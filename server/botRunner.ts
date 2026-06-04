import type { Server } from "socket.io";
import { prisma } from "@/lib/prisma";
import {
  makeInterrogation,
  disproveSuggestion,
  passDisprove,
  makeAccusation,
  getCurrentPlayer,
} from "@/lib/game/engine";
import type { Card } from "@/lib/game/constants";
import {
  chooseInterrogation,
  chooseDisproveCard,
  chooseAccusation,
  createBotBrain,
  recordRevealedCard,
  observeInterrogation,
  observeNoDisprove,
  getDisprovingPlayer,
  isBotsTurnToAct,
  type BotBrain,
} from "@/lib/game/botAI";
import type { ActiveGame } from "./socketTypes";

const BOT_THINK_MS = 550;
const BOT_STEP_MS = 280;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getBotBrain(game: ActiveGame, userId: string, hand: string[]): BotBrain {
  if (!game.botBrains.has(userId)) {
    game.botBrains.set(userId, createBotBrain(hand as never));
  }
  return game.botBrains.get(userId)!;
}

function syncBrainFromHand(game: ActiveGame, playerId: string): void {
  const player = game.state.players.find((p) => p.id === playerId);
  if (!player || !game.botUserIds.has(player.userId)) return;
  const brain = getBotBrain(game, player.userId, player.hand);
  for (const card of player.hand) {
    brain.ruledOut.add(card);
  }
}

/** Share observation with every bot brain after an interrogation round. */
function broadcastObservationToBots(
  game: ActiveGame,
  pending: NonNullable<ActiveGame["state"]["pendingSuggestion"]> | null,
  disproverUserId: string,
  revealedCard: Card | null,
  noOneDisproved: boolean
): void {
  if (!pending) return;
  const allIds = game.state.players.map((p) => p.userId);

  for (const userId of game.botUserIds) {
    const brain = game.botBrains.get(userId);
    if (!brain) continue;

    if (noOneDisproved) {
      observeNoDisprove(brain, pending);
    } else if (revealedCard) {
      observeInterrogation(brain, pending, disproverUserId, revealedCard, allIds);
    } else {
      observeInterrogation(brain, pending, disproverUserId, null, allIds);
    }
  }
}

export async function createBotUser(displayName: string): Promise<{ id: string; name: string }> {
  const botKey = `bot_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const user = await prisma.user.create({
    data: {
      name: displayName,
      email: `${botKey}@bot.mysterymansion.local`,
      isGuest: true,
    },
  });
  return { id: user.id, name: user.name ?? displayName };
}

async function resolveBotDisproveChain(game: ActiveGame, emit: () => void): Promise<void> {
  while (
    game.state.phase === "disprove" &&
    game.state.pendingSuggestion &&
    game.state.status === "playing"
  ) {
    const disprover = getDisprovingPlayer(game.state);
    if (!disprover || !game.botUserIds.has(disprover.userId)) break;

    await delay(BOT_STEP_MS);
    syncBrainFromHand(game, disprover.id);

    const pending = game.state.pendingSuggestion!;
    const card = chooseDisproveCard(disprover.hand, pending);

    if (card) {
      const result = disproveSuggestion(game.state, disprover.id, card);
      if (result.error) break;
      game.state = result.state;

      broadcastObservationToBots(game, pending, disprover.userId, card, false);

      if (result.revealedTo) {
        const suggester = game.state.players.find((p) => p.id === result.revealedTo);
        if (suggester && game.botUserIds.has(suggester.userId)) {
          const brain = getBotBrain(game, suggester.userId, suggester.hand);
          recordRevealedCard(brain, card, disprover.userId);
        }
        game.revealedCards.set(suggester!.id, {
          card,
          toPlayerId: suggester!.id,
          fromPlayerId: disprover.id,
        });
      }
    } else {
      observeInterrogation(
        getBotBrain(game, disprover.userId, disprover.hand),
        pending,
        disprover.userId,
        null,
        game.state.players.map((p) => p.userId)
      );
      const result = passDisprove(game.state, disprover.id);
      if (result.error) break;
      game.state = result.state;

      if (!game.state.pendingSuggestion && game.state.phase === "turn") {
        broadcastObservationToBots(game, pending, disprover.userId, null, true);
      }
    }

    emit();
  }
}

async function runSingleBotAction(game: ActiveGame, emit: () => void): Promise<void> {
  if (game.state.status === "finished") return;

  if (game.state.phase === "disprove" && game.state.pendingSuggestion) {
    await resolveBotDisproveChain(game, emit);
    return;
  }

  const current = getCurrentPlayer(game.state);
  if (!game.botUserIds.has(current.userId)) return;

  syncBrainFromHand(game, current.id);
  const brain = getBotBrain(game, current.userId, current.hand);

  if (game.state.phase !== "turn") return;

  const accusation = chooseAccusation(current, brain, game.solution);
  if (accusation) {
    const result = makeAccusation(
      game.state,
      current.id,
      accusation.suspect,
      accusation.weapon,
      accusation.room,
      game.solution
    );
    if (!result.error) {
      game.state = result.state;
      emit();
      return;
    }
  }

  const interrogation = chooseInterrogation(current, brain, game.state.players);
  const result = makeInterrogation(
    game.state,
    current.id,
    interrogation.suspect,
    interrogation.weapon,
    interrogation.room
  );
  if (result.error) return;

  game.state = result.state;
  emit();
  await resolveBotDisproveChain(game, emit);
}

const botTimers = new Map<string, ReturnType<typeof setTimeout>>();

export function scheduleBotTurns(
  sessionId: string,
  game: ActiveGame,
  io: Server,
  emitGameStateFn: (
    io: Server,
    game: ActiveGame,
    options?: { scheduleBots?: boolean }
  ) => void
): void {
  const existing = botTimers.get(sessionId);
  if (existing) clearTimeout(existing);

  if (!isBotsTurnToAct(game.state, game.botUserIds)) return;

  const emitQuiet = () => emitGameStateFn(io, game, { scheduleBots: false });

  const timer = setTimeout(async () => {
    botTimers.delete(sessionId);
    if (!isBotsTurnToAct(game.state, game.botUserIds)) return;

    await delay(BOT_THINK_MS);
    await runSingleBotAction(game, emitQuiet);

    if (game.state.status === "finished") {
      io.to(`game:${sessionId}`).emit("game:finished", {
        winnerId: game.state.winnerId,
        solution: game.solution,
      });
      return;
    }

    emitGameStateFn(io, game);
  }, BOT_THINK_MS);

  botTimers.set(sessionId, timer);
}

export function initBotBrainsForGame(game: ActiveGame): void {
  for (const player of game.state.players) {
    if (game.botUserIds.has(player.userId)) {
      game.botBrains.set(player.userId, createBotBrain(player.hand));
    }
  }
}
