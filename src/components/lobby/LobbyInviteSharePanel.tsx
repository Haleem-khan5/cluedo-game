"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { AnimatePresence, motion } from "framer-motion";
import { Copy, Check, Share2, MessageCircle, QrCode } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  buildLobbyInviteUrl,
  buildLobbyShareMessage,
} from "@/lib/lobby/buildLobbyInviteUrl";

interface LobbyInviteSharePanelProps {
  lobbyInviteCode: string;
}

export function LobbyInviteSharePanel({ lobbyInviteCode }: LobbyInviteSharePanelProps) {
  const [didCopyLink, setDidCopyLink] = useState(false);
  const [didCopyCode, setDidCopyCode] = useState(false);
  const [didCopyMessage, setDidCopyMessage] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const inviteUrl = buildLobbyInviteUrl(lobbyInviteCode);
  const shareMessage = buildLobbyShareMessage(lobbyInviteCode);

  const flash = (setter: (v: boolean) => void) => {
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  const copyInviteLink = async () => {
    await navigator.clipboard.writeText(inviteUrl);
    flash(setDidCopyLink);
  };

  const copyLobbyCode = async () => {
    await navigator.clipboard.writeText(lobbyInviteCode.toUpperCase());
    flash(setDidCopyCode);
  };

  const copyFullShareMessage = async () => {
    await navigator.clipboard.writeText(shareMessage);
    flash(setDidCopyMessage);
  };

  const openNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join Cluebound Chronicles",
          text: shareMessage,
          url: inviteUrl,
        });
      } catch {
        /* user cancelled */
      }
    } else {
      copyFullShareMessage();
    }
  };

  return (
    <div className="rounded-xl border border-cream/10 bg-mansion-dark/50 p-3">
      <div className="flex flex-wrap items-center gap-3">
        {/* Code — tap to copy */}
        <button
          onClick={copyLobbyCode}
          className="flex items-center gap-2 group min-w-0"
          aria-label="Copy invite code"
        >
          <span className="text-[10px] uppercase tracking-wider text-cream/40 shrink-0">
            Code
          </span>
          <span className="text-2xl font-mono tracking-[0.18em] text-gold font-bold leading-none">
            {lobbyInviteCode.toUpperCase()}
          </span>
          <span className="p-1 rounded-md text-cream/40 group-hover:text-cream/80 group-hover:bg-cream/10 shrink-0">
            {didCopyCode ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </span>
        </button>

        {/* Actions */}
        <div className="flex items-center gap-2 ml-auto">
          <Button variant="secondary" size="sm" onClick={openNativeShare}>
            <Share2 className="w-4 h-4" /> Share
          </Button>
          <Button variant="ghost" size="sm" onClick={copyInviteLink} aria-label="Copy link">
            {didCopyLink ? (
              <><Check className="w-4 h-4 text-emerald-400" /> Link</>
            ) : (
              <><Copy className="w-4 h-4" /> Link</>
            )}
          </Button>
          <button
            onClick={() => setShowQr((v) => !v)}
            className={`p-2 rounded-lg border transition-colors ${
              showQr
                ? "border-gold/40 bg-gold/10 text-gold"
                : "border-cream/15 text-cream/55 hover:text-cream hover:bg-cream/5"
            }`}
            aria-label="Toggle QR code"
            aria-pressed={showQr}
          >
            <QrCode className="w-4 h-4" />
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {showQr && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-3 mt-3 border-t border-cream/10">
              <div className="p-2.5 rounded-xl bg-white shadow-md shrink-0">
                <QRCodeSVG value={inviteUrl} size={104} level="M" includeMargin />
              </div>
              <div className="min-w-0 w-full space-y-2 text-center sm:text-left">
                <p className="text-xs text-cream/50">Scan to join, or send the link:</p>
                <div className="px-3 py-2 rounded-lg bg-mansion-card border border-cream/10 text-xs text-cream/70 truncate">
                  {inviteUrl}
                </div>
                <Button variant="ghost" size="sm" onClick={copyFullShareMessage}>
                  {didCopyMessage ? (
                    <><Check className="w-4 h-4 text-emerald-400" /> Copied invite</>
                  ) : (
                    <><MessageCircle className="w-4 h-4" /> Copy invite text</>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
