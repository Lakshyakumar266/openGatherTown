# Project Tasks: Ancient Adventure RPG Expansion

## Overview
Transform OpenGather from a template into an engaging, cohesive, ancient-adventure 2D top-down RPG. Build upon the skills in `.agents/skills` (`create-game-assets`, `procedural-gen`, `level-design`, `camera-systems`, `shader-programming`, `dialogue-systems`, `audio-design`, `visual-novel`).

---

## Core Task Requirements (From User Prompt)

### 1. Startpage Redesign (Exact to Concept A Reference)
- Recreate the exact layout and look of `concept_a_slate_1792249522311.jpg`:
  - `🌿 WHISPERING MEADOWS 🌿` title inscribed inside the top of the slate card with vine flourishes.
  - Character standing atop an ancient stone pedestal with a radial warm lighting halo and magical sparkle motes.
  - 4 stacked vertical action buttons:
    1. `Enter World` (luminous emerald with gold hairline border)
    2. `Change Hero` (deep slate beveled button)
    3. `Settings` (deep slate beveled button)
    4. `How to Play` (deep slate beveled button)
  - Top-right `Music On [ON/OFF]` slider pill.
  - Map selection picker: `Legacy Map (Oakhaven Glade)` vs `New Map (Ancient Ruins)`.
  - Crisp 6px corners, translucent alpha slate (`rgba(13, 27, 20, 0.9)`), antique gold double-hairline border.

### 2. Map Loading Fix & Dual Map System (Legacy + New WFC / Procedural Map)
- Diagnose and fix map rendering on first load so the map and world render instantly without needing manual reload.
- Provide Map Selection:
  - **Legacy Map**: Oakhaven Glade (village, cottage, well, crates, with all new enhancements, animals, and animated trees).
  - **New Ancient Adventure Map**: Generated using procedural generation / Wave Function Collapse principles inspired by [mxgmn/WaveFunctionCollapse](https://github.com/mxgmn/WaveFunctionCollapse) with ancient stone ruins, shrines, waterways, and enchanted paths.
  - Players can toggle between maps seamlessly from the title screen or in-game settings.

### 3. Non-Overlapping, Adventure-Driven NPC & POI Layout
- Re-position Elder Oakhaven, Echo, the Ancient Well, Crates, and new ancient shrines so their hitboxes and sprites never overlap cottage walls, fences, or waterways.
- Add clear clearance paths, stone pathways, and interaction halos.

### 4. Animated Animals
- Add peaceful animated animals to the meadow:
  - Meadow Rabbits (hopping and nibbling animations)
  - Forest Deer (grazing and looking up animations)
  - Fluttering Butterflies / Birds (soaring between flower patches)
- Each animal implemented with real multi-frame pixel sprite strips and authentic behavioral FSMs (Idle, Wander, Graze/Peck).

### 5. Animated Trees & Environmental Wind/Shader Effects
- Animate trees with natural wind sway and rustling leaves using dynamic sinusoidal vertex/canvas deformation and falling blossom/leaf particles.
- Sun-ray god rays filtering through the canopy matching the Concept A art.

### 6. Cohesive Ancient Adventure Art Theme & Rich Text
- Maintain a strict visual style: Ancient Celtic/Nordic/Fantasy meadow with stone ruins, mossy slate, amber runes, and warm hearth elements.
- Rewrite all dialogues, item descriptions, and quest lore with evocative, atmospheric storytelling inspired by *Eastward*, *Moonlighter*, and *Sea of Stars*.

### 7. Process & Tooling
- Track progress through `docs/plan/tasks.md` and `docs/plan/steps.md`.
- Build with `bun`.
- Commit with Git at every completed milestone.
