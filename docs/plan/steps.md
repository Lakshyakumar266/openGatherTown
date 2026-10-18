# Execution Steps: OpenGather Itch.io Assets & Oval Island Architecture

## Phase 21: Asset Migration & Cleanup
- [x] Step 21.1: Demolish and eradicate Kenney RPG pack (`public/tiles/RPGpack_sheet_2X.png`).
- [x] Step 21.2: Download official top-down RPG asset packs from itch.io (`cainos_top_down_basic`, `soppycraft_forest_houses`, `gentle_forest`) and unpack to `public/tiles/cainos/`, `public/tiles/soppycraft/`, `public/tiles/gentle_forest/`.
- [x] Step 21.3: Update `docs/plan/tasks.md` and `docs/plan/steps.md` to reflect the new architecture.

## Phase 22: Clean Grass, Oval Island & Collision Polish
- [x] Step 22.1: Remove `minimap-coords-row` from `MiniMap.tsx` and `MiniMap.css`.
- [x] Step 22.2: Implement strict player-animal bounding box collision in `src/App.tsx` and smooth avoidance steering in `src/game/animals.ts` so player cannot overlap with animals.
- [ ] Step 22.3: Upgrade `public/sandbox.html` to load and train with the new itch.io tilesets (`cainos` & `soppycraft`):
  - Calibrate pure interior grass tiles (`TX Tileset Grass.png`) to ensure 0 brown edge leaks.
  - Test and verify oval island elevation falloff and shoreline bitmask autotiling.
  - Test and verify modular house placement (walls, roofs, chimneys, doors) and prop alignment.

## Phase 23: Port WFC Oval Island & Itch.io Tiles to Main Engine
- [ ] Step 23.1: Refactor `src/game/mapGenerator.ts` to utilize the new itch.io tileset atlas (`cainos` + `soppycraft`):
  - Ground layer with oval island mask and pure grass.
  - Shoreline autotiling bordering ocean water.
  - Stone path connections leading between houses, wells, and docks.
  - Multi-tile house structures and props (wells, chests, barrels, trees) with proper vertical bonding and collision boxes.
- [ ] Step 23.2: Update texture loader in `src/App.tsx` to load `public/tiles/cainos/` and `public/tiles/soppycraft/` instead of Kenney RPGpack.

## Phase 24: Verification, Quality Assurance & Git Milestone
- [ ] Step 24.1: Build test with `bun run build` to confirm 0 TypeScript / bundling errors.
- [ ] Step 24.2: Inspect live world using browser subagent at `http://localhost:5173/`, confirming:
  - Natural oval island surrounded by ocean.
  - Clean grass with 0 brown edges.
  - Flawless house structures (no glitched roofs or walls).
  - No coordinate row on minimap.
  - Player cannot walk through or overlap animals.
- [ ] Step 24.3: Git commit all changes with structured log.
