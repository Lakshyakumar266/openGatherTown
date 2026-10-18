# WFC Uphill, Water, Stairs & Layering Architecture Rulebook

**Module:** OpenGather World Generation Engine  
**Document Path:** `/docs/spec/wfc_uphill_water_layering_rulebook.md`  
**Status:** Approved Specification & Execution Plan  

---

## 1. Rulebook: Uphill & Cliff Elevation System

### 1.1 Plateau Geometry & Wang Autotiling
An uphill plateau is an elevated 2.5D terrace occupying an $(W \times H)$ tile footprint (e.g. Cols 44–62, Rows 10–22).
All cliff boundaries must follow strict cardinal Wang tile socket rules from `tx_wall.png` and `map_preview_1.png`:

| Boundary Segment | Tile Asset Source | Sprite Rect `[sx, sy, sw, sh]` | Collision Value |
| :--- | :--- | :--- | :--- |
| **North Coping (Top Edge)** | `tx_wall.png` | `[64, 32, 32, 32]` or `[416, 32, 32, 32]` | `1025` (Solid) |
| **Northwest Outer Corner** | `tx_wall.png` | `[32, 32, 32, 32]` or `[384, 32, 32, 32]` | `1025` (Solid) |
| **Northeast Outer Corner** | `tx_wall.png` | `[96, 32, 32, 32]` or `[448, 32, 32, 32]` | `1025` (Solid) |
| **West Retaining Wall Edge** | `tx_wall.png` | `[32, 64, 32, 32]` or `[288, 64, 32, 32]` | `1025` (Solid) |
| **East Retaining Wall Edge** | `tx_wall.png` | `[96, 64, 32, 32]` or `[320, 64, 32, 32]` | `1025` (Solid) |
| **South Coping Row (Cliff Upper)**| `tx_wall.png` | `[64, 96, 32, 32]` | `1025` (Solid) |
| **South Wall Face Row (Cliff Lower)**| `tx_wall.png` | `[64, 128, 32, 32]` | `1025` (Solid) |
| **Southwest Outer Corner Coping** | `tx_wall.png` | `[32, 96, 32, 32]` | `1025` (Solid) |
| **Southwest Outer Corner Face** | `tx_wall.png` | `[32, 128, 32, 32]` | `1025` (Solid) |
| **Southeast Outer Corner Coping** | `tx_wall.png` | `[96, 96, 32, 32]` | `1025` (Solid) |
| **Southeast Outer Corner Face** | `tx_wall.png` | `[96, 128, 32, 32]` | `1025` (Solid) |
| **Plateau Surface Ground** | `tx_grass.png` | `[0, 0, 32, 32]` + emerald tint | `0` (Walkable) |

### 1.2 Strict Invariant Rules for Cliffs
- **Rule C1 (No Random Repetition):** Corners must never be straight wall tiles; edges must match their cardinal orientation.
- **Rule C2 (Two-Tier South Face):** Every south-facing cliff must be exactly 2 tiles tall: Upper Coping (Row $R-1$) + Lower Brick Face (Row $R$) with ground contact shadow.
- **Rule C3 (Terrace Interior):** The interior of the plateau is pure elevated turf (`TILE_HIGHLAND_GRASS`), completely walkable.

---

## 2. Rulebook: Carved Stone Stairs System

### 2.1 Placement Constraints
- **Rule S1 (Strict Cliff-Cut Only):** Stairs **CANNOT** exist on open flat ground. Stairs may **ONLY** be placed embedded directly into a South-facing cliff retaining wall.
- **Rule S2 (Single Continuous Connection):** The top step of the stairs must terminate on the upper plateau ground (Row $R-1$). The bottom step must terminate on the lower ground (Row $R+1$).
- **Rule S3 (Zero Floating Stairs):** Any stair tile not adjacent to a retaining wall face is strictly forbidden.

### 2.2 2-Column Weathered Stone Staircase Assembly (`tx_struct.png`)
The staircase spans 2 columns wide (Cols $C, C+1$) and 3 rows tall (Rows $R-1, R, R+1$), matching `map_preview_1.png`:

```
Col C (Left)               Col C+1 (Right)
┌───────────────────────┐  ┌───────────────────────┐
│ Left Railing Top      │  │ Right Railing Top     │  Row R-1 (Top landing onto plateau)
│ [sx:32, sy:160]       │  │ [sx:64, sy:160]       │
├───────────────────────┤  ├───────────────────────┤
│ Left Railing Mid Step │  │ Right Railing Mid Step│  Row R (Mid retaining wall)
│ [sx:32, sy:192]       │  │ [sx:64, sy:192]       │
├───────────────────────┤  ├───────────────────────┤
│ Left Railing Base     │  │ Right Railing Base    │  Row R+1 (Lower ground landing)
│ [sx:32, sy:224]       │  │ [sx:64, sy:224]       │
└───────────────────────┘  └───────────────────────┘
```
- **Walkable Corridor:** Both columns (Col $C$ and Col $C+1$) across Rows $R-1, R, R+1$ are strictly `collisionGrid = 0` (walkable step corridor).
- **Flanking Wall Solidity:** Cols $C-1$ and $C+2$ are solid stone retaining wall (`collisionGrid = 1025`).

