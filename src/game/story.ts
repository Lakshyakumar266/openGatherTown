export type Item = {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: "relic" | "consumable" | "tool";
  usable?: boolean;
};

export type QuestStep = {
  id: string;
  description: string;
  completed: boolean;
};

export type Quest = {
  id: string;
  title: string;
  description: string;
  steps: QuestStep[];
  active: boolean;
  completed: boolean;
  reward?: string;
};

export type DialogueOption = {
  text: string;
  nextNodeId?: string; // If undefined, dialogue closes
  condition?: (state: StoryState) => boolean;
  onSelect?: (state: StoryState) => void;
};

export type DialogueNode = {
  id: string;
  speaker: string;
  title: string;
  portrait: string; // image url or emoji
  text: string;
  options: DialogueOption[];
};

export type InteractablePOI = {
  id: string;
  name: string;
  type: "npc" | "object";
  position: { x: number; y: number };
  radius: number;
  icon: string;
  prompt: string;
  spriteFolder?: string; // if NPC has custom sprite
  initialNodeId: (state: StoryState) => string;
};

// ─── Default Items ──────────────────────────────────────────────────────────
export const ITEMS: Record<string, Item> = {
  amberRune: {
    id: "amberRune",
    name: "Glinting Amber Rune",
    icon: "🔮",
    description: "An ancient, warm rune dredged from the Well of Whispers. Emits a calming pulse.",
    category: "relic",
  },
  herbalTea: {
    id: "herbalTea",
    name: "Meadow Chamomile Tea",
    icon: "🍵",
    description: "Brewed from sun-dried flowers found in the cottage cache. Soothing to the soul.",
    category: "consumable",
    usable: true,
  },
  oldMap: {
    id: "oldMap",
    name: "Weathered Glade Map",
    icon: "🗺️",
    description: "Hand-drawn parchment detailing Oakhaven Glade and the whispering waterways.",
    category: "tool",
  },
  whisperCloak: {
    id: "whisperCloak",
    name: "Whisperwind Cloak",
    icon: "🪶",
    description: "Bestowed by Elder Oakhaven. Woven from meadow silk, grants effortless swiftness.",
    category: "relic",
  },
};

// ─── Default Quests ─────────────────────────────────────────────────────────
export function createDefaultQuests(): Quest[] {
  return [
    {
      id: "whispering_meadow",
      title: "Awakening in Oakhaven",
      description: "Mysterious amber lights have surfaced across the meadow. Unravel the glade's secrets.",
      active: true,
      completed: false,
      reward: "Whisperwind Cloak (+Swiftness)",
      steps: [
        {
          id: "talk_elder",
          description: "Speak with Elder Oakhaven near the village garden",
          completed: false,
        },
        {
          id: "search_crates",
          description: "Search the cottage supply crates for adventuring tools",
          completed: false,
        },
        {
          id: "inspect_well",
          description: "Inspect the shimmering waters of the Ancient Well",
          completed: false,
        },
        {
          id: "return_rune",
          description: "Deliver the Amber Rune to Elder Oakhaven",
          completed: false,
        },
      ],
    },
  ];
}

// ─── Story State Model ──────────────────────────────────────────────────────
export type StoryState = {
  inventory: Item[];
  quests: Quest[];
  flags: Record<string, boolean>;
};

const STORY_STORAGE_KEY = "opengather_story_save_v1";

export function loadSavedStory(): StoryState {
  try {
    const raw = localStorage.getItem(STORY_STORAGE_KEY);
    if (!raw) return getDefaultStoryState();
    const parsed = JSON.parse(raw);
    return {
      inventory: Array.isArray(parsed.inventory) ? parsed.inventory : [],
      quests: Array.isArray(parsed.quests) && parsed.quests.length > 0 ? parsed.quests : createDefaultQuests(),
      flags: parsed.flags || {},
    };
  } catch {
    return getDefaultStoryState();
  }
}

