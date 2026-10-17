import { Boundary } from "../class";
import { POIS, type InteractablePOI } from "./story";

export interface StructurePrefab {
  name: string;
  originCol: number;
  originRow: number;
  width: number;
  height: number;
  tiles: ([number, number] | null)[][];
  solidMask: boolean[][];
}

export interface CompoundTree {
  col: number;
  row: number; // row of the trunk
  type: "oak" | "birch" | "pine" | "apple";
  canopySheet: [number, number];
  trunkSheet: [number, number];
}

export interface ProceduralMap {
  cols: number;
  rows: number;
  tileSize: number;
  width: number;
  height: number;
  grid: number[][];
  boundaries: Boundary[];
  spawnPoint: { x: number; y: number };
  pois: InteractablePOI[];
  structures: StructurePrefab[];
  trees: CompoundTree[];
  draw: (
    ctx: CanvasRenderingContext2D,
    tileset: HTMLImageElement | null,
    camera: { x: number; y: number },
    viewW: number,
    viewH: number,
    zoom: number,
    animTime: number,
  ) => void;
  drawForeground: (
    ctx: CanvasRenderingContext2D,
    camera: { x: number; y: number },
    viewW: number,
    viewH: number,
    zoom: number,
    animTime: number,
  ) => void;
}

// Tile definitions from Kenney RPGpack_sheet_2X (128x128 pixels per tile, 20 cols x 13 rows)
export interface TileDef {
  name: string;
  sheet: [number, number]; // [col, row] in sheet
  blocking?: boolean;
  underlay?: "grass" | "water" | "patio";
}

export const TILE_DEFS: Record<number, TileDef> = {
  // 0: Deep Sapphire Ocean
  0: { name: "WATER_DEEP", sheet: [11, 1], blocking: true },

  // 1-8: Coastline Autotiles (Grass -> Ocean)
  1: { name: "SHORE_N", sheet: [11, 0], blocking: true },
  2: { name: "SHORE_S", sheet: [11, 2], blocking: true },
  3: { name: "SHORE_W", sheet: [10, 1], blocking: true },
  4: { name: "SHORE_E", sheet: [12, 1], blocking: true },
  5: { name: "SHORE_NW", sheet: [10, 0], blocking: true },
  6: { name: "SHORE_NE", sheet: [12, 0], blocking: true },
  7: { name: "SHORE_SW", sheet: [10, 2], blocking: true },
  8: { name: "SHORE_SE", sheet: [12, 2], blocking: true },

  // 9-10: Meadow Grass
  9: { name: "GRASS_LUSH", sheet: [3, 1] },
  10: { name: "GRASS_VAR", sheet: [4, 1] },

  // 11-13: Wildflower Fields (Chamomile, Lavender, Clover)
  11: { name: "FLOWER_CHAMOMILE", sheet: [1, 9], underlay: "grass" },
  12: { name: "FLOWER_LAVENDER", sheet: [2, 9], underlay: "grass" },
  13: { name: "FLOWER_CLOVER", sheet: [5, 9], underlay: "grass" },
  14: { name: "BUSH", sheet: [0, 9], underlay: "grass" },

  // 15-23: Cobblestone / Dirt Highway
  15: { name: "ROAD", sheet: [8, 1] },
  16: { name: "ROAD_N", sheet: [6, 0], underlay: "grass" },
  17: { name: "ROAD_S", sheet: [6, 2], underlay: "grass" },
  18: { name: "ROAD_W", sheet: [5, 1], underlay: "grass" },
  19: { name: "ROAD_E", sheet: [7, 1], underlay: "grass" },
  20: { name: "ROAD_NW", sheet: [5, 0], underlay: "grass" },
  21: { name: "ROAD_NE", sheet: [7, 0], underlay: "grass" },
  22: { name: "ROAD_SW", sheet: [5, 2], underlay: "grass" },
  23: { name: "ROAD_SE", sheet: [7, 2], underlay: "grass" },

  // 24-25: Wooden Footbridges
  24: { name: "BRIDGE_H", sheet: [6, 9], underlay: "water" },
  25: { name: "BRIDGE_V", sheet: [7, 9], underlay: "water" },

  // 26-28: Sunken Citadel Courtyard
  26: { name: "PATIO", sheet: [10, 4] },
  27: { name: "STONE_WALL", sheet: [11, 4], blocking: true },
  28: { name: "STONE_PILLAR", sheet: [10, 3], underlay: "patio", blocking: true },
  29: { name: "SUN_SHRINE", sheet: [10, 3], underlay: "patio" },
};

