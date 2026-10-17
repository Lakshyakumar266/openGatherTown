import { createContext, useContext } from "react";

export type GamePhase = "start" | "game";

export type CharacterOption = {
  id: string;
  name: string;
  folder: string;
  description: string;
  color: string;
};

export const CHARACTER_OPTIONS: CharacterOption[] = [
  {
    id: "classic",
    name: "Wanderer",
    folder: "00-classic",
    description: "The classic emerald-robed explorer of these lands.",
    color: "#22c55e",
  },
  {
    id: "aldric",
    name: "Aldric",
    folder: "01-aldric",
    description: "A seasoned warrior with unwavering resolve.",
    color: "#6ea8fe",
  },
  {
    id: "mira",
    name: "Mira",
    folder: "02-mira",
    description: "Swift and clever, master of the shadows.",
    color: "#f497c0",
  },
  {
    id: "brom",
    name: "Brom",
    folder: "03-brom",
    description: "Gentle giant, protector of the weak.",
    color: "#a8d8a8",
  },
  {
    id: "sable",
    name: "Sable",
    folder: "04-sable",
    description: "Mysterious traveler from the eastern lands.",
    color: "#c084fc",
  },
  {
    id: "rowan",
    name: "Rowan",
    folder: "05-rowan",
    description: "Young adventurer full of boundless energy.",
    color: "#fbbf24",
  },
  {
    id: "elia",
    name: "Elia",
    folder: "06-elia",
    description: "Wise mage who weaves magic effortlessly.",
    color: "#67e8f9",
  },
];

export type PlayerConfig = {
  name: string;
  character: CharacterOption;
};

export type GameSettings = {
  bgmVolume: number;
  sfxVolume: number;
  bgmMuted: boolean;
  sfxMuted: boolean;
  showFps: boolean;
  showNameplates: boolean;
};

export const DEFAULT_SETTINGS: GameSettings = {
  bgmVolume: 0.4,
  sfxVolume: 0.7,
  bgmMuted: false,
  sfxMuted: false,
  showFps: false,
  showNameplates: true,
};

export type GameContextType = {
  phase: GamePhase;
  playerConfig: PlayerConfig | null;
  settings: GameSettings;
  setPhase: (phase: GamePhase) => void;
  setPlayerConfig: (config: PlayerConfig) => void;
  updateSettings: (partial: Partial<GameSettings>) => void;
};

export const GameContext = createContext<GameContextType>({
  phase: "start",
  playerConfig: null,
  settings: DEFAULT_SETTINGS,
  setPhase: () => {},
  setPlayerConfig: () => {},
  updateSettings: () => {},
});

export const useGameContext = () => useContext(GameContext);
