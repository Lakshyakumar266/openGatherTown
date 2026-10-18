# Wave Function Collapse (WFC) Architecture & 2.5D World System Specification

**Author / Module:** OpenGather Core Engine  
**File Location:** `/docs/spec/wfc_architecture_and_map_system.md`  
**Target Engine & Framework:** HTML5 Canvas, TypeScript, React, Vite  
**Assets Ecosystem:** Cainos Top-Down RPG Pack Basic, Sprout Lands, Soppycraft  

---

## 1. Executive Summary & Root Cause Retrospective

During early iterations of the procedural map generator, the visual canvas suffered from disfiguring colored rectangles (raw `#0a2540` canvas ocean blocks, `#6d4c41` bridge lines, and flat grey boxes). 

### 1.1 Root Cause
1. **Asset Pack Misalignment:** Cainos Top-Down RPG Basic is an open-air forest sanctuary, stone citadel ruins, and glade highway asset pack. It possesses **zero** water tiles or ocean transitions in its spritesheet layout. Forcing an ocean/archipelago model onto Cainos forced arbitrary canvas fills (`fillRect`), ruining visual cohesion.
2. **Author Reference Reality:** Reverse-engineering `Scene Overview.png` (1200×1200 px) proved that the environment is strictly:
   - Ancient dense oak perimeter borders serving as natural barriers.
   - Wildflower meadows and forest clearings (`tx_grass.png`).
   - Interlocking cobblestone highways with rounded curbs and grass tufts.
   - Raised stone citadel terraces, coped walls, stairs, and ruinous altars (`tx_wall.png`, `tx_struct.png`, `tx_props.png`).
   - Grounded vegetation with independent cast drop shadows (`tx_shadow_plant.png`).

---

## 2. Macro-WFC System Architecture

To avoid tile-by-tile micro-contradictions and combinatorial explosion over an 80×80 tile grid (6,400 cells), the world generation uses a **Hierarchical Macro-WFC Model**:

```
 ┌────────────────────────┐         ┌────────────────────────┐
 │  16×16 Macro Chunks    │  WFC    │  80×80 Micro Tiles     │
 │  Wang Socket Solving   │ ──────> │  4-Bit Autotiling &    │
 │  (P, G, R, C Sockets)  │ Expand  │  Sprite Bitmasking     │
 └────────────────────────┘         └────────────────────────┘
```

### 2.1 Closed Wang Sockets
Each macro module possesses four cardinal sockets indexed `[left, down, right, up]` (`dir 0, 1, 2, 3`):
- **`P` (Perimeter):** Ancient Oak Deepwoods boundary. Sockets connect exclusively with `P` or directional forest borders (`BORDER_N`, `BORDER_S`, etc.).
- **`G` (Glade / Grass):** Open green meadow, floral fields, and rustic clearings.
- **`R` (Road):** Cobblestone highway connectors ensuring topological path continuity.
- **`C` (Citadel):** Raised terrace stonework, ruin walls, and sacred courtyards.

### 2.2 Module Inventory (37 Modules)
1. **Perimeter Woods (5 modules):**
   - `PERIMETER_WOODS` (`["P", "P", "P", "P"]`)
   - `BORDER_N` (`["G", "G", "G", "P"]`), `BORDER_S` (`["G", "P", "G", "G"]`)
   - `BORDER_W` (`["P", "G", "G", "G"]`), `BORDER_E` (`["G", "G", "P", "G"]`)
2. **Perimeter Corners (4 modules):**
   - `CORNER_NW` (`["P", "G", "G", "P"]`), `CORNER_NE` (`["G", "G", "P", "P"]`)
   - `CORNER_SW` (`["P", "P", "G", "G"]`), `CORNER_SE` (`["G", "P", "P", "G"]`)
3. **Open Glades & Meadows (5 modules):**
   - `GLADE_MEADOW` (`["G", "G", "G", "G"]`, weight 45)
   - `MEADOW_FLOWERS` (`["G", "G", "G", "G"]`, weight 25)
   - `FOREST_CLEARING` (`["G", "G", "G", "G"]`, weight 15)
   - `GROVE_NORTH` (`["G", "G", "G", "G"]`), `GROVE_SOUTH` (`["G", "G", "G", "G"]`)
