import { type InteractablePOI, POIS } from "./story";
import { Boundary } from "../class";

export interface TilePlacement {
  sheet: "wall" | "struct" | "props" | "plant" | "stone" | "grass";
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  dx: number;
  dy: number;
  dw: number;
  dh: number;
  sway?: boolean;
}

export interface CompoundStructure {
  name: string;
  type:
    | "cottage"
    | "well"
    | "tree"
    | "chest"
    | "barrel"
    | "bench"
    | "monolith"
    | "statue"
    | "altar"
    | "pillar"
    | "boulder"
    | "log"
    | "stump"
    | "bush"
    | "flowers"
    | "waterPump";
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
  type: "altar" | "chest" | "citadel" | "gateway" | "well" | "pond";
  col: number;
  row: number;
  widthTiles: number;
  heightTiles: number;
}

export interface ProceduralMap {
  cols: number;
  rows: number;
  tileSize: number;
  width: number;
  height: number;
  grid: number[][];           // Layer 1: Ground Base (Grass, Deep Water, Highland Grass)
  detailGrid: number[][];     // Layer 2: Ground Detail (Roads, Water Shorelines, Bridge, Flowers)
  cliffGrid: number[][];      // Layer 3: Cliffs, Stone Retaining Walls & Stairs
  structureTiles: TilePlacement[]; // Layer 4: Building walls, doors, windows, props & tree trunks
  overheadTiles: TilePlacement[];  // Layer 5: Overhead roofs, canopies & overhangs (drawForeground)
  collisionGrid: number[][];  // 2D grid: 1025 = solid, 0 = walkable (for A* pathfinding & double-click)
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
    tilesets?: Record<string, HTMLImageElement> | HTMLImageElement | null,
  ) => void;
}

// ── Layer 1: Ground Base Semantic Tiles ─────────────────────────────────────────
export const TILE_GRASS_PURE = 0;
export const TILE_GRASS_FLOWER_YELLOW = 1;
export const TILE_GRASS_FLOWER_WHITE = 2;
export const TILE_FOREST_GROUND = 3;
export const TILE_WATER_DEEP = 18;
export const TILE_HIGHLAND_GRASS = 37;
export const TILE_PERIMETER_WOODS = 17;

// ── Layer 2: Ground Detail Semantic Tiles ──────────────────────────────────────
export const TILE_DETAIL_EMPTY = 0;
export const TILE_ROAD_COBBLESTONE = 4;
export const TILE_WATER_SHORE_N = 19;
export const TILE_WATER_SHORE_S = 20;
export const TILE_WATER_SHORE_W = 21;
export const TILE_WATER_SHORE_E = 22;
export const TILE_WATER_CORNER_NW = 23;
export const TILE_WATER_CORNER_NE = 24;
export const TILE_WATER_CORNER_SW = 25;
export const TILE_WATER_CORNER_SE = 26;
export const TILE_STONE_BRIDGE = 27;

// ── Layer 3: Cliffs, Retaining Walls & Stairs ──────────────────────────────────
export const TILE_CLIFF_NONE = 0;
export const TILE_CLIFF_COPING_H = 28;     // South wall coping (tx_wall.png [64, 96, 32, 32])
export const TILE_CLIFF_CORNER_NW = 29;    // NW wall corner ([384, 32, 32, 32] or [32, 32, 32, 32])
export const TILE_CLIFF_CORNER_NE = 30;    // NE wall corner ([448, 32, 32, 32] or [96, 32, 32, 32])
export const TILE_CLIFF_CORNER_SW = 31;    // SW wall corner coping ([32, 96, 32, 32])
export const TILE_CLIFF_CORNER_SE = 32;    // SE wall corner coping ([96, 96, 32, 32])
export const TILE_CLIFF_FACE_WALL = 33;    // Stone wall face bricks ([64, 128, 32, 32])
export const TILE_CLIFF_STAIRS_L = 34;     // Carved stone stairs left ([32, 160..224] in tx_struct)
export const TILE_CLIFF_STAIRS_C = 35;     // Carved stone stairs center step
export const TILE_CLIFF_STAIRS_R = 36;     // Carved stone stairs right ([64, 160..224] in tx_struct)
export const TILE_CLIFF_PARAPET_N = 38;    // North horizontal parapet ([416, 32, 32, 32])
export const TILE_CLIFF_EDGE_W = 39;       // West vertical parapet ([288, 64, 32, 32])
export const TILE_CLIFF_EDGE_E = 40;       // East vertical parapet ([320, 64, 32, 32])
export const TILE_CLIFF_CORNER_SW_FACE = 41; // SW wall corner brick face ([32, 128, 32, 32])
export const TILE_CLIFF_CORNER_SE_FACE = 42; // SE wall corner brick face ([96, 128, 32, 32])

