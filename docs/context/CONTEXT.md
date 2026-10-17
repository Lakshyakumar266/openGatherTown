# OpenGather — Project Context

## Overview
**OpenGather** is a browser-based top-down multiplayer-style world, inspired by [Gather.town](https://www.gather.town/). Built with React + TypeScript + Vite, rendered on an HTML5 Canvas.

---

## Architecture

### Phase State Machine
The game runs through two phases managed by `GameContext`:

| Phase | Description |
|-------|-------------|
| `start` | Character + name selection screen |
| `game`  | In-world game loop with HUD overlay |

### File Structure
```
src/
├── App.tsx                    # Root: phase machine, game loop
├── class.ts                   # Sprite, Boundary classes
├── collision.ts               # Static collision tilemap
├── index.css                  # Global styles
├── main.tsx                   # React entry point
├── components/
│   ├── StartScreen.tsx        # Character & name selection UI
│   ├── StartScreen.css        # Start screen styles
│   ├── GameHUD.tsx            # In-game HUD, Settings, Controls modals
│   └── GameHUD.css            # HUD styles
└── game/
    ├── audioManager.ts        # Howler.js BGM/SFX manager
    ├── ambient.ts             # Procedural ambient particles
    ├── gameContext.ts         # React context, types, CHARACTER_OPTIONS
    ├── particles.ts           # Click-sprinkle particles
    ├── pathfinding.ts         # A* pathfinding
    └── clickMovement.ts       # Double-click movement
```

---

## Features

### Start Screen
- Animated starfield background with twinkling stars
- Gradient orbs for depth (glassmorphism aesthetic)
- **Character selection**: 6 characters (Aldric, Mira, Brom, Sable, Rowan, Elia)
  - Arrow navigation + thumbnail grid
  - Per-character color glow and sprite preview
- **Name entry**: Input with live character counter (max 18), validation
- Fade-out transition into the game world

### Characters
Located in `public/characters/{folder}/`:
- `01-aldric` — Warrior, blue
- `02-mira` — Rogue, pink  
- `03-brom` — Guardian, green
- `04-sable` — Traveler, purple
- `05-rowan` — Adventurer, amber
- `06-elia` — Mage, cyan

### Game World
- Top-down tile-based map with collision detection
- Camera follows player (centered, with zoom)
- Keyboard WASD movement with priority ordering
- Double-click pathfinding (A* with exact waypoints)
- Player nameplate with rounded pill background

### In-Game HUD
Located top-right:
- **Player chip**: Green pulse dot + player name
- **? button**: Toggles Controls modal (also `?`/`/` keyboard shortcut)
- **⚙ button**: Opens Settings modal
- **FPS counter** (when enabled in settings)

### Controls Modal
Displays all keyboard/mouse shortcuts in a clean table with `<kbd>` styling.

### Settings Modal
**Audio section:**
- BGM volume slider (0–100%) with mute toggle
- SFX volume slider (0–100%) with mute toggle

**Display section:**
- Show FPS toggle
- Show Nameplates toggle

### Audio System (`audioManager.ts`)
Uses Howler.js:
- `bgm_demo.mp3` — Looping background music (plays on world enter)
- `click.mp3` — Button/UI interactions, double-click
- `join.mp3` — Plays on entering the world
- `footstep.mp3` — Plays every ~18 frames while moving (low volume)

### Ambient System (`ambient.ts`)
Procedurally generated particles across the map:
- **Fireflies**: Glowing, pulsing, wobbling movement with radial gradient glow
- **Leaves**: Drifting downward with wobble rotation
- **Dust**: Slowly floating upward, semi-transparent

---

## Settings
Stored in React state, propagated via `GameContext`:

```ts
type GameSettings = {
  bgmVolume: number;   // 0..1
  sfxVolume: number;   // 0..1
  bgmMuted: boolean;
  sfxMuted: boolean;
  showFps: boolean;
  showNameplates: boolean;
};
```

---

## Controls

| Key | Action |
|-----|--------|
| W/A/S/D | Move |
| Double-click | Pathfind to location |
| + / = | Zoom in |
| - | Zoom out |
| Scroll wheel | Zoom |
| ? | Toggle controls help |
| Esc | Close modals |

---

## Audio Files
Located in `public/audio/`:
- `bgm/bgm_demo.mp3` — Demo BGM (replace with final track)
- `sfx/click.mp3` — UI click
- `sfx/join.mp3` — Enter world sound
- `sfx/footstep.mp3` — Footstep SFX

All sourced from Mixkit (free license).

---

## Tech Stack
- **React 19** + TypeScript
- **Vite 8** (dev server + bundler)
- **Howler.js** (audio)
- **HTML5 Canvas** (rendering)
- **Inter** font (Google Fonts)

---

## To-Do / Future
- [ ] Replace `bgm_demo.mp3` with final background music
- [ ] Add real multiplayer (WebSocket/WebRTC)
- [ ] More map areas / procedural map generation
- [ ] Interactive objects (tables, doors, whiteboards)
- [ ] Video/voice proximity chat integration
- [ ] Persistent player state
