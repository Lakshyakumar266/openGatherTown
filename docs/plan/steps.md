# Execution Steps: OpenGather Layered World & RPG Expansion

## Phase 15: Layered Map Architecture & World Border
- [ ] Step 15.1: Implement layered terrain model (Sea/Ocean base border, Grass/Island contours, Footpath networks, Prefab multi-tile structures: Houses, Stone Wells, Fences, Wooden Bridges/Docks, Chests, Barrels).
- [ ] Step 15.2: Ensure multi-tile structures (houses, 2-tile trees) are placed as cohesive compound structures with exact vertical bonding (preventing tree tops/trunks from being disjointed).
- [ ] Step 15.3: Add deep sea border padding around world edges so camera never exposes empty background void.

## Phase 16: Fluid Movement Engine & Spawn Fixes
- [ ] Step 16.1: Refactor movement loop to use vector-based velocity with wall-sliding (separate X and Y collision tests) so WASD and Arrow keys (including 'D') operate smoothly without sticking.
- [ ] Step 16.2: Fix legacy world spawn coordinates to safe dry land on the cottage path (`x: 730, y: 480`) and isolate localStorage position saves per realm.

## Phase 17: Bottom-Left MiniMap & Expandable World Map Modal
- [ ] Step 17.1: Create `MiniMap.tsx` and `MiniMap.css` pinned to bottom-left with real-time player indicator, terrain colors, and POI markers.
- [ ] Step 17.2: Add click/key ('M') toggle to open high-resolution Expandable World Map with region labels, quest markers, and legend.

## Phase 18: Animated NPCs & Lively World Population
- [ ] Step 18.1: Implement animated idle bobbing and player-facing orientation for NPCs (Elder Oakhaven, Echo, Silas the Hermit, Captain Joshua).
- [ ] Step 18.2: Add ambient speech/interaction cues, animated swaying trees, falling leaf particles, and roaming wildlife (rabbits, deer, foxes, butterflies).

## Phase 19: Epic Multi-Chapter Storyline & Quests
- [ ] Step 19.1: Expand `src/game/story.ts` with "The Chronicles of OpenGather: The Sunken Core" multi-act questline.
- [ ] Step 19.2: Implement rich quest items (Explorer's Compass, Ancient Journal, Shimmering Water Sigil, Runic Key, Amber Core) and branch dialogues.

## Phase 20: Build Verification, Stress QA & Git Commits
- [ ] Step 20.1: Run `bun run build` and ensure 0 TypeScript or Vite warnings/errors.
- [ ] Step 20.2: Conduct browser subagent QA testing all movement directions, dialogue, minimap, and world aesthetics.
- [ ] Step 20.3: Git commit with comprehensive log.