---

## 3. Rulebook: Water & Shoreline System

### 3.1 Water Autotiling (`gentle forest v01.png` & procedural water shader)
- **Deep Water Basin:** Procedural crystalline water with specular sine-wave ripples (`rgb(2, 110-140, 180-205)`).
- **Organic Shoreline Wang Autotiling:**
  - North Shore, South Shore, West Shore, East Shore.
  - Outer NW, NE, SW, SE corners.
  - Inner NW, NE, SW, SE corners.
- **Bridge Spanning:** Arched stone bridge (`tx_stone.png` bridge deck) placed across river (Cols 39–41, Rows 29–33). Bridge deck is `collisionGrid = 0` (walkable), water beneath is `1025` (impassable).

---

## 4. Rulebook: Strict 5-Layer Depth & Z-Ordering

To permanently solve the bug where the character appeared behind stairs:

| Render Order | Layer Name | Contents | Z-Position Relative to Player |
| :---: | :--- | :--- | :--- |
| **1** | **Layer 1: Ground Base** | Grass, Wildflowers, Deep Water Basin, Border Woods | **Under Player** |
| **2** | **Layer 2: Ground Detail** | Cobblestone King's Highway, Shoreline Foam, Bridge Deck | **Under Player** |
| **3** | **Layer 3: Cliffs & Stairs** | Retaining Walls, Cliff Faces, **STAIR STEPS & LANDING** | **Under Player (Player walks ON stairs)** |
| **4** | **Layer 4: Obstacles & Walls** | Building Wall Bases, Doors, Windows, Well, Props, Tree Trunks | **Under Player** (Solid collision blocks) |
| **5** | **Y-SORTED ENTITY LAYER** | **Player, NPCs, Wildlife, Companions** | **Rendered here based on `position.y`** |
| **6** | **Layer 5: Overhead Foreground** | House Gabled Roofs, Battlements, Tree Foliage Canopies | **ABOVE Player (`drawForeground`)** |

> [!IMPORTANT]
> **Stair Steps are on Layer 3:** The player walks directly on top of the carved stone steps. The steps must NEVER be drawn in Layer 5 or after the entity loop!

---

## 5. Tasklist

- [ ] **Task 1: Sandbox Prototype & Deep Validation** (`scratch/test_map_sandbox.ts`)
  - Build a standalone verification runner to validate 100% of cliff tiles, corner connections, and stair bindings.
  - Test case: verify 0 floating stairs exist on flat ground.
  - Test case: verify stairs only spawn where lower level meets higher level.
- [ ] **Task 2: Refactor `mapGenerator.ts` Uphill & Stair Engine**
  - Implement 8-direction cliff Wang tile autotiling with authentic corner coping.
  - Anchor the Grand Stone Stairs strictly to the South retaining wall (Cols 52–54, Rows 21–22).
  - Eliminate all random or isolated stair placements.
- [ ] **Task 3: Water Shoreline Autotiling Engine**
  - Connect Whispering Lake and Crystal Creek River with organic autotiled bank tiles.
  - Ensure Arched Stone Bridge connects East and West road networks seamlessly.
- [ ] **Task 4: Enforce Strict 5-Layer Render Depth**
  - Move stair floor steps into Layer 3 (before player).
  - Ensure only overhead roofs, battlements, and tree canopies render in `drawForeground`.
- [ ] **Task 5: End-to-End Browser Verification**
  - Walk the player up the stairs: verify character is ON the steps and ascends onto the terrace.
  - Inspect town square: verify 0 background seams.
  - Inspect lake & bridge: verify water looks organic and bridge is walkable.
  - Test double-click movement auto-walking to upper plateau.
- [ ] **Task 6: Git Commit & Knowledge Base Sync**
  - Commit all verified changes with descriptive commit message.

---

## 6. Testlist & Verification Criteria

| Test ID | Description | Expected Outcome | Status |
| :---: | :--- | :--- | :---: |
| **T-01** | Stair Z-Sorting | Character renders ON TOP of stair steps when ascending (never behind). | Pending |
| **T-02** | Stair Placement Constraint | Zero stair blocks appear on flat meadow/grass; stairs exist ONLY on cliff face. | Pending |
| **T-03** | Cliff Corner Autotiling | Retaining wall corners use exact NW, NE, SW, SE corner coping without repetition. | Pending |
| **T-04** | Terrace Ascendancy | Walking into the stairs smoothly transitions player from Row 23 (lower) to Row 20 (upper). | Pending |
| **T-05** | Water Shorelines | Lake and river have smooth organic banks without blocky rectangular edges. | Pending |
| **T-06** | Double-Click Pathing | Double-clicking onto the highland terrace calculates a path through the stairs. | Pending |
| **T-07** | MiniMap Compass HUD | Radar accurately draws the plateau, lake, river, and town without floating header pill. | Pending |
