import { Boundary } from "../class";
import type { InteractablePOI } from "./story";
import { WfcModel } from "./wfc/wfcCore";

export type TileId = number;

export const TILES = {
  WATER_DEEP: 0,
  WATER_SHORE_N: 1,
  WATER_SHORE_S: 2,
  WATER_SHORE_E: 3,
  WATER_SHORE_W: 4,
  WATER_SHORE_NW: 5,
  WATER_SHORE_NE: 6,
  WATER_SHORE_SW: 7,
  WATER_SHORE_SE: 8,
  STONE_BRIDGE_H: 9,
  STONE_BRIDGE_V: 10,
  GRASS_LUSH: 11,
  GRASS_CHAMOMILE: 12,
  GRASS_LAVENDER: 13,
  GRASS_CLOVER: 14,
  ANCIENT_ROAD: 15,
  STONE_PATIO: 16,
  RUNIC_SUN_SHRINE: 17,
  MOSSY_STONE_WALL: 18,
  ANCIENT_PILLAR: 19,
  FOREST_TREE: 20,
  BUSH_FOLIAGE: 21,
} as const;

export const NUM_TILES = 22;

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

// Build adjacency rules for the 4 cardinal directions (Left=0, Down=1, Right=2, Up=3)
function buildAdjacencyRules(): number[][][] {
  // propagator[direction][tileA] = array of allowed tileB
  const propagator: number[][][] = [];
  for (let d = 0; d < 4; d++) {
    propagator[d] = [];
    for (let t = 0; t < NUM_TILES; t++) {
      propagator[d][t] = [];
    }
  }

  const allow = (tileA: number, dir: number, tileB: number) => {
    if (!propagator[dir][tileA].includes(tileB)) {
      propagator[dir][tileA].push(tileB);
    }
    const opp = WfcModel.opposite[dir];
    if (!propagator[opp][tileB].includes(tileA)) {
      propagator[opp][tileB].push(tileA);
    }
  };

  const allowSymmetric = (tileA: number, tileB: number) => {
    for (let d = 0; d < 4; d++) {
      allow(tileA, d, tileB);
    }
  };

  const grassTiles = [
    TILES.GRASS_LUSH,
    TILES.GRASS_CHAMOMILE,
    TILES.GRASS_LAVENDER,
    TILES.GRASS_CLOVER,
    TILES.BUSH_FOLIAGE,
  ];

  // 1. All grass and flower variants can connect in any direction
  for (const g1 of grassTiles) {
    for (const g2 of grassTiles) {
      allowSymmetric(g1, g2);
    }
  }

  // 2. Deep Water connections
  allowSymmetric(TILES.WATER_DEEP, TILES.WATER_DEEP);

  // Shore North (Land South, Water North)
  allow(TILES.WATER_SHORE_N, 3, TILES.WATER_DEEP); // North is water
  allow(TILES.WATER_SHORE_N, 3, TILES.WATER_SHORE_N);
  for (const g of grassTiles) {
    allow(TILES.WATER_SHORE_N, 1, g); // South is land
  }
  allow(TILES.WATER_SHORE_N, 0, TILES.WATER_SHORE_N); // West is shore N
  allow(TILES.WATER_SHORE_N, 2, TILES.WATER_SHORE_N); // East is shore N
  allow(TILES.WATER_SHORE_N, 0, TILES.WATER_SHORE_NW);
  allow(TILES.WATER_SHORE_N, 2, TILES.WATER_SHORE_NE);

  // Shore South (Land North, Water South)
  allow(TILES.WATER_SHORE_S, 1, TILES.WATER_DEEP); // South is water
  allow(TILES.WATER_SHORE_S, 1, TILES.WATER_SHORE_S);
  for (const g of grassTiles) {
    allow(TILES.WATER_SHORE_S, 3, g); // North is land
  }
  allow(TILES.WATER_SHORE_S, 0, TILES.WATER_SHORE_S);
  allow(TILES.WATER_SHORE_S, 2, TILES.WATER_SHORE_S);
  allow(TILES.WATER_SHORE_S, 0, TILES.WATER_SHORE_SW);
  allow(TILES.WATER_SHORE_S, 2, TILES.WATER_SHORE_SE);

  // Shore East (Land West, Water East)
  allow(TILES.WATER_SHORE_E, 2, TILES.WATER_DEEP); // East is water
  allow(TILES.WATER_SHORE_E, 2, TILES.WATER_SHORE_E);
  for (const g of grassTiles) {
    allow(TILES.WATER_SHORE_E, 0, g); // West is land
  }
  allow(TILES.WATER_SHORE_E, 1, TILES.WATER_SHORE_E);
  allow(TILES.WATER_SHORE_E, 3, TILES.WATER_SHORE_E);

  // Shore West (Land East, Water West)
  allow(TILES.WATER_SHORE_W, 0, TILES.WATER_DEEP); // West is water
  allow(TILES.WATER_SHORE_W, 0, TILES.WATER_SHORE_W);
  for (const g of grassTiles) {
    allow(TILES.WATER_SHORE_W, 2, g); // East is land
  }
  allow(TILES.WATER_SHORE_W, 1, TILES.WATER_SHORE_W);
  allow(TILES.WATER_SHORE_W, 3, TILES.WATER_SHORE_W);

  // Corner Shores
  allow(TILES.WATER_SHORE_NW, 3, TILES.WATER_DEEP);
  allow(TILES.WATER_SHORE_NW, 0, TILES.WATER_DEEP);
  allow(TILES.WATER_SHORE_NE, 3, TILES.WATER_DEEP);
  allow(TILES.WATER_SHORE_NE, 2, TILES.WATER_DEEP);
  allow(TILES.WATER_SHORE_SW, 1, TILES.WATER_DEEP);
  allow(TILES.WATER_SHORE_SW, 0, TILES.WATER_DEEP);
  allow(TILES.WATER_SHORE_SE, 1, TILES.WATER_DEEP);
  allow(TILES.WATER_SHORE_SE, 2, TILES.WATER_DEEP);

  for (const g of grassTiles) {
    allow(TILES.WATER_SHORE_NW, 1, g);
    allow(TILES.WATER_SHORE_NW, 2, g);
    allow(TILES.WATER_SHORE_NE, 1, g);
    allow(TILES.WATER_SHORE_NE, 0, g);
    allow(TILES.WATER_SHORE_SW, 3, g);
    allow(TILES.WATER_SHORE_SW, 2, g);
    allow(TILES.WATER_SHORE_SE, 3, g);
    allow(TILES.WATER_SHORE_SE, 0, g);
  }

  // 3. Bridges crossing water
  // Horizontal bridge: Water North and South, Bridge/Land East and West
  allow(TILES.STONE_BRIDGE_H, 3, TILES.WATER_DEEP);
  allow(TILES.STONE_BRIDGE_H, 1, TILES.WATER_DEEP);
  allow(TILES.STONE_BRIDGE_H, 0, TILES.STONE_BRIDGE_H);
  allow(TILES.STONE_BRIDGE_H, 2, TILES.STONE_BRIDGE_H);
  allow(TILES.STONE_BRIDGE_H, 0, TILES.ANCIENT_ROAD);
  allow(TILES.STONE_BRIDGE_H, 2, TILES.ANCIENT_ROAD);
  for (const g of grassTiles) {
    allow(TILES.STONE_BRIDGE_H, 0, g);
    allow(TILES.STONE_BRIDGE_H, 2, g);
  }

  // Vertical bridge
  allow(TILES.STONE_BRIDGE_V, 0, TILES.WATER_DEEP);
  allow(TILES.STONE_BRIDGE_V, 2, TILES.WATER_DEEP);
  allow(TILES.STONE_BRIDGE_V, 1, TILES.STONE_BRIDGE_V);
  allow(TILES.STONE_BRIDGE_V, 3, TILES.STONE_BRIDGE_V);
  allow(TILES.STONE_BRIDGE_V, 1, TILES.ANCIENT_ROAD);
  allow(TILES.STONE_BRIDGE_V, 3, TILES.ANCIENT_ROAD);
  for (const g of grassTiles) {
    allow(TILES.STONE_BRIDGE_V, 1, g);
    allow(TILES.STONE_BRIDGE_V, 3, g);
  }

  // 4. Ancient Road connections
  allowSymmetric(TILES.ANCIENT_ROAD, TILES.ANCIENT_ROAD);
  for (const g of grassTiles) {
    allowSymmetric(TILES.ANCIENT_ROAD, g);
  }
  allowSymmetric(TILES.ANCIENT_ROAD, TILES.STONE_PATIO);

  // 5. Sunken Citadel Courtyard & Ruins
  allowSymmetric(TILES.STONE_PATIO, TILES.STONE_PATIO);
  for (const g of grassTiles) {
    allowSymmetric(TILES.STONE_PATIO, g);
  }
  allowSymmetric(TILES.STONE_PATIO, TILES.RUNIC_SUN_SHRINE);
  allowSymmetric(TILES.RUNIC_SUN_SHRINE, TILES.RUNIC_SUN_SHRINE);

  // Walls and Pillars sit on Stone Patio or Grass
  allowSymmetric(TILES.MOSSY_STONE_WALL, TILES.STONE_PATIO);
  allowSymmetric(TILES.MOSSY_STONE_WALL, TILES.MOSSY_STONE_WALL);
  allowSymmetric(TILES.ANCIENT_PILLAR, TILES.STONE_PATIO);
  allowSymmetric(TILES.ANCIENT_PILLAR, TILES.ANCIENT_ROAD);
  for (const g of grassTiles) {
    allowSymmetric(TILES.MOSSY_STONE_WALL, g);
    allowSymmetric(TILES.ANCIENT_PILLAR, g);
  }

  // 6. Forest Trees in meadow & forest groves
  for (const g of grassTiles) {
    allowSymmetric(TILES.FOREST_TREE, g);
  }
  allowSymmetric(TILES.FOREST_TREE, TILES.FOREST_TREE);

  return propagator;
}