/**
 * Builds the layered archipelago world with deep ocean borders, organic coastlines,
 * connected footpaths, compound buildings, stone well, wooden pier, and animated trees.
 */
export function generateWhisperingRuinsMap(
  ctx: CanvasRenderingContext2D,
  _seed = 42,
): ProceduralMap {
  const cols = 64;
  const rows = 64;
  const tileSize = 64;
  const width = cols * tileSize;
  const height = rows * tileSize;
  const S_TILE = 128; // Kenney spritesheet tile dimension

  // ── LAYER 0: Ocean Base & Island Mask ────────────────────────────────────
  // 0 = ocean water, 1 = dry land (grass)
  const landMask: boolean[][] = [];
  for (let r = 0; r < rows; r++) {
    landMask[r] = [];
    for (let c = 0; c < cols; c++) {
      // Outer 5 tiles are strictly ocean water to ensure ocean borders
      if (r < 5 || r >= rows - 5 || c < 5 || c >= cols - 5) {
        landMask[r][c] = false;
        continue;
      }

      // Main Island center (c: 32, r: 34)
      const distMain = Math.hypot((c - 32) * 1.1, (r - 34) * 0.95);
      // Whispering Lake cutout (c: 50, r: 27)
      const distLake = Math.hypot((c - 50) * 1.3, r - 27);
      // Citadel plateau (c: 32, r: 16)
      const distCitadel = Math.hypot((c - 32) * 1.2, r - 16);

      // Procedural organic coastline shape
      const noise =
        Math.sin(c * 0.42 + r * 0.35) * 2.8 +
        Math.cos(c * 0.28 - r * 0.45) * 2.2 +
        Math.sin((c + r) * 0.6) * 1.4;

      const isMainLand = distMain + noise < 23.5;
      const isCitadelLand = distCitadel + noise < 11.5;
      const isLakeWater = distLake < 6.2;

      landMask[r][c] = (isMainLand || isCitadelLand) && !isLakeWater;
    }
  }

  // ── LAYER 1: Ground Tiles & Shoreline Autotiling ─────────────────────────
  const grid: number[][] = [];
  for (let r = 0; r < rows; r++) {
    grid[r] = [];
    for (let c = 0; c < cols; c++) {
      if (!landMask[r][c]) {
        grid[r][c] = 0; // WATER_DEEP
        continue;
      }

      // Check cardinal neighbors for shoreline transitions
      const nWater = r > 0 && !landMask[r - 1][c];
      const sWater = r < rows - 1 && !landMask[r + 1][c];
      const wWater = c > 0 && !landMask[r][c - 1];
      const eWater = c < cols - 1 && !landMask[r][c + 1];

      if (nWater && wWater) grid[r][c] = 5; // SHORE_NW
      else if (nWater && eWater) grid[r][c] = 6; // SHORE_NE
      else if (sWater && wWater) grid[r][c] = 7; // SHORE_SW
      else if (sWater && eWater) grid[r][c] = 8; // SHORE_SE
      else if (nWater) grid[r][c] = 1; // SHORE_N
      else if (sWater) grid[r][c] = 2; // SHORE_S
      else if (wWater) grid[r][c] = 3; // SHORE_W
      else if (eWater) grid[r][c] = 4; // SHORE_E
      else {
        // Interior grass: lush with wildflower clusters
        const flowerSeed = (c * 17 + r * 31) % 100;
        if (flowerSeed < 8) grid[r][c] = 11; // Chamomile
        else if (flowerSeed < 16) grid[r][c] = 12; // Lavender
        else if (flowerSeed < 24) grid[r][c] = 13; // Clover
        else if (flowerSeed < 28) grid[r][c] = 14; // Bush
        else if (flowerSeed < 55) grid[r][c] = 10; // Grass Var
        else grid[r][c] = 9; // Grass Lush
      }
    }
  }

  // Northern Sunken Citadel Plaza Flagstones (Rows 12-20, Cols 26-38)
  for (let r = 12; r <= 20; r++) {
    for (let c = 26; c <= 38; c++) {
      if (landMask[r][c]) {
        grid[r][c] = 26; // PATIO
      }
    }
  }

  // ── LAYER 2: Footpath Networks ──────────────────────────────────────────
  // Grand Southern Highway: from Row 20 down to Row 54, Cols 31-33
  for (let r = 20; r <= 54; r++) {
    for (let c = 31; c <= 33; c++) {
      if (landMask[r][c]) {
        grid[r][c] = 15; // ROAD
      }
    }
  }

  // East Branch: towards Silas's Cottage & Whispering Lake (Row 34-35, Cols 34-48)
  for (let c = 34; c <= 48; c++) {
    for (let r = 34; r <= 35; r++) {
      if (landMask[r][c]) {
        grid[r][c] = 15; // ROAD
      }
    }
  }

  // North branch up to Lake Pier: Col 48, Rows 28 to 34
  for (let r = 28; r <= 34; r++) {
    if (landMask[r][48]) grid[r][48] = 15;
  }

  // Lake Pier Wooden Bridge (Row 28, Cols 49-53)
  for (let c = 49; c <= 53; c++) {
    grid[28][c] = 24; // BRIDGE_H over water
  }

  // Central Sun Shrine Altar
  grid[15][32] = 29; // SUN_SHRINE

  // ── LAYER 3: Compound Structures & Prefabs (Exact Bonding) ───────────────
  const structures: StructurePrefab[] = [
    // 1. Oakhaven Slate Cottage (Blue Roof) at Cols 19-21, Rows 32-34
    {
      name: "Oakhaven Hermitage",
      originCol: 19,
      originRow: 32,
      width: 3,
      height: 3,
      tiles: [
        [[15, 6], [16, 6], [17, 6]], // Slate Roof Peak
        [[15, 7], [16, 7], [17, 7]], // Slate Roof Eaves
        [[9, 4], [11, 11], [11, 4]], // Stone wall, timber door, stone wall
      ],
      solidMask: [
        [false, false, false],
        [true, true, true],
        [true, false, true], // Doorway in center is walkable
      ],
    },
    // 2. Silas's Thatched Cottage (Warm Roof) at Cols 39-41, Rows 33-35
    {
      name: "Silas's Herbal Cottage",
      originCol: 39,
      originRow: 33,
      width: 3,
      height: 3,
      tiles: [
        [[0, 6], [1, 6], [2, 6]], // Thatched Roof Peak + Chimney
        [[0, 7], [1, 7], [2, 7]], // Roof Eaves
        [[0, 4], [10, 11], [2, 4]], // Wall with window, wooden door, wall with window
      ],
      solidMask: [
        [false, false, false],
        [true, true, true],
        [true, false, true],
      ],
    },
    // 3. Ancient Well of Whispers (1x2 Compound) at Col 29, Row 34
    {
      name: "Well of Whispers",
      originCol: 29,
      originRow: 34,
      width: 1,
      height: 2,
      tiles: [
        [[8, 10]], // Well wooden canopy
        [[8, 11]], // Stone well basin
      ],
      solidMask: [
        [false],
        [true], // Stone basin is solid
      ],
    },
    // 4. Relic Chest at Col 24, Row 14
    {
      name: "Forgotten Relic Chest",
      originCol: 24,
      originRow: 14,
      width: 1,
      height: 1,
      tiles: [[[8, 9]]],
      solidMask: [[true]],
    },
    // 5. Cargo Crates & Barrels around Silas's garden
    {
      name: "Silas's Garden Crates",
      originCol: 42,
      originRow: 35,
      width: 2,
      height: 1,
      tiles: [[[9, 9], [9, 10]]],
      solidMask: [[true, true]],
    },
    // 6. Citadel Ancient Stone Columns
    {
      name: "Citadel Columns",
      originCol: 28,
      originRow: 13,
      width: 1,
      height: 1,
      tiles: [[[10, 3]]],
      solidMask: [[true]],
    },
    {
      name: "Citadel Columns East",
      originCol: 36,
      originRow: 13,
      width: 1,
      height: 1,
      tiles: [[[10, 3]]],
      solidMask: [[true]],
    },
    {
      name: "Citadel Ruin Wall West",
      originCol: 26,
      originRow: 17,
      width: 3,
      height: 1,
      tiles: [[[11, 4], [11, 4], [11, 4]]],
      solidMask: [[true, true, true]],
    },
    {
      name: "Citadel Ruin Wall East",
      originCol: 36,
      originRow: 17,
      width: 3,
      height: 1,
      tiles: [[[11, 4], [11, 4], [11, 4]]],
      solidMask: [[true, true, true]],
    },
  ];

  // ── LAYER 4: Compound Trees (Canopy + Trunk Vertically Bound) ────────────
  const trees: CompoundTree[] = [];
  const treePositions: [number, number, "oak" | "birch" | "pine" | "apple"][] = [
    // Oakhaven West Grove
    [16, 28, "oak"],
    [17, 30, "birch"],
    [15, 33, "oak"],
    [16, 36, "apple"],
    [18, 38, "oak"],
    [15, 40, "birch"],
    [17, 43, "oak"],
    [20, 44, "apple"],

    // Northern Citadel Grove
    [24, 11, "pine"],
    [26, 9, "pine"],
    [30, 8, "pine"],
    [34, 8, "pine"],
    [38, 9, "pine"],
    [40, 11, "pine"],

    // Silas's Orchard & Whispering Lake Woods
    [43, 31, "apple"],
    [44, 33, "birch"],
    [45, 36, "oak"],
    [46, 38, "apple"],
    [44, 40, "birch"],
    [47, 41, "oak"],
    [46, 24, "birch"],
    [47, 22, "oak"],
    [49, 23, "pine"],

    // Southern Highway Gatekeepers
    [29, 48, "oak"],
    [35, 48, "oak"],
    [29, 52, "birch"],
    [35, 52, "birch"],
  ];

  for (const [tCol, tRow, tType] of treePositions) {
    let canopySheet: [number, number] = [0, 10]; // Oak canopy
    let trunkSheet: [number, number] = [0, 11]; // Oak trunk

    if (tType === "birch") {
      canopySheet = [1, 10];
      trunkSheet = [1, 11];
    } else if (tType === "pine") {
      canopySheet = [2, 10];
      trunkSheet = [2, 11];
    } else if (tType === "apple") {
      canopySheet = [3, 10];
      trunkSheet = [3, 11];
    }

    trees.push({
      col: tCol,
      row: tRow,
      type: tType,
      canopySheet,
      trunkSheet,
    });
  }

  // ── LAYER 5: Watertight Collision Boundaries ─────────────────────────────
  const boundaries: Boundary[] = [];

  // 1. Water colliders (all ocean & deep water)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const tileIndex = grid[r][c];
      // If water or blocking shore tile, or outer ocean border
      if (TILE_DEFS[tileIndex]?.blocking || !landMask[r][c]) {
        boundaries.push(
          new Boundary({
            ctx,
            position: {
              x: c * tileSize,
              y: r * tileSize,
            },
          }),
        );
      }
    }
  }

  // 2. Tree Trunk colliders (bottom half of tree, allowing player behind canopy)
  for (const tree of trees) {
    boundaries.push(
      new Boundary({
        ctx,
        position: {
          x: tree.col * tileSize,
          y: tree.row * tileSize,
        },
      }),
    );
  }

  // 3. Structure solid masks (cottage walls, well base, chests, columns)
  for (const struct of structures) {
    for (let sr = 0; sr < struct.height; sr++) {
      for (let sc = 0; sc < struct.width; sc++) {
        if (struct.solidMask[sr]?.[sc]) {
          boundaries.push(
            new Boundary({
              ctx,
              position: {
                x: (struct.originCol + sc) * tileSize,
                y: (struct.originRow + sr) * tileSize,
              },
            }),
          );
        }
      }
    }
  }

  // Spawn Point: Row 53 on the Grand Southern Highway
  const spawnPoint = {
    x: 32 * tileSize + tileSize / 2 - 24,
    y: 53 * tileSize,
  };

  // ── Pixel-Art Renderer with Animated Canopy Sway & Waves ─────────────────
  const draw = (
    c: CanvasRenderingContext2D,
    tileset: HTMLImageElement | null,
    camera: { x: number; y: number },
    viewW: number,
    viewH: number,
    zoom: number,
    animTime: number,
  ) => {
    const minCol = Math.max(0, Math.floor((camera.x - viewW / (2 * zoom)) / tileSize) - 1);
    const maxCol = Math.min(cols - 1, Math.ceil((camera.x + viewW / (2 * zoom)) / tileSize) + 1);
    const minRow = Math.max(0, Math.floor((camera.y - viewH / (2 * zoom)) / tileSize) - 1);
    const maxRow = Math.min(rows - 1, Math.ceil((camera.y + viewH / (2 * zoom)) / tileSize) + 1);

    const hasTileset = tileset && tileset.complete && tileset.naturalWidth > 0;
    c.imageSmoothingEnabled = false;

    // 1. Draw Base Terrain & Footpaths
    for (let r = minRow; r <= maxRow; r++) {
      for (let col = minCol; col <= maxCol; col++) {
        const tileIndex = grid[r][col];
        const tDef = TILE_DEFS[tileIndex] || TILE_DEFS[9];
        const px = col * tileSize;
        const py = r * tileSize;
        const drawSize = tileSize + 0.5;

        if (hasTileset) {
          // Underlay for transparent flower/road sprites
          if (tDef.underlay === "grass") {
            c.drawImage(tileset, 3 * S_TILE + 0.5, 1 * S_TILE + 0.5, S_TILE - 1, S_TILE - 1, px, py, drawSize, drawSize);
          } else if (tDef.underlay === "patio") {
            c.drawImage(tileset, 10 * S_TILE + 0.5, 4 * S_TILE + 0.5, S_TILE - 1, S_TILE - 1, px, py, drawSize, drawSize);
          } else if (tDef.underlay === "water") {
            c.drawImage(tileset, 11 * S_TILE + 0.5, 1 * S_TILE + 0.5, S_TILE - 1, S_TILE - 1, px, py, drawSize, drawSize);
          }

          // Tile graphic
          const [sx, sy] = tDef.sheet;
          c.drawImage(tileset, sx * S_TILE + 0.5, sy * S_TILE + 0.5, S_TILE - 1, S_TILE - 1, px, py, drawSize, drawSize);

          // Animated water shimmer waves on ocean/lake
          if (tileIndex === 0) {
            const wave = Math.sin(animTime * 2.5 + col * 0.8 + r * 0.6) * 4;
            c.fillStyle = "rgba(186, 230, 253, 0.22)";
            c.fillRect(px + 10 + wave, py + 20, 26, 2.5);
            c.fillRect(px + 28 - wave, py + 42, 18, 2);
          }

          // Glowing Sun Shrine Altar
          if (tileIndex === 29) {
            const pulse = 0.5 + Math.sin(animTime * 3) * 0.4;
            c.save();
            c.strokeStyle = `rgba(245, 158, 11, ${pulse})`;
            c.lineWidth = 3;
            c.beginPath();
            c.arc(px + tileSize / 2, py + tileSize / 2, 26, 0, Math.PI * 2);
            c.stroke();
            c.fillStyle = `rgba(245, 158, 11, ${pulse * 0.25})`;
            c.fill();
            c.restore();
          }
        } else {
          c.fillStyle = tileIndex === 0 ? "#1e3a8a" : tileIndex === 26 ? "#475569" : "#166534";
          c.fillRect(px, py, tileSize, tileSize);
        }
      }
    }

    if (!hasTileset) return;

    // 2. Draw Prefab Structures (Cottages, Well, Relic Chests, Columns)
    for (const struct of structures) {
      for (let sr = 0; sr < struct.height; sr++) {
        for (let sc = 0; sc < struct.width; sc++) {
          const sheetTile = struct.tiles[sr]?.[sc];
          if (!sheetTile) continue;
          const [sx, sy] = sheetTile;
          const px = (struct.originCol + sc) * tileSize;
          const py = (struct.originRow + sr) * tileSize;
          if (px + tileSize < camera.x - viewW / (2 * zoom) || px > camera.x + viewW / (2 * zoom)) continue;
          if (py + tileSize < camera.y - viewH / (2 * zoom) || py > camera.y + viewH / (2 * zoom)) continue;

          // Draw underlay grass if not pure wall
          c.drawImage(tileset, 3 * S_TILE + 0.5, 1 * S_TILE + 0.5, S_TILE - 1, S_TILE - 1, px, py, tileSize + 0.5, tileSize + 0.5);
          c.drawImage(tileset, sx * S_TILE + 0.5, sy * S_TILE + 0.5, S_TILE - 1, S_TILE - 1, px, py, tileSize + 0.5, tileSize + 0.5);
        }
      }
    }

    // 3. Draw Compound Trees with Ground Shadow and Trunk
    for (const tree of trees) {
      const px = tree.col * tileSize;
      const py = tree.row * tileSize;

      // Ground shadow under tree
      c.beginPath();
      c.ellipse(px + tileSize / 2, py + tileSize * 0.75, tileSize * 0.45, tileSize * 0.2, 0, 0, Math.PI * 2);
      c.fillStyle = "rgba(10, 25, 18, 0.35)";
      c.fill();

      // Draw Tree Trunk firmly anchored on the ground
      const [tx, ty] = tree.trunkSheet;
      c.drawImage(tileset, tx * S_TILE + 0.5, ty * S_TILE + 0.5, S_TILE - 1, S_TILE - 1, px, py, tileSize + 0.5, tileSize + 0.5);

      // Draw Animated Swaying Canopy at (row - 1)
      const canopyY = (tree.row - 1) * tileSize;
      const sway = Math.sin(animTime * 2.2 + tree.col * 1.4) * 3;
      const [cx, cy] = tree.canopySheet;
      c.drawImage(
        tileset,
        cx * S_TILE + 0.5,
        cy * S_TILE + 0.5,
        S_TILE - 1,
        S_TILE - 1,
        px + sway,
        canopyY,
        tileSize + 0.5,
        tileSize + 0.5,
      );
    }
  };

  // Foreground environmental overlay
  const drawForeground = (
    c: CanvasRenderingContext2D,
    _camera: { x: number; y: number },
    _viewW: number,
    _viewH: number,
    _zoom: number,
    _animTime: number,
  ) => {
    const archX = 31 * tileSize;
    const archY = 20 * tileSize - 24;

    c.save();
    c.fillStyle = "rgba(30, 41, 59, 0.9)";
    c.fillRect(archX - 12, archY, 3 * tileSize + 24, 28);
    c.strokeStyle = "rgba(245, 158, 11, 0.6)";
    c.lineWidth = 2;
    c.strokeRect(archX - 12, archY, 3 * tileSize + 24, 28);

    c.font = "bold 11px monospace";
    c.fillStyle = "#fef08a";
    c.textAlign = "center";
    c.fillText("⚡ SUNKEN CITADEL SANCTUARY ⚡", archX + (3 * tileSize) / 2, archY + 18);
    c.restore();
  };

  return {
    cols,
    rows,
    tileSize,
    width,
    height,
    grid,
    boundaries,
    spawnPoint,
    pois: POIS,
    structures,
    trees,
    draw,
    drawForeground,
  };
}
