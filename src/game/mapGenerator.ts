import { Boundary } from "../class";
import { POIS, type InteractablePOI } from "./story";
import { WfcModel } from "./wfc/wfcCore";

export interface CompoundStructure {
  name: string;
  type: "cottage" | "well" | "tree" | "chest" | "barrel" | "bench" | "monolith" | "statue" | "altar" | "pillar";
  col: number;
  row: number;
  widthPx: number;
  heightPx: number;
  solidBox: { x: number; y: number; w: number; h: number };
  cottageIndex?: number;
  isOpen?: boolean;
}

export interface CompoundTree {
  col: number;
  row: number;
  type: "oak" | "pine" | "autumn";
  canopySheet: [number, number];
  trunkSheet: [number, number];
}

export interface StructurePrefab {
  name: string;
  originCol: number;
  originRow: number;
  width: number;
  height: number;
  tiles: ([number, number] | null)[][];
  solidMask: boolean[][];
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
  compoundStructures: CompoundStructure[];
  trees: CompoundTree[];
  draw: (
    ctx: CanvasRenderingContext2D,
    tilesets: Record<string, HTMLImageElement> | HTMLImageElement | null,
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

// ── Multi-Biome Semantic Tile Types (Strictly Cainos Pixel Art) ────────────────
export const TILE_GRASS_PURE = 0;
export const TILE_GRASS_FLOWER_WHITE = 1;
export const TILE_GRASS_FLOWER_YELLOW = 2;
export const TILE_FOREST_GROUND = 3;
export const TILE_ROAD_COBBLESTONE = 4;
export const TILE_CITADEL_FLOOR = 5;
export const TILE_WALL_COPING_N = 6;
export const TILE_WALL_COPING_S = 7;
export const TILE_WALL_COPING_W = 8;
export const TILE_WALL_COPING_E = 9;
export const TILE_WALL_CORNER_NW = 10;
export const TILE_WALL_CORNER_NE = 11;
export const TILE_WALL_CORNER_SW = 12;
export const TILE_WALL_CORNER_SE = 13;
export const TILE_WALL_FACE = 14;
export const TILE_STAIRS = 15;
export const TILE_ARCH_GATE = 16;
export const TILE_PERIMETER_WOODS = 17;

// ── Macro WFC Module Architecture (37 modules with closed Wang sockets) ──────
interface MacroModuleDef {
  name: string;
  sockets: [string, string, string, string]; // [left, down, right, up] (dir 0, 1, 2, 3)
  weight: number;
  biome: "perimeter" | "forest" | "meadow" | "road" | "village" | "citadel";
}

const MACRO_MODULES: MacroModuleDef[] = [
  // 1. Boundary Perimeter & Forest Edges (Dense Ancient Oak Trees)
  { name: "PERIMETER_WOODS", sockets: ["P", "P", "P", "P"], weight: 50, biome: "perimeter" },
  { name: "BORDER_N", sockets: ["G", "G", "G", "P"], weight: 15, biome: "forest" },
  { name: "BORDER_S", sockets: ["G", "P", "G", "G"], weight: 15, biome: "forest" },
  { name: "BORDER_W", sockets: ["P", "G", "G", "G"], weight: 15, biome: "forest" },
  { name: "BORDER_E", sockets: ["G", "G", "P", "G"], weight: 15, biome: "forest" },
  { name: "BORDER_CORNER_NW", sockets: ["P", "G", "G", "P"], weight: 10, biome: "forest" },
  { name: "BORDER_CORNER_NE", sockets: ["G", "G", "P", "P"], weight: 10, biome: "forest" },
  { name: "BORDER_CORNER_SW", sockets: ["P", "P", "G", "G"], weight: 10, biome: "forest" },
  { name: "BORDER_CORNER_SE", sockets: ["G", "P", "P", "G"], weight: 10, biome: "forest" },

  // 2. Whispering Glade Meadows & Woodlands
  { name: "GLADE_MEADOW", sockets: ["G", "G", "G", "G"], weight: 45, biome: "meadow" },
  { name: "GLADE_GROVE", sockets: ["G", "G", "G", "G"], weight: 35, biome: "forest" },
  { name: "DENSE_WOODS", sockets: ["G", "G", "G", "G"], weight: 25, biome: "forest" },

  // 3. Cobblestone Highway Network (Connecting Citadel to Village)
  { name: "ROAD_H", sockets: ["R", "G", "R", "G"], weight: 18, biome: "road" },
  { name: "ROAD_V", sockets: ["G", "R", "G", "R"], weight: 18, biome: "road" },
  { name: "ROAD_CROSS", sockets: ["R", "R", "R", "R"], weight: 8, biome: "road" },
  { name: "ROAD_CORNER_NE", sockets: ["R", "G", "G", "R"], weight: 8, biome: "road" },
  { name: "ROAD_CORNER_NW", sockets: ["G", "G", "R", "R"], weight: 8, biome: "road" },
  { name: "ROAD_CORNER_SE", sockets: ["R", "R", "G", "G"], weight: 8, biome: "road" },
  { name: "ROAD_CORNER_SW", sockets: ["G", "R", "R", "G"], weight: 8, biome: "road" },
  { name: "ROAD_T_N", sockets: ["R", "G", "R", "R"], weight: 6, biome: "road" },
  { name: "ROAD_T_S", sockets: ["R", "R", "R", "G"], weight: 6, biome: "road" },
  { name: "ROAD_T_E", sockets: ["R", "R", "G", "R"], weight: 6, biome: "road" },
  { name: "ROAD_T_W", sockets: ["G", "R", "R", "R"], weight: 6, biome: "road" },
  { name: "ROAD_END_L", sockets: ["G", "G", "R", "G"], weight: 5, biome: "road" },
  { name: "ROAD_END_R", sockets: ["R", "G", "G", "G"], weight: 5, biome: "road" },
  { name: "ROAD_END_U", sockets: ["G", "R", "G", "G"], weight: 5, biome: "road" },
  { name: "ROAD_END_D", sockets: ["G", "G", "G", "R"], weight: 5, biome: "road" },

  // 4. Oakhaven Village Settlement
  { name: "VILLAGE_CENTER", sockets: ["G", "R", "G", "G"], weight: 10, biome: "village" },
  { name: "VILLAGE_GARDEN", sockets: ["G", "G", "G", "G"], weight: 18, biome: "village" },

  // 5. Sunken Citadel Ruins & Sanctum (Stone Fortress)
  { name: "SANCTUM_CORE", sockets: ["C", "C", "C", "C"], weight: 10, biome: "citadel" },
  { name: "COURTYARD_PLAZA", sockets: ["C", "C", "C", "C"], weight: 16, biome: "citadel" },
  { name: "COURTYARD_GATE", sockets: ["C", "R", "C", "C"], weight: 8, biome: "citadel" },
  { name: "COURTYARD_STAIRS", sockets: ["C", "G", "C", "C"], weight: 8, biome: "citadel" },
  { name: "CITADEL_WALL_N", sockets: ["C", "C", "C", "G"], weight: 8, biome: "citadel" },
  { name: "CITADEL_WALL_S", sockets: ["C", "G", "C", "C"], weight: 8, biome: "citadel" },
  { name: "CITADEL_WALL_W", sockets: ["G", "C", "C", "C"], weight: 8, biome: "citadel" },
  { name: "CITADEL_WALL_E", sockets: ["C", "C", "G", "C"], weight: 8, biome: "citadel" },
];

/**
 * Builds the 4-directional propagator table from socket rules
 * Directions: 0 = Left (-1, 0), 1 = Down (0, 1), 2 = Right (1, 0), 3 = Up (0, -1)
 */
function buildPropagator(modules: MacroModuleDef[]): number[][][] {
  const numTiles = modules.length;
  const prop: number[][][] = [[], [], [], []];
  for (let d = 0; d < 4; d++) prop[d] = [];

  for (let t1 = 0; t1 < numTiles; t1++) {
    const s1 = modules[t1].sockets;
    for (let d = 0; d < 4; d++) prop[d][t1] = [];

    for (let t2 = 0; t2 < numTiles; t2++) {
      const s2 = modules[t2].sockets;
      if (s2[2] === s1[0]) prop[0][t1].push(t2);
      if (s2[3] === s1[1]) prop[1][t1].push(t2);
      if (s2[0] === s1[2]) prop[2][t1].push(t2);
      if (s2[1] === s1[3]) prop[3][t1].push(t2);
    }
  }
  return prop;
}

/**
 * Generates the massive 80x80 multi-biome continent strictly using
 * Wave Function Collapse (WFC constraint satisfaction & Shannon entropy).
 */
export function generateWhisperingRuinsMap(
  ctx: CanvasRenderingContext2D,
  seed = 42,
): ProceduralMap {
  const cols = 80;
  const rows = 80;
  const tileSize = 64;
  const width = cols * tileSize;
  const height = rows * tileSize;

  // 1. Solve Macro Layout with WFC on a 16x16 grid
  const macroW = 16;
  const macroH = 16;
  const numModules = MACRO_MODULES.length;
  const weights = MACRO_MODULES.map((m) => m.weight);
  const propagator = buildPropagator(MACRO_MODULES);

  const wfc = new WfcModel(macroW, macroH, numModules, weights, propagator, false, "Entropy");
  wfc.clear();

  const nameIdx = (nm: string) => MACRO_MODULES.findIndex((m) => m.name === nm);
  const perimIdx = nameIdx("PERIMETER_WOODS");

  // Pre-pin outer perimeter ring 0
  for (let mr = 0; mr < macroH; mr++) {
    for (let mc = 0; mc < macroW; mc++) {
      const cell = mc + mr * macroW;
      if (mr === 0 || mr === macroH - 1 || mc === 0 || mc === macroW - 1) {
        for (let t = 0; t < numModules; t++) {
          if (t !== perimIdx) wfc.ban(cell, t);
        }
      } else if (mr === 1 && mc === 1) {
        const t = nameIdx("BORDER_CORNER_NW");
        for (let i = 0; i < numModules; i++) if (i !== t) wfc.ban(cell, i);
      } else if (mr === 1 && mc === macroW - 2) {
        const t = nameIdx("BORDER_CORNER_NE");
        for (let i = 0; i < numModules; i++) if (i !== t) wfc.ban(cell, i);
      } else if (mr === macroH - 2 && mc === 1) {
        const t = nameIdx("BORDER_CORNER_SW");
        for (let i = 0; i < numModules; i++) if (i !== t) wfc.ban(cell, i);
      } else if (mr === macroH - 2 && mc === macroW - 2) {
        const t = nameIdx("BORDER_CORNER_SE");
        for (let i = 0; i < numModules; i++) if (i !== t) wfc.ban(cell, i);
      } else if (mr === 1) {
        const t = nameIdx("BORDER_N");
        for (let i = 0; i < numModules; i++) if (i !== t) wfc.ban(cell, i);
      } else if (mr === macroH - 2) {
        const t = nameIdx("BORDER_S");
        for (let i = 0; i < numModules; i++) if (i !== t) wfc.ban(cell, i);
      } else if (mc === 1) {
        const t = nameIdx("BORDER_W");
        for (let i = 0; i < numModules; i++) if (i !== t) wfc.ban(cell, i);
      } else if (mc === macroW - 2) {
        const t = nameIdx("BORDER_E");
        for (let i = 0; i < numModules; i++) if (i !== t) wfc.ban(cell, i);
      } else {
        // Interior: ban border and perimeter modules
        const borderNames = [
          "PERIMETER_WOODS", "BORDER_N", "BORDER_S", "BORDER_W", "BORDER_E",
          "BORDER_CORNER_NW", "BORDER_CORNER_NE", "BORDER_CORNER_SW", "BORDER_CORNER_SE"
        ];
        for (const bn of borderNames) {
          const idx = nameIdx(bn);
          if (idx >= 0) wfc.ban(cell, idx);
        }
      }
    }
  }

  // Pre-pin core narrative anchors
  const pinCell = (mc: number, mr: number, nm: string) => {
    const cell = mc + mr * macroW;
    const t = nameIdx(nm);
    if (t >= 0) {
      for (let i = 0; i < numModules; i++) {
        if (i !== t) wfc.ban(cell, i);
      }
    }
  };

  pinCell(5, 4, "SANCTUM_CORE");
  pinCell(5, 5, "COURTYARD_PLAZA");
  pinCell(6, 5, "COURTYARD_PLAZA");
  pinCell(5, 6, "COURTYARD_GATE");
  pinCell(10, 9, "VILLAGE_CENTER");

  const macroGrid: number[][] = [];
  for (let r = 0; r < macroH; r++) macroGrid[r] = new Array(macroW).fill(perimIdx);

  // Run WFC collapse preserving pre-pinned border constraints
  const collapsed = wfc.run(seed, -1, false);
  if (collapsed) {
    for (let mr = 0; mr < macroH; mr++) {
      for (let mc = 0; mc < macroW; mc++) {
        const cell = mc + mr * macroW;
        macroGrid[mr][mc] = wfc.observed[cell] >= 0 ? wfc.observed[cell] : nameIdx("GLADE_MEADOW");
      }
    }
  } else {
    // Structured canonical layout adhering to Scene Overview principles
    for (let mr = 0; mr < macroH; mr++) {
      for (let mc = 0; mc < macroW; mc++) {
        if (mr === 0 || mr === macroH - 1 || mc === 0 || mc === macroW - 1) {
          macroGrid[mr][mc] = perimIdx;
        } else if (mr === 1) {
          macroGrid[mr][mc] = nameIdx("BORDER_N");
        } else if (mr === macroH - 2) {
          macroGrid[mr][mc] = nameIdx("BORDER_S");
        } else if (mc === 1) {
          macroGrid[mr][mc] = nameIdx("BORDER_W");
        } else if (mc === macroW - 2) {
          macroGrid[mr][mc] = nameIdx("BORDER_E");
        } else if (mr >= 4 && mr <= 6 && mc >= 4 && mc <= 7) {
          macroGrid[mr][mc] = mr === 4 && mc === 5
            ? nameIdx("SANCTUM_CORE")
            : nameIdx("COURTYARD_PLAZA");
        } else if (mr === 7 && mc >= 4 && mc <= 11) {
          macroGrid[mr][mc] = nameIdx("ROAD_H");
        } else if (mc === 10 && mr >= 7 && mr <= 11) {
          macroGrid[mr][mc] = mr === 9
            ? nameIdx("VILLAGE_CENTER")
            : nameIdx("ROAD_V");
        } else if (mr >= 8 && mr <= 11 && mc >= 9 && mc <= 12) {
          macroGrid[mr][mc] = nameIdx("VILLAGE_GARDEN");
        } else if (mc >= 11 || (mr >= 9 && mc <= 6)) {
          macroGrid[mr][mc] = nameIdx("GLADE_GROVE");
        } else {
          macroGrid[mr][mc] = nameIdx("GLADE_MEADOW");
        }
      }
    }
  }

  // 2. Expand Macro Cells (5x5 tiles each) into Micro 80x80 Grid
  const grid: number[][] = [];
  const boundaries: Boundary[] = [];
  const compoundStructures: CompoundStructure[] = [];
  const trees: CompoundTree[] = [];
  const CHUNK_TILES = 5;

  for (let r = 0; r < rows; r++) {
    grid[r] = new Array(cols).fill(TILE_GRASS_PURE);
  }

  for (let mr = 0; mr < macroH; mr++) {
    for (let mc = 0; mc < macroW; mc++) {
      const modIdx = macroGrid[mr][mc];
      const mod = MACRO_MODULES[modIdx] || MACRO_MODULES[0];
      const rBase = mr * CHUNK_TILES;
      const cBase = mc * CHUNK_TILES;

      for (let lr = 0; lr < CHUNK_TILES; lr++) {
        for (let lc = 0; lc < CHUNK_TILES; lc++) {
          const r = rBase + lr;
          const c = cBase + lc;

          if (mod.biome === "perimeter") {
            grid[r][c] = TILE_PERIMETER_WOODS;
            if (lr % 2 === 0 && lc % 2 === 0) {
              trees.push({
                col: c,
                row: r,
                type: "oak",
                canopySheet: [24, 14],
                trunkSheet: [24 + 40, 14 + 130],
              });
            }
          } else if (mod.biome === "citadel") {
            if (mod.name === "SANCTUM_CORE") {
              if (lr === 0) grid[r][c] = TILE_WALL_COPING_N;
              else if (lr === 4) grid[r][c] = TILE_WALL_COPING_S;
              else if (lc === 0) grid[r][c] = TILE_WALL_COPING_W;
              else if (lc === 4) grid[r][c] = TILE_WALL_COPING_E;
              else grid[r][c] = TILE_CITADEL_FLOOR;
            } else if (mod.name === "COURTYARD_STAIRS") {
              if (lc === 2) grid[r][c] = TILE_STAIRS;
              else if (lr === 0) grid[r][c] = TILE_WALL_COPING_N;
              else if (lr === 4) grid[r][c] = TILE_WALL_COPING_S;
              else grid[r][c] = TILE_CITADEL_FLOOR;
            } else if (mod.name === "CITADEL_WALL_N") {
              grid[r][c] = lr === 0 ? TILE_WALL_COPING_N : TILE_CITADEL_FLOOR;
            } else if (mod.name === "CITADEL_WALL_S") {
              grid[r][c] = lr === 3 ? TILE_WALL_COPING_S : (lr === 4 ? TILE_WALL_FACE : TILE_CITADEL_FLOOR);
            } else if (mod.name === "CITADEL_WALL_W") {
              grid[r][c] = lc === 0 ? TILE_WALL_COPING_W : TILE_CITADEL_FLOOR;
            } else if (mod.name === "CITADEL_WALL_E") {
              grid[r][c] = lc === 4 ? TILE_WALL_COPING_E : TILE_CITADEL_FLOOR;
            } else {
              grid[r][c] = TILE_CITADEL_FLOOR;
            }
          } else if (mod.biome === "road") {
            if (mod.name === "ROAD_H") {
              grid[r][c] = (lr === 2 || lr === 3) ? TILE_ROAD_COBBLESTONE : TILE_GRASS_PURE;
            } else if (mod.name === "ROAD_V") {
              grid[r][c] = (lc === 2 || lc === 3) ? TILE_ROAD_COBBLESTONE : TILE_GRASS_PURE;
            } else if (mod.name === "ROAD_CROSS") {
              grid[r][c] = (lr === 2 || lr === 3 || lc === 2 || lc === 3)
                ? TILE_ROAD_COBBLESTONE
                : TILE_GRASS_PURE;
            } else if (mod.name === "ROAD_CORNER_NE") {
              grid[r][c] = (lr === 2 && lc >= 2) || (lc === 2 && lr <= 2)
                ? TILE_ROAD_COBBLESTONE
                : TILE_GRASS_PURE;
            } else if (mod.name === "ROAD_CORNER_NW") {
              grid[r][c] = (lr === 2 && lc <= 2) || (lc === 2 && lr <= 2)
                ? TILE_ROAD_COBBLESTONE
                : TILE_GRASS_PURE;
            } else if (mod.name === "ROAD_CORNER_SE") {
              grid[r][c] = (lr === 2 && lc >= 2) || (lc === 2 && lr >= 2)
                ? TILE_ROAD_COBBLESTONE
                : TILE_GRASS_PURE;
            } else if (mod.name === "ROAD_CORNER_SW") {
              grid[r][c] = (lr === 2 && lc <= 2) || (lc === 2 && lr >= 2)
                ? TILE_ROAD_COBBLESTONE
                : TILE_GRASS_PURE;
            } else {
              grid[r][c] = (lr === 2 || lc === 2) ? TILE_ROAD_COBBLESTONE : TILE_GRASS_PURE;
            }
          } else if (mod.biome === "village") {
            if (mod.name === "VILLAGE_CENTER") {
              if (lr === 2 || lc === 2) grid[r][c] = TILE_ROAD_COBBLESTONE;
              else grid[r][c] = (lr + lc) % 2 === 0 ? TILE_GRASS_FLOWER_WHITE : TILE_GRASS_PURE;
            } else {
              const f = (r * 13 + c * 29) % 7;
              grid[r][c] = f === 0 ? TILE_GRASS_FLOWER_YELLOW : (f === 1 ? TILE_GRASS_FLOWER_WHITE : TILE_GRASS_PURE);
            }
          } else if (mod.biome === "forest") {
            grid[r][c] = (lr * lc) % 2 === 0 ? TILE_FOREST_GROUND : TILE_GRASS_PURE;
            if (lr === 2 && lc === 2) {
              trees.push({
                col: c,
                row: r,
                type: "oak",
                canopySheet: [24, 14],
                trunkSheet: [24 + 40, 14 + 130],
              });
            }
          } else {
            // Glade Meadow
            const roll = (r * 17 + c * 31) % 11;
            if (roll === 0) grid[r][c] = TILE_GRASS_FLOWER_WHITE;
            else if (roll === 1) grid[r][c] = TILE_GRASS_FLOWER_YELLOW;
            else if (roll in [2, 3]) grid[r][c] = TILE_FOREST_GROUND;
            else grid[r][c] = TILE_GRASS_PURE;
          }
        }
      }

      // Add Chunk-Level Landmark Props based on Scene Overview
      if (mod.name === "SANCTUM_CORE") {
        compoundStructures.push({
          name: "Sacred Sun Altar",
          type: "altar",
          col: cBase + 1,
          row: rBase + 1,
          widthPx: 128,
          heightPx: 96,
          solidBox: { x: (cBase + 1) * tileSize + 16, y: (rBase + 1) * tileSize + 20, w: 96, h: 60 },
        });
      } else if (mod.name === "COURTYARD_PLAZA") {
        if (mr === 5 && mc === 5) {
          compoundStructures.push({
            name: "Praying Maiden Statue",
            type: "statue",
            col: cBase + 1,
            row: rBase + 1,
            widthPx: 48,
            heightPx: 96,
            solidBox: { x: (cBase + 1) * tileSize + 8, y: (rBase + 1) * tileSize + 40, w: 32, h: 50 },
          });
          compoundStructures.push({
            name: "Forgotten Relic Chest",
            type: "chest",
            col: cBase + 3,
            row: rBase + 2,
            widthPx: 48,
            heightPx: 48,
            solidBox: { x: (cBase + 3) * tileSize + 6, y: (rBase + 2) * tileSize + 16, w: 36, h: 28 },
          });
        }
      } else if (mod.name === "VILLAGE_CENTER") {
        compoundStructures.push({
          name: "Silas Thatched Cottage",
          type: "cottage",
          col: cBase,
          row: rBase,
          widthPx: 140,
          heightPx: 110,
          solidBox: { x: cBase * tileSize + 12, y: rBase * tileSize + 40, w: 116, h: 65 },
          cottageIndex: 1,
        });
        compoundStructures.push({
          name: "Well of Whispers",
          type: "well",
          col: cBase + 3,
          row: rBase + 3,
          widthPx: 72,
          heightPx: 72,
          solidBox: { x: (cBase + 3) * tileSize + 8, y: (rBase + 3) * tileSize + 16, w: 56, h: 48 },
        });
        compoundStructures.push({
          name: "Village Rest Bench",
          type: "bench",
          col: cBase + 1,
          row: rBase + 3,
          widthPx: 64,
          heightPx: 48,
          solidBox: { x: (cBase + 1) * tileSize + 4, y: (rBase + 3) * tileSize + 16, w: 56, h: 24 },
        });
      }
    }
  }

  // 3. Collision Boundaries Setup
  // A. Outer Perimeter Woods Boundaries (Blocks walking off map edge)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (r <= 2 || r >= rows - 3 || c <= 2 || c >= cols - 3) {
        boundaries.push(
          new Boundary({
            ctx,
            position: { x: c * tileSize, y: r * tileSize },
            width: tileSize,
            height: tileSize,
          }),
        );
      } else if (
        grid[r][c] === TILE_WALL_COPING_N ||
        grid[r][c] === TILE_WALL_COPING_S ||
        grid[r][c] === TILE_WALL_COPING_W ||
        grid[r][c] === TILE_WALL_COPING_E ||
        grid[r][c] === TILE_WALL_FACE
      ) {
        boundaries.push(
          new Boundary({
            ctx,
            position: { x: c * tileSize, y: r * tileSize + 16 },
            width: tileSize,
            height: tileSize - 16,
          }),
        );
      }
    }
  }

  // B. Compound Structure Boundaries
  for (const struct of compoundStructures) {
    boundaries.push(
      new Boundary({
        ctx,
        position: { x: struct.solidBox.x, y: struct.solidBox.y },
        width: struct.solidBox.w,
        height: struct.solidBox.h,
      }),
    );
  }

  // C. Tree Trunk Boundaries (Firmly rooted trunk base)
  for (const tree of trees) {
    const px = tree.col * tileSize;
    const py = tree.row * tileSize;
    boundaries.push(
      new Boundary({
        ctx,
        position: { x: px + 40, y: py + 140 },
        width: 34,
        height: 25,
      }),
    );
  }

  // 4. Safe Village Spawn Point (Right outside Silas's cottage on the stone path)
  const spawnPoint = {
    x: 51 * tileSize + tileSize / 2,
    y: 47 * tileSize + tileSize / 2,
  };

  // 5. Authentic POI Placements matching the narrative quests and structures
  const pois: InteractablePOI[] = POIS.map((poi, idx) => {
    let px = poi.position.x;
    let py = poi.position.y;

    if (idx === 0) {
      // Elder Oakhaven: Northern Sunken Citadel Altar
      px = 22 * tileSize + 32;
      py = 27 * tileSize + 32;
    } else if (idx === 1) {
      // Echo the Wanderer: Central highway crossroads
      px = 40 * tileSize + 32;
      py = 37 * tileSize + 32;
    } else if (idx === 2) {
      // Silas the Hermit: Village clearing near cottage
      px = 46 * tileSize + 32;
      py = 52 * tileSize + 32;
    } else if (idx === 3) {
      // Captain Joshua: Village Center Fountain / Outpost
      px = 50 * tileSize + 32;
      py = 52 * tileSize + 32;
    } else if (idx === 4) {
      // Sacred Sun Altar (SANCTUM_CORE)
      px = 21 * tileSize + 64;
      py = 26 * tileSize + 48;
    } else if (idx === 5) {
      // Forgotten Relic Chest (COURTYARD_PLAZA)
      px = 28 * tileSize + 24;
      py = 27 * tileSize + 24;
    } else if (idx === 6) {
      // Whispering Waters Basin / Outpost Lookout
      px = 52 * tileSize + 32;
      py = 53 * tileSize + 32;
    } else if (idx === 7) {
      // Well of Whispers (VILLAGE_CENTER)
      px = 48 * tileSize + 36;
      py = 53 * tileSize + 36;
    }

    return {
      ...poi,
      position: { x: px, y: py },
    };
  });

  // 6. Draw Method using Real Cainos Spritesheets & Autotiling
  const draw = (
    c: CanvasRenderingContext2D,
    tilesetObj: Record<string, HTMLImageElement> | HTMLImageElement | null,
    camera: { x: number; y: number },
    viewW: number,
    viewH: number,
    zoom: number,
    animTime: number,
  ) => {
    const imgs = (tilesetObj && typeof tilesetObj === "object" && "grassTileset" in tilesetObj)
      ? (tilesetObj as Record<string, HTMLImageElement>)
      : null;

    const grassImg = imgs?.grassTileset;
    const wallImg = imgs?.wallTileset;
    const structImg = imgs?.structTileset;
    const propsImg = imgs?.propsTileset;
    const plantImg = imgs?.plantTileset;
    const shadowPlantImg = imgs?.shadowPlantTileset;
    const house1 = imgs?.house1;

    // Viewport Culling Bounds
    const halfW = viewW / (2 * zoom);
    const halfH = viewH / (2 * zoom);
    const minCol = Math.max(0, Math.floor((camera.x - halfW) / tileSize) - 1);
    const maxCol = Math.min(cols - 1, Math.ceil((camera.x + halfW) / tileSize) + 1);
    const minRow = Math.max(0, Math.floor((camera.y - halfH) / tileSize) - 1);
    const maxRow = Math.min(rows - 1, Math.ceil((camera.y + halfH) / tileSize) + 1);

    const drawSize = tileSize;

    // Step A: Draw Base Ground Tiles (Real Cainos Pixel Art + Full Autotiling)
    for (let r = minRow; r <= maxRow; r++) {
      for (let col = minCol; col <= maxCol; col++) {
        const px = col * tileSize;
        const py = r * tileSize;
        const tileType = grid[r][col];

        if (tileType === TILE_ROAD_COBBLESTONE) {
          // 4-bit Autotiled Cobblestone Path from tx_grass.png
          if (grassImg && grassImg.complete && grassImg.naturalWidth > 0) {
            const up = r > 0 && (grid[r - 1][col] === TILE_ROAD_COBBLESTONE || grid[r - 1][col] === TILE_STAIRS || grid[r - 1][col] === TILE_CITADEL_FLOOR);
            const dn = r < rows - 1 && (grid[r + 1][col] === TILE_ROAD_COBBLESTONE || grid[r + 1][col] === TILE_STAIRS || grid[r + 1][col] === TILE_CITADEL_FLOOR);
            const lt = col > 0 && (grid[r][col - 1] === TILE_ROAD_COBBLESTONE || grid[r][col - 1] === TILE_CITADEL_FLOOR);
            const rt = col < cols - 1 && (grid[r][col + 1] === TILE_ROAD_COBBLESTONE || grid[r][col + 1] === TILE_CITADEL_FLOOR);

            let sx = 0;
            let sy = 128; // Center cobblestones

            if (!up && dn) {
              if (!lt && rt) { sx = 192; sy = 128; } // NW corner
              else if (lt && !rt) { sx = 224; sy = 128; } // NE corner
              else { sx = 128; sy = 128; } // Top edge
            } else if (up && !dn) {
              if (!lt && rt) { sx = 192; sy = 160; } // SW corner
              else if (lt && !rt) { sx = 224; sy = 160; } // SE corner
              else { sx = 128; sy = 160; } // Bottom edge
            } else if (!lt && rt) {
              sx = 64; sy = 128; // Left edge
            } else if (lt && !rt) {
              sx = 96; sy = 128; // Right edge
            } else if (up && dn && !lt && !rt) {
              sx = 64; sy = 192; // Straight vertical
            } else if (!up && !dn && lt && rt) {
              sx = 128; sy = 128; // Straight horizontal
            }

            c.drawImage(grassImg, sx, sy, 32, 32, px, py, drawSize + 1, drawSize + 1);
          } else {
            c.fillStyle = "#64748b";
            c.fillRect(px, py, drawSize + 1, drawSize + 1);
          }
        } else if (tileType === TILE_CITADEL_FLOOR) {
          // Authentic Overgrown Citadel Ground: Green grass with cobblestone flagstones
          if (grassImg && grassImg.complete && grassImg.naturalWidth > 0) {
            c.drawImage(grassImg, ((r + col) % 3) * 32, 0, 32, 32, px, py, drawSize + 1, drawSize + 1);
            // Overgrown stone pavers from tx_grass.png
            c.drawImage(grassImg, ((r * 7 + col * 13) % 2) * 32, 128, 32, 32, px, py, drawSize + 1, drawSize + 1);
          } else {
            c.fillStyle = "#4d7c0f";
            c.fillRect(px, py, drawSize + 1, drawSize + 1);
          }
        } else if (tileType === TILE_WALL_COPING_N) {
          if (grassImg && grassImg.complete) c.drawImage(grassImg, 0, 0, 32, 32, px, py, drawSize + 1, drawSize + 1);
          if (wallImg && wallImg.complete && wallImg.naturalWidth > 0) {
            c.drawImage(wallImg, 64, 32, 32, 32, px, py, drawSize + 1, drawSize + 1);
          }
        } else if (tileType === TILE_WALL_COPING_S) {
          if (grassImg && grassImg.complete) c.drawImage(grassImg, 0, 0, 32, 32, px, py, drawSize + 1, drawSize + 1);
          if (wallImg && wallImg.complete && wallImg.naturalWidth > 0) {
            c.drawImage(wallImg, 64, 96, 32, 32, px, py, drawSize + 1, drawSize + 1);
          }
        } else if (tileType === TILE_WALL_COPING_W) {
          if (grassImg && grassImg.complete) c.drawImage(grassImg, 0, 0, 32, 32, px, py, drawSize + 1, drawSize + 1);
          if (wallImg && wallImg.complete && wallImg.naturalWidth > 0) {
            c.drawImage(wallImg, 32, 64, 32, 32, px, py, drawSize + 1, drawSize + 1);
          }
        } else if (tileType === TILE_WALL_COPING_E) {
          if (grassImg && grassImg.complete) c.drawImage(grassImg, 0, 0, 32, 32, px, py, drawSize + 1, drawSize + 1);
          if (wallImg && wallImg.complete && wallImg.naturalWidth > 0) {
            c.drawImage(wallImg, 96, 64, 32, 32, px, py, drawSize + 1, drawSize + 1);
          }
        } else if (tileType === TILE_WALL_FACE) {
          if (grassImg && grassImg.complete) c.drawImage(grassImg, 0, 0, 32, 32, px, py, drawSize + 1, drawSize + 1);
          if (wallImg && wallImg.complete && wallImg.naturalWidth > 0) {
            c.drawImage(wallImg, 64, 192, 32, 32, px, py, drawSize + 1, drawSize + 1);
          }
        } else if (tileType === TILE_STAIRS) {
          if (grassImg && grassImg.complete) c.drawImage(grassImg, 0, 0, 32, 32, px, py, drawSize + 1, drawSize + 1);
          if (structImg && structImg.complete && structImg.naturalWidth > 0) {
            c.drawImage(structImg, 64, 64, 32, 32, px, py, drawSize + 1, drawSize + 1);
          }
        } else if (tileType === TILE_PERIMETER_WOODS) {
          // Forest Boundary with ambient canopy shading
          if (grassImg && grassImg.complete && grassImg.naturalWidth > 0) {
            c.drawImage(grassImg, 0, 0, 32, 32, px, py, drawSize + 1, drawSize + 1);
            c.fillStyle = "rgba(15, 23, 42, 0.45)";
            c.fillRect(px, py, drawSize + 1, drawSize + 1);
          }
        } else {
          // Lush Green Meadow Grass with flowers & blades
          if (grassImg && grassImg.complete && grassImg.naturalWidth > 0) {
            let sx = 0;
            let sy = 0;
            if (tileType === TILE_GRASS_FLOWER_WHITE) {
              sx = 128; sy = 0;
            } else if (tileType === TILE_GRASS_FLOWER_YELLOW) {
              sx = 192; sy = 32;
            } else if (tileType === TILE_FOREST_GROUND) {
              sx = 32; sy = 64;
            } else {
              sx = ((r + col) % 3) * 32;
              sy = 0;
            }
            c.drawImage(grassImg, sx, sy, 32, 32, px, py, drawSize + 1, drawSize + 1);
          } else {
            c.fillStyle = "#4d7c0f";
            c.fillRect(px, py, drawSize + 1, drawSize + 1);
          }
        }
      }
    }

    // Step B: Draw Compound Structures & Props from Scene Overview
    for (const struct of compoundStructures) {
      const px = struct.col * tileSize;
      const py = struct.row * tileSize;

      if (px + struct.widthPx < camera.x - halfW || px > camera.x + halfW) continue;
      if (py + struct.heightPx < camera.y - halfH || py > camera.y + halfH) continue;

      if (struct.type === "altar") {
        // Sacred Sun Altar Dias from tx_props.png (cols 11..14, rows 8..10)
        c.fillStyle = "rgba(0, 0, 0, 0.35)";
        c.beginPath();
        c.ellipse(px + struct.widthPx / 2, py + struct.heightPx - 8, struct.widthPx / 2 + 8, 22, 0, 0, Math.PI * 2);
        c.fill();

        if (propsImg && propsImg.complete && propsImg.naturalWidth > 0) {
          c.drawImage(propsImg, 352, 256, 128, 96, px, py, struct.widthPx, struct.heightPx);

          // Animated radiant sun rune pulse
          const pulse = (Math.sin(animTime * 2.5) + 1) * 0.5;
          c.fillStyle = `rgba(250, 204, 21, ${0.25 + pulse * 0.45})`;
          c.beginPath();
          c.arc(px + struct.widthPx / 2, py + struct.heightPx / 2 - 2, 24 + pulse * 6, 0, Math.PI * 2);
          c.fill();
        }
      } else if (struct.type === "cottage") {
        // Silas's Thatched Cottage
        c.fillStyle = "rgba(0, 0, 0, 0.4)";
        c.beginPath();
        c.ellipse(px + struct.widthPx / 2, py + struct.heightPx - 8, struct.widthPx / 2 + 10, 18, 0, 0, Math.PI * 2);
        c.fill();

        if (house1 && house1.complete && house1.naturalWidth > 0) {
          c.drawImage(house1, px, py, struct.widthPx, struct.heightPx);
        }
      } else if (struct.type === "well") {
        // Round Stone Well from tx_props.png (cols 13..14, rows 11..12)
        c.fillStyle = "rgba(0, 0, 0, 0.35)";
        c.beginPath();
        c.ellipse(px + struct.widthPx / 2, py + struct.heightPx - 6, struct.widthPx / 2 + 4, 14, 0, 0, Math.PI * 2);
        c.fill();

        if (propsImg && propsImg.complete && propsImg.naturalWidth > 0) {
          c.drawImage(propsImg, 416, 352, 64, 64, px, py, struct.widthPx, struct.heightPx);
        }
      } else if (struct.type === "statue") {
        // Praying Maiden Statue from tx_props.png (col 14, rows 0..2)
        c.fillStyle = "rgba(0, 0, 0, 0.3)";
        c.beginPath();
        c.ellipse(px + struct.widthPx / 2, py + struct.heightPx - 4, struct.widthPx / 2 + 2, 10, 0, 0, Math.PI * 2);
        c.fill();

        if (propsImg && propsImg.complete && propsImg.naturalWidth > 0) {
          c.drawImage(propsImg, 448, 0, 32, 96, px, py, struct.widthPx, struct.heightPx);
        }
      } else if (struct.type === "bench") {
        // Stone Bench from tx_props.png (cols 9..10, row 0)
        c.fillStyle = "rgba(0, 0, 0, 0.25)";
        c.fillRect(px + 4, py + struct.heightPx - 6, struct.widthPx - 8, 8);

        if (propsImg && propsImg.complete && propsImg.naturalWidth > 0) {
          c.drawImage(propsImg, 288, 0, 64, 64, px, py, struct.widthPx, struct.heightPx);
        }
      } else if (struct.type === "chest") {
        // Forgotten Relic Chest from tx_props.png (col 3, row 1)
        c.fillStyle = "rgba(0, 0, 0, 0.3)";
        c.beginPath();
        c.ellipse(px + struct.widthPx / 2, py + struct.heightPx - 4, struct.widthPx / 2 + 2, 8, 0, 0, Math.PI * 2);
        c.fill();

        if (propsImg && propsImg.complete && propsImg.naturalWidth > 0) {
          const sy = struct.isOpen ? 64 : 32;
          c.drawImage(propsImg, 96, sy, 32, 32, px, py, struct.widthPx, struct.heightPx);
        }
      }
    }

    // Step C: Draw Oak Trees (Full Canopy, Sturdy Rooted Trunk, Soft Drop Shadow)
    for (const tree of trees) {
      const px = tree.col * tileSize;
      const py = tree.row * tileSize;
      const treeW = 114;
      const treeH = 186;

      if (px + treeW < camera.x - halfW || px > camera.x + halfW) continue;
      if (py + treeH < camera.y - halfH || py > camera.y + halfH) continue;

      // 1. Static Drop Shadow firmly grounded under the trunk base
      if (shadowPlantImg && shadowPlantImg.complete && shadowPlantImg.naturalWidth > 0) {
        c.drawImage(shadowPlantImg, 39, 100, 95, 122, px + 10, py + 75, 95, 122);
      } else {
        c.fillStyle = "rgba(0, 0, 0, 0.35)";
        c.beginPath();
        c.ellipse(px + 57, py + 160, 42, 16, 0, 0, Math.PI * 2);
        c.fill();
      }

      // 2. Trunk & Canopy from tx_plant.png (Oak Tree at x=24, y=14)
      if (plantImg && plantImg.complete && plantImg.naturalWidth > 0) {
        const sx = tree.canopySheet[0];
        const sy = tree.canopySheet[1];

        // Draw solid trunk base firmly without skew
        c.drawImage(plantImg, sx + 40, sy + 130, 34, 56, px + 40, py + 130, 34, 56);

        // Draw swaying foliage on top (gentle breeze only on the leaves)
        const windSkew = Math.sin(animTime * 1.8 + tree.col) * 1.5;
        c.save();
        c.translate(px + treeW / 2, py + 130);
        c.transform(1, 0, windSkew * 0.012, 1, 0, 0);
        c.drawImage(plantImg, sx, sy, treeW, 130, -treeW / 2, -130, treeW, 130);
        c.restore();
      }
    }
  };

  // 7. Draw Foreground Environmental Layer (glowing forest spores & solar motes)
  const drawForeground = (
    c: CanvasRenderingContext2D,
    camera: { x: number; y: number },
    viewW: number,
    viewH: number,
    zoom: number,
    animTime: number,
  ) => {
    const halfW = viewW / (2 * zoom);
    const halfH = viewH / (2 * zoom);

    c.fillStyle = "rgba(250, 204, 21, 0.3)";
    for (let p = 0; p < 16; p++) {
      const px = ((camera.x - halfW) + ((animTime * 14 + p * 127) % viewW));
      const py = ((camera.y - halfH) + ((animTime * 8 + p * 83) % viewH));
      c.beginPath();
      c.arc(px, py, 1.8, 0, Math.PI * 2);
      c.fill();
    }
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
    structures: [],
    compoundStructures,
    trees,
    draw,
    drawForeground,
  };
}
