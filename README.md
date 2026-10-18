# openGather

A 2D top-down hangout world you walk around as an avatar. **openGather** is a side project for fun: a shared meadow, a cottage, a few trails — a place where people can bump into each other and actually talk.

The current build is a **local single-player prototype**. The next update is **online multiplayer** with in-world video hangouts, so a map can become an office, a classroom, a conference floor, or a living room for friends.

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Bun](https://img.shields.io/badge/Bun-Ready-FBF0DF?logo=bun&logoColor=black)](https://bun.sh/)

---

## Why it exists

Video calls flatten everyone into a grid. Walking around a map does not. You can linger by a well, follow someone into a clearing, or leave a crowded room without hanging up a call. openGather is being built so those small, accidental interactions have a place to happen.

---

## Current version (local prototype)

You play in the browser: pick a character, name yourself, and enter a painted world. Everything runs on your machine — no lobby, no other players yet.

- **Character roster** — several walkable sprites (Wanderer, Aldric, Mira, Brom, Sable, Rowan, Elia) plus a cozy start screen.
- **Two maps** — a hand-authored **legacy** terrain, and a **new** procedural island (Wave Function Collapse chunks, autotiled paths, woods, ruins, village pieces).
- **Movement** — WASD, optional click-to-walk with pathfinding, camera zoom, collision with terrain and animals.
- **Living world** — ambient particles, weather-ish environment layers, wandering animals, music and SFX (Howler).
- **Story layer** — NPCs and objects you can talk to (`E`), branching dialogue, quests, inventory (`B` / `I`), minimap, HUD, save/restore of story and last position.
- **Engine** — React 19, TypeScript, HTML5 Canvas, Vite. Fixed-timestep-ish `requestAnimationFrame` loop, not a DOM-heavy scene graph.

This is still a playground: map art and WFC rules are actively being tuned (oval island, shoreline, houses, grass tilesets).

### Controls

| Input | Action |
|:---|:---|
| <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> | Move |
| <kbd>E</kbd> | Interact with an NPC or object |
| <kbd>B</kbd> / <kbd>I</kbd> | Open inventory |
| Double-click | Walk to a point |
| Scroll / <kbd>+</kbd> <kbd>-</kbd> | Zoom |
| <kbd>?</kbd> | Controls help |
| <kbd>Esc</kbd> | Close menus and dialogue |

---

## Next update: play together

The following is **not in this build**. It is the point of the next one.

**Online multiplayer.** Several people share the same map. You see each other’s avatars, names, and where they are walking. A space can be a remote office, a study hall, a meetup, or just somewhere to hang out.

**Proximity video and audio.** Walk up to someone and cameras / mics fade in. Walk away and they fade out. Conversation is spatial: the people next to you are the people in the call, not a mute-all grid.

**Rooms that actually isolate.** Walls, doors, and meeting pockets keep a standup from leaking into the hallway. Private corners for 1:1s; open plazas for mingling.

**Share a screen while you stand together.** Pair programming, a slide deck, a whiteboard — you present to whoever is in that circle, not to a whole platform.

**Lightweight social layer.** Text chat, emotes and reactions, and a status (available / busy / away) so the map reads like a room, not a silent screensaver.

**Spaces you can shape.** Custom maps for offices, event halls, classrooms, and friend hangouts. Interactive objects: posters, boards, games, spawn spots, and other things you can walk up to.

Same idea as the prototype: you are a little sprite in a 2D world. The next version just lets other people be there too — and talk, for real.

---

## Getting started

### Prerequisites

[Bun](https://bun.sh/) (recommended) or [Node.js](https://nodejs.org/) 18+.

### Install and run

```bash
git clone https://github.com/Lakshyakumar266/topDown-game-ts.git
cd topDown-game-ts

bun install          # or: npm install
bun run dev          # or: npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Production build

```bash
bun run build        # or: npm run build
bun run preview      # or: npm run preview
```

---

## Layout (high level)

```text
src/
  App.tsx                 # Canvas loop, input, collision, map draw
  components/             # Start screen, HUD, dialogue, quests, minimap
  game/                   # WFC map gen, story, audio, animals, ambient
public/                   # Sprites, tilesets, terrain
docs/spec/                # Map / WFC notes
```

---

## License

Personal side project. Tile packs under `public/tiles/` keep their own licenses — respect those if you reuse art.
