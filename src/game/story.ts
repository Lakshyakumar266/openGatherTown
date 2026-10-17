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
  portrait: string; // emoji or identifier
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
  spriteFolder?: string; // custom sprite character folder
  initialNodeId: (state: StoryState) => string;
};

// ─── Default Items Catalog ──────────────────────────────────────────────────
export const ITEMS: Record<string, Item> = {
  oldMap: {
    id: "oldMap",
    name: "Weathered Glade Map",
    icon: "🗺️",
    description: "A hand-inked parchment revealing the coastlines, waterways, and stone ruins of OpenGather.",
    category: "tool",
  },
  compass: {
    id: "compass",
    name: "Explorer's Brass Compass",
    icon: "🧭",
    description: "An antique nautical compass. Its enchanted needle quivers toward ancient elemental relics.",
    category: "tool",
  },
  amberRune: {
    id: "amberRune",
    name: "Glinting Amber Rune",
    icon: "🔮",
    description: "An ancient solar glyph salvaged from the western ruins. Radiates a soothing warmth.",
    category: "relic",
  },
  waterSigil: {
    id: "waterSigil",
    name: "Shimmering Water Sigil",
    icon: "🌊",
    description: "Carved from sapphire sea-glass dredged from the depths of Whispering Lake.",
    category: "relic",
  },
  herbalTea: {
    id: "herbalTea",
    name: "Meadow Chamomile Tea",
    icon: "🍵",
    description: "Brewed from wild blossoms by Echo. Calms restless wanderers.",
    category: "consumable",
    usable: true,
  },
  silasElixir: {
    id: "silasElixir",
    name: "Silas's Swiftness Elixir",
    icon: "🧪",
    description: "A potent draught distilled from moonlit lavender and wild herbs. Invigorates the body.",
    category: "consumable",
    usable: true,
  },
  expeditionJournal: {
    id: "expeditionJournal",
    name: "Archivist's Lost Logbook",
    icon: "📜",
    description: "Silas's field notes documenting the ancient cataclysm that submerged the Sunken Citadel.",
    category: "tool",
  },
  whisperCloak: {
    id: "whisperCloak",
    name: "Whisperwind Cloak of the Arch-Explorer",
    icon: "🪶",
    description: "A gossamer mantle woven from cloud-silk. Drastically boosts travel pace across any terrain.",
    category: "relic",
  },
  starflower: {
    id: "starflower",
    name: "Celestial Starflower",
    icon: "🌸",
    description: "A rare bloom that unfurls only when the Sunken Core is cleansed of ancient sorrow.",
    category: "relic",
  },
};

