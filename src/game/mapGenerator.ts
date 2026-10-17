import { Boundary } from "../class";
import type { InteractablePOI } from "./story";
import { WfcModel } from "./wfc/wfcCore";

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

// Corner socket types:
// 0: WATER, 1: GRASS, 2: ROAD, 3: PATIO
export const SOCKETS = {
  WATER: 0,
  GRASS: 1,
  ROAD: 2,
  PATIO: 3,
} as const;

const { WATER: W, GRASS: G, ROAD: R, PATIO: P } = SOCKETS;

export interface TileDefinition {
  name: string;
  corners: [number, number, number, number]; // [TopLeft, TopRight, BottomRight, BottomLeft]
  weight: number;
  sheet: [number, number]; // [col, row] in RPGpack_sheet_2X (128x128 tiles)
  underlay?: "grass" | "patio" | "water";
  blocking?: boolean;
}

export const TILES: TileDefinition[] = [
  // 0: Deep Lake Water
  { name: "WATER_DEEP", corners: [W, W, W, W], weight: 20, sheet: [11, 1], blocking: true },

  // 1-8: Shore Autotiles connecting Grass to Lake Water
  { name: "SHORE_N", corners: [G, G, W, W], weight: 8, sheet: [11, 0] },
  { name: "SHORE_S", corners: [W, W, G, G], weight: 8, sheet: [11, 2] },
  { name: "SHORE_W", corners: [G, W, W, G], weight: 8, sheet: [10, 1] },
  { name: "SHORE_E", corners: [W, G, G, W], weight: 8, sheet: [12, 1] },
  { name: "SHORE_NW", corners: [G, G, W, G], weight: 5, sheet: [10, 0] },
  { name: "SHORE_NE", corners: [G, G, G, W], weight: 5, sheet: [12, 0] },
  { name: "SHORE_SW", corners: [G, W, G, G], weight: 5, sheet: [10, 2] },
  { name: "SHORE_SE", corners: [W, G, G, G], weight: 5, sheet: [12, 2] },

  // 9-10: Base Lush Meadow Grass
  { name: "GRASS_LUSH", corners: [G, G, G, G], weight: 45, sheet: [3, 1] },
  { name: "GRASS_VAR", corners: [G, G, G, G], weight: 25, sheet: [4, 1] },

  // 11-13: Wildflower Fields (Chamomile, Lavender, Clover)
  { name: "GRASS_CHAMOMILE", corners: [G, G, G, G], weight: 14, sheet: [1, 9], underlay: "grass" },
  { name: "GRASS_LAVENDER", corners: [G, G, G, G], weight: 12, sheet: [2, 9], underlay: "grass" },
  { name: "GRASS_CLOVER", corners: [G, G, G, G], weight: 16, sheet: [5, 9], underlay: "grass" },

  // 14-15: Shrubbery & Forest Trees
  { name: "BUSH", corners: [G, G, G, G], weight: 7, sheet: [0, 9], underlay: "grass" },
  { name: "TREE_TRUNK", corners: [G, G, G, G], weight: 8, sheet: [0, 11], underlay: "grass", blocking: true },

  // 16-24: Dirt / Cobblestone Highway & Transitions
  { name: "ROAD", corners: [R, R, R, R], weight: 18, sheet: [8, 1] },
  { name: "ROAD_N", corners: [G, G, R, R], weight: 6, sheet: [6, 0] },
  { name: "ROAD_S", corners: [R, R, G, G], weight: 6, sheet: [6, 2] },
  { name: "ROAD_W", corners: [G, R, R, G], weight: 6, sheet: [5, 1] },
  { name: "ROAD_E", corners: [R, G, G, R], weight: 6, sheet: [7, 1] },
  { name: "ROAD_NW", corners: [G, G, R, G], weight: 4, sheet: [5, 0], underlay: "grass" },
  { name: "ROAD_NE", corners: [G, G, G, R], weight: 4, sheet: [7, 0], underlay: "grass" },
  { name: "ROAD_SW", corners: [G, R, G, G], weight: 4, sheet: [5, 2], underlay: "grass" },
  { name: "ROAD_SE", corners: [R, G, G, G], weight: 4, sheet: [7, 2], underlay: "grass" },

  // 25-26: Wooden Footbridges over Whispering Lake
  { name: "BRIDGE_H", corners: [W, W, W, W], weight: 4, sheet: [6, 9], underlay: "water" },
  { name: "BRIDGE_V", corners: [W, W, W, W], weight: 4, sheet: [7, 9], underlay: "water" },

  // 27-38: Sunken Citadel Courtyard (Stone Flagstones, Walls, Pillars, Altar, Edges)
  { name: "PATIO", corners: [P, P, P, P], weight: 28, sheet: [10, 4] },
  { name: "PATIO_N", corners: [G, G, P, P], weight: 6, sheet: [10, 4], underlay: "grass" },
  { name: "PATIO_S", corners: [P, P, G, G], weight: 6, sheet: [10, 4], underlay: "grass" },
  { name: "PATIO_W", corners: [G, P, P, G], weight: 6, sheet: [10, 4], underlay: "grass" },
  { name: "PATIO_E", corners: [P, G, G, P], weight: 6, sheet: [10, 4], underlay: "grass" },
  { name: "PATIO_NW", corners: [G, G, P, G], weight: 4, sheet: [10, 4], underlay: "grass" },
  { name: "PATIO_NE", corners: [G, G, G, P], weight: 4, sheet: [10, 4], underlay: "grass" },
  { name: "PATIO_SW", corners: [G, P, G, G], weight: 4, sheet: [10, 4], underlay: "grass" },
  { name: "PATIO_SE", corners: [P, G, G, G], weight: 4, sheet: [10, 4], underlay: "grass" },
  { name: "SUN_SHRINE", corners: [P, P, P, P], weight: 1, sheet: [10, 3], underlay: "patio" },
  { name: "STONE_WALL", corners: [P, P, P, P], weight: 6, sheet: [11, 4], blocking: true },
  { name: "STONE_PILLAR", corners: [P, P, P, P], weight: 4, sheet: [10, 3], underlay: "patio", blocking: true },
];