export function saveStoryState(state: StoryState) {
  try {
    localStorage.setItem(STORY_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export function getDefaultStoryState(): StoryState {
  return {
    inventory: [ITEMS.oldMap],
    quests: createDefaultQuests(),
    flags: {},
  };
}

// ─── Interactive Points of Interest (POIs) in Oakhaven ──────────────────────
// Fixed world coordinates matching the cottage, crates, and well
export const POIS: InteractablePOI[] = [
  {
    id: "elder_oakhaven",
    name: "Elder Oakhaven",
    type: "npc",
    position: { x: 775, y: 245 },
    radius: 65,
    icon: "🧙‍♂️",
    prompt: "Talk to Elder Oakhaven",
    spriteFolder: "03-brom",
    initialNodeId: (state) => {
      if (state.flags.questCompleted) return "elder_farewell";
      if (state.flags.hasRune) return "elder_turn_in";
      if (state.flags.talkedToElder) return "elder_reminder";
      return "elder_intro";
    },
  },
  {
    id: "echo_companion",
    name: "Echo",
    type: "npc",
    position: { x: 600, y: 350 },
    radius: 60,
    icon: "👋",
    prompt: "Chat with Echo",
    spriteFolder: "00-classic",
    initialNodeId: (state) => {
      if (state.flags.talkedToEcho) return "echo_banter";
      return "echo_intro";
    },
  },
  {
    id: "ancient_well",
    name: "Ancient Well of Whispers",
    type: "object",
    position: { x: 830, y: 165 },
    radius: 68,
    icon: "💧",
    prompt: "Examine Ancient Well",
    initialNodeId: (state) => {
      if (state.flags.hasRune) return "well_empty";
      return "well_intro";
    },
  },
  {
    id: "cottage_crates",
    name: "Cottage Supply Cache",
    type: "object",
    position: { x: 750, y: 315 },
    radius: 58,
    icon: "📦",
    prompt: "Search Supply Crates",
    initialNodeId: (state) => {
      if (state.flags.searchedCrates) return "crates_empty";
      return "crates_intro";
    },
  },
];

// ─── Dialogue Trees ─────────────────────────────────────────────────────────
export const DIALOGUE_NODES: Record<string, DialogueNode> = {
  // ── Elder Oakhaven ──
  elder_intro: {
    id: "elder_intro",
    speaker: "Elder Oakhaven",
    title: "Glade Sage",
    portrait: "/characters/03-brom/playerDown.png",
    text: "Peace be with you, young adventurer. The winds carry the scent of rain and old memories. For decades, Oakhaven has slumbered peacefully, yet this morning the Ancient Well began vibrating with golden ripples.",
    options: [
      {
        text: "What could be causing the well to ripple?",
        nextNodeId: "elder_lore",
        onSelect: (state) => {
          state.flags.talkedToElder = true;
          advanceStep(state, "whispering_meadow", "talk_elder");
        },
      },
      {
        text: "I am ready to help. What should I do?",
        nextNodeId: "elder_quest_give",
        onSelect: (state) => {
          state.flags.talkedToElder = true;
          advanceStep(state, "whispering_meadow", "talk_elder");
        },
      },
      {
        text: "Just admiring the scenery for now.",
      },
    ],
  },
  elder_lore: {
    id: "elder_lore",
    speaker: "Elder Oakhaven",
    title: "Glade Sage",
    portrait: "/characters/03-brom/playerDown.png",
    text: "Generations ago, the forest guardians sealed a relic of serenity deep within the crystal springs beneath the well. If it has surfaced, it yearns to be reunited with a pure heart.",
    options: [
      {
        text: "I'll inspect the well and search for the relic.",
        nextNodeId: "elder_quest_give",
      },
      {
        text: "Thank you for the history, Elder.",
      },
    ],
  },
  elder_quest_give: {
    id: "elder_quest_give",
    speaker: "Elder Oakhaven",
    title: "Glade Sage",
    portrait: "/characters/03-brom/playerDown.png",
    text: "Bless your courage! First, check the wooden supply crates beside the cottage—there may be wholesome provisions there. Then inspect the stone well to the northeast.",
    options: [
      {
        text: "Consider it done. I'm on my way!",
      },
    ],
  },
  elder_reminder: {
    id: "elder_reminder",
    speaker: "Elder Oakhaven",
    title: "Glade Sage",
    portrait: "/characters/03-brom/playerDown.png",
    text: "Walk softly, child. The supply crates lie just to the south by the cottage wall, and the Ancient Well shimmers to our northeast.",
    options: [
      {
        text: "Understood, Elder.",
      },
    ],
  },
  elder_turn_in: {
    id: "elder_turn_in",
    speaker: "Elder Oakhaven",
    title: "Glade Sage",
    portrait: "/characters/03-brom/playerDown.png",
    text: "By the ancient trees... is that what I think it is?! The Glinting Amber Rune of Oakhaven! Its warmth fills the entire clearing with tranquility.",
    options: [
      {
        text: "Hand the Amber Rune to Elder Oakhaven.",
        nextNodeId: "elder_reward",
        onSelect: (state) => {
          state.flags.questCompleted = true;
          advanceStep(state, "whispering_meadow", "return_rune");
          completeQuest(state, "whispering_meadow");
          if (!state.inventory.some((i) => i.id === "whisperCloak")) {
            state.inventory.push(ITEMS.whisperCloak);
          }
        },
      },
    ],
  },
  elder_reward: {
    id: "elder_reward",
    speaker: "Elder Oakhaven",
    title: "Glade Sage",
    portrait: "/characters/03-brom/playerDown.png",
    text: "You have revitalized the heart of Oakhaven. Please accept this Whisperwind Cloak—woven from meadow silk. You will feel as light as the mountain breeze whenever you tread upon our soil.",
    options: [
      {
        text: "Thank you, Elder! It is an honor.",
      },
    ],
  },
  elder_farewell: {
    id: "elder_farewell",
    speaker: "Elder Oakhaven",
    title: "Glade Sage",
    portrait: "/characters/03-brom/playerDown.png",
    text: "May the gentle whispers of the glade guide every step of your journey. You are always welcome in Oakhaven.",
    options: [
      {
        text: "Farewell, Elder Oakhaven.",
      },
    ],
  },

  // ── Ancient Well ──
  well_intro: {
    id: "well_intro",
    speaker: "Ancient Well of Whispers",
    title: "Sacred Landmark",
    portrait: "💧",
    text: "The well's stones are damp and cool, covered in soft green moss. A faint harmonic hum resonates from deep below, and a gleaming amber crystal floats gently on the water's surface.",
    options: [
      {
        text: "Reach down into the bucket and retrieve the Amber Rune.",
        nextNodeId: "well_retrieved",
        onSelect: (state) => {
          state.flags.hasRune = true;
          if (!state.inventory.some((i) => i.id === "amberRune")) {
            state.inventory.push(ITEMS.amberRune);
          }
          advanceStep(state, "whispering_meadow", "inspect_well");
        },
      },
      {
        text: "Listen to the harmonic hum for a moment.",
        nextNodeId: "well_listen",
      },
      {
        text: "Leave the well undisturbed.",
      },
    ],
  },
  well_listen: {
    id: "well_listen",
    speaker: "Ancient Well of Whispers",
    title: "Sacred Landmark",
    portrait: "💧",
    text: "The sound washes away all tension and fatigue, filling your lungs with fresh pine air and peace.",
    options: [
      {
        text: "Take the Amber Rune now.",
        nextNodeId: "well_retrieved",
        onSelect: (state) => {
          state.flags.hasRune = true;
          if (!state.inventory.some((i) => i.id === "amberRune")) {
            state.inventory.push(ITEMS.amberRune);
          }
          advanceStep(state, "whispering_meadow", "inspect_well");
        },
      },
      {
        text: "Step back.",
      },
    ],
  },
  well_retrieved: {
    id: "well_retrieved",
    speaker: "Ancient Well of Whispers",
    title: "Sacred Landmark",
    portrait: "✨",
    text: "You reach down and take the Glinting Amber Rune. It pulses with a comforting warmth in the palm of your hand. You should show this to Elder Oakhaven!",
    options: [
      {
        text: "Pocket the rune carefully.",
      },
    ],
  },
  well_empty: {
    id: "well_empty",
    speaker: "Ancient Well of Whispers",
    title: "Sacred Landmark",
    portrait: "💧",
    text: "Clear, tranquil water mirrors the azure sky. The well hums softly in contentment.",
    options: [
      {
        text: "Step away.",
      },
    ],
  },

  // ── Cottage Crates ──
  crates_intro: {
    id: "crates_intro",
    speaker: "Cottage Supply Cache",
    title: "Village Cache",
    portrait: "📦",
    text: "Two cedarwood crates nestled against the cottage wall, sealed with rustic iron latches.",
    options: [
      {
        text: "Open and examine the supplies.",
        nextNodeId: "crates_found",
        onSelect: (state) => {
          state.flags.searchedCrates = true;
          if (!state.inventory.some((i) => i.id === "herbalTea")) {
            state.inventory.push(ITEMS.herbalTea);
          }
          advanceStep(state, "whispering_meadow", "search_crates");
        },
      },
      {
        text: "Leave the crates alone.",
      },
    ],
  },
  crates_found: {
    id: "crates_found",
    speaker: "Cottage Supply Cache",
    title: "Village Cache",
    portrait: "🍵",
    text: "Inside, nestled in dry lavender, you discover a tin of freshly dried Meadow Chamomile Tea! It smells wonderfully calming.",
    options: [
      {
        text: "Take the tea and close the lid.",
      },
    ],
  },
  crates_empty: {
    id: "crates_empty",
    speaker: "Cottage Supply Cache",
    title: "Village Cache",
    portrait: "📦",
    text: "The wooden crates contain spare straw, garden shears, and neat bundles of drying herbs.",
    options: [
      {
        text: "Step away.",
      },
    ],
  },

  // ── Echo Companion ──
  echo_intro: {
    id: "echo_intro",
    speaker: "Echo",
    title: "Meadow Wanderer",
    portrait: "/characters/00-classic/playerDown.png",
    text: "Greetings, fellow traveler! The breeze here is unmatched, isn't it? Take your time exploring every corner of Oakhaven.",
    options: [
      {
        text: "Any tips on navigating around?",
        nextNodeId: "echo_controls",
        onSelect: (state) => {
          state.flags.talkedToEcho = true;
        },
      },
      {
        text: "What do you know about this village?",
        nextNodeId: "echo_village",
        onSelect: (state) => {
          state.flags.talkedToEcho = true;
        },
      },
      {
        text: "Enjoy your stroll, Echo!",
      },
    ],
  },
  echo_controls: {
    id: "echo_controls",
    speaker: "Echo",
    title: "Meadow Wanderer",
    portrait: "/characters/00-classic/playerDown.png",
    text: "You can move with WASD keys, or simply double-click any spot on the ground to auto-walk there. Use your mouse scroll or +/- keys to zoom the camera in close for a cozy view!",
    options: [
      {
        text: "Good to know! Thank you.",
      },
    ],
  },
  echo_village: {
    id: "echo_village",
    speaker: "Echo",
    title: "Meadow Wanderer",
    portrait: "/characters/00-classic/playerDown.png",
    text: "Elder Oakhaven watches over the grove. If you haven't spoken to him yet, he's usually standing near the well admiring the flowers.",
    options: [
      {
        text: "I'll go talk to him.",
      },
    ],
  },
  echo_banter: {
    id: "echo_banter",
    speaker: "Echo",
    title: "Meadow Wanderer",
    portrait: "/characters/00-classic/playerDown.png",
    text: "The sun warms the stones, the water whispers in the well... It feels wonderful to be alive in Oakhaven today.",
    options: [
      {
        text: "Indeed it does, Echo.",
      },
    ],
  },
};

// ─── Quest Progression Helpers ──────────────────────────────────────────────
export function advanceStep(state: StoryState, questId: string, stepId: string): boolean {
  const quest = state.quests.find((q) => q.id === questId);
  if (!quest) return false;
  const step = quest.steps.find((s) => s.id === stepId);
  if (step && !step.completed) {
    step.completed = true;
    saveStoryState(state);
    return true;
  }
  return false;
}

export function completeQuest(state: StoryState, questId: string): boolean {
  const quest = state.quests.find((q) => q.id === questId);
  if (quest && !quest.completed) {
    quest.completed = true;
    saveStoryState(state);
    return true;
  }
  return false;
}