// ─── Multi-Act Questline ────────────────────────────────────────────────────
export function createDefaultQuests(): Quest[] {
  return [
    {
      id: "act1_awakening",
      title: "Act I: The Sunken Awakening",
      description: "Strange amber tremors echo from the Sunken Citadel. Speak with Elder Oakhaven and locate the Explorer's Compass.",
      active: true,
      completed: false,
      reward: "Explorer's Brass Compass + Herbal Tea",
      steps: [
        {
          id: "talk_elder_intro",
          description: "Consult Elder Oakhaven at the northern Sunken Citadel courtyard",
          completed: false,
        },
        {
          id: "search_ruins_chest",
          description: "Recover the Brass Compass from the western ruins chest",
          completed: false,
        },
        {
          id: "speak_with_echo",
          description: "Regroup with Echo along the southern glade highway",
          completed: false,
        },
      ],
    },
    {
      id: "act2_hermit",
      title: "Act II: Silas & The Wildflower Remedy",
      description: "Seek out Silas the Hermit in his eastern thatched cottage and gather wild moonlit lavender for his curative elixir.",
      active: false,
      completed: false,
      reward: "Silas's Swiftness Elixir + Archivist's Logbook",
      steps: [
        {
          id: "visit_silas",
          description: "Visit Silas the Hermit at his cottage near the eastern orchard",
          completed: false,
        },
        {
          id: "gather_lavender",
          description: "Harvest wild purple lavender from the meadow fields",
          completed: false,
        },
        {
          id: "deliver_lavender",
          description: "Return to Silas to brew the Swiftness Elixir",
          completed: false,
        },
      ],
    },
    {
      id: "act3_mariner",
      title: "Act III: Depths of Whispering Lake",
      description: "Meet Captain Joshua at the wooden pier on Whispering Lake and recover the submerged Water Sigil.",
      active: false,
      completed: false,
      reward: "Shimmering Water Sigil",
      steps: [
        {
          id: "meet_joshua",
          description: "Speak with Captain Joshua at the lake pier",
          completed: false,
        },
        {
          id: "inspect_pier_depths",
          description: "Gaze into the sapphire depths at the end of the pier",
          completed: false,
        },
        {
          id: "dredge_sigil",
          description: "Dredge the ancient Water Sigil from the lakebed",
          completed: false,
        },
      ],
    },
    {
      id: "act4_sunken_core",
      title: "Act IV: Restoration of the Sunken Core",
      description: "Bring the Amber Rune and Water Sigil to the Sacred Sun Altar to rekindle the island's dormant ancient core.",
      active: false,
      completed: false,
      reward: "Whisperwind Cloak (+Speed) + Celestial Starflower",
      steps: [
        {
          id: "consecrate_altar",
          description: "Place both Sigils onto the Sacred Sun Altar",
          completed: false,
        },
        {
          id: "elder_blessing",
          description: "Receive Elder Oakhaven's Arch-Explorer blessing",
          completed: false,
        },
      ],
    },
  ];
}

// ─── Story State Model & Persistence ────────────────────────────────────────
export type StoryState = {
  inventory: Item[];
  quests: Quest[];
  flags: Record<string, boolean>;
};

const STORY_STORAGE_KEY = "opengather_story_save_v2";

