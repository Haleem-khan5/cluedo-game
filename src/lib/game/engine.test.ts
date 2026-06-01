import { describe, it, expect } from "vitest";
import {
  createSolution,
  dealCards,
  initializeGame,
  rollDice,
  movePlayer,
  makeSuggestion,
  disproveSuggestion,
  passDisprove,
  makeAccusation,
  endTurn,
  getMatchingCards,
  validatePlayerCount,
} from "@/lib/game/engine";
import { SUSPECTS, WEAPONS, ROOMS } from "@/lib/game/constants";

describe("Game Engine", () => {
  describe("createSolution", () => {
    it("creates a valid solution with one of each type", () => {
      const solution = createSolution();
      expect(SUSPECTS).toContain(solution.suspect);
      expect(WEAPONS).toContain(solution.weapon);
      expect(ROOMS).toContain(solution.room);
    });
  });

  describe("dealCards", () => {
    it("deals all remaining cards to players", () => {
      const solution = {
        suspect: "Professor Gray" as const,
        weapon: "Silver Dagger" as const,
        room: "Library" as const,
      };
      const hands = dealCards(solution, 3);
      expect(hands).toHaveLength(3);
      const total = hands.reduce((sum, h) => sum + h.length, 0);
      expect(total).toBe(18);
    });
  });

  describe("validatePlayerCount", () => {
    it("rejects too few players", () => {
      expect(validatePlayerCount(2)).toBeTruthy();
    });
    it("accepts valid player count", () => {
      expect(validatePlayerCount(4)).toBeNull();
    });
    it("rejects too many players", () => {
      expect(validatePlayerCount(7)).toBeTruthy();
    });
  });

  describe("game flow", () => {
    const solution = {
      suspect: "Professor Gray" as const,
      weapon: "Silver Dagger" as const,
      room: "Library" as const,
    };

    const players = [
      { id: "p1", userId: "u1", displayName: "Alice", color: "burgundy", canAccuse: true, isEliminated: false, turnOrder: 0, isConnected: true },
      { id: "p2", userId: "u2", displayName: "Bob", color: "gold", canAccuse: true, isEliminated: false, turnOrder: 1, isConnected: true },
      { id: "p3", userId: "u3", displayName: "Carol", color: "green", canAccuse: true, isEliminated: false, turnOrder: 2, isConnected: true },
    ];

    it("initializes game with dealt hands", () => {
      const { state } = initializeGame("session1", "ABC123", players, solution);
      expect(state.players).toHaveLength(3);
      expect(state.players.every((p) => p.hand.length > 0)).toBe(true);
      expect(state.phase).toBe("roll");
    });

    it("rolls dice and transitions to move phase", () => {
      const { state } = initializeGame("session1", "ABC123", players, solution);
      const result = rollDice(state);
      expect(result.error).toBeUndefined();
      expect(result.state.diceRoll).toBeGreaterThanOrEqual(1);
      expect(result.state.diceRoll).toBeLessThanOrEqual(6);
      expect(result.state.phase).toBe("move");
    });

    it("correct accusation wins the game", () => {
      const { state } = initializeGame("session1", "ABC123", players, solution);
      const rolled = rollDice(state).state;
      const accused = makeAccusation(
        { ...rolled, phase: "accuse" },
        "p1",
        solution.suspect,
        solution.weapon,
        solution.room,
        solution
      );
      expect(accused.state.status).toBe("finished");
      expect(accused.state.winnerId).toBe("p1");
    });

    it("wrong accusation eliminates player", () => {
      const { state } = initializeGame("session1", "ABC123", players, solution);
      const accused = makeAccusation(
        { ...state, phase: "accuse" },
        "p1",
        "Lady Violet",
        "Poison Bottle",
        "Kitchen",
        solution
      );
      expect(accused.state.players[0].canAccuse).toBe(false);
      expect(accused.state.players[0].isEliminated).toBe(true);
    });
  });

  describe("getMatchingCards", () => {
    it("finds matching cards in hand", () => {
      const suggestion = {
        suspect: "Professor Gray" as const,
        weapon: "Silver Dagger" as const,
        room: "Library" as const,
        suggesterId: "p1",
        disproveIndex: 1,
      };
      const matches = getMatchingCards(["Professor Gray", "Kitchen"], suggestion);
      expect(matches).toEqual(["Professor Gray"]);
    });
  });
});
