"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { motion } from "framer-motion";
import {
  Copy,
  Check,
  Link2,
  QrCode,
  Share2,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  buildLobbyInviteUrl,
  buildLobbyShareMessage,
} from "@/lib/lobby/buildLobbyInviteUrl";

interface LobbyInviteSharePanelProps {
  /** Six-character lobby code displayed and encoded in the QR. */
  lobbyInviteCode: string;
}

/**
 * Lets the host share a lobby via QR code, copy link, or native share sheet.
 */
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
    <div className="rounded-2xl border border-cream/10 bg-mansion-dark/50 p-5 space-y-5">
      <div className="flex items-center gap-2 text-gold">
        <Share2 className="w-5 h-5" />
        <h3 className="font-serif text-lg text-cream">Invite Friends</h3>
      </div>

      <div className="grid sm:grid-cols-[auto_1fr] gap-6 items-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mx-auto p-4 rounded-2xl bg-white shadow-lg ring-2 ring-gold/30"
        >
          <QRCodeSVG
            value={inviteUrl}
            size={160}
            level="M"
            includeMargin
            imageSettings={{
              src: "",
              height: 0,
              width: 0,
              excavate: false,
            }}
          />
          <p className="text-center text-[10px] text-stone-500 mt-2 flex items-center justify-center gap-1">
            <QrCode className="w-3 h-3" /> Scan to join
          </p>
        </motion.div>

        <div className="space-y-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-cream/40 mb-1">Lobby Code</p>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-mono tracking-[0.25em] text-gold font-bold">
                {lobbyInviteCode.toUpperCase()}
              </span>
              <button
                onClick={copyLobbyCode}
                className="p-2 rounded-lg hover:bg-cream/10 text-cream/60 transition-colors"
                aria-label="Copy lobby code"
              >
                {didCopyCode ? (
                  <Check className="w-5 h-5 text-emerald-400" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-cream/40 mb-1">Invite Link</p>
            <p className="text-[10px] text-cream/30 mb-1.5">
              Share this link or QR — friends can join from anywhere
            </p>
            <div className="flex gap-2">
              <div className="flex-1 px-3 py-2 rounded-xl bg-mansion-card border border-cream/10 text-sm text-cream/70 truncate flex items-center gap-2">
                <Link2 className="w-4 h-4 shrink-0 text-gold" />
                <span className="truncate">{inviteUrl}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={copyInviteLink}>
                {didCopyLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <Button variant="secondary" size="sm" onClick={openNativeShare}>
              <Share2 className="w-4 h-4" /> Share
            </Button>
            <Button variant="ghost" size="sm" onClick={copyFullShareMessage}>
              {didCopyMessage ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" /> Copied!
                </>
              ) : (
                <>
                  <MessageCircle className="w-4 h-4" /> Copy Message
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