// ── Layered Map Generator ──────────────────────────────────────────────────────
export function generateProceduralMap(
  initialPOIs: InteractablePOI[],
  worldSeed: number = 42,
): ProceduralMap {
  const cols = 80;
  const rows = 80;
  const tileSize = 64; // 32x32 native Cainos pixel art scaled 2x to 64x64

  // Initialize Discrete Tile Grids
  const grid: number[][] = Array.from({ length: rows }, () => new Array(cols).fill(TILE_GRASS_PURE));
  const detailGrid: number[][] = Array.from({ length: rows }, () => new Array(cols).fill(TILE_DETAIL_EMPTY));
  const cliffGrid: number[][] = Array.from({ length: rows }, () => new Array(cols).fill(TILE_CLIFF_NONE));
  const collisionGrid: number[][] = Array.from({ length: rows }, () => new Array(cols).fill(0));

  // 1. Natural Wildflower Scatter on Ground Layer
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const hash = Math.sin(r * 12.9898 + c * 78.233 + worldSeed) * 43758.5453;
      const rnd = hash - Math.floor(hash);
      if (rnd < 0.12) grid[r][c] = TILE_GRASS_FLOWER_YELLOW;
      else if (rnd < 0.22) grid[r][c] = TILE_GRASS_FLOWER_WHITE;
      else if (rnd < 0.28) grid[r][c] = TILE_FOREST_GROUND;
    }
  }

  // 2. Dense Perimeter Woods (Natural Boundary Border)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (r < 5 || r >= rows - 5 || c < 5 || c >= cols - 5) {
        grid[r][c] = TILE_PERIMETER_WOODS;
        collisionGrid[r][c] = 1025;
      }
    }
  }

  // 3. Whispering Lake & Crystal Creek River System (Natural Water Body)
  // Lake Basin: centered at cols 10..22, rows 26..36
  const lakeCenterCol = 16;
  const lakeCenterRow = 31;
  const lakeRadiusCol = 6;
  const lakeRadiusRow = 5;

  for (let r = 24; r <= 38; r++) {
    for (let c = 8; c <= 24; c++) {
      const normDist =
        Math.pow((c - lakeCenterCol) / lakeRadiusCol, 2) +
        Math.pow((r - lakeCenterRow) / lakeRadiusRow, 2);

      if (normDist <= 1.0) {
        grid[r][c] = TILE_WATER_DEEP;
        collisionGrid[r][c] = 1025;
      } else if (normDist <= 1.35) {
        if (r < lakeCenterRow - 2 && c < lakeCenterCol - 2) detailGrid[r][c] = TILE_WATER_CORNER_NW;
        else if (r < lakeCenterRow - 2 && c > lakeCenterCol + 2) detailGrid[r][c] = TILE_WATER_CORNER_NE;
        else if (r > lakeCenterRow + 2 && c < lakeCenterCol - 2) detailGrid[r][c] = TILE_WATER_CORNER_SW;
        else if (r > lakeCenterRow + 2 && c > lakeCenterCol + 2) detailGrid[r][c] = TILE_WATER_CORNER_SE;
        else if (r < lakeCenterRow) detailGrid[r][c] = TILE_WATER_SHORE_N;
        else if (r > lakeCenterRow) detailGrid[r][c] = TILE_WATER_SHORE_S;
        else if (c < lakeCenterCol) detailGrid[r][c] = TILE_WATER_SHORE_W;
        else detailGrid[r][c] = TILE_WATER_SHORE_E;
      }
    }
  }

  // Crystal Creek River: flows east from Lake across cols 22..58 along rows 30..32
  for (let c = 22; c <= 58; c++) {
    const riverRow = Math.round(31 + Math.sin(c * 0.25) * 1.5);
    for (let dr = -1; dr <= 1; dr++) {
      const r = riverRow + dr;
      if (r >= 0 && r < rows) {
        grid[r][c] = TILE_WATER_DEEP;
        collisionGrid[r][c] = 1025;

        if (dr === -1) detailGrid[r][c] = TILE_WATER_SHORE_N;
        else if (dr === 1) detailGrid[r][c] = TILE_WATER_SHORE_S;
      }
    }
  }

  // 4. Cobblestone King's Highway Road Network
  // North-South Highway: col 40 (rows 8..72)
  for (let r = 8; r <= 70; r++) {
    for (let dc = -1; dc <= 1; dc++) {
      const c = 40 + dc;
      if (c >= 0 && c < cols) {
        detailGrid[r][c] = TILE_ROAD_COBBLESTONE;
        if (grid[r][c] !== TILE_WATER_DEEP) collisionGrid[r][c] = 0;
      }
    }
  }

  // East-West Village Crossway: row 44 (cols 12..68)
  for (let c = 12; c <= 68; c++) {
    for (let dr = -1; dr <= 1; dr++) {
      const r = 44 + dr;
      if (r >= 0 && r < rows) {
        detailGrid[r][c] = TILE_ROAD_COBBLESTONE;
        if (grid[r][c] !== TILE_WATER_DEEP) collisionGrid[r][c] = 0;
      }
    }
  }

  // Branch road leading up to the Uphill Plateau Stairs
  for (let r = 24; r <= 44; r++) {
    for (let dc = 0; dc <= 1; dc++) {
      const c = 52 + dc;
      detailGrid[r][c] = TILE_ROAD_COBBLESTONE;
      if (grid[r][c] !== TILE_WATER_DEEP) collisionGrid[r][c] = 0;
    }
  }

  // 5. Arched Stone Bridge across Crystal Creek River (Col 39..41, Row 29..33)
  for (let r = 29; r <= 33; r++) {
    for (let c = 39; c <= 41; c++) {
      detailGrid[r][c] = TILE_STONE_BRIDGE;
      collisionGrid[r][c] = 0; // Bridge deck is open and walkable across water
    }
  }

  // 6. Uphill Highland Plateau & Carved Stone Stairs (Cainos Authentic 2.5D Elevation)
  // Plateau Region: cols 44..62, rows 10..22
  const hillMinCol = 44;
  const hillMaxCol = 62;
  const hillMinRow = 10;
  const hillMaxRow = 22;

  // Fill Plateau Surface with Highland Grass on Ground Layer
  for (let r = hillMinRow; r <= hillMaxRow; r++) {
    for (let c = hillMinCol; c <= hillMaxCol; c++) {
      grid[r][c] = TILE_HIGHLAND_GRASS;
    }
  }

  // North Parapet of Uphill Plateau (Row 10)
  cliffGrid[hillMinRow][hillMinCol] = TILE_CLIFF_CORNER_NW;
  collisionGrid[hillMinRow][hillMinCol] = 1025;
  for (let c = hillMinCol + 1; c < hillMaxCol; c++) {
    cliffGrid[hillMinRow][c] = TILE_CLIFF_PARAPET_N;
    collisionGrid[hillMinRow][c] = 1025;
  }
  cliffGrid[hillMinRow][hillMaxCol] = TILE_CLIFF_CORNER_NE;
  collisionGrid[hillMinRow][hillMaxCol] = 1025;

  // West & East Wall Parapets (Rows 11..20)
  for (let r = hillMinRow + 1; r < hillMaxRow - 1; r++) {
    cliffGrid[r][hillMinCol] = TILE_CLIFF_EDGE_W;
    collisionGrid[r][hillMinCol] = 1025;
    cliffGrid[r][hillMaxCol] = TILE_CLIFF_EDGE_E;
    collisionGrid[r][hillMaxCol] = 1025;
  }

  // South Retaining Wall & Central Carved Stone Stairs (Rows 21..22)
  // Row 21: Upper Coping Row
  cliffGrid[21][hillMinCol] = TILE_CLIFF_CORNER_SW; // SW corner coping
  collisionGrid[21][hillMinCol] = 1025;

  for (let c = hillMinCol + 1; c <= 51; c++) {
    cliffGrid[21][c] = TILE_CLIFF_COPING_H;
    collisionGrid[21][c] = 1025;
  }

  // Stairs at Cols 52..53: Top steps (walkable!)
  cliffGrid[21][52] = TILE_CLIFF_STAIRS_L;
  collisionGrid[21][52] = 0;
  cliffGrid[21][53] = 0; // Or TILE_CLIFF_STAIRS_R;
  cliffGrid[21][53] = TILE_CLIFF_STAIRS_R;
  collisionGrid[21][53] = 0;

  for (let c = 54; c < hillMaxCol; c++) {
    cliffGrid[21][c] = TILE_CLIFF_COPING_H;
    collisionGrid[21][c] = 1025;
  }
  cliffGrid[21][hillMaxCol] = TILE_CLIFF_CORNER_SE; // SE corner coping
  collisionGrid[21][hillMaxCol] = 1025;

  // Row 22: Lower Brick Wall Face Row
  cliffGrid[22][hillMinCol] = TILE_CLIFF_CORNER_SW_FACE; // SW corner face
  collisionGrid[22][hillMinCol] = 1025;

  for (let c = hillMinCol + 1; c <= 51; c++) {
    cliffGrid[22][c] = TILE_CLIFF_FACE_WALL;
    collisionGrid[22][c] = 1025;
  }

  // Stairs at Cols 52..53: Bottom steps (walkable!)
  cliffGrid[22][52] = TILE_CLIFF_STAIRS_L;
  collisionGrid[22][52] = 0;
  cliffGrid[22][53] = TILE_CLIFF_STAIRS_R;
  collisionGrid[22][53] = 0;

  for (let c = 54; c < hillMaxCol; c++) {
    cliffGrid[22][c] = TILE_CLIFF_FACE_WALL;
    collisionGrid[22][c] = 1025;
  }
  cliffGrid[22][hillMaxCol] = TILE_CLIFF_CORNER_SE_FACE; // SE corner face
  collisionGrid[22][hillMaxCol] = 1025;

  // Clear walkable stair approach & terrace exit corridor
  collisionGrid[20][52] = 0;
  collisionGrid[20][53] = 0;
  collisionGrid[23][52] = 0;
  collisionGrid[23][53] = 0;

  // 7. Structure & Overhead Tile Placements (Layer 4 & 5)
  // Everything is composed purely from transparent tilesets (tx_wall, tx_struct, tx_props, tx_plant)
  const structureTiles: TilePlacement[] = [];
  const overheadTiles: TilePlacement[] = [];

  // Helper to add a tile to Layer 4
  const addStructTile = (
    sheet: TilePlacement["sheet"],
    sx: number,
    sy: number,
    col: number,
    row: number,
    sw: number = 32,
    sh: number = 32,
    dw: number = tileSize,
    dh: number = tileSize,
  ) => {
    structureTiles.push({
      sheet,
      sx,
      sy,
      sw,
      sh,
      dx: col * tileSize,
      dy: row * tileSize,
      dw,
      dh,
    });
  };

  // Helper to add a tile to Layer 5 (overhead / drawForeground)
  const addOverheadTile = (
    sheet: TilePlacement["sheet"],
    sx: number,
    sy: number,
    col: number,
    row: number,
    sw: number = 32,
    sh: number = 32,
    dw: number = tileSize,
    dh: number = tileSize,
    sway: boolean = false,
  ) => {
    overheadTiles.push({
      sheet,
      sx,
      sy,
      sw,
      sh,
      dx: col * tileSize,
      dy: row * tileSize,
      dw,
      dh,
      sway,
    });
  };

  // ── BUILD TOWNHALL MANOR (Cols 37..42, Rows 42..45) ──
  // Layer 4: Foundation, Ashlar Stone Walls, Windows & Grand Arched Entrance
  // Row 45: Foundation & Entrances
  addStructTile("wall", 32, 96, 37, 45); // Left stone quoin corner
  addStructTile("wall", 64, 96, 38, 45); // Ashlar stone wall
  addStructTile("struct", 64, 416, 39, 45); // Arched wooden door (left)
  addStructTile("struct", 96, 416, 40, 45); // Arched wooden door (right)
  addStructTile("wall", 64, 64, 41, 45); // Leaded glass window wall
  addStructTile("wall", 96, 96, 42, 45); // Right stone quoin corner

  // Row 44: Mid Wall & Upper Windows
  addStructTile("wall", 32, 64, 37, 44);
  addStructTile("wall", 64, 64, 38, 44); // Stained glass window
  addStructTile("struct", 64, 384, 39, 44); // Archway top left
  addStructTile("struct", 96, 384, 40, 44); // Archway top right
  addStructTile("wall", 64, 64, 41, 44); // Stained glass window
  addStructTile("wall", 96, 64, 42, 44);

  // Row 43: Cornice & Corbel Trim
  for (let c = 37; c <= 42; c++) {
    addStructTile("wall", 64, 32, c, 43);
  }

  // Layer 5: Overhead Gabled Slate Roof
  // Row 43: Eaves Overhang
  addOverheadTile("struct", 32, 160, 37, 43); // Left roof eave
  for (let c = 38; c <= 41; c++) {
    addOverheadTile("struct", 64, 160, c, 43);
  }
  addOverheadTile("struct", 128, 160, 42, 43); // Right roof eave

  // Row 42: Upper Slate Roof
  addOverheadTile("struct", 32, 144, 37, 42);
  for (let c = 38; c <= 41; c++) {
    addOverheadTile("struct", 64, 144, c, 42);
  }
  addOverheadTile("struct", 128, 144, 42, 42);

  // Row 41: Slate Roof Ridge & Stone Chimney
  addOverheadTile("struct", 32, 128, 37, 41);
  addOverheadTile("struct", 64, 128, 38, 41);
  addOverheadTile("struct", 64, 128, 39, 41);
  addOverheadTile("struct", 64, 128, 40, 41);
  addOverheadTile("wall", 64, 0, 41, 41); // Stone Chimney
  addOverheadTile("struct", 128, 128, 42, 41);

  // ── BUILD HARBOR OUTPOST GUARDHOUSE (Cols 30..33, Rows 44..46) ──
  // Layer 4: Fortified Stone Wall & Oak Door
  addStructTile("wall", 32, 192, 30, 46);
  addStructTile("struct", 64, 96, 31, 46); // Reinforced Oak Door
  addStructTile("wall", 64, 192, 32, 46); // Arrow Slit Wall
  addStructTile("wall", 96, 192, 33, 46);

  addStructTile("wall", 32, 192, 30, 45);
  addStructTile("wall", 64, 192, 31, 45);
  addStructTile("wall", 64, 192, 32, 45);
  addStructTile("wall", 96, 192, 33, 45);

  // Layer 5: Overhead Stone Crenellated Battlements
  for (let c = 30; c <= 33; c++) {
    addOverheadTile("wall", 64, 0, c, 44);
  }

  // ── BUILD SILAS'S WOODLAND TIMBER COTTAGE (Cols 46..49, Rows 45..47) ──
  // Layer 4: Timber Walls & Wooden Door
  addStructTile("struct", 32, 64, 46, 47);
  addStructTile("struct", 64, 96, 47, 47); // Cottage Wooden Door
  addStructTile("struct", 64, 64, 48, 47); // Cozy Cottage Window
  addStructTile("struct", 96, 64, 49, 47);

  for (let c = 46; c <= 49; c++) {
    addStructTile("struct", 64, 64, c, 46);
  }

  // Layer 5: Overhead Shingle Roof
  addOverheadTile("struct", 32, 160, 46, 45);
  addOverheadTile("struct", 64, 160, 47, 45);
  addOverheadTile("struct", 64, 160, 48, 45);
  addOverheadTile("struct", 128, 160, 49, 45);

  addOverheadTile("struct", 32, 128, 46, 44);
  addOverheadTile("struct", 64, 128, 47, 44);
  addOverheadTile("struct", 64, 128, 48, 44);
  addOverheadTile("struct", 128, 128, 49, 44);

  // ── BUILD HIGHLAND SACRED SUN ALTAR (Cols 52..54, Rows 14..15) ──
  // Authentic Circular Rune Stone Altar from tx_props.png (sx:340, sy:266, sw:107, sh:94)
  addStructTile("props", 340, 266, 52, 14, 107, 94, tileSize * 2.4, tileSize * 2.1);
  // Flanking Monolith Pillars
  addStructTile("struct", 416, 0, 50, 14, 32, 64, tileSize, tileSize * 1.5);
  addStructTile("struct", 416, 0, 55, 14, 32, 64, tileSize, tileSize * 1.5);

  // ── BUILD WHISPERING LAKE WOODEN DOCK (Cols 24..26, Row 32) ──
  for (let c = 24; c <= 26; c++) {
    addStructTile("struct", 32, 32, c, 32);
  }
  // Mooring Bollards & Dock Post
  addStructTile("props", 96, 0, 26, 32, 32, 32, 48, 48);

  // ── VILLAGE PROPS ON LAYER 4 ──
  // Ancient Carved Stone Well (Col 35, Row 48 - from tx_props.png sx:420, sy:359, sw:55, sh:49)
  addStructTile("props", 420, 359, 35, 48, 55, 49, tileSize * 1.1, tileSize * 1.0);
  // Town Water Pump & Trough (Col 44, Row 48)
  addStructTile("props", 96, 0, 44, 48, 32, 64, 48, 64);
  // Forgotten Relic Chest on Highland Terrace (Col 57, Row 16)
  addStructTile("props", 96, 32, 57, 16, 32, 32, 48, 48);
  // Market Barrels & Produce Crates (Col 43, Row 47)
  addStructTile("props", 32, 0, 43, 47, 32, 64, 48, 56);
  // Town Square Carved Stone Benches (Col 40, Row 47)
  addStructTile("props", 288, 0, 40, 47, 64, 64, 64, 48);

  // Compound Structures metadata for POI interactions and Radar HUD
  const compoundStructures: CompoundStructure[] = [
    {
      name: "Oakhaven Town Hall Manor",
      type: "cottage",
      cottageIndex: 0,
      col: 37,
      row: 42,
      widthPx: 6 * tileSize,
      heightPx: 4 * tileSize,
      solidBox: { x: 37 * tileSize + 10, y: 44 * tileSize + 10, w: 6 * tileSize - 20, h: 2 * tileSize - 10 },
    },
    {
      name: "Harbor Outpost Guardhouse",
      type: "cottage",
      cottageIndex: 1,
      col: 30,
      row: 44,
      widthPx: 4 * tileSize,
      heightPx: 3 * tileSize,
      solidBox: { x: 30 * tileSize + 8, y: 45 * tileSize + 10, w: 4 * tileSize - 16, h: 2 * tileSize - 10 },
    },
    {
      name: "Silas's Timber Cottage",
      type: "cottage",
      cottageIndex: 3,
      col: 46,
      row: 45,
      widthPx: 4 * tileSize,
      heightPx: 3 * tileSize,
      solidBox: { x: 46 * tileSize + 8, y: 46 * tileSize + 10, w: 4 * tileSize - 16, h: 2 * tileSize - 10 },
    },
    {
      name: "Sacred Sun Altar",
      type: "altar",
      col: 52,
      row: 14,
      widthPx: 4 * tileSize,
      heightPx: 2 * tileSize,
      solidBox: { x: 52 * tileSize + 16, y: 14 * tileSize + 20, w: 3 * tileSize, h: tileSize },
    },
    {
      name: "Town Water Pump & Trough",
      type: "waterPump",
      col: 44,
      row: 48,
      widthPx: tileSize,
      heightPx: tileSize,
      solidBox: { x: 44 * tileSize + 8, y: 48 * tileSize + 12, w: 48, h: 48 },
    },
    {
      name: "Well of Whispers",
      type: "well",
      col: 35,
      row: 48,
      widthPx: tileSize,
      heightPx: tileSize,
      solidBox: { x: 35 * tileSize + 8, y: 48 * tileSize + 12, w: 48, h: 48 },
    },
    {
      name: "Highland Relic Chest",
      type: "chest",
      col: 57,
      row: 16,
      widthPx: tileSize,
      heightPx: tileSize,
      solidBox: { x: 57 * tileSize + 8, y: 16 * tileSize + 12, w: 36, h: 36 },
    },
    {
      name: "Town Square Bench",
      type: "bench",
      col: 40,
      row: 47,
      widthPx: tileSize,
      heightPx: tileSize,
      solidBox: { x: 40 * tileSize + 4, y: 47 * tileSize + 10, w: 56, h: 32 },
    },
    {
      name: "Market Crates & Barrels",
      type: "barrel",
      col: 43,
      row: 47,
      widthPx: tileSize,
      heightPx: tileSize,
      solidBox: { x: 43 * tileSize + 6, y: 47 * tileSize + 12, w: 44, h: 36 },
    },
    {
      name: "Whispering Lake Dock",
      type: "bench",
      col: 24,
      row: 32,
      widthPx: 3 * tileSize,
      heightPx: tileSize,
      solidBox: { x: 24 * tileSize + 8, y: 32 * tileSize + 8, w: 3 * tileSize - 16, h: tileSize - 16 },
    },
  ];

  // Apply compound structure collision boxes to collisionGrid
  for (const s of compoundStructures) {
    const sc = Math.floor(s.solidBox.x / tileSize);
    const sr = Math.floor(s.solidBox.y / tileSize);
    const ec = Math.floor((s.solidBox.x + s.solidBox.w - 1) / tileSize);
    const er = Math.floor((s.solidBox.y + s.solidBox.h - 1) / tileSize);
    for (let r = sr; r <= er; r++) {
      for (let c = sc; c <= ec; c++) {
        if (r >= 0 && r < rows && c >= 0 && c < cols) {
          collisionGrid[r][c] = 1025;
        }
      }
    }
  }

  // 8. Individual Forest Trees & Nature Props
  const trees: CompoundTree[] = [];
  const treePositions = [
    // Groves on Highland Terrace
    { col: 46, row: 13, type: "oak" as const },
    { col: 59, row: 13, type: "pine" as const },
    { col: 48, row: 18, type: "autumn" as const },
    { col: 58, row: 19, type: "oak" as const },
    // Whispering Forest Grove
    { col: 26, row: 16, type: "oak" as const },
    { col: 30, row: 14, type: "pine" as const },
    { col: 28, row: 20, type: "autumn" as const },
    { col: 34, row: 18, type: "oak" as const },
    // Lakeside Weeping Willows
    { col: 12, row: 22, type: "oak" as const },
    { col: 20, row: 22, type: "oak" as const },
    { col: 10, row: 38, type: "pine" as const },
    { col: 22, row: 38, type: "autumn" as const },
    // Town Border Trees
    { col: 28, row: 46, type: "autumn" as const },
    { col: 52, row: 46, type: "pine" as const },
    { col: 36, row: 52, type: "oak" as const },
    { col: 44, row: 53, type: "autumn" as const },
  ];

  for (const t of treePositions) {
    trees.push({
      col: t.col,
      row: t.row,
      type: t.type,
      canopySheet: t.type === "pine" ? [160, 0] : t.type === "autumn" ? [288, 32] : [32, 0],
      trunkSheet: t.type === "pine" ? [192, 128] : t.type === "autumn" ? [320, 128] : [64, 128],
    });

    // Trunk base blocks movement
    if (t.row >= 0 && t.row < rows && t.col >= 0 && t.col < cols) {
      collisionGrid[t.row][t.col] = 1025;
    }

    // Add Tree Trunk on Layer 4
    const trunkSx = t.type === "pine" ? 192 : t.type === "autumn" ? 320 : 64;
    addStructTile("plant", trunkSx, 128, t.col, t.row, 32, 32, 36, 40);

    // Add Tree Canopy on Layer 5 (swaying foliage overhead)
    const canopySx = t.type === "pine" ? 160 : t.type === "autumn" ? 288 : 32;
    const canopySy = t.type === "autumn" ? 32 : 0;
    const canopySh = t.type === "autumn" ? 96 : 128;
    addOverheadTile(
      "plant",
      canopySx,
      canopySy,
      t.col - 0.25,
      t.row - 1.25,
      96,
      canopySh,
      96,
      128,
      true, // gentle wind sway
    );
  }

  // 9. Generate Exact Collision Boundaries for Physics Engine
  const boundaries: Boundary[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (collisionGrid[r][c] === 1025) {
        boundaries.push(
          new Boundary({
            position: { x: c * tileSize, y: r * tileSize },
            width: tileSize,
            height: tileSize,
          }),
        );
      }
    }
  }

  // 10. Spawn Point (South King's Highway entering Oakhaven Town Plaza)
  const spawnPoint = {
    x: 40 * tileSize + 32,
    y: 50 * tileSize + 32,
  };

  // 11. Wire POIs to exact physical landmarks
  const pois: InteractablePOI[] = initialPOIs.map((poi, idx) => {
    let px = spawnPoint.x;
    let py = spawnPoint.y;

    if (idx === 0) {
      // Elder Oakhaven: Townhall Manor Porch
      px = 39 * tileSize + 20;
      py = 46 * tileSize + 20;
    } else if (idx === 1) {
      // Echo the Wanderer: Arched Stone Bridge Lookout
      px = 40 * tileSize + 32;
      py = 31 * tileSize + 32;
    } else if (idx === 2) {
      // Silas the Hermit: Silas's Timber Cottage
      px = 48 * tileSize + 20;
      py = 47 * tileSize + 40;
    } else if (idx === 3) {
      // Captain Joshua: Harbor Outpost
      px = 31 * tileSize + 32;
      py = 47 * tileSize + 32;
    } else if (idx === 4) {
      // Sacred Sun Altar (Highland Terrace)
      px = 53 * tileSize + 48;
      py = 15 * tileSize + 32;
    } else if (idx === 5) {
      // Highland Relic Chest
      px = 57 * tileSize + 24;
      py = 16 * tileSize + 24;
    } else if (idx === 6) {
      // Whispering Lake Dock Lookout
      px = 25 * tileSize + 32;
      py = 32 * tileSize + 32;
    } else if (idx === 7) {
      // Well of Whispers
      px = 35 * tileSize + 32;
      py = 48 * tileSize + 32;
    }

    return {
      ...poi,
      position: { x: px, y: py },
    };
  });

  // Helper to draw a TilePlacement
  const drawTileItem = (
    c: CanvasRenderingContext2D,
    t: TilePlacement,
    imgs: Record<string, HTMLImageElement> | null,
    animTime: number,
  ) => {
    if (!imgs) return;
    const img =
      t.sheet === "wall" ? imgs.wallTileset :
      t.sheet === "struct" ? imgs.structTileset :
      t.sheet === "props" ? imgs.propsTileset :
      t.sheet === "plant" ? imgs.plantTileset :
      t.sheet === "stone" ? imgs.stoneTileset :
      imgs.grassTileset;

    if (!img || !img.complete || img.naturalWidth === 0) return;

    if (t.sway) {
      const sway = Math.sin(animTime * 1.5 + t.dx * 0.02) * 2;
      c.drawImage(img, t.sx, t.sy, t.sw, t.sh, t.dx + sway, t.dy, t.dw, t.dh);
    } else {
      c.drawImage(img, t.sx, t.sy, t.sw, t.sh, t.dx, t.dy, t.dw, t.dh);
    }
  };

  // 12. Multi-Layer Draw Engine
  const draw = (
    c: CanvasRenderingContext2D,
    tilesetObj: Record<string, HTMLImageElement> | HTMLImageElement | null,
    camera: { x: number; y: number },
    viewW: number,
    viewH: number,
    zoom: number,
    animTime: number,
  ) => {
    const imgs =
      tilesetObj && typeof tilesetObj === "object" && "grassTileset" in tilesetObj
        ? (tilesetObj as Record<string, HTMLImageElement>)
        : null;

    if (imgs) {
      (window as unknown as { __tilesetCache?: Record<string, HTMLImageElement> }).__tilesetCache = imgs;
    }

    const grassImg = imgs?.grassTileset;
    const stoneImg = imgs?.stoneTileset;
    const wallImg = imgs?.wallTileset;
    const structImg = imgs?.structTileset;
    const waterImg = imgs?.waterTileset;

    // Viewport Culling Bounds
    const halfW = viewW / (2 * zoom);
    const halfH = viewH / (2 * zoom);
    const minCol = Math.max(0, Math.floor((camera.x - halfW) / tileSize) - 1);
    const maxCol = Math.min(cols - 1, Math.ceil((camera.x + halfW) / tileSize) + 1);
    const minRow = Math.max(0, Math.floor((camera.y - halfH) / tileSize) - 1);
    const maxRow = Math.min(rows - 1, Math.ceil((camera.y + halfH) / tileSize) + 1);

    // ─────────────────────────────────────────────────────────────────────────
    // LAYER 1: GROUND BASE (Grass, Deep Water, Highland Plateau)
    // ─────────────────────────────────────────────────────────────────────────
    for (let r = minRow; r <= maxRow; r++) {
      for (let col = minCol; col <= maxCol; col++) {
        const px = col * tileSize;
        const py = r * tileSize;
        const tileType = grid[r][col];

        if (tileType === TILE_WATER_DEEP) {
          // Deep crystalline water with smooth specular shimmer
          const shimmer = Math.sin(animTime * 2.8 + col * 0.6 + r * 0.4) * 0.5 + 0.5;
          if (waterImg && waterImg.complete) {
            c.drawImage(waterImg, 16, 144, 16, 16, px, py, tileSize + 1, tileSize + 1);
            c.fillStyle = `rgba(2, ${Math.round(110 + shimmer * 30)}, ${Math.round(180 + shimmer * 25)}, 0.4)`;
            c.fillRect(px, py, tileSize + 1, tileSize + 1);
          } else {
            c.fillStyle = `rgb(2, ${Math.round(110 + shimmer * 30)}, ${Math.round(180 + shimmer * 25)})`;
            c.fillRect(px, py, tileSize + 1, tileSize + 1);
          }

          // Water ripple specular light lines
          c.fillStyle = `rgba(186, 230, 253, ${0.12 + shimmer * 0.22})`;
          c.fillRect(px + 4, py + 12 + shimmer * 10, tileSize - 8, 3);
          c.fillRect(px + 12, py + 34 - shimmer * 8, tileSize - 24, 2);
        } else if (tileType === TILE_HIGHLAND_GRASS) {
          // Highland Plateau Emerald Meadow
          if (grassImg && grassImg.complete) {
            c.drawImage(grassImg, 0, 0, 32, 32, px, py, tileSize + 1, tileSize + 1);
            c.fillStyle = "rgba(16, 185, 129, 0.08)";
            c.fillRect(px, py, tileSize + 1, tileSize + 1);
          } else {
            c.fillStyle = "#15803d";
            c.fillRect(px, py, tileSize + 1, tileSize + 1);
          }
        } else if (tileType === TILE_PERIMETER_WOODS) {
          // Dense Ancient Border Forest
          if (grassImg && grassImg.complete) {
            c.drawImage(grassImg, 96, 0, 32, 32, px, py, tileSize + 1, tileSize + 1);
          } else {
            c.fillStyle = "#064e3b";
            c.fillRect(px, py, tileSize + 1, tileSize + 1);
          }
        } else if (tileType === TILE_GRASS_FLOWER_YELLOW) {
          if (grassImg && grassImg.complete) {
            c.drawImage(grassImg, 32, 0, 32, 32, px, py, tileSize + 1, tileSize + 1);
          } else {
            c.fillStyle = "#22c55e";
            c.fillRect(px, py, tileSize + 1, tileSize + 1);
          }
        } else if (tileType === TILE_GRASS_FLOWER_WHITE) {
          if (grassImg && grassImg.complete) {
            c.drawImage(grassImg, 64, 0, 32, 32, px, py, tileSize + 1, tileSize + 1);
          } else {
            c.fillStyle = "#22c55e";
            c.fillRect(px, py, tileSize + 1, tileSize + 1);
          }
        } else {
          // Pure Lush Green Grass
          if (grassImg && grassImg.complete) {
            c.drawImage(grassImg, 0, 0, 32, 32, px, py, tileSize + 1, tileSize + 1);
          } else {
            c.fillStyle = "#22c55e";
            c.fillRect(px, py, tileSize + 1, tileSize + 1);
          }
        }
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LAYER 2: GROUND DETAIL & SHORELINES (Roads, Transparent Water Banks, Bridge)
    // ─────────────────────────────────────────────────────────────────────────
    for (let r = minRow; r <= maxRow; r++) {
      for (let col = minCol; col <= maxCol; col++) {
        const px = col * tileSize;
        const py = r * tileSize;
        const detail = detailGrid[r][col];

        if (detail === TILE_ROAD_COBBLESTONE) {
          // Authentic Cobblestone King's Highway
          if (stoneImg && stoneImg.complete) {
            c.drawImage(stoneImg, 0, 0, 32, 32, px, py, tileSize + 1, tileSize + 1);
          } else {
            c.fillStyle = "#d97706";
            c.fillRect(px, py, tileSize + 1, tileSize + 1);
          }
        } else if (detail === TILE_STONE_BRIDGE) {
          // Arched Stone Bridge Deck
          if (stoneImg && stoneImg.complete) {
            c.drawImage(stoneImg, 32, 0, 32, 32, px, py, tileSize + 1, tileSize + 1);
            // Stone bridge parapets
            c.fillStyle = "rgba(71, 85, 105, 0.9)";
            c.fillRect(px, py, 6, tileSize);
            c.fillRect(px + tileSize - 6, py, 6, tileSize);
          }
        } else if (detail >= TILE_WATER_SHORE_N && detail <= TILE_WATER_CORNER_SE) {
          // Organic shoreline bank autotiles from waterTileset if available
          if (waterImg && waterImg.complete) {
            if (detail === TILE_WATER_SHORE_N) c.drawImage(waterImg, 16, 128, 16, 16, px, py, tileSize + 1, tileSize + 1);
            else if (detail === TILE_WATER_SHORE_S) c.drawImage(waterImg, 16, 176, 16, 16, px, py, tileSize + 1, tileSize + 1);
            else if (detail === TILE_WATER_SHORE_W) c.drawImage(waterImg, 0, 144, 16, 16, px, py, tileSize + 1, tileSize + 1);
            else if (detail === TILE_WATER_SHORE_E) c.drawImage(waterImg, 48, 144, 16, 16, px, py, tileSize + 1, tileSize + 1);
            else if (detail === TILE_WATER_CORNER_NW) c.drawImage(waterImg, 0, 128, 16, 16, px, py, tileSize + 1, tileSize + 1);
            else if (detail === TILE_WATER_CORNER_NE) c.drawImage(waterImg, 48, 128, 16, 16, px, py, tileSize + 1, tileSize + 1);
            else if (detail === TILE_WATER_CORNER_SW) c.drawImage(waterImg, 0, 176, 16, 16, px, py, tileSize + 1, tileSize + 1);
            else if (detail === TILE_WATER_CORNER_SE) c.drawImage(waterImg, 48, 176, 16, 16, px, py, tileSize + 1, tileSize + 1);
          }
          // Soft organic foam shoreline blending ground into water
          c.fillStyle = "rgba(186, 230, 253, 0.35)";
          if (detail === TILE_WATER_SHORE_N) c.fillRect(px, py + tileSize - 8, tileSize, 8);
          else if (detail === TILE_WATER_SHORE_S) c.fillRect(px, py, tileSize, 8);
          else if (detail === TILE_WATER_SHORE_W) c.fillRect(px + tileSize - 8, py, 8, tileSize);
          else if (detail === TILE_WATER_SHORE_E) c.fillRect(px, py, 8, tileSize);
          else if (detail === TILE_WATER_CORNER_NW) c.fillRect(px + tileSize - 10, py + tileSize - 10, 10, 10);
          else if (detail === TILE_WATER_CORNER_NE) c.fillRect(px, py + tileSize - 10, 10, 10);
          else if (detail === TILE_WATER_CORNER_SW) c.fillRect(px + tileSize - 10, py, 10, 10);
          else if (detail === TILE_WATER_CORNER_SE) c.fillRect(px, py, 10, 10);
        }
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LAYER 3: CLIFFS, RETAINING WALLS & STONE STAIRS (Uphill Elevation)
    // ─────────────────────────────────────────────────────────────────────────
    for (let r = minRow; r <= maxRow; r++) {
      for (let col = minCol; col <= maxCol; col++) {
        const px = col * tileSize;
        const py = r * tileSize;
        const cliff = cliffGrid[r][col];

        if (cliff === TILE_CLIFF_COPING_H) {
          if (wallImg && wallImg.complete) {
            c.drawImage(wallImg, 64, 96, 32, 32, px, py, tileSize + 1, tileSize + 1);
          } else {
            c.fillStyle = "#94a3b8";
            c.fillRect(px, py, tileSize, tileSize);
          }
        } else if (cliff === TILE_CLIFF_FACE_WALL) {
          if (wallImg && wallImg.complete) {
            c.drawImage(wallImg, 64, 128, 32, 32, px, py, tileSize + 1, tileSize + 1);
          } else {
            c.fillStyle = "#475569";
            c.fillRect(px, py, tileSize, tileSize);
          }
        } else if (cliff === TILE_CLIFF_PARAPET_N) {
          if (wallImg && wallImg.complete) c.drawImage(wallImg, 416, 32, 32, 32, px, py, tileSize + 1, tileSize + 1);
        } else if (cliff === TILE_CLIFF_CORNER_NW) {
          if (wallImg && wallImg.complete) c.drawImage(wallImg, 384, 32, 32, 32, px, py, tileSize + 1, tileSize + 1);
        } else if (cliff === TILE_CLIFF_CORNER_NE) {
          if (wallImg && wallImg.complete) c.drawImage(wallImg, 448, 32, 32, 32, px, py, tileSize + 1, tileSize + 1);
        } else if (cliff === TILE_CLIFF_EDGE_W) {
          if (wallImg && wallImg.complete) c.drawImage(wallImg, 288, 64, 32, 32, px, py, tileSize + 1, tileSize + 1);
        } else if (cliff === TILE_CLIFF_EDGE_E) {
          if (wallImg && wallImg.complete) c.drawImage(wallImg, 320, 64, 32, 32, px, py, tileSize + 1, tileSize + 1);
        } else if (cliff === TILE_CLIFF_CORNER_SW) {
          if (wallImg && wallImg.complete) c.drawImage(wallImg, 32, 96, 32, 32, px, py, tileSize + 1, tileSize + 1);
        } else if (cliff === TILE_CLIFF_CORNER_SW_FACE) {
          if (wallImg && wallImg.complete) c.drawImage(wallImg, 32, 128, 32, 32, px, py, tileSize + 1, tileSize + 1);
        } else if (cliff === TILE_CLIFF_CORNER_SE) {
          if (wallImg && wallImg.complete) c.drawImage(wallImg, 96, 96, 32, 32, px, py, tileSize + 1, tileSize + 1);
        } else if (cliff === TILE_CLIFF_CORNER_SE_FACE) {
          if (wallImg && wallImg.complete) c.drawImage(wallImg, 96, 128, 32, 32, px, py, tileSize + 1, tileSize + 1);
        } else if (cliff === TILE_CLIFF_STAIRS_L) {
          // Weathered stone stair left column: top step row 21, bottom step row 22
          if (structImg && structImg.complete) {
            const sy = r === 21 ? 160 : 224;
            c.drawImage(structImg, 32, sy, 32, 32, px, py, tileSize + 1, tileSize + 1);
          }
        } else if (cliff === TILE_CLIFF_STAIRS_R) {
          // Weathered stone stair right column: top step row 21, bottom step row 22
          if (structImg && structImg.complete) {
            const sy = r === 21 ? 160 : 224;
            c.drawImage(structImg, 64, sy, 32, 32, px, py, tileSize + 1, tileSize + 1);
          }
        }
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LAYER 4: STRUCTURES, TOWN & PROPS (Ground Contact Shadows & Base Walls)
    // ─────────────────────────────────────────────────────────────────────────
    // Draw Ground Contact Shadows for Compounds
    for (const s of compoundStructures) {
      c.save();
      c.fillStyle = "rgba(10, 20, 15, 0.4)";
      c.beginPath();
      c.ellipse(
        s.solidBox.x + s.solidBox.w / 2,
        s.solidBox.y + s.solidBox.h - 4,
        s.solidBox.w * 0.52,
        14,
        0,
        0,
        Math.PI * 2,
      );
      c.fill();
      c.restore();
    }

    // Draw Tree Contact Shadows
    for (const t of trees) {
      const tx = t.col * tileSize;
      const ty = t.row * tileSize;
      c.save();
      c.fillStyle = "rgba(10, 20, 15, 0.4)";
      c.beginPath();
      c.ellipse(tx + 24, ty + 46, 20, 8, 0, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }

    // Render Layer 4 Tiles (Culled to viewport)
    for (const t of structureTiles) {
      if (t.dx + t.dw < camera.x - halfW || t.dx > camera.x + halfW) continue;
      if (t.dy + t.dh < camera.y - halfH || t.dy > camera.y + halfH) continue;
      drawTileItem(c, t, imgs, animTime);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // LAYER 5: OVERHEAD ROOFS & CANOPIES (Rendered in drawForeground OVER the player)
  // ─────────────────────────────────────────────────────────────────────────
  const drawForeground = (
    c: CanvasRenderingContext2D,
    camera: { x: number; y: number },
    viewW: number,
    viewH: number,
    zoom: number,
    animTime: number,
    tilesetObj?: Record<string, HTMLImageElement> | HTMLImageElement | null,
  ) => {
    // Render Layer 5 Overhead Tiles (Slate roofs, shingle roofs, battlements, tree canopies)
    const halfW = viewW / (2 * zoom);
    const halfH = viewH / (2 * zoom);

    const imgs =
      tilesetObj && typeof tilesetObj === "object" && "grassTileset" in tilesetObj
        ? (tilesetObj as Record<string, HTMLImageElement>)
        : (window as unknown as { __tilesetCache?: Record<string, HTMLImageElement> }).__tilesetCache;

    for (const t of overheadTiles) {
      if (t.dx + t.dw < camera.x - halfW || t.dx > camera.x + halfW) continue;
      if (t.dy + t.dh < camera.y - halfH || t.dy > camera.y + halfH) continue;
      drawTileItem(c, t, imgs ?? null, animTime);
    }
  };

  return {
    cols,
    rows,
    tileSize,
    width: cols * tileSize,
    height: rows * tileSize,
    grid,
    detailGrid,
    cliffGrid,
    structureTiles,
    overheadTiles,
    collisionGrid,
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

export function generateWhisperingRuinsMap(
  _ctx?: CanvasRenderingContext2D,
  worldSeed: number = 42,
): ProceduralMap {
  return generateProceduralMap(POIS, worldSeed);
}