4. **Cobblestone Highway Network (11 modules):**
   - Straights: `ROAD_HORIZ` (`["R", "G", "R", "G"]`), `ROAD_VERT` (`["G", "R", "G", "R"]`)
   - Corners: `ROAD_CORNER_NE` (`["G", "G", "R", "R"]`), `ROAD_CORNER_NW` (`["R", "G", "G", "R"]`), `ROAD_CORNER_SE` (`["G", "R", "R", "G"]`), `ROAD_CORNER_SW` (`["R", "R", "G", "G"]`)
   - T-Junctions: `ROAD_TEE_NORTH` (`["R", "G", "R", "R"]`), `ROAD_TEE_SOUTH` (`["R", "R", "R", "G"]`), `ROAD_TEE_EAST` (`["G", "R", "R", "R"]`), `ROAD_TEE_WEST` (`["R", "R", "G", "R"]`)
   - Crossroads: `ROAD_CROSS` (`["R", "R", "R", "R"]`)
5. **Sunken Citadel Ruins & Sanctum (9 modules):**
   - `CITADEL_CORE` (`["C", "C", "C", "C"]`)
   - `CITADEL_WALL_N` (`["C", "C", "C", "G"]`), `CITADEL_WALL_S` (`["C", "G", "C", "C"]`)
   - `CITADEL_WALL_W` (`["G", "C", "C", "C"]`), `CITADEL_WALL_E` (`["C", "C", "G", "C"]`)
   - `CITADEL_CORNER_NW` (`["G", "C", "C", "G"]`), `CITADEL_CORNER_NE` (`["C", "C", "G", "G"]`)
   - `CITADEL_CORNER_SW` (`["G", "G", "C", "C"]`), `CITADEL_CORNER_SE` (`["C", "G", "G", "C"]`)
   - `CITADEL_GATE_SOUTH` (`["C", "R", "C", "C"]`) — Bridge transition between highway and ruins.
