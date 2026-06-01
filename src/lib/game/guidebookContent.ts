import { SUSPECTS, WEAPONS, ROOMS, MIN_PLAYERS, MAX_PLAYERS } from "./constants";

export interface GuidebookSection {
  id: string;
  title: string;
  icon: string;
  content: GuidebookBlock[];
}

export type GuidebookBlock =
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "steps"; steps: { title: string; description: string }[] }
  | { type: "cards"; cards: { name: string; emoji: string; detail: string }[] }
  | { type: "tip"; text: string };

export const guidebookSections: GuidebookSection[] = [
  {
    id: "overview",
    title: "Game Overview",
    icon: "🏰",
    content: [
      {
        type: "paragraph",
        text: `Mystery Mansion is an online detective board game for ${MIN_PLAYERS}–${MAX_PLAYERS} players. A murder has occurred in the mansion. Your goal is to deduce three hidden facts: who did it, which weapon was used, and in which room.`,
      },
      {
        type: "list",
        items: [
          "One suspect, one weapon, and one room are secretly chosen at game start.",
          "Remaining cards are shuffled and dealt to players as private clues.",
          "Use logic, suggestions, and your detective notes to eliminate possibilities.",
          "Make a final accusation when you are confident — but guess wrong and you are eliminated!",
        ],
      },
    ],
  },
  {
    id: "setup",
    title: "Getting Started",
    icon: "🚪",
    content: [
      {
        type: "steps",
        steps: [
          { title: "Sign in or play as guest", description: "No account required for guest play. Pick a detective name and jump in." },
          { title: "Create or join a lobby", description: "Host creates a game and shares the 6-character code, QR code, or invite link." },
          { title: "Wait for players", description: `Need at least ${MIN_PLAYERS} detectives. Maximum ${MAX_PLAYERS}.` },
          { title: "Host starts the game", description: "Cards are dealt, tokens placed, and turns begin clockwise." },
        ],
      },
      {
        type: "tip",
        text: "Share your ngrok or public invite link so friends can join from anywhere in the world.",
      },
    ],
  },
  {
    id: "turn",
    title: "Your Turn",
    icon: "🎲",
    content: [
      {
        type: "steps",
        steps: [
          { title: "Roll the dice", description: "Roll 1–6. That many steps determine how far you can move on the board." },
          { title: "Move your token", description: "Click a highlighted gold tile to move orthogonally (not diagonally). You cannot pass through walls or rooms." },
          { title: "Enter a room (optional)", description: "If you reach a doorway, you enter that room and may make a suggestion." },
          { title: "Use a secret passage (optional)", description: "From certain rooms, jump instantly to a connected room via secret passage." },
          { title: "Make a suggestion (in a room)", description: "Name a suspect and weapon for your current room. The suspect token moves there." },
          { title: "Make an accusation (optional)", description: "Guess all three facts anywhere on your turn. Correct = you win. Wrong = eliminated." },
          { title: "End your turn", description: "Pass play to the next detective clockwise." },
        ],
      },
    ],
  },
  {
    id: "suggestions",
    title: "Suggestions & Disproving",
    icon: "🔍",
    content: [
      {
        type: "paragraph",
        text: "When you are inside a room, you may suggest a suspect and weapon for that room. Other players must disprove in turn order if they hold a matching card.",
      },
      {
        type: "list",
        items: [
          "The suggesting player names one suspect, one weapon, and the room they are in.",
          "The named suspect token is moved into that room on the board.",
          "Starting with the player to your left, each player checks their hand.",
          "The first player with a matching card must show exactly one matching card privately to you.",
          "If no one can disprove, the suggestion stands — record this in your notes!",
        ],
      },
      {
        type: "tip",
        text: "Pay attention to who disproved and which card type was shown (if you can deduce it). This is the heart of the game.",
      },
    ],
  },
  {
    id: "accusation",
    title: "Final Accusation",
    icon: "⚖️",
    content: [
      {
        type: "paragraph",
        text: "On your turn, you may make a final accusation naming any suspect, weapon, and room — you do not need to be in that room.",
      },
      {
        type: "list",
        items: [
          "Correct accusation: you win immediately and the game ends.",
          "Wrong accusation: you are eliminated from making further accusations.",
          "Eliminated players can still disprove suggestions for others.",
          "If all players are eliminated without a correct accusation, no one wins.",
        ],
      },
      {
        type: "tip",
        text: "Only accuse when you are certain. One wrong guess ends your chance to win.",
      },
    ],
  },
  {
    id: "notes",
    title: "Detective Notes",
    icon: "📋",
    content: [
      {
        type: "paragraph",
        text: "Use the detective notes sheet to track what you know. Tap each cell to cycle through marks:",
      },
      {
        type: "list",
        items: [
          "Empty — unknown",
          "? — possible / maybe",
          "✗ — ruled out (you or someone holds this card, or it was shown)",
          "✓ — confirmed part of the solution (only if you deduced it with certainty)",
        ],
      },
      {
        type: "tip",
        text: "Notes are private and saved only on your device during the game.",
      },
    ],
  },
  {
    id: "suspects",
    title: "Suspects",
    icon: "🕵️",
    content: [
      {
        type: "cards",
        cards: SUSPECTS.map((name) => ({
          name,
          emoji: name.includes("Gray") ? "🎓" : name.includes("Violet") ? "💜" : name.includes("Stone") ? "🎖️" : name.includes("Rose") ? "🌹" : name.includes("Black") ? "⚓" : "✨",
          detail: "One of six mansion guests — one is the murderer.",
        })),
      },
    ],
  },
  {
    id: "weapons",
    title: "Weapons",
    icon: "🗡️",
    content: [
      {
        type: "cards",
        cards: WEAPONS.map((name) => ({
          name,
          emoji: name.includes("Dagger") ? "🗡️" : name.includes("Poison") ? "☠️" : name.includes("Revolver") ? "🔫" : name.includes("Rope") ? "🪢" : name.includes("Candle") ? "🕯️" : "🔧",
          detail: "One of six possible murder weapons.",
        })),
      },
    ],
  },
  {
    id: "rooms",
    title: "Rooms & Passages",
    icon: "🏠",
    content: [
      {
        type: "cards",
        cards: ROOMS.map((name) => ({
          name,
          emoji: name.includes("Library") ? "📚" : name.includes("Kitchen") ? "🍳" : name.includes("Ballroom") ? "💃" : name.includes("Study") ? "📜" : name.includes("Dining") ? "🍽️" : name.includes("Conservatory") ? "🌿" : name.includes("Lounge") ? "🛋️" : name.includes("Gallery") ? "🖼️" : "🏚️",
          detail: "One of nine mansion rooms — one is the crime scene.",
        })),
      },
      {
        type: "paragraph",
        text: "Secret passages connect: Study ↔ Kitchen, Library ↔ Conservatory, Gallery ↔ Lounge.",
      },
    ],
  },
  {
    id: "winning",
    title: "Winning Tips",
    icon: "🏆",
    content: [
      {
        type: "list",
        items: [
          "Track every suggestion and who disproved it.",
          "If a player cannot disprove, none of those three cards are in anyone's hand except possibly the solution.",
          "Move into different rooms each turn to force new suggestions.",
          "Use secret passages to reach distant rooms quickly.",
          "Eliminate entire categories in your notes before accusing.",
          "Watch other players' movement patterns for clues about their deductions.",
        ],
      },
      {
        type: "tip",
        text: "The best detectives are patient. Gather evidence before making your final accusation.",
      },
    ],
  },
];

export const onboardingTourSteps = [
  {
    id: "welcome",
    title: "Welcome, Detective",
    description: "This brief tour shows you the key areas of the game board. You can reopen the guide anytime from the header.",
    target: null as string | null,
  },
  {
    id: "turn",
    title: "Turn Status",
    description: "See whose turn it is, the dice roll, and what phase you are in (roll, move, suggest, accuse).",
    target: "tour-turn-status",
  },
  {
    id: "board",
    title: "Mansion Board",
    description: "Gold highlighted tiles show valid moves. Click a tile to move your token after rolling.",
    target: "tour-board",
  },
  {
    id: "actions",
    title: "Action Buttons",
    description: "Roll dice, make suggestions, accuse, or end your turn from here when it is your move.",
    target: "tour-actions",
  },
  {
    id: "hand",
    title: "Your Clues",
    description: "These are your private cards. Other players cannot see them. Use them to disprove suggestions.",
    target: "tour-hand",
  },
  {
    id: "notes",
    title: "Detective Notes",
    description: "Tap cells to mark suspects, weapons, and rooms as you eliminate possibilities.",
    target: "tour-notes",
  },
];