export function loadSavedStory(): StoryState {
  try {
    const raw = localStorage.getItem(STORY_STORAGE_KEY);
    if (!raw) return getDefaultStoryState();
    const parsed = JSON.parse(raw);
    return {
      inventory: Array.isArray(parsed.inventory) && parsed.inventory.length > 0 ? parsed.inventory : [ITEMS.oldMap],
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

// Helper to advance quest step safely
function advanceQuestStep(state: StoryState, questId: string, stepId: string) {
  const quest = state.quests.find((q) => q.id === questId);
  if (!quest) return;
  const step = quest.steps.find((s) => s.id === stepId);
  if (step) step.completed = true;

  // Check if all steps in this quest are done
  if (quest.steps.every((s) => s.completed)) {
    quest.completed = true;
    // Activate next quest
    if (questId === "act1_awakening") {
      const q2 = state.quests.find((q) => q.id === "act2_hermit");
      if (q2) q2.active = true;
    } else if (questId === "act2_hermit") {
      const q3 = state.quests.find((q) => q.id === "act3_mariner");
      if (q3) q3.active = true;
    } else if (questId === "act3_mariner") {
      const q4 = state.quests.find((q) => q.id === "act4_sunken_core");
      if (q4) q4.active = true;
    }
  }
  saveStoryState(state);
}

// ─── Interactive Points of Interest (POIs) ──────────────────────────────────
export const POIS: InteractablePOI[] = [
  {
    id: "elder_oakhaven",
    name: "Elder Oakhaven",
    type: "npc",
    position: { x: 32 * 64 + 32, y: 15 * 64 + 32 }, // Altar courtyard
    radius: 76,
    icon: "🧙‍♂️",
    prompt: "Consult Elder Oakhaven",
    spriteFolder: "03-brom",
    initialNodeId: (state) => {
      if (state.flags.coreRestored) return "elder_farewell";
      if (state.flags.hasWaterSigil && state.flags.hasAmberRune) return "elder_ready_core";
      if (state.flags.metJoshua) return "elder_lake_advice";
      if (state.flags.talkedToSilas) return "elder_hermit_advice";
      if (state.flags.talkedToElder) return "elder_reminder";
      return "elder_intro";
    },
  },
  {
    id: "echo_companion",
    name: "Echo",
    type: "npc",
    position: { x: 28 * 64 + 32, y: 38 * 64 + 32 }, // Southern Village Green
    radius: 70,
    icon: "🧝‍♀️",
    prompt: "Speak with Echo",
    spriteFolder: "00-classic",
    initialNodeId: (state) => {
      if (state.flags.coreRestored) return "echo_victory";
      if (state.flags.hasCompass && !state.flags.echoReceivedCompass) return "echo_compass_reaction";
      return "echo_banter";
    },
  },
  {
    id: "silas_hermit",
    name: "Silas the Hermit",
    type: "npc",
    position: { x: 41 * 64 + 32, y: 35 * 64 + 32 }, // Eastern Thatched Cottage
    radius: 70,
    icon: "🧔",
    prompt: "Talk to Silas the Hermit",
    spriteFolder: "05-rowan",
    initialNodeId: (state) => {
      if (state.flags.brewedElixir) return "silas_grateful";
      if (state.flags.gatheredLavender) return "silas_turn_in_lavender";
      if (state.flags.talkedToSilas) return "silas_lavender_reminder";
      return "silas_intro";
    },
  },
  {
    id: "captain_joshua",
    name: "Captain Joshua",
    type: "npc",
    position: { x: 50 * 64 + 32, y: 28 * 64 + 32 }, // Whispering Lake Pier
    radius: 72,
    icon: "⚓",
    prompt: "Speak with Captain Joshua",
    spriteFolder: "01-aldric",
    initialNodeId: (state) => {
      if (state.flags.hasWaterSigil) return "joshua_sigil_recovered";
      if (state.flags.gazedIntoDepths) return "joshua_ready_dredge";
      if (state.flags.metJoshua) return "joshua_whispers_lake";
      return "joshua_intro";
    },
  },
  {
    id: "ancient_sun_altar",
    name: "Sacred Sun Altar",
    type: "object",
    position: { x: 32 * 64 + 32, y: 15 * 64 + 32 },
    radius: 64,
    icon: "☀️",
    prompt: "Examine Sacred Sun Altar",
    initialNodeId: (state) => {
      if (state.flags.coreRestored) return "altar_radiant";
      if (state.flags.hasWaterSigil && state.flags.hasAmberRune) return "altar_consecrate";
      return "altar_dormant";
    },
  },
  {
    id: "relic_chest",
    name: "Forgotten Relic Chest",
    type: "object",
    position: { x: 24 * 64 + 32, y: 14 * 64 + 32 },
    radius: 60,
    icon: "📦",
    prompt: "Open Relic Chest",
    initialNodeId: (state) => {
      if (state.flags.openedRuinsChest) return "chest_empty";
      return "chest_open";
    },
  },
  {
    id: "lake_pier_lookout",
    name: "Whispering Lake Depths",
    type: "object",
    position: { x: 53 * 64 + 32, y: 28 * 64 + 32 },
    radius: 62,
    icon: "🌊",
    prompt: "Gaze into Lake Depths",
    initialNodeId: (state) => {
      if (state.flags.hasWaterSigil) return "depths_placid";
      if (state.flags.metJoshua) return "depths_inspect";
      return "depths_murky";
    },
  },
  {
    id: "village_well",
    name: "Well of Whispers",
    type: "object",
    position: { x: 29 * 64 + 32, y: 34 * 64 + 32 },
    radius: 60,
    icon: "🪣",
    prompt: "Toss coin into Well",
    initialNodeId: (_state) => "well_wish",
  },
];

// ─── Dialogue Nodes Graph ───────────────────────────────────────────────────
export const DIALOGUE_NODES: Record<string, DialogueNode> = {
  // ── ELDER OAKHAVEN NODES ──
  elder_intro: {
    id: "elder_intro",
    speaker: "Elder Oakhaven",
    title: "Guardian of the Sunken Citadel",
    portrait: "🧙‍♂️",
    text: "Greetings, traveler. You stand upon the ancient stones of OpenGather. The earth hums with forgotten resonance — our Sunken Core has fallen dormant, and the spring waters grow restless. Will you aid our archipelago?",
    options: [
      {
        text: "Tell me of the Sunken Core, Elder.",
        nextNodeId: "elder_lore_core",
      },
      {
        text: "What must I do to help?",
        nextNodeId: "elder_quest_start",
      },
      {
        text: "I must prepare myself first. Farewell.",
      },
    ],
  },
  elder_lore_core: {
    id: "elder_lore_core",
    speaker: "Elder Oakhaven",
    title: "Guardian of the Sunken Citadel",
    portrait: "🧙‍♂️",
    text: "Centuries ago, two sacred keystones kept balance between land and tide: the Glinting Amber Rune of the Sun Altar, and the Shimmering Water Sigil of Whispering Lake. When the great cataclysm came, both were scattered to the winds.",
    options: [
      {
        text: "Where should I begin searching?",
        nextNodeId: "elder_quest_start",
      },
      {
        text: "I understand. I shall heed your guidance.",
      },
    ],
  },
  elder_quest_start: {
    id: "elder_quest_start",
    speaker: "Elder Oakhaven",
    title: "Guardian of the Sunken Citadel",
    portrait: "🧙‍♂️",
    text: "First, inspect the weathered chest in the western ruins across the courtyard. My predecessor locked the Brass Explorer's Compass within. Once retrieved, seek out Echo down on the village road.",
    options: [
      {
        text: "Consider it done, Elder.",
        onSelect: (state) => {
          state.flags.talkedToElder = true;
          advanceQuestStep(state, "act1_awakening", "talk_elder_intro");
        },
      },
      {
        text: "Is there anything else I should know?",
        nextNodeId: "elder_lore_core",
      },
    ],
  },
  elder_reminder: {
    id: "elder_reminder",
    speaker: "Elder Oakhaven",
    title: "Guardian of the Sunken Citadel",
    portrait: "🧙‍♂️",
    text: "Remember, child of the wind: recover the Brass Compass from the western ruins chest, then meet Echo along the southern highway. Let your footsteps tread gently upon the earth.",
    options: [
      {
        text: "Thank you for the guidance, Elder.",
      },
      {
        text: "Remind me of the history of this sanctuary.",
        nextNodeId: "elder_lore_core",
      },
    ],
  },
  elder_ready_core: {
    id: "elder_ready_core",
    speaker: "Elder Oakhaven",
    title: "Guardian of the Sunken Citadel",
    portrait: "🧙‍♂️",
    text: "By the stars... you hold both the Amber Rune and the Water Sigil! The harmonic hum from your satchel makes the ancient flagstones vibrate! Approach the Sacred Sun Altar and consecrate them!",
    options: [
      {
        text: "Let us rekindle the Sunken Core!",
        nextNodeId: "altar_consecrate",
      },
    ],
  },
  elder_hermit_advice: {
    id: "elder_hermit_advice",
    speaker: "Elder Oakhaven",
    title: "Guardian of the Sunken Citadel",
    portrait: "🧙‍♂️",
    text: "I see you have met Silas in his thatched cottage. A reclusive botanist, yes, but no soul understands the glade's medicinal flora better than him.",
    options: [{ text: "I shall help him with his lavender brew." }],
  },
  elder_lake_advice: {
    id: "elder_lake_advice",
    speaker: "Elder Oakhaven",
    title: "Guardian of the Sunken Citadel",
    portrait: "🧙‍♂️",
    text: "Captain Joshua watches the deep waters of Whispering Lake. If the Water Sigil still rests beneath the tides, Joshua's sharp eye and rowboat will uncover it.",
    options: [{ text: "I am on my way to the lake pier." }],
  },
  elder_farewell: {
    id: "elder_farewell",
    speaker: "Elder Oakhaven",
    title: "Guardian of the Sunken Citadel",
    portrait: "🧙‍♂️",
    text: "The Sunken Core radiates with golden celestial warmth once more! The springs run crystal clear, and the wildflower meadows flourish. You are forever the Hero of OpenGather!",
    options: [{ text: "It was an honor, Elder Oakhaven." }],
  },

  // ── ECHO COMPANION NODES ──
  echo_compass_reaction: {
    id: "echo_compass_reaction",
    speaker: "Echo",
    title: "Glade Scout & Companion",
    portrait: "🧝‍♀️",
    text: "You found the Brass Compass! Look how the needle spins and points toward the eastern glades! Here, drink this warm Chamomile Tea I brewed—you've earned a breather.",
    options: [
      {
        text: "Thank you, Echo! What's our next step?",
        onSelect: (state) => {
          state.flags.echoReceivedCompass = true;
          if (!state.inventory.some((i) => i.id === "herbalTea")) {
            state.inventory.push(ITEMS.herbalTea);
          }
          advanceQuestStep(state, "act1_awakening", "speak_with_echo");
        },
        nextNodeId: "echo_next_lead",
      },
    ],
  },
  echo_next_lead: {
    id: "echo_next_lead",
    speaker: "Echo",
    title: "Glade Scout & Companion",
    portrait: "🧝‍♀️",
    text: "The compass needle is trembling toward the eastern thatched cottage! That's where Silas the Hermit lives. He's been researching the wildflower roots for weeks. We should go consult him!",
    options: [{ text: "Let's head east to Silas's cottage!" }],
  },
  echo_banter: {
    id: "echo_banter",
    speaker: "Echo",
    title: "Glade Scout & Companion",
    portrait: "🧝‍♀️",
    text: "Feel that gentle breeze? The rabbits love grazing near the blue cottage garden. Press [M] at any time if you ever need to check the full World Map!",
    options: [
      { text: "Good tip, Echo. I'll check the map." },
      { text: "Have you seen any wild deer today?", nextNodeId: "echo_deer_talk" },
    ],
  },
  echo_deer_talk: {
    id: "echo_deer_talk",
    speaker: "Echo",
    title: "Glade Scout & Companion",
    portrait: "🧝‍♀️",
    text: "Aye! Two white-tailed deer were grazing peacefully by the northern tree grove earlier. If you approach them slowly, they'll look right at you!",
    options: [{ text: "I'll go watch them gently." }],
  },
  echo_victory: {
    id: "echo_victory",
    speaker: "Echo",
    title: "Glade Scout & Companion",
    portrait: "🧝‍♀️",
    text: "We did it! The whole glade is glowing with celestial starflowers! Look at your Whisperwind Cloak fluttering in the wind—you look like a true legend of OpenGather!",
    options: [{ text: "We made a great team, Echo!" }],
  },

  // ── SILAS THE HERMIT NODES ──
  silas_intro: {
    id: "silas_intro",
    speaker: "Silas the Hermit",
    title: "Glade Herbalist & Archivist",
    portrait: "🧔",
    text: "Halt there, traveler! Step lightly—my drying chamomile drying racks are delicate. Wait... you carry the Explorer's Compass! Did Elder Oakhaven send you?",
    options: [
      {
        text: "Yes, Silas. We are restoring the harmony of OpenGather.",
        nextNodeId: "silas_quest",
      },
      {
        text: "What are you brewing in those brass kettles?",
        nextNodeId: "silas_lore_brewing",
      },
    ],
  },
  silas_lore_brewing: {
    id: "silas_lore_brewing",
    speaker: "Silas the Hermit",
    title: "Glade Herbalist & Archivist",
    portrait: "🧔",
    text: "An ancient vigor tonic called the Swiftness Elixir! But the glade's wild moonlit lavender has been scarce lately. If I had fresh sprigs, I could finish the batch.",
    options: [{ text: "I can harvest wild lavender for you!", nextNodeId: "silas_quest" }],
  },
  silas_quest: {
    id: "silas_quest",
    speaker: "Silas the Hermit",
    title: "Glade Herbalist & Archivist",
    portrait: "🧔",
    text: "Splendid! Search the lush meadow fields just west of my garden fence. Gather purple lavender sprigs and bring them to me. In exchange, I'll share my Swiftness Elixir and my expedition logbook!",
    options: [
      {
        text: "I'll gather the lavender right away.",
        onSelect: (state) => {
          state.flags.talkedToSilas = true;
          advanceQuestStep(state, "act2_hermit", "visit_silas");
        },
      },
    ],
  },
  silas_lavender_reminder: {
    id: "silas_lavender_reminder",
    speaker: "Silas the Hermit",
    title: "Glade Herbalist & Archivist",
    portrait: "🧔",
    text: "Have you spotted the purple lavender patches in the glade? Just press [E] near the flower clusters to gather them.",
    options: [
      {
        text: "I have gathered the fresh lavender sprigs right here!",
        nextNodeId: "silas_turn_in_lavender",
        onSelect: (state) => {
          state.flags.gatheredLavender = true;
          advanceQuestStep(state, "act2_hermit", "gather_lavender");
        },
      },
      { text: "Still gathering, Silas. Be back shortly." },
    ],
  },
  silas_turn_in_lavender: {
    id: "silas_turn_in_lavender",
    speaker: "Silas the Hermit",
    title: "Glade Herbalist & Archivist",
    portrait: "🧔",
    text: "Ah, the aroma of fresh moonlit lavender! *Silas crushes the petals into a bubbling crystal beaker.* Magnificent! Here is your Swiftness Elixir, and take my Archivist's Logbook—it tells of the lake pier!",
    options: [
      {
        text: "Thank you, Silas! What does the logbook say about the lake?",
        onSelect: (state) => {
          state.flags.brewedElixir = true;
          if (!state.inventory.some((i) => i.id === "silasElixir")) {
            state.inventory.push(ITEMS.silasElixir);
          }
          if (!state.inventory.some((i) => i.id === "expeditionJournal")) {
            state.inventory.push(ITEMS.expeditionJournal);
          }
          advanceQuestStep(state, "act2_hermit", "deliver_lavender");
        },
        nextNodeId: "silas_lake_hint",
      },
    ],
  },
  silas_lake_hint: {
    id: "silas_lake_hint",
    speaker: "Silas the Hermit",
    title: "Glade Herbalist & Archivist",
    portrait: "🧔",
    text: "Old Captain Joshua guards the wooden pier on Whispering Lake to the northeast. My notes indicate the Water Sigil lies submerged just off the pier's edge. Joshua will know how to reach it!",
    options: [{ text: "To Whispering Lake pier, then!" }],
  },
  silas_grateful: {
    id: "silas_grateful",
    speaker: "Silas the Hermit",
    title: "Glade Herbalist & Archivist",
    portrait: "🧔",
    text: "My drying racks are full, and my tea is hot! May the Swiftness Elixir lighten your tread across the archipelago, brave traveler.",
    options: [{ text: "Take care, Silas." }],
  },

  // ── CAPTAIN JOSHUA NODES ──
  joshua_intro: {
    id: "joshua_intro",
    speaker: "Captain Joshua",
    title: "Lake Mariner",
    portrait: "⚓",
    text: "Ahoy, wanderer! Watch your footing on the planks—the lake water runs deep and sapphire blue today. Hear that gentle chime beneath the ripples? That's the ancient masonry of the submerged ruins.",
    options: [
      {
        text: "Silas's journal led me here. We seek the Water Sigil.",
        nextNodeId: "joshua_quest",
      },
      {
        text: "How long have you kept watch over Whispering Lake?",
        nextNodeId: "joshua_lore",
      },
    ],
  },
  joshua_lore: {
    id: "joshua_lore",
    speaker: "Captain Joshua",
    title: "Lake Mariner",
    portrait: "⚓",
    text: "Man and boy, forty years! My grandfather rowed these waterways when the sunken towers still reached above the surface. The water has kept the ancient secrets safe from harm.",
    options: [{ text: "Help me find the Water Sigil, Captain.", nextNodeId: "joshua_quest" }],
  },
  joshua_quest: {
    id: "joshua_quest",
    speaker: "Captain Joshua",
    title: "Lake Mariner",
    portrait: "⚓",
    text: "Walk to the far edge of the wooden pier and gaze into the water. If you focus your senses, the submerged glyphs will resonate with your Explorer's Compass!",
    options: [
      {
        text: "I will inspect the pier's edge immediately.",
        onSelect: (state) => {
          state.flags.metJoshua = true;
          advanceQuestStep(state, "act3_mariner", "meet_joshua");
        },
      },
    ],
  },
  joshua_whispers_lake: {
    id: "joshua_whispers_lake",
    speaker: "Captain Joshua",
    title: "Lake Mariner",
    portrait: "⚓",
    text: "Step to the end of the pier and look down into the crystal depths. The sigil's blue gleam cannot hide from a true seeker.",
    options: [{ text: "Understood, Captain." }],
  },
  joshua_ready_dredge: {
    id: "joshua_ready_dredge",
    speaker: "Captain Joshua",
    title: "Lake Mariner",
    portrait: "⚓",
    text: "You saw it, didn't you! The sapphire pulse beneath the waves! Here, take my brass dredging hook and bring it to the surface!",
    options: [
      {
        text: "Dredge the Water Sigil from the lakebed!",
        onSelect: (state) => {
          state.flags.hasWaterSigil = true;
          if (!state.inventory.some((i) => i.id === "waterSigil")) {
            state.inventory.push(ITEMS.waterSigil);
          }
          advanceQuestStep(state, "act3_mariner", "dredge_sigil");
        },
        nextNodeId: "joshua_sigil_recovered",
      },
    ],
  },
  joshua_sigil_recovered: {
    id: "joshua_sigil_recovered",
    speaker: "Captain Joshua",
    title: "Lake Mariner",
    portrait: "⚓",
    text: "Incredible! The Shimmering Water Sigil is in your hands! It radiates pure, crystalline energy. Run back to Elder Oakhaven at the Sun Altar—the time has come to restore the Sunken Core!",
    options: [{ text: "Thank you, Captain Joshua! To the Sunken Citadel!" }],
  },

  // ── OBJECT & ALTAR NODES ──
  altar_dormant: {
    id: "altar_dormant",
    speaker: "Sacred Sun Altar",
    title: "Heart of the Sunken Citadel",
    portrait: "☀️",
    text: "An ancient monolithic sun altar engraved with twin circular sockets. One socket calls for the Amber Rune; the other for the Water Sigil. Both sockets lie empty.",
    options: [{ text: "Step away and continue searching." }],
  },
  altar_consecrate: {
    id: "altar_consecrate",
    speaker: "Sacred Sun Altar",
    title: "Heart of the Sunken Citadel",
    portrait: "☀️",
    text: "The Glinting Amber Rune and Shimmering Water Sigil rise from your satchel, floating gently into their rightful sockets! A blinding pillar of golden and azure light erupts into the sky, cleansing the entire archipelago!",
    options: [
      {
        text: "Claim the Arch-Explorer's Blessing!",
        onSelect: (state) => {
          state.flags.coreRestored = true;
          if (!state.inventory.some((i) => i.id === "whisperCloak")) {
            state.inventory.push(ITEMS.whisperCloak);
          }
          if (!state.inventory.some((i) => i.id === "starflower")) {
            state.inventory.push(ITEMS.starflower);
          }
          advanceQuestStep(state, "act4_sunken_core", "consecrate_altar");
          advanceQuestStep(state, "act4_sunken_core", "elder_blessing");
        },
        nextNodeId: "elder_farewell",
      },
    ],
  },
  altar_radiant: {
    id: "altar_radiant",
    speaker: "Sacred Sun Altar",
    title: "Heart of the Sunken Citadel",
    portrait: "☀️",
    text: "The Sun Altar pulses with eternal radiant vitality. Twin ribbons of solar fire and sapphire water spiral peacefully around the stones.",
    options: [{ text: "Bask in the warm harmony." }],
  },
  chest_open: {
    id: "chest_open",
    speaker: "Forgotten Relic Chest",
    title: "Ruins Cache",
    portrait: "📦",
    text: "You unlatch the rusted iron lock. Inside lies the Brass Explorer's Compass, nestled beside an ancient Glinting Amber Rune!",
    options: [
      {
        text: "Take the Compass and Amber Rune into your satchel.",
        onSelect: (state) => {
          state.flags.openedRuinsChest = true;
          state.flags.hasCompass = true;
          state.flags.hasAmberRune = true;
          if (!state.inventory.some((i) => i.id === "compass")) {
            state.inventory.push(ITEMS.compass);
          }
          if (!state.inventory.some((i) => i.id === "amberRune")) {
            state.inventory.push(ITEMS.amberRune);
          }
          advanceQuestStep(state, "act1_awakening", "search_ruins_chest");
        },
      },
    ],
  },
  chest_empty: {
    id: "chest_empty",
    speaker: "Forgotten Relic Chest",
    title: "Ruins Cache",
    portrait: "📦",
    text: "The relic chest is empty, save for traces of dried sea lavender.",
    options: [{ text: "Close the chest." }],
  },
  depths_inspect: {
    id: "depths_inspect",
    speaker: "Whispering Lake Depths",
    title: "Submerged Ruins",
    portrait: "🌊",
    text: "You lean over the wooden pier railing. Sunlight pierces the clear sapphire water, revealing the carved silhouette of the Water Sigil resting upon an ancient marble pedestal!",
    options: [
      {
        text: "Report what you saw to Captain Joshua!",
        onSelect: (state) => {
          state.flags.gazedIntoDepths = true;
          advanceQuestStep(state, "act3_mariner", "inspect_pier_depths");
        },
        nextNodeId: "joshua_ready_dredge",
      },
    ],
  },
  depths_murky: {
    id: "depths_murky",
    speaker: "Whispering Lake Depths",
    title: "Submerged Ruins",
    portrait: "🌊",
    text: "The gentle waves lap against the pier pilings. You should speak with Captain Joshua before inspecting the deep water.",
    options: [{ text: "Step back safely onto the dock." }],
  },
  depths_placid: {
    id: "depths_placid",
    speaker: "Whispering Lake Depths",
    title: "Submerged Ruins",
    portrait: "🌊",
    text: "Schools of iridescent silverfish swim merrily among the submerged marble columns. The lake is peaceful and crystal clear.",
    options: [{ text: "Enjoy the scenic view." }],
  },
  well_wish: {
    id: "well_wish",
    speaker: "Well of Whispers",
    title: "Village Centerpiece",
    portrait: "🪣",
    text: "A cool draft rises from the stone well. You hear faint chime-like whispers echoing from the deep spring water.",
    options: [
      {
        text: "Make a wish for safe travels.",
        onSelect: (state) => {
          state.flags.wishedAtWell = true;
        },
      },
      { text: "Walk away." },
    ],
  },
};