// Generate the big multi-biome WFC ancient adventure world
export function generateWhisperingRuinsMap(
  ctx: CanvasRenderingContext2D,
  initialSeed = 101,
): ProceduralMap {
  const cols = 64;
  const rows = 64;
  const tileSize = 64;
  const width = cols * tileSize;
  const height = rows * tileSize;

  // Tile Weights
  const weights = new Array(NUM_TILES).fill(1.0);
  weights[TILES.GRASS_LUSH] = 25.0;
  weights[TILES.GRASS_CHAMOMILE] = 7.0;
  weights[TILES.GRASS_LAVENDER] = 6.0;
  weights[TILES.GRASS_CLOVER] = 8.0;
  weights[TILES.BUSH_FOLIAGE] = 3.0;
  weights[TILES.WATER_DEEP] = 12.0;
  weights[TILES.WATER_SHORE_N] = 3.0;
  weights[TILES.WATER_SHORE_S] = 3.0;
  weights[TILES.WATER_SHORE_E] = 3.0;
  weights[TILES.WATER_SHORE_W] = 3.0;
  weights[TILES.WATER_SHORE_NW] = 1.5;
  weights[TILES.WATER_SHORE_NE] = 1.5;
  weights[TILES.WATER_SHORE_SW] = 1.5;
  weights[TILES.WATER_SHORE_SE] = 1.5;
  weights[TILES.STONE_BRIDGE_H] = 1.2;
  weights[TILES.STONE_BRIDGE_V] = 1.2;
  weights[TILES.ANCIENT_ROAD] = 9.0;
  weights[TILES.STONE_PATIO] = 14.0;
  weights[TILES.RUNIC_SUN_SHRINE] = 2.0;
  weights[TILES.MOSSY_STONE_WALL] = 4.0;
  weights[TILES.ANCIENT_PILLAR] = 3.0;
  weights[TILES.FOREST_TREE] = 5.0;

  const propagator = buildAdjacencyRules();

  // Instantiate the exact Maxim Gumin WfcModel
  const model = new WfcModel(cols, rows, NUM_TILES, weights, propagator, false, "Entropy");

  // Attempt collapse with seed perturbations if contradiction occurs
  let success = false;
  let attempt = 0;
  let currentSeed = initialSeed;

  while (!success && attempt < 8) {
    attempt++;
    model.clear();

    // ── Macro Biome Domain Pre-Conditioning ──
    // 1. Surrounding perimeter deep water moat / chasm (rows 0-2, rows 61-63, cols 0-2, cols 61-63)
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (r <= 1 || r >= rows - 2 || c <= 1 || c >= cols - 2) {
          const idx = c + r * cols;
          for (let t = 0; t < NUM_TILES; t++) {
            if (t !== TILES.WATER_DEEP) model.ban(idx, t);
          }
        }
      }
    }

    // 2. Eastern Whispering Lake (Rows 16-44, Cols 46-58)
    for (let r = 18; r < 42; r++) {
      for (let c = 48; c < 56; c++) {
        const dist = Math.hypot((c - 52) * 1.3, r - 30);
        if (dist < 8.5) {
          const idx = c + r * cols;
          for (let t = 0; t < NUM_TILES; t++) {
            if (t !== TILES.WATER_DEEP) model.ban(idx, t);
          }
        }
      }
    }

    // 3. Northern Sunken Citadel Courtyard (Rows 8 to 22, Cols 22 to 42)
    for (let r = 10; r <= 20; r++) {
      for (let c = 24; c <= 40; c++) {
        const idx = c + r * cols;
        for (let t = 0; t < NUM_TILES; t++) {
          if (
            t !== TILES.STONE_PATIO &&
            t !== TILES.RUNIC_SUN_SHRINE &&
            t !== TILES.ANCIENT_PILLAR &&
            t !== TILES.MOSSY_STONE_WALL
          ) {
            model.ban(idx, t);
          }
        }
      }
    }

    // Central Sun Shrine in Courtyard (Row 15, Col 32)
    const shrineIdx = 32 + 15 * cols;
    for (let t = 0; t < NUM_TILES; t++) {
      if (t !== TILES.RUNIC_SUN_SHRINE) model.ban(shrineIdx, t);
    }

    // 4. Ancient Stone Highway connecting Gateway -> Courtyard
    for (let r = 21; r <= 56; r++) {
      for (let c = 31; c <= 33; c++) {
        const idx = c + r * cols;
        for (let t = 0; t < NUM_TILES; t++) {
          if (t !== TILES.ANCIENT_ROAD) model.ban(idx, t);
        }
      }
    }

    // Propagate macro constraints before running collapse
    const initProp = model.propagate();
    if (initProp) {
      success = model.run(currentSeed, 60000);
    }

    if (!success) {
      currentSeed = (currentSeed + 7919) | 0;
    }
  }

  // Build final 2D grid from observed results
  const grid: number[][] = [];
  for (let r = 0; r < rows; r++) {
    grid[r] = [];
    for (let c = 0; c < cols; c++) {
      const idx = c + r * cols;
      const tile = model.observed[idx] >= 0 ? model.observed[idx] : TILES.GRASS_LUSH;
      grid[r][c] = tile;
    }
  }

  // Build Boundaries for all blocking tiles
  const boundaries: Boundary[] = [];
  const blockingTiles = new Set<number>([
    TILES.WATER_DEEP,
    TILES.MOSSY_STONE_WALL,
    TILES.ANCIENT_PILLAR,
    TILES.FOREST_TREE,
  ]);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (blockingTiles.has(grid[r][c])) {
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

  // Safe Spawn Point (on the southern ancient road)
  const spawnPoint = {
    x: 32 * tileSize + tileSize / 2 - 24,
    y: 52 * tileSize,
  };

  // Interactive POIs positioned in the Big WFC Ruins World
  const pois: InteractablePOI[] = [
    {
      id: "elder_oakhaven",
      name: "Elder Oakhaven",
      type: "npc",
      position: { x: 32 * tileSize + 32, y: 14 * tileSize + 32 },
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
      position: { x: 30 * tileSize + 20, y: 48 * tileSize + 32 },
      radius: 65,
      icon: "👋",
      prompt: "Greet Echo on Highway",
      spriteFolder: "00-classic",
      initialNodeId: (state) => {
        if (state.flags.talkedToEcho) return "echo_banter";
        return "echo_intro";
      },
    },
    {
      id: "ancient_well",
      name: "Well of Whispers",
      type: "object",
      position: { x: 44 * tileSize + 32, y: 28 * tileSize + 32 },
      radius: 70,
      icon: "💧",
      prompt: "Examine Lake Well",
      initialNodeId: (state) => {
        if (state.flags.hasRune) return "well_empty";
        return "well_intro";
      },
    },
    {
      id: "cottage_crates",
      name: "Ruins Relic Chest",
      type: "object",
      position: { x: 26 * tileSize + 32, y: 16 * tileSize + 32 },
      radius: 60,
      icon: "📦",
      prompt: "Search Ancient Relic Chest",
      initialNodeId: (state) => {
        if (state.flags.searchedCrates) return "crates_empty";
        return "crates_intro";
      },
    },
  ];

  // High-performance viewport culling renderer
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

    for (let r = minRow; r <= maxRow; r++) {
      for (let col = minCol; col <= maxCol; col++) {
        const tile = grid[r][col];
        const px = col * tileSize;
        const py = r * tileSize;

        switch (tile) {
          case TILES.WATER_DEEP: {
            const wave = Math.sin(animTime * 1.8 + col * 0.4 + r * 0.3) * 5;
            c.fillStyle = "#1e3a5f";
            c.fillRect(px, py, tileSize, tileSize);
            c.fillStyle = "rgba(56, 189, 248, 0.22)";
            c.fillRect(px + 8 + wave, py + 18, 30, 2.5);
            c.fillRect(px + 18 - wave, py + 42, 24, 2);
            break;
          }

          case TILES.WATER_SHORE_N:
          case TILES.WATER_SHORE_S:
          case TILES.WATER_SHORE_E:
          case TILES.WATER_SHORE_W:
          case TILES.WATER_SHORE_NW:
          case TILES.WATER_SHORE_NE:
          case TILES.WATER_SHORE_SW:
          case TILES.WATER_SHORE_SE: {
            c.fillStyle = "#2d527a";
            c.fillRect(px, py, tileSize, tileSize);
            c.fillStyle = "#3e6a3d";
            c.fillRect(px + 4, py + 4, tileSize - 8, tileSize - 8);
            c.fillStyle = "#a8a29e";
            c.fillRect(px, py + tileSize - 6, tileSize, 6);
            break;
          }

          case TILES.STONE_BRIDGE_H:
            c.fillStyle = "#1e3a5f";
            c.fillRect(px, py, tileSize, tileSize);
            c.fillStyle = "#64748b";
            c.fillRect(px, py + 12, tileSize, tileSize - 24);
            c.strokeStyle = "#475569";
            c.lineWidth = 2;
            c.strokeRect(px, py + 12, tileSize, tileSize - 24);
            c.fillStyle = "#94a3b8";
            c.fillRect(px + 6, py + 16, tileSize - 12, 4);
            break;

          case TILES.STONE_BRIDGE_V:
            c.fillStyle = "#1e3a5f";
            c.fillRect(px, py, tileSize, tileSize);
            c.fillStyle = "#64748b";
            c.fillRect(px + 12, py, tileSize - 24, tileSize);
            c.strokeStyle = "#475569";
            c.lineWidth = 2;
            c.strokeRect(px + 12, py, tileSize - 24, tileSize);
            break;

          case TILES.GRASS_LUSH:
            c.fillStyle = "#3e6a3d";
            c.fillRect(px, py, tileSize, tileSize);
            c.fillStyle = "#4a7d48";
            c.fillRect(px + 10, py + 14, 4, 7);
            c.fillRect(px + 38, py + 42, 4, 8);
            break;

          case TILES.GRASS_CHAMOMILE:
            c.fillStyle = "#417240";
            c.fillRect(px, py, tileSize, tileSize);
            c.fillStyle = "#fef08a";
            c.beginPath();
            c.arc(px + 18, py + 22, 4, 0, Math.PI * 2);
            c.arc(px + 42, py + 38, 3.5, 0, Math.PI * 2);
            c.fill();
            c.fillStyle = "#f97316";
            c.beginPath();
            c.arc(px + 18, py + 22, 1.5, 0, Math.PI * 2);
            c.arc(px + 42, py + 38, 1.2, 0, Math.PI * 2);
            c.fill();
            break;

          case TILES.GRASS_LAVENDER:
            c.fillStyle = "#3c683b";
            c.fillRect(px, py, tileSize, tileSize);
            c.fillStyle = "#c084fc";
            c.beginPath();
            c.arc(px + 16, py + 20, 3.5, 0, Math.PI * 2);
            c.arc(px + 40, py + 44, 3.5, 0, Math.PI * 2);
            c.arc(px + 30, py + 16, 3, 0, Math.PI * 2);
            c.fill();
            c.fillStyle = "#7e22ce";
            c.beginPath();
            c.arc(px + 16, py + 20, 1.2, 0, Math.PI * 2);
            c.arc(px + 40, py + 44, 1.2, 0, Math.PI * 2);
            c.fill();
            break;

          case TILES.GRASS_CLOVER:
            c.fillStyle = "#376236";
            c.fillRect(px, py, tileSize, tileSize);
            c.fillStyle = "#86efac";
            c.beginPath();
            c.arc(px + 14, py + 18, 3, 0, Math.PI * 2);
            c.arc(px + 44, py + 46, 3, 0, Math.PI * 2);
            c.fill();
            break;

          case TILES.ANCIENT_ROAD:
            c.fillStyle = "#52525b";
            c.fillRect(px, py, tileSize, tileSize);
            c.strokeStyle = "#3f3f46";
            c.lineWidth = 1.5;
            c.strokeRect(px + 4, py + 4, tileSize - 8, tileSize - 8);
            c.fillStyle = "#71717a";
            c.fillRect(px + 8, py + 8, 20, 20);
            c.fillRect(px + 32, py + 32, 22, 22);
            break;

          case TILES.STONE_PATIO:
            c.fillStyle = "#475569";
            c.fillRect(px, py, tileSize, tileSize);
            c.strokeStyle = "#334155";
            c.lineWidth = 1;
            c.strokeRect(px, py, tileSize, tileSize);
            c.fillStyle = "rgba(74, 222, 128, 0.22)";
            c.fillRect(px + 4, py + 4, 8, 4);
            break;

          case TILES.RUNIC_SUN_SHRINE: {
            c.fillStyle = "#334155";
            c.fillRect(px, py, tileSize, tileSize);
            const pulse = 0.5 + Math.sin(animTime * 2.5) * 0.35;
            c.save();
            c.strokeStyle = `rgba(245, 158, 11, ${pulse})`;
            c.lineWidth = 2.5;
            c.beginPath();
            c.arc(px + tileSize / 2, py + tileSize / 2, 26, 0, Math.PI * 2);
            c.stroke();
            c.fillStyle = `rgba(245, 158, 11, ${pulse * 0.2})`;
            c.fill();
            c.restore();
            break;
          }

          case TILES.MOSSY_STONE_WALL:
            c.fillStyle = "#334155";
            c.fillRect(px, py, tileSize, tileSize);
            c.fillStyle = "#64748b";
            c.fillRect(px + 4, py + 4, tileSize - 8, tileSize - 12);
            c.fillStyle = "#94a3b8";
            c.fillRect(px + 2, py + 2, tileSize - 4, 12);
            c.fillStyle = "#22c55e";
            c.fillRect(px + 8, py + 24, 6, 16);
            break;

          case TILES.ANCIENT_PILLAR:
            c.fillStyle = "#475569";
            c.fillRect(px, py, tileSize, tileSize);
            c.fillStyle = "#cbd5e1";
            c.beginPath();
            c.arc(px + tileSize / 2, py + tileSize / 2, 20, 0, Math.PI * 2);
            c.fill();
            c.strokeStyle = "#475569";
            c.lineWidth = 3;
            c.stroke();
            c.fillStyle = "#f59e0b";
            c.beginPath();
            c.arc(px + tileSize / 2, py + tileSize / 2, 6, 0, Math.PI * 2);
            c.fill();
            break;

          case TILES.FOREST_TREE:
            c.fillStyle = "#376236";
            c.fillRect(px, py, tileSize, tileSize);
            c.fillStyle = "#451a03";
            c.fillRect(px + 24, py + 24, 16, 28);
            c.fillStyle = "#15803d";
            c.beginPath();
            c.arc(px + 32, py + 24, 26, 0, Math.PI * 2);
            c.fill();
            break;

          case TILES.BUSH_FOLIAGE:
            c.fillStyle = "#3e6a3d";
            c.fillRect(px, py, tileSize, tileSize);
            c.fillStyle = "#16a34a";
            c.beginPath();
            c.arc(px + 32, py + 34, 18, 0, Math.PI * 2);
            c.fill();
            c.fillStyle = "#ef4444";
            c.beginPath();
            c.arc(px + 24, py + 32, 2.5, 0, Math.PI * 2);
            c.arc(px + 38, py + 36, 2.5, 0, Math.PI * 2);
            c.fill();
            break;
        }

        // Overlay tileset graphics if loaded
        if (tileset && tileset.complete && tileset.naturalWidth > 0) {
          const sTile = 128;
          if (tile === TILES.STONE_PATIO) {
            c.drawImage(tileset, 0 * sTile, 3 * sTile, sTile, sTile, px, py, tileSize, tileSize);
          } else if (tile === TILES.ANCIENT_PILLAR) {
            c.drawImage(tileset, 6 * sTile, 7 * sTile, sTile, sTile, px, py, tileSize, tileSize);
          }
        }
      }
    }
  };

  // Foreground effects
  const drawForeground = (
    c: CanvasRenderingContext2D,
    _camera: { x: number; y: number },
    _viewW: number,
    _viewH: number,
    _zoom: number,
    _animTime: number,
  ) => {
    // Grand South Archway Lintel across ancient road (Row 46, Cols 31 to 33)
    const archX = 31 * tileSize;
    const archY = 46 * tileSize - 20;
    c.save();
    c.fillStyle = "#94a3b8";
    c.fillRect(archX - 10, archY, 3 * tileSize + 20, 26);
    c.strokeStyle = "#475569";
    c.lineWidth = 2;
    c.strokeRect(archX - 10, archY, 3 * tileSize + 20, 26);

    c.font = "bold 11px monospace";
    c.fillStyle = "rgba(245, 158, 11, 0.9)";
    c.textAlign = "center";
    c.fillText("ᚠ ᚢ ᚦ ᚨ ᚱ ᚲ — SUNKEN CITADEL", archX + (3 * tileSize) / 2, archY + 17);
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
