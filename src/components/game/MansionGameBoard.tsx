"use client";

import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BOARD_WIDTH,
  BOARD_HEIGHT,
  ROOM_DEFINITIONS,
  PLAYER_COLORS,
  SUSPECTS,
} from "@/lib/game/constants";
import { buildGrid } from "@/lib/game/board";
import type { GameState } from "@/lib/game/engine";
import type { Position } from "@/lib/game/board";
import { cn } from "@/lib/utils";
import { MapPin, User, ZoomIn, ZoomOut } from "lucide-react";

interface MansionGameBoardProps {
  liveGameState: GameState;
  highlightedMoveTargets?: Position[];
  onMoveTargetClick?: (targetPosition: Position) => void;
  viewingUserId?: string;
}

const BASE_CELL_SIZE = 22;

/** Interactive mansion grid — scales responsively to fit container width. */
export function MansionGameBoard({
  liveGameState,
  highlightedMoveTargets = [],
  onMoveTargetClick,
  viewingUserId,
}: MansionGameBoardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [manualZoom, setManualZoom] = useState(0);

  const mansionGrid = buildGrid();
  const boardPixelWidth = BOARD_WIDTH * BASE_CELL_SIZE;
  const boardPixelHeight = BOARD_HEIGHT * BASE_CELL_SIZE;

  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.clientWidth - 32;
      const autoScale = Math.min(1, containerWidth / boardPixelWidth);
      setScale(Math.max(0.35, autoScale + manualZoom * 0.12));
    };
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [boardPixelWidth, manualZoom]);

  const isHighlightedMove = (gridX: number, gridY: number) =>
    highlightedMoveTargets.some((target) => target.x === gridX && target.y === gridY);

  const getPlayerOnTile = (gridX: number, gridY: number) =>
    liveGameState.players.find(
      (player) =>
        !player.isEliminated &&
        player.position.x === gridX &&
        player.position.y === gridY
    );

  const getSuspectTokenOnTile = (gridX: number, gridY: number) => {
    for (const suspectToken of liveGameState.suspectTokens) {
      const roomDef = ROOM_DEFINITIONS.find((room) => room.id === suspectToken.room);
      if (!roomDef) continue;
      const centerX = roomDef.x + Math.floor(roomDef.w / 2);
      const centerY = roomDef.y + Math.floor(roomDef.h / 2);
      if (centerX === gridX && centerY === gridY) return suspectToken.suspect;
    }
    return null;
  };

  const activeTurnPlayer = liveGameState.players[liveGameState.turnIndex];

  return (
    <div
      ref={containerRef}
      id="tour-board"
      className="relative rounded-2xl border border-cream/10 bg-gradient-to-br from-mansion-dark/90 to-stone-950/90 p-3 sm:p-4 shadow-inner"
    >
      <div className="flex items-center gap-2 mb-3 text-cream/50 text-xs uppercase tracking-wider flex-wrap">
        <MapPin className="w-3.5 h-3.5 text-gold" />
        <span className="hidden sm:inline">Mansion Board</span>
        {highlightedMoveTargets.length > 0 && (
          <span className="text-gold normal-case font-medium animate-pulse sm:ml-auto">
            Tap gold tile to move ({highlightedMoveTargets.length})
          </span>
        )}
        <div className="flex gap-1 ml-auto">
          <button
            type="button"
            onClick={() => setManualZoom((z) => Math.max(-2, z - 1))}
            className="p-1.5 rounded-lg hover:bg-cream/10 text-cream/50"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setManualZoom((z) => Math.min(3, z + 1))}
            className="p-1.5 rounded-lg hover:bg-cream/10 text-cream/50"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="overflow-auto rounded-lg">
        <div
          className="mx-auto transition-transform duration-200"
          style={{
            width: boardPixelWidth * scale,
            height: boardPixelHeight * scale,
          }}
        >
          <div
            className="relative rounded-lg overflow-hidden ring-1 ring-cream/5 shadow-lg origin-top-left"
            style={{
              width: boardPixelWidth,
              height: boardPixelHeight,
              transform: `scale(${scale})`,
            }}
          >
            {ROOM_DEFINITIONS.map((roomDef) => (
              <div
                key={roomDef.id}
                className="absolute rounded-md flex items-center justify-center"
                style={{
                  left: roomDef.x * BASE_CELL_SIZE,
                  top: roomDef.y * BASE_CELL_SIZE,
                  width: roomDef.w * BASE_CELL_SIZE,
                  height: roomDef.h * BASE_CELL_SIZE,
                  background: `linear-gradient(145deg, ${roomDef.color}E8, ${roomDef.color}99)`,
                  border: "1px solid rgba(255,255,255,0.15)",
                  boxShadow: "inset 0 2px 12px rgba(0,0,0,0.35)",
                }}
              >
                <span className="text-[7px] sm:text-[9px] font-serif text-cream/90 text-center px-0.5 leading-tight drop-shadow-md select-none">
                  {roomDef.id}
                </span>
              </div>
            ))}

            {Array.from({ length: BOARD_HEIGHT }).map((_, gridY) =>
              Array.from({ length: BOARD_WIDTH }).map((_, gridX) => {
                const gridCell = mansionGrid[gridY][gridX];
                if (gridCell.type === "wall" || gridCell.type === "room") return null;

                const playerOnTile = getPlayerOnTile(gridX, gridY);
                const suspectOnTile = getSuspectTokenOnTile(gridX, gridY);
                const isValidMoveTarget = isHighlightedMove(gridX, gridY);
                const isViewingPlayersToken = playerOnTile?.userId === viewingUserId;
                const isActiveTurnToken = playerOnTile?.id === activeTurnPlayer?.id;

                return (
                  <motion.button
                    key={`${gridX}-${gridY}`}
                    whileTap={isValidMoveTarget ? { scale: 0.9 } : undefined}
                    onClick={() => isValidMoveTarget && onMoveTargetClick?.({ x: gridX, y: gridY })}
                    disabled={!isValidMoveTarget || !onMoveTargetClick}
                    className={cn(
                      "absolute transition-all duration-150",
                      gridCell.type === "door"
                        ? "bg-amber-800/55 ring-1 ring-amber-600/35"
                        : "bg-stone-700/55",
                      isValidMoveTarget &&
                        "bg-gold/40 ring-2 ring-gold/80 cursor-pointer hover:bg-gold/60 z-10",
                      !isValidMoveTarget && "cursor-default"
                    )}
                    style={{
                      left: gridX * BASE_CELL_SIZE,
                      top: gridY * BASE_CELL_SIZE,
                      width: BASE_CELL_SIZE - 1,
                      height: BASE_CELL_SIZE - 1,
                    }}
                  >
                    {suspectOnTile && !playerOnTile && (
                      <span className="text-[8px] font-bold text-cream/45">
                        {SUSPECTS.indexOf(suspectOnTile) + 1}
                      </span>
                    )}
                    {playerOnTile && (
                      <motion.div
                        className={cn(
                          "w-full h-full rounded-full border-2 flex items-center justify-center shadow-md",
                          isActiveTurnToken && "border-gold ring-2 ring-gold/60",
                          isViewingPlayersToken && !isActiveTurnToken && "border-white/70"
                        )}
                        style={{
                          backgroundColor:
                            PLAYER_COLORS.find((c) => c.id === playerOnTile.color)?.hex ?? "#888",
                        }}
                        animate={isActiveTurnToken ? { scale: [1, 1.08, 1] } : {}}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      >
                        <User className="w-2.5 h-2.5 text-white/90" />
                      </motion.div>
                    )}
                  </motion.button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
