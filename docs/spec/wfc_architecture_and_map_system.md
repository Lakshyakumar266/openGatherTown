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
