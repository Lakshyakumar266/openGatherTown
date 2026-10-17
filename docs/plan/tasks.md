# Project Tasks: OpenGather Ancient Adventure RPG

## Overview
OpenGather — an evocative, cozy, and rich ancient-adventure 2D top-down RPG inspired by *Eastward*, *Moonlighter*, and *Sea of Stars*. Built using `bun`, Vite, React, Canvas 2D, and exact algorithmic Wave Function Collapse.

---

## Targeted Refinements & User Feedback Tasks

### 1. Title Name & Branding
- Standardize game title strictly to **`OPENGATHER`** across all UI headers, StartScreen card, page title, and meta tags.

### 2. Responsive UI & Layout Feel
- Fix card vertical height overflow on all displays (including 1366x679 laptops and mobile).
- Eliminate any clipping or scroll overflow on `.ss-card-stage`.
- Streamline padding, typography, button sizes, and modal transitions for a clean, premium slate aesthetic.

### 3. Hero Name Input
- Replace randomized badge click with a real, responsive text input field (`<input className="ss-name-input" ... />`).
- Keep an optional dice roll button `🎲` beside it for instant cozy suggestions.

### 4. Dedicated Realm Selection Tab
- Move Realm/Map selection off the cramped main card face into a dedicated **Realm Tab / Sub-Screen** (`[ ⚔️ Adventure ] [ 🗺️ Realm / Map ]`).
- Main screen shows active realm pill with a one-click switch to the Realm tab.

### 5. Dialogue System State & Control Fix
- Eliminate stale selection bug and accidental option auto-triggers.
- Remove automatic option-0 selection on spacebar.
- Add cooldown between text rendering and keyboard choice selection.
- Update `story.ts` with rich, re-traversable dialogue menus for Elder Oakhaven, Echo, Well, and Crates so players can re-ask lore, directions, and check quest status.

### 6. Animals Movement & Animation Direction Glitch Fix
- Resolve backward walking bug: animal sprite sheets naturally face **LEFT**; flip horizontally with `scale(-1, 1)` only when moving **RIGHT** (`dx > 0`).
- Ensure consistent wander target calculation and collision avoidance.

### 7. Big Multi-Biome Wave Function Collapse (mxgmn/WaveFunctionCollapse Exact Model)
- Faithfully implement the exact constraint-satisfaction model from [mxgmn/WaveFunctionCollapse](https://github.com/mxgmn/WaveFunctionCollapse):
  - Model base class with `wave`, `propagator`, `compatible`, `stack`, `Ban`, `Propagate`, `NextUnobservedNode`, Shannon entropy calculation, and weighted observation.
  - Large map dimension (e.g. 70x70 or 80x80 tiles @ 64px = 4,480x4,480 to 5,120x5,120 pixels in world size).
  - Multi-biome layout:
    1. **Sunken Citadel Ruins** (stone pavers, marble columns, ancient monoliths, sun shrine, broken ruin walls)
    2. **Wildflower Meadows** (lush grass, buttercups, chamomile, lavender)
    3. **Whispering Waterways & Shimmering Lake** (deep sapphire water, sand/dirt shores, wooden bridges crossing water)
    4. **Ancient Whispering Forest** (canopies, mossy roots, clovers)
  - Tile adjacency rules enforcing valid neighbor connections in 4 directions (Left, Down, Right, Up).
  - Safe spawn point and calibrated POIs.

---

### Process & Tooling
- Track progress in `docs/plan/tasks.md` and `docs/plan/steps.md`.
- Build with `bun`.
- Commit with Git at every completed milestone.
