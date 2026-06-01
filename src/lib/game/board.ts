import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  ROOM_DEFINITIONS,
  SECRET_PASSAGES,
  type Room,
  type RoomDef,
} from "./constants";

export interface Position {
  x: number;
  y: number;
}

export type GridCell = {
  type: "wall" | "corridor" | "room" | "door";
  room?: Room;
};

let gridCache: GridCell[][] | null = null;

export function buildGrid(): GridCell[][] {
  if (gridCache) return gridCache;

  const grid: GridCell[][] = Array.from({ length: BOARD_HEIGHT }, () =>
    Array.from({ length: BOARD_WIDTH }, () => ({ type: "wall" as const }))
  );

  for (const room of ROOM_DEFINITIONS) {
    for (let y = room.y; y < room.y + room.h; y++) {
      for (let x = room.x; x < room.x + room.w; x++) {
        grid[y][x] = { type: "room", room: room.id };
      }
    }
    for (const door of room.doors) {
      grid[door.y][door.x] = { type: "door", room: room.id };
    }
  }

  for (let y = 0; y < BOARD_HEIGHT; y++) {
    for (let x = 0; x < BOARD_WIDTH; x++) {
      if (grid[y][x].type === "wall") {
        const neighbors = [
          [x - 1, y],
          [x + 1, y],
          [x, y - 1],
          [x, y + 1],
        ];
        const nearRoom = neighbors.some(([nx, ny]) => {
          if (nx < 0 || ny < 0 || nx >= BOARD_WIDTH || ny >= BOARD_HEIGHT) return false;
          return grid[ny][nx].type === "room" || grid[ny][nx].type === "door";
        });
        if (nearRoom) {
          grid[y][x] = { type: "corridor" };
        }
      }
    }
  }

  const corridorSpots: Position[] = [
    { x: 7, y: 0 },
    { x: 8, y: 0 },
    { x: 11, y: 0 },
    { x: 12, y: 0 },
    { x: 15, y: 0 },
    { x: 16, y: 0 },
    { x: 7, y: 6 },
    { x: 8, y: 6 },
    { x: 15, y: 6 },
    { x: 16, y: 6 },
    { x: 7, y: 7 },
    { x: 8, y: 7 },
    { x: 15, y: 7 },
    { x: 16, y: 7 },
    { x: 7, y: 8 },
    { x: 8, y: 8 },
    { x: 15, y: 8 },
    { x: 16, y: 8 },
    { x: 0, y: 7 },
    { x: 0, y: 8 },
    { x: 23, y: 7 },
    { x: 23, y: 8 },
    { x: 7, y: 15 },
    { x: 8, y: 15 },
    { x: 15, y: 15 },
    { x: 16, y: 15 },
    { x: 7, y: 16 },
    { x: 8, y: 16 },
    { x: 15, y: 16 },
    { x: 16, y: 16 },
    { x: 7, y: 17 },
    { x: 8, y: 17 },
    { x: 15, y: 17 },
    { x: 16, y: 17 },
    { x: 23, y: 17 },
    { x: 23, y: 18 },
  ];

  for (const spot of corridorSpots) {
    if (spot.y < BOARD_HEIGHT && spot.x < BOARD_WIDTH) {
      if (grid[spot.y][spot.x].type === "wall") {
        grid[spot.y][spot.x] = { type: "corridor" };
      }
    }
  }

  gridCache = grid;
  return grid;
}

export function getRoomAt(x: number, y: number): Room | null {
  const grid = buildGrid();
  if (y < 0 || y >= BOARD_HEIGHT || x < 0 || x >= BOARD_WIDTH) return null;
  const cell = grid[y][x];
  return cell.room ?? null;
}

export function getRoomDef(room: Room): RoomDef {
  return ROOM_DEFINITIONS.find((r) => r.id === room)!;
}

export function isWalkable(x: number, y: number): boolean {
  const grid = buildGrid();
  if (y < 0 || y >= BOARD_HEIGHT || x < 0 || x >= BOARD_WIDTH) return false;
  const cell = grid[y][x];
  return cell.type === "corridor" || cell.type === "door";
}

export function isInRoom(x: number, y: number): boolean {
  const grid = buildGrid();
  if (y < 0 || y >= BOARD_HEIGHT || x < 0 || x >= BOARD_WIDTH) return false;
  return grid[y][x].type === "room";
}

export function getValidMoves(
  from: Position,
  steps: number,
  occupied: Position[]
): Position[] {
  if (steps <= 0) return [];

  const grid = buildGrid();
  const visited = new Set<string>();
  const queue: { pos: Position; remaining: number }[] = [{ pos: from, remaining: steps }];
  const valid: Position[] = [];

  const key = (p: Position) => `${p.x},${p.y}`;
  const isOccupied = (p: Position) =>
    occupied.some((o) => o.x === p.x && o.y === p.y && !(o.x === from.x && o.y === from.y));

  while (queue.length > 0) {
    const { pos, remaining } = queue.shift()!;
    const k = `${key(pos)}:${remaining}`;
    if (visited.has(k)) continue;
    visited.add(k);

    if (remaining === 0) {
      if (!valid.some((v) => v.x === pos.x && v.y === pos.y)) {
        valid.push(pos);
      }
      continue;
    }

    const directions = [
      { x: 0, y: -1 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
      { x: 1, y: 0 },
    ];

    for (const dir of directions) {
      const nx = pos.x + dir.x;
      const ny = pos.y + dir.y;
      if (ny < 0 || ny >= BOARD_HEIGHT || nx < 0 || nx >= BOARD_WIDTH) continue;

      const cell = grid[ny][nx];
      if (cell.type === "wall" || cell.type === "room") continue;

      const next = { x: nx, y: ny };
      if (remaining === 1 && isOccupied(next)) continue;

      queue.push({ pos: next, remaining: remaining - 1 });
    }
  }

  return valid;
}

export function enterRoom(from: Position, room: Room): Position | null {
  const roomDef = getRoomDef(room);
  const doors = roomDef.doors;
  let best: Position | null = null;
  let bestDist = Infinity;

  for (const door of doors) {
    const dist = Math.abs(door.x - from.x) + Math.abs(door.y - from.y);
    if (dist <= 1 && dist < bestDist) {
      bestDist = dist;
      best = { x: roomDef.x + Math.floor(roomDef.w / 2), y: roomDef.y + Math.floor(roomDef.h / 2) };
    }
  }

  return best;
}

export function hasSecretPassage(fromRoom: Room, toRoom: Room): boolean {
  return SECRET_PASSAGES.some(([a, b]) => a === fromRoom && b === toRoom);
}

export function manhattan(a: Position, b: Position): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}
