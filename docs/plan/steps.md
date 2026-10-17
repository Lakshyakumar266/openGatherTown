# Execution Steps: Ancient Adventure RPG Expansion

## Phase 1: Skill Knowledge & Groundwork
- [x] Step 1.1: Review and digest all required skill files (`create-game-assets`, `procedural-gen`, `level-design`, `camera-systems`, `shader-programming`, `dialogue-systems`, `audio-design`, `visual-novel`).
- [x] Step 1.2: Create `docs/plan/tasks.md` and `docs/plan/steps.md`.
- [ ] Step 1.3: Commit initial task and step plans to git.

## Phase 2: Start Screen Polish (Exact Match to Concept A Reference)
- [ ] Step 2.1: Redesign `StartScreen.tsx` and `StartScreen.css` to match `concept_a_slate_1792249522311.jpg`:
  - `WHISPERING MEADOWS` title inside the top of the slate card with delicate vine flourishes.
  - Carved stone pedestal beneath the active hero with radial spotlight and magical ember particles.
  - 4 stacked vertical action buttons (`Enter World`, `Change Hero`, `Settings`, `How to Play`).
  - `Music On [ON]` toggle pill in the top-right corner.
  - Add Map Selection toggle (`Oakhaven Glade (Legacy)` vs `Whispering Ruins (New Ancient Adventure)`).
- [ ] Step 2.2: Test and verify StartScreen via `bun run build` and git commit.

## Phase 3: Map Loading Reliability & First-Load Fix
- [ ] Step 3.1: Audit the asset loading pipeline in `App.tsx` and ensure `BackgroundTerrain.png`, `forground.png`, boundaries, and sprites load synchronously or with a guaranteed loading screen, eliminating blank blue canvases on initial load.
- [ ] Step 3.2: Verify responsive canvas sizing across various viewports.

## Phase 4: Non-Overlapping NPC & POI Layout
- [ ] Step 4.1: Calibrate world coordinates and boundaries for Elder Oakhaven, Echo, the Ancient Well, and the Cottage Crates so they do not collide with structures or overlap terrain features.
- [ ] Step 4.2: Add visual ground interaction rings and collision hitboxes.

## Phase 5: Animated Animals System
- [ ] Step 5.1: Create animal sprite sheets and assets adhering to the ancient meadow theme:
  - White meadow rabbits (idle, hop, nibble)
  - Golden glade deer / fawns (idle, graze)
  - Woodland bluebirds / fluttering butterflies
- [ ] Step 5.2: Implement `src/game/animals.ts` with autonomous wandering, idling, and fleeing if the player runs too close.
- [ ] Step 5.3: Integrate animals into the game loop for both Legacy and New maps.

## Phase 6: Animated Trees & Atmospheric Environmental Shaders
- [ ] Step 6.1: Implement dynamic tree swaying animation using sinusoidal sway in canvas rendering.
- [ ] Step 6.2: Add sun-ray god rays and fluttering dandelion/leaf particles matching the Concept A artwork.

## Phase 7: Procedural / WFC New Ancient Adventure Map System
- [ ] Step 7.1: Implement `src/game/mapGenerator.ts` utilizing Wave Function Collapse / procedural rules with tilesets (grass, stone paths, ancient mossy ruins, water shores, enchanted shrines).
- [ ] Step 7.2: Wire dual-map toggle in `gameContext.ts` and `App.tsx` so players can switch between Legacy Map and New Ancient Ruins Map at will.

## Phase 8: Narrative, Dialogues & Ancient Adventure Lore Polish
- [ ] Step 8.1: Enrich all NPC dialogues, quest logs, and item descriptions with evocative ancient fantasy lore.
- [ ] Step 8.2: Ensure quests and interactions work seamlessly across both maps.

## Phase 9: Verification, Quality Assurance & Git Commitments
- [ ] Step 9.1: Build with `bun run build`.
- [ ] Step 9.2: Run comprehensive browser subagent tests with screenshots of all new features.
- [ ] Step 9.3: Final git commit and report.
