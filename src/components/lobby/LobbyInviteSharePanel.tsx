"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { motion } from "framer-motion";
import { Copy, Check, Link2, Share2, MessageCircle } from "lucide-react";
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

  const inviteUrl = buildLobbyInviteUrl(lobbyInviteCode);
  const shareMessage = buildLobbyShareMessage(lobbyInviteCode);

  const copyInviteLink = async () => {
    await navigator.clipboard.writeText(inviteUrl);
    setDidCopyLink(true);
    setTimeout(() => setDidCopyLink(false), 2500);
  };

  const copyLobbyCode = async () => {
    await navigator.clipboard.writeText(lobbyInviteCode.toUpperCase());
    setDidCopyCode(true);
    setTimeout(() => setDidCopyCode(false), 2500);
  };

  const copyFullShareMessage = async () => {
    await navigator.clipboard.writeText(shareMessage);
    setDidCopyMessage(true);
    setTimeout(() => setDidCopyMessage(false), 2500);
  };

  const openNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join Mystery Mansion",
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
    <div className="rounded-xl border border-cream/10 bg-mansion-dark/50 p-4 space-y-4">
      <h3 className="font-serif text-base text-cream">Invite</h3>

      <div className="grid sm:grid-cols-[auto_1fr] gap-4 items-start">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mx-auto p-3 rounded-xl bg-white shadow-md"
        >
          <QRCodeSVG value={inviteUrl} size={140} level="M" includeMargin />
        </motion.div>

        <div className="space-y-3 min-w-0">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-cream/40 mb-1">Code</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-mono tracking-[0.2em] text-gold font-bold">
                {lobbyInviteCode.toUpperCase()}
              </span>
              <button
                onClick={copyLobbyCode}
                className="p-1.5 rounded-lg hover:bg-cream/10 text-cream/60"
                aria-label="Copy code"
              >
                {didCopyCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-wider text-cream/40 mb-1">Link</p>
            <div className="flex gap-2">
              <div className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-mansion-card border border-cream/10 text-xs text-cream/70 truncate flex items-center gap-2">
                <Link2 className="w-3.5 h-3.5 shrink-0 text-gold" />
                <span className="truncate">{inviteUrl}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={copyInviteLink} aria-label="Copy link">
                {didCopyLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={openNativeShare}>
              <Share2 className="w-4 h-4" /> Share
            </Button>
            <Button variant="ghost" size="sm" onClick={copyFullShareMessage}>
              {didCopyMessage ? (
                <><Check className="w-4 h-4 text-emerald-400" /> Copied</>
              ) : (
                <><MessageCircle className="w-4 h-4" /> Copy text</>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
