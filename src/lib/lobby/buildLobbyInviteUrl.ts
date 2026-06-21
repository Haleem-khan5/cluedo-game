/**
 * Builds shareable lobby invite URLs and QR payload strings.
 */

import { getClientPublicAppBaseUrl, getPublicAppBaseUrl } from "@/lib/config/publicAppUrl";

/** Returns the absolute invite URL friends can open or scan. */
export function buildLobbyInviteUrl(lobbyInviteCode: string, baseUrlOverride?: string): string {
  const publicBaseUrl =
    baseUrlOverride ??
    (typeof window !== "undefined"
      ? getClientPublicAppBaseUrl()
      : getPublicAppBaseUrl());

  const normalizedCode = lobbyInviteCode.trim().toUpperCase();
  return `${publicBaseUrl.replace(/\/$/, "")}/join/${normalizedCode}`;
}

/** Human-readable share message for copy / native share sheet. */
export function buildLobbyShareMessage(lobbyInviteCode: string, baseUrlOverride?: string): string {
  const inviteUrl = buildLobbyInviteUrl(lobbyInviteCode, baseUrlOverride);
  return `Join my Cluebound Chronicles game!\n\nCode: ${lobbyInviteCode.toUpperCase()}\nLink: ${inviteUrl}`;
}
