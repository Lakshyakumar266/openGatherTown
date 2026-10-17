# Execution Steps: OpenGather Enhancements & Fixes

## Phase 10: Animal Movement & Direction Glitch Fix
- [ ] Step 10.1: Correct animal sprite horizontal facing flip in `src/game/animals.ts` so animals face forward when walking in both directions.
- [ ] Step 10.2: Smooth out wander target selection and flee reactions.

## Phase 11: Start Screen Polish, OpenGather Branding & Responsiveness
- [ ] Step 11.1: Update title to `OPENGATHER` with elegant leaf vine typography.
- [ ] Step 11.2: Add clean text `<input>` for hero name with `🎲` cozy reroll button.
- [ ] Step 11.3: Add a dedicated `Realm` tab / view for choosing between Oakhaven Glade and the Big WFC Ruins, removing clutter from the main card.
- [ ] Step 11.4: Fix CSS heights, margins, and padding in `StartScreen.css` so the modal card never overflows on 1366x679 or smaller screens.

## Phase 12: Dialogue System Bug Fixes & Re-traversable Menus
- [ ] Step 12.1: Update `DialogueBox.tsx` so spacebar does not accidentally auto-trigger choices, options render reliably, and node transitions update cleanly.
- [ ] Step 12.2: Enrich `story.ts` with re-traversable dialogue options for Elder Oakhaven, Echo, Well, and Crates so players can re-read directions, ask about lore, or check progress anytime.

## Phase 13: Exact Wave Function Collapse (mxgmn/WaveFunctionCollapse Model) & Big Multi-Biome Map
- [ ] Step 13.1: Implement exact WFC AC-4 constraint propagation and Shannon entropy solver in `src/game/wfc/wfcModel.ts` and `src/game/mapGenerator.ts`.
- [ ] Step 13.2: Create large 75x75 multi-biome map (Sunken Citadel Ruins, Wildflower Meadows with Chamomile/Buttercups/Lavender, Whispering Waterways with Stone Bridges, and Forest Groves).
- [ ] Step 13.3: Define thorough adjacency rules for all directions so tile transitions are seamless and beautiful.
- [ ] Step 13.4: Integrate safe spawn point, POIs, boundaries, and high-performance tile culling.

## Phase 14: Build Verification, Browser Testing & Git Commit
- [ ] Step 14.1: Run `bun run build` and ensure 0 TypeScript or Vite warnings/errors.
- [ ] Step 14.2: Test via browser subagent (inspect StartScreen responsiveness, hero name input, realm tab, forward-walking animals, dialogue box options, and the big WFC world).
- [ ] Step 14.3: Git commit with detailed message and report back.