/**
 * Builds the 4-directional propagator using Corner Socket Matching.
 * Direction mapping:
 * d=0: Left (-1, 0)
 * d=1: Down (0, 1)
 * d=2: Right (1, 0)
 * d=3: Up (0, -1)
 */
function buildCornerPropagator(): number[][][] {
  const T = TILES.length;
  const propagator: number[][][] = [];
  for (let d = 0; d < 4; d++) {
    propagator[d] = [];
    for (let t = 0; t < T; t++) {
      propagator[d][t] = [];
    }
  }

  for (let t1 = 0; t1 < T; t1++) {
    const c1 = TILES[t1].corners;
    for (let t2 = 0; t2 < T; t2++) {
      const c2 = TILES[t2].corners;
      // d=0: Left (-1, 0). Neighbor t2 is to the Left of t1.
      // t1.TL must match t2.TR, t1.BL must match t2.BR.
      if (c1[0] === c2[1] && c1[3] === c2[2]) {
        propagator[0][t1].push(t2);
      }
      // d=1: Down (0, 1). Neighbor t2 is Down from t1.
      // t1.BL must match t2.TL, t1.BR must match t2.TR.
      if (c1[3] === c2[0] && c1[2] === c2[1]) {
        propagator[1][t1].push(t2);
      }
      // d=2: Right (1, 0). Neighbor t2 is to the Right of t1.
      // t1.TR must match t2.TL, t1.BR must match t2.BL.
      if (c1[1] === c2[0] && c1[2] === c2[3]) {
        propagator[2][t1].push(t2);
      }
      // d=3: Up (0, -1). Neighbor t2 is Up from t1.
      // t1.TL must match t2.BL, t1.TR must match t2.BR.
      if (c1[0] === c2[3] && c1[1] === c2[2]) {
        propagator[3][t1].push(t2);
      }
    }
  }

  return propagator;
}

/**
 * Generates the expansive 64x64 multi-biome procedural map (4096 x 4096 pixels)
 * using the exact WaveFunctionCollapse algorithm (Model.cs with AC-4 constraint propagation).
 */
