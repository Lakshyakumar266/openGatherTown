# Project Tasks: OpenGather Ancient Adventure RPG (Itch.io Asset Architecture)

## Core Directives & User Requirements

### 1. Demolish Kenney RPG Pack & Adopt Official Itch.io Assets (COMPLETED)
- **Status: COMPLETED**
- Completely deleted and eradicated `RPGpack_sheet_2X.png` (Kenney asset).
- Downloaded and installed official, top-rated top-down RPG asset packs directly from itch.io into `public/tiles/`:
  - `public/tiles/cainos/` (Cainos Top-Down Basic 32x32: grass terrain, stone ground, modular structural walls, roofs, chimneys, doors, wells, chests, barrels, benches, trees, plants, shadows).
  - `public/tiles/soppycraft/` (Soppycraft Forest Houses: handcrafted cozy cottage houses, water pumps, clay flower pots, stone & mud paths).
  - `public/tiles/gentle_forest/` (Seliel the Shaper Gentle Forest: animated water, crystalline shores, cliffs).

### 2. Natural Oval Island Geometry (WaveFunctionCollapse + Elliptical Mask)
- Strictly generate an oval / elliptical island landmass surrounded by deep ocean water:
  - Center: `(cx, cy)`, semi-major horizontal radius `rx`, semi-minor vertical radius `ry`.
  - Normalized distance falloff: `d = ((col - cx)/rx)^2 + ((row - cy)/ry)^2 + noise(col, row)`.
  - If `d < 1.0` -> Island Landmass; else -> Deep Ocean Water.
  - No square map boundaries, no straight unnatural edges, no void cutoff.

### 3. Absolute Grass Tile Cleanliness (Zero Brown Edge Leaks)
- Ensure all interior land tiles use pure lush grass tiles from `TX Tileset Grass.png` without any edge dirt, brown corner fragments, or boundary bleed.
- Edge transitions only occur at the true shoreline meeting the water.

### 4. Player Cannot Overlap With Animals (Physical Collision & Steering Avoidance)
- Fix animal collision boxes in `src/App.tsx`:
  - Ensure the player's bounding box is physically obstructed by animal colliders (`wouldCollide` checks all active animals).
  - Animals dynamically steer and smoothly step away when the player approaches, preventing overlap.

### 5. Remove MiniMap Coordinates Row
- Delete `<div className="minimap-coords-row">` and coordinates display (`POS X, Y`) below the mini-map radar in `MiniMap.tsx` and `MiniMap.css`.

### 6. Sandbox Training & Verification Environment (`public/sandbox.html`)
- Utilize the dedicated WFC training laboratory in `public/sandbox.html`:
  - Directly load and render the new itch.io tilesets (`cainos` & `soppycraft`).
  - Train and verify exact tile socket adjacency, shoreline 4-bit / 8-bit autotiling, and modular house bonding.
  - Verify zero roof glitches, zero missing walls, and correct depth sorting before wiring into the game engine.

### 7. Seamless Integration into Main Game Engine (`src/game/mapGenerator.ts` & `src/App.tsx`)
- Port verified sandbox tileset mappings into `mapGenerator.ts`:
  - Layer 0: Deep ocean water base.
  - Layer 1: Natural oval island terrain with pure grass interior and autotiled shorelines.
  - Layer 2: Stone/dirt pathways, bridges, flower beds, and docks.
  - Layer 3: Structurally verified houses, stone wells, animated trees, chests, and barrels.
  - Collision layer: Solid bounding boxes for houses, water, fences, and props.