6. **Narrative Anchor Anchors (3 modules):**
   - `SANCTUM_CORE` (Houses the Sacred Sun Altar and Elder Oakhaven)
   - `COURTYARD_PLAZA` (Houses the Praying Maiden Statue & Forgotten Relic Chest)
   - `VILLAGE_CENTER` (Houses Silas's Thatched Cottage, Village Well, and benches)

---

## 3. Micro-Expansion & 4-Bit Autotiling System

When macro chunks expand into the 5×5 micro-tile blocks, terrain edges must form seamless, pixel-perfect transitions.

### 3.1 4-Bit Cobblestone Autotiling
Cobblestone highway paths evaluate four orthogonal neighbor cells:
$$\text{Bitmask} = (\text{up} \ll 0) \mid (\text{dn} \ll 1) \mid (\text{lt} \ll 2) \mid (\text{rt} \ll 3)$$

From this 4-bit integer ($0 \dots 15$), exact 32×32 pixel UVs are sampled from `tx_grass.png`:
- **Horizontal Highway (`mask & (LT | RT)`):** Col 2, Row 4 (source: `64, 128, 32, 32`).
- **Vertical Highway (`mask & (UP | DN)`):** Col 1, Row 5 (source: `32, 160, 32, 32`).
- **Elbow Bends:**
  - Northwest (DN + RT): Col 0, Row 4 (`0, 128, 32, 32`)
  - Northeast (DN + LT): Col 3, Row 4 (`96, 128, 32, 32`)
  - Southwest (UP + RT): Col 0, Row 6 (`0, 192, 32, 32`)
  - Southeast (UP + LT): Col 3, Row 6 (`96, 192, 32, 32`)
- **Center Crossroads / Fill:** Col 1, Row 4 (`32, 128, 32, 32`).

### 3.2 2.5D Elevation & Wall Autotiling
Stone terraces feature:
- Wall Top Coping (`TILE_WALL_COPING_N/S/W/E` from `tx_wall.png` at rows 0..2).
- Wall Front Faces (`TILE_WALL_FACE` from `tx_wall.png` at row 3).
- Stone Staircases (`TILE_STAIRS` from `tx_struct.png` at col 0, row 3).
- Underlay Rule: In 2.5D top-down perspective, all transparent coping tiles must render a base grass tile underneath to eliminate background bleed-through.

---

## 4. Multi-Layer 2.5D Rendering Pipeline

The canvas rendering loop executes in strict bottom-to-top Z-depth order:

1. **Layer 0 — Ground Terrain (Base Pass):**
   - Pure Glade Grass (`TILE_GRASS_PURE`)
   - Blooming White & Yellow Wildflowers (`TILE_GRASS_FLOWER_WHITE`, `TILE_GRASS_FLOWER_YELLOW`)
   - Autotiled Cobblestone Road Network (`TILE_ROAD_COBBLESTONE`)
   - Overgrown Citadel Pavers (`TILE_CITADEL_FLOOR`)
2. **Layer 1 — Elevation Terraces & Fixed Stonework:**
   - Wall faces, copings, stone stairs, archways.
3. **Layer 2 — Shadows & Ambient Occlusion (Pre-Entity Pass):**
   - Independent drop shadows for all trees (`tx_shadow_plant.png`, 95×122 px, alpha 0.45).
   - Building drop shadows (blurred elliptical black shadows with 35% alpha).
   - Character circular contact shadows (`ctx.ellipse(x, y + 18, 14, 6, 0, 0, 2*PI)`).
4. **Layer 3 — Y-Sorted Dynamic Entities & Props:**
   - Characters (Player, Echo, Elder Oakhaven, Silas, Captain Joshua).
   - Wildlife (Roaming Deer, Frolicking Rabbits, Scurrying Foxes).
   - Thatched Cottages, Wells, Sacred Sun Altar, Praying Maiden Statue, Relic Chest.
   - Trees (Trunks & lower canopy).
   - *Sorting Criterion:* `entity.sortY = entity.y + entity.depthAnchor`.
5. **Layer 4 — Elevated Canopy & Roof Occlusion (Foreground Pass):**
   - Overhanging oak tree canopies with gentle wind sway ($dx = \sin(t \cdot 1.8 + \text{col}) \cdot 3.0$).
   - Cottage overhanging eaves providing depth when player walks behind rooflines.
6. **Layer 5 — Atmosphere & Lighting Overlay (Post-Processing Pass):**
   - Vignette shading at viewport edges.
   - Radial warm light halos around player, altars, and glowing cottage windows (`globalCompositeOperation = "screen"` or `"lighter"`).
   - Ambient color grade (Cozy sun-dappled glade warmth: `#ffeedd` tint with 6% opacity).

---

## 5. Collision Geometry & Physics Clamping

### 5.1 Trunk vs Canopy Disconnect Fix
A common 2.5D flaw is setting the collision box to the full sprite rect (114×186 px for trees). In OpenGather:
- **Tree Visual Sprite:** $114 \times 186$ px.
- **Root Contact Shadow:** $95 \times 122$ px at $(px - 10, py + 80)$.
- **Solid Trunk Collision Box:** Strictly restricted to the grounded base at:
  $$\text{Box} = [px + 40, py + 140, 34\text{ px width}, 25\text{ px height}]$$
- Player can freely walk behind the canopy with correct Z-occlusion.

### 5.2 Perimeter Clamping & Viewport Math
To prevent camera exposure of the raw canvas background:
- **Playable World Dimensions:** $80 \times 64 = 5,120$ px wide, $5,120$ px high.
- **Playable Walking Extent:** $X \in [192, 4928]$, $Y \in [192, 4928]$ (outer 3 tiles reserved for ancient forest canopy).
- **Camera Clamping Formula:**
  $$CamX = \text{clamp}\left(PlayerX - \frac{ViewW}{2 \cdot Zoom},\ 0,\ WorldW - \frac{ViewW}{Zoom}\right)$$
  $$CamY = \text{clamp}\left(PlayerY - \frac{ViewH}{2 \cdot Zoom},\ 0,\ WorldH - \frac{ViewH}{Zoom}\right)$$

---

## 6. Narrative Anchor & POI Registry

| POI ID | Entity / Object | Biome Location | World Coordinates | Quest Relevance |
| :--- | :--- | :--- | :--- | :--- |
| `elder_oakhaven` | Elder Oakhaven (NPC) | Northern Citadel Altar | $(22 \times 64 + 32,\ 27 \times 64 + 32)$ | Act I: The Sunken Awakening |
| `ancient_sun_altar` | Sacred Sun Altar | Sanctum Core | $(21 \times 64 + 64,\ 26 \times 64 + 48)$ | Act IV: Restoration of the Core |
| `relic_chest` | Forgotten Relic Chest | Citadel Courtyard | $(28 \times 64 + 24,\ 27 \times 64 + 24)$ | Act I: Brass Compass Recovery |
| `echo_companion` | Echo the Wanderer | Central Crossroads | $(40 \times 64 + 32,\ 37 \times 64 + 32)$ | Companion & Story Guide |
| `silas_hermit` | Silas the Hermit | Oakhaven Hamlet | $(46 \times 64 + 32,\ 52 \times 64 + 32)$ | Act II: Silas's Herbal Elixir |
| `village_well` | Well of Whispers | Hamlet Center | $(48 \times 64 + 36,\ 53 \times 64 + 36)$ | Herbal Spring Extraction |
| `captain_joshua` | Captain Joshua | Whispering Basin Outpost | $(50 \times 64 + 32,\ 52 \times 64 + 32)$ | Act III: Depths & Water Sigil |
| `lake_pier_lookout`| Ancient Basin Shrine | Whispering Basin | $(52 \times 64 + 32,\ 53 \times 64 + 32)$ | Submerged Relic Discovery |

---

## 7. Quality Assurance Checklist

- [x] WFC generates 100% deterministic, non-contradictory worlds across arbitrary RNG seeds.
- [x] Cobblestone highways autotile orthogonally without seam gaps or missing corner elbows.
- [x] Zero raw `fillRect` canvas blocks exist in terrain rendering.
- [x] Character movement is restricted to one directional animation at a time (no crab-walking).
- [x] MiniMap and Backpack HUD remain in distinct quadrants without spatial collisions.
- [x] Tree roots are grounded in ambient drop shadows with wind sway applied only to the upper foliage canopy.
- [x] Outer perimeter forest barrier prevents camera view of the dark navy void.

---

## 8. Discrete 5-Layer Tilemap Engine Architecture

### 8.1 Elimination of Cropped Images and Baked Background Seams
Cropping composite buildings or stairs from pre-rendered map graphics (such as `BackgroundTerrain.png` or `pack_house_001.png`) inevitably bakes surrounding terrain pixels (opaque green grass or brick backgrounds) into the sprite bounding box. When placed over varying ground types (cobblestone roads, water shorelines, or highland turf), these cropped images display disfiguring rectangular background seams.

To achieve state-of-the-art 2.5D visual excellence, the engine was re-architected into a **Strict 5-Layer Discrete Tilemap Engine** utilizing exclusively transparent spritesheets (`tx_grass.png`, `tx_stone.png`, `tx_wall.png`, `tx_struct.png`, `tx_props.png`, and `tx_plant.png`):

```
┌───────────────────────────────────────────────────────────────┐
│ Layer 5: Overhead Roofs, Battlements & Canopies (drawForeground)│
├───────────────────────────────────────────────────────────────┤
│ [Y-SORTED ENTITIES: Player, NPCs, Wildlife, Companions]       │
├───────────────────────────────────────────────────────────────┤
│ Layer 4: Building Walls, Doors, Windows, Props & Tree Trunks   │
├───────────────────────────────────────────────────────────────┤
│ Layer 3: Cliffs, Stone Retaining Walls & Carved Stone Stairs   │
├───────────────────────────────────────────────────────────────┤
│ Layer 2: Ground Detail, Pathways, Shorelines & Stone Bridge   │
├───────────────────────────────────────────────────────────────┤
│ Layer 1: Ground Base (Grass, Wildflowers, Deep Water, Woods)   │
└───────────────────────────────────────────────────────────────┘
```

### 8.2 Layer Specifications
1. **Layer 1: Ground Base (`grid: number[][]`)**
   - Pure lush green turf (`tx_grass.png` col 0, row 0).
   - Yellow and white wildflower meadows (`tx_grass.png` cols 1-2, row 0).
   - Highland Plateau emerald meadow (`TILE_HIGHLAND_GRASS`).
   - Deep crystalline water basin (`gentle forest` autotiles) with animated specular ripples.
   - Ancient perimeter border woods preventing camera exposure.
2. **Layer 2: Ground Detail & Pathways (`detailGrid: number[][]`)**
   - Authentic Country Highway & Boulevard: Organic dirt and cobblestone path (`gentle forest` `sx: 16, sy: 16`).
   - Arched stone bridge deck (`tx_stone.png` col 1, row 0) with side stone parapets across Crystal Creek River.
   - Eastern Footbridge (`col 52..53, row 29..33`) providing direct walkable access to the Grand Stairs.
   - North Riverbank Connector Path (`row 24, col 40..52`) connecting the Boulevard and the Stairs Road.
   - Organic shoreline bank autotiles (`gentle forest` 16x16 autotiles) smoothly blending terrain into water.
3. **Layer 3: Cliffs & Carved Stone Stairs (`cliffGrid: number[][]`)**
   - Highland Plateau Stone Retaining Wall:
     - North parapet coping (`tx_wall.png` `[416, 32, 32, 32]`).
     - NW and NE corners (`tx_wall.png` `[384, 32, 32, 32]`, `[448, 32, 32, 32]`).
     - West and East retaining wall parapets (`tx_wall.png` `[288, 64]`, `[320, 64]`).
     - South 2-tier cliff wall: Upper Coping Row (`tx_wall.png` `[64, 96]`) and Lower Brick Wall Face (`tx_wall.png` `[64, 128]`).
     - SW and SE outer corner coping and face tiles.
   - Grand Weathered Stone Stairs (`tx_struct.png` cols 52..53, rows 21..22):
     - Left column: `sx: 32`, top step `sy: 160`, bottom step `sy: 224`.
     - Right column: `sx: 64`, top step `sy: 160`, bottom step `sy: 224`.
     - Embedded directly into south retaining wall face. Zero floating stairs exist on open terrain.
     - Stairs are rendered on Layer 3 (before player), so the character walks ON TOP of steps, never behind.
4. **Layer 4: Building Walls, Props & Tree Trunks (`structureTiles: TilePlacement[]`)**
   - **Grand Oakhaven Townhall Manor** (Cols 32..36, Rows 42..45):
     - Authentic Soppycraft Manor (`pack_house_001.png`, 85x63 native scaled 3x).
     - Layer 4 base walls and wooden porch deck (`sx: 0, sy: 34, sw: 85, sh: 29` -> `dw: 255, dh: 87`).
     - Open front porch allows character to walk right up to front door.
   - **Harbor Outpost Guardhouse** (Cols 25..28, Rows 43..45):
     - Authentic Soppycraft Guardhouse (`pack_house_002.png`, 60x47 native scaled 3x).
     - Layer 4 fortified timber/stone base walls and door (`sx: 0, sy: 24, sw: 60, sh: 23` -> `dw: 180, dh: 69`).
   - **Silas's Woodland Timber Cottage** (Cols 45..48, Rows 43..45):
     - Authentic Soppycraft Cottage (`pack_house_004.png`, 58x53 native scaled 3x).
     - Layer 4 rustic timber base walls, window and door (`sx: 0, sy: 28, sw: 58, sh: 25` -> `dw: 174, dh: 75`).
   - **Highland Sacred Sun Altar** (Cols 52..55, Rows 14..15):
     - Authentic circular rune stone altar from `tx_props.png` (`sx: 340, sy: 266, sw: 107, sh: 94`) flanked by monolith columns.
   - **Village Props & Lake Pier**:
     - Circular Stone Well (`tx_props.png` `sx: 420, sy: 359, sw: 55, sh: 49`).
     - Town Water Pump & Trough (`tx_props.png` `sx: 96, sy: 0`).
     - Forgotten Relic Chest (`tx_props.png` `sx: 96, sy: 32`).
     - Market cider barrels & produce crates (`tx_props.png` `sx: 32, sy: 0`).
     - Carved Stone Benches (`tx_props.png` `sx: 288, sy: 0`).
     - Whispering Lake Wooden Boat Dock (`tx_struct.png` `sx: 32, sy: 32`).
   - **Tree Trunks with Ground Contact Shadows**:
     - Contact drop shadow ellipse (`rgba(10, 20, 15, 0.4)`).
     - Rooted oak, pine, and autumn trunks (`tx_plant.png`).
5. **Layer 5: Overhead Roofs & Canopies (`overheadTiles: TilePlacement[]`)**
   - Rendered in `drawForeground` **on top of the player** with authentic depth:
     - Townhall Gabled Slate Roof: `pack_house_001.png` upper roof (`sx: 0, sy: 0, sw: 85, sh: 34` -> `dw: 255, dh: 102`).
     - Guardhouse Roof: `pack_house_002.png` (`sx: 0, sy: 0, sw: 60, sh: 24` -> `dw: 180, dh: 72`).
     - Silas's Cottage Roof & Chimney: `pack_house_004.png` (`sx: 0, sy: 0, sw: 58, sh: 28` -> `dw: 174, dh: 84`).
     - Lush tree canopy crowns (`tx_plant.png`) with gentle animated wind sway.
     - Player can freely walk behind roofs and under tree canopies with pixel-perfect occlusion.

### 8.3 Reliable Click-to-Move Pathfinding Architecture
- **Static vs Dynamic Obstacle Decoupling:** When a roaming animal (rabbit, deer, fox) steps in front of the player, movement pauses without wiping `clickPath`. Once the critter moves, path traversal resumes automatically.
- **Walkable Tile A\* Resolution:** Tile navigation directly checks `isWalkableTile(collisionGrid, tile) === 0`, ensuring narrow pathways, stairs, and bridges never suffer false path rejections.
- **Start Tile Robustness:** Path calculations allow players standing near boundary edges to immediately pathfind without start-tile bounding box rejections.

### 8.3 Double-Click Pathfinding & Collision Integration
- Previously, double-click pathfinding queried the legacy 40×70 collision map, resulting in empty paths or blocked navigation in the new 80×80 procedural map.
- The pathfinding engine now dynamically binds to `effectiveCollisionsMap` (`proceduralMap.collisionGrid` when in `"new"` map mode).
- Walkable bridges and uphill stairs have `collisionGrid = 0`, enabling smooth A* auto-walk pathing across water and up to the highland terrace.