export function generateWhisperingRuinsMap(
  ctx: CanvasRenderingContext2D,
  seed = 42,
): ProceduralMap {
  const cols = 64;
  const rows = 64;
  const tileSize = 64;
  const width = cols * tileSize;
  const height = rows * tileSize;
  const numTiles = TILES.length;

  const weights = TILES.map((t) => t.weight);
  const propagator = buildCornerPropagator();

  let success = false;
  let currentSeed = seed;
  let model: WfcModel = new WfcModel(cols, rows, numTiles, weights, propagator, false, "Entropy");

  const waterIndices = new Set<number>();
  const patioIndices = new Set<number>();
  const roadIndices = new Set<number>();

  TILES.forEach((t, i) => {
    if (t.corners.includes(W)) waterIndices.add(i);
    if (t.corners.includes(P)) patioIndices.add(i);
    if (t.corners.includes(R)) roadIndices.add(i);
  });

  for (let attempt = 0; attempt < 8 && !success; attempt++) {
    model = new WfcModel(cols, rows, numTiles, weights, propagator, false, "Entropy");
    model.clear();

    // ── Multi-Biome Domain Conditioning ──

    // 1. Surrounding perimeter deep water moat
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (r <= 1 || r >= rows - 2 || c <= 1 || c >= cols - 2) {
          const idx = c + r * cols;
          for (let t = 0; t < numTiles; t++) {
            if (!waterIndices.has(t)) model.ban(idx, t);
          }
        }
      }
    }

    // 2. Eastern Whispering Lake (Oval Water Reservoir: Rows 20-40, Cols 46-58)
    for (let r = 20; r < 40; r++) {
      for (let c = 46; c < 58; c++) {
        const dist = Math.hypot((c - 52) * 1.3, r - 30);
        if (dist < 5.5) {
          const idx = c + r * cols;
          for (let t = 0; t < numTiles; t++) {
            if (!waterIndices.has(t)) model.ban(idx, t);
          }
        }
      }
    }

    // 3. Northern Sunken Citadel Plaza (Rows 10-22, Cols 24-40)
    for (let r = 10; r <= 22; r++) {
      for (let c = 24; c <= 40; c++) {
        const idx = c + r * cols;
        for (let t = 0; t < numTiles; t++) {
          if (!patioIndices.has(t)) model.ban(idx, t);
        }
      }
    }

    // 4. Southern Ancient Highway (Grand Road from Row 24 down to Row 56, Cols 31-33)
    for (let r = 24; r <= 56; r++) {
      for (let c = 31; c <= 33; c++) {
        const idx = c + r * cols;
        for (let t = 0; t < numTiles; t++) {
          if (!roadIndices.has(t)) model.ban(idx, t);
        }
      }
    }

    // 5. Propagate constraints and solve wave function
    const initOk = model.propagate();
    if (initOk) {
      success = model.run(currentSeed, -1);
    }

    if (!success) {
      currentSeed = (currentSeed + 9973) | 0;
    }
  }

  // Construct tile grid from WFC observed state (fallback to Lush Grass if unobserved)
  const grid: number[][] = [];
  for (let r = 0; r < rows; r++) {
    grid[r] = [];
    for (let c = 0; c < cols; c++) {
      const idx = c + r * cols;
      const obs = model.observed[idx];
      grid[r][c] = obs >= 0 && obs < numTiles ? obs : 9; // GRASS_LUSH
    }
  }

  // Ensure central Sun Shrine altar is present in courtyard
  grid[15][32] = 36; // SUN_SHRINE

  // Build physical Boundaries for solid colliders (Water, Stone Walls, Stone Pillars, Tree Trunks)
  const boundaries: Boundary[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const tileIndex = grid[r][c];
      if (TILES[tileIndex]?.blocking) {
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

  // Grand entrance spawn point (Row 54 on the Southern Highway)
  const spawnPoint = {
    x: 32 * tileSize + tileSize / 2 - 24,
    y: 54 * tileSize,
  };

  // Interactive POIs placed in the world
  const pois: InteractablePOI[] = [
    {
      id: "elder_oakhaven",
      name: "Elder Oakhaven",
      type: "npc",
      position: { x: 32 * tileSize + 32, y: 15 * tileSize + 32 },
      radius: 72,
      icon: "🧙‍♂️",
      prompt: "Consult Elder at Sun Shrine",
      spriteFolder: "03-brom",
      initialNodeId: (state) => {
        if (state.flags.questCompleted) return "elder_farewell";
        if (state.flags.hasRune) return "elder_turn_in";
        if (state.flags.talkedToElder) return "elder_reminder";
        return "elder_intro";
      },
    },
    {
      id: "echo_companion",
      name: "Echo",
      type: "npc",
      position: { x: 36 * tileSize + 32, y: 14 * tileSize + 32 },
      radius: 64,
      icon: "🧝‍♀️",
      prompt: "Speak with Echo",
      spriteFolder: "00-classic",
      initialNodeId: (state) => {
        if (state.flags.questCompleted) return "echo_banter";
        if (state.flags.hasRune) return "echo_excited";
        return "echo_greeting";
      },
    },
    {
      id: "ancient_sun_altar",
      name: "Sacred Sun Altar",
      type: "object",
      position: { x: 32 * tileSize + 32, y: 15 * tileSize + 32 },
      radius: 60,
      icon: "☀️",
      prompt: "Examine Ancient Runic Altar",
      initialNodeId: (state) => {
        if (state.flags.hasRune) return "well_has_rune";
        return "well_empty";
      },
    },
    {
      id: "relic_chest",
      name: "Relic Chest",
      type: "object",
      position: { x: 26 * tileSize + 32, y: 14 * tileSize + 32 },
      radius: 54,
      icon: "📦",
      prompt: "Search Ancient Relic Chest",
      initialNodeId: (state) => {
        if (state.flags.searchedCrates) return "crates_empty";
        return "crates_intro";
      },
    },
    {
      id: "lake_lookout",
      name: "Whispering Lake Pier",
      type: "object",
      position: { x: 51 * tileSize + 32, y: 29 * tileSize + 32 },
      radius: 58,
      icon: "🌊",
      prompt: "Gaze into the Whispering Depths",
      initialNodeId: (state) => {
        if (state.flags.hasRune) return "well_has_rune";
        return "well_empty";
      },
    },
  ];

  // Tile size on Kenney RPGpack_sheet_2X.png is 128x128 pixels
  const S_TILE = 128;

  // Viewport culling pixel-art renderer using real Kenney RPGpack spritesheet
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

    for (let r = minRow; r <= maxRow; r++) {
      for (let col = minCol; col <= maxCol; col++) {
        const tileIndex = grid[r][col];
        const tDef = TILES[tileIndex] || TILES[9];
        const px = col * tileSize;
        const py = r * tileSize;
        // 0.5px subpixel overlap prevents canvas rounding seam lines between tiles
        const drawSize = tileSize + 0.5;

        if (hasTileset) {
          // 1. Draw underlay (grass, patio, or water) for transparent sprites
          if (tDef.underlay === "grass") {
            // Draw lush grass underneath
            c.drawImage(tileset, 3 * S_TILE + 0.5, 1 * S_TILE + 0.5, S_TILE - 1, S_TILE - 1, px, py, drawSize, drawSize);
          } else if (tDef.underlay === "patio") {
            // Draw stone flagstone underneath
            c.drawImage(tileset, 10 * S_TILE + 0.5, 4 * S_TILE + 0.5, S_TILE - 1, S_TILE - 1, px, py, drawSize, drawSize);
          } else if (tDef.underlay === "water") {
            // Draw deep water underneath
            c.drawImage(tileset, 11 * S_TILE + 0.5, 1 * S_TILE + 0.5, S_TILE - 1, S_TILE - 1, px, py, drawSize, drawSize);
          }

          // 2. Draw actual tile graphic from spritesheet (0.5px source inset prevents bleed)
          const [sx, sy] = tDef.sheet;
          c.drawImage(tileset, sx * S_TILE + 0.5, sy * S_TILE + 0.5, S_TILE - 1, S_TILE - 1, px, py, drawSize, drawSize);

          // 3. Shimmer wave on water tiles
          if (tileIndex === 0) {
            const wave = Math.sin(animTime * 2.2 + col * 0.7 + r * 0.5) * 4;
            c.fillStyle = "rgba(186, 230, 253, 0.2)";
            c.fillRect(px + 8 + wave, py + 22, 28, 2.5);
            c.fillRect(px + 24 - wave, py + 44, 20, 2);
          }

          // 4. Glowing Sun Shrine Altar pulsation
          if (tileIndex === 36) {
            const pulse = 0.5 + Math.sin(animTime * 3) * 0.4;
            c.save();
            c.strokeStyle = `rgba(245, 158, 11, ${pulse})`;
            c.lineWidth = 3;
            c.beginPath();
            c.arc(px + tileSize / 2, py + tileSize / 2, 24, 0, Math.PI * 2);
            c.stroke();
            c.fillStyle = `rgba(245, 158, 11, ${pulse * 0.25})`;
            c.fill();
            c.restore();
          }
        } else {
          // Fallback if tileset is loading
          c.fillStyle = tDef.corners[0] === W ? "#1e3a5f" : tDef.corners[0] === P ? "#475569" : "#3e6a3d";
          c.fillRect(px, py, tileSize, tileSize);
        }
      }
    }
  };

  // Foreground environmental overlay (grand archway at South Gateway Row 22, Cols 31-33)
  const drawForeground = (
    c: CanvasRenderingContext2D,
    _camera: { x: number; y: number },
    _viewW: number,
    _viewH: number,
    _zoom: number,
    _animTime: number,
  ) => {
    const archX = 31 * tileSize;
    const archY = 22 * tileSize - 24;

    c.save();
    c.fillStyle = "#334155";
    c.fillRect(archX - 12, archY, 3 * tileSize + 24, 30);
    c.strokeStyle = "#64748b";
    c.lineWidth = 2.5;
    c.strokeRect(archX - 12, archY, 3 * tileSize + 24, 30);

    c.font = "bold 11px monospace";
    c.fillStyle = "#f59e0b";
    c.textAlign = "center";
    c.fillText("⚡ SUNKEN CITADEL — SACRED REALM ⚡", archX + (3 * tileSize) / 2, archY + 19);
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
    pois,
    draw,
    drawForeground,
  };
}
