import { Boundary } from "../class";
import type { InteractablePOI } from "./story";

export type TileType =
  | "grass"
  | "grass_flowers"
  | "grass_clover"
  | "stone_path"
  | "stone_patio"
  | "stone_ruin_wall"
  | "stone_pillar"
  | "water_deep"
  | "water_shore"
  | "shrine_circle"
  | "stone_stairs";

export interface MapCell {
  base: TileType;
  overlay?: TileType;
  blocking: boolean;
  elevation: number;
}

export interface ProceduralMap {
  cols: number;
  rows: number;
  tileSize: number;
  width: number;
  height: number;
  grid: MapCell[][];
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

// Seeded PRNG (Mulberry32)
function createRng(seed: number) {
  let s = seed | 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateWhisperingRuinsMap(ctx: CanvasRenderingContext2D, seed = 42): ProceduralMap {
  const rng = createRng(seed);
  const cols = 40;
  const rows = 40;
  const tileSize = 64;
  const width = cols * tileSize;
  const height = rows * tileSize;

  // Initialize grid
  const grid: MapCell[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      base: "grass" as TileType,
      blocking: false,
      elevation: 0,
    })),
  );

  // 1. Surrounding perimeter deep water / impassable ancient chasm
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (r <= 2 || r >= rows - 3 || c <= 2 || c >= cols - 3) {
        grid[r][c].base = "water_deep";
        grid[r][c].blocking = true;
      }
    }
  }

  // 2. Whispering waterways & tranquil pond on the East
  for (let r = 6; r < 24; r++) {
    for (let c = 26; c < 36; c++) {
      const distFromCenter = Math.hypot((c - 30) * 1.2, r - 15);
      if (distFromCenter < 7.5 + (rng() - 0.5) * 1.5) {
        grid[r][c].base = "water_deep";
        grid[r][c].blocking = true;
      } else if (distFromCenter < 9.0) {
        grid[r][c].base = "water_shore";
        grid[r][c].blocking = false;
      }
    }
  }

  // 3. Central Grand Sunken Courtyard & Temple Grounds (Rows 10 to 22, Cols 12 to 24)
  for (let r = 10; r <= 22; r++) {
    for (let c = 12; c <= 24; c++) {
      grid[r][c].base = "stone_patio";
      grid[r][c].blocking = false;
    }
  }

  // Central Sun Shrine Circle in courtyard
  grid[14][17].base = "shrine_circle";
  grid[14][18].base = "shrine_circle";
  grid[15][17].base = "shrine_circle";
  grid[15][18].base = "shrine_circle";

  // 4. Ancient stone paved road connecting South Gateway -> Central Courtyard -> North Altar
  for (let r = 22; r <= 36; r++) {
    for (let c = 17; c <= 19; c++) {
      grid[r][c].base = "stone_path";
      grid[r][c].blocking = false;
    }
  }
  for (let r = 4; r <= 10; r++) {
    for (let c = 17; c <= 19; c++) {
      grid[r][c].base = "stone_path";
      grid[r][c].blocking = false;
    }
  }

  // Cross path extending to the West Ancient Grove and East Waterway Bridge
  for (let c = 5; c <= 28; c++) {
    grid[16][c].base = "stone_path";
    grid[16][c].blocking = false;
    grid[17][c].base = "stone_path";
    grid[17][c].blocking = false;
  }

  // 5. Ancient Stone Ruin Walls & Colonnade
  // North temple back wall
  for (let c = 12; c <= 24; c++) {
    grid[9][c].base = "stone_ruin_wall";
    grid[9][c].blocking = true;
  }
  // North temple pillars
  const pillarCols = [13, 16, 20, 23];
  for (const pc of pillarCols) {
    grid[12][pc].base = "stone_pillar";
    grid[12][pc].blocking = true;
    grid[20][pc].base = "stone_pillar";
    grid[20][pc].blocking = true;
  }

  // West garden ruin wall fragments
  for (let r = 13; r <= 19; r++) {
    if (r !== 16 && r !== 17) {
      grid[r][11].base = "stone_ruin_wall";
      grid[r][11].blocking = true;
    }
  }

  // 6. Grass variants & flower carpets
  for (let r = 3; r < rows - 3; r++) {
    for (let c = 3; c < cols - 3; c++) {
      if (grid[r][c].base === "grass") {
        const roll = rng();
        if (roll < 0.15) {
          grid[r][c].base = "grass_flowers";
        } else if (roll < 0.3) {
          grid[r][c].base = "grass_clover";
        }
      }
    }
  }

  // 7. Create Boundaries
  const boundaries: Boundary[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c].blocking) {
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

  // 8. Safe Player Spawn Point (On the southern stone road)
  const spawnPoint = {
    x: 18 * tileSize + tileSize / 2 - 24,
    y: 33 * tileSize,
  };

  // 9. Interactive POIs positioned in the Whispering Ruins
  const pois: InteractablePOI[] = [
    {
      id: "elder_oakhaven",
      name: "Elder Oakhaven",
      type: "npc",
      position: { x: 18 * tileSize + 32, y: 14 * tileSize + 32 },
      radius: 68,
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
      position: { x: 16 * tileSize + 10, y: 27 * tileSize + 20 },
      radius: 65,
      icon: "👋",
      prompt: "Greet Echo at the Gateway",
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
      position: { x: 22 * tileSize + 32, y: 11 * tileSize + 32 },
      radius: 70,
      icon: "💧",
      prompt: "Examine Ancient Runic Well",
      initialNodeId: (state) => {
        if (state.flags.hasRune) return "well_empty";
        return "well_intro";
      },
    },
    {
      id: "cottage_crates",
      name: "Ruins Relic Chest",
      type: "object",
      position: { x: 13 * tileSize + 32, y: 17 * tileSize + 32 },
      radius: 60,
      icon: "📦",
      prompt: "Search Ancient Relic Chest",
      initialNodeId: (state) => {
        if (state.flags.searchedCrates) return "crates_empty";
        return "crates_intro";
      },
    },
  ];

  // 10. Renderer
  const draw = (
    c: CanvasRenderingContext2D,
    tileset: HTMLImageElement | null,
    camera: { x: number; y: number },
    viewW: number,
    viewH: number,
    zoom: number,
    animTime: number,
  ) => {
    // Tile bounds culling
    const minCol = Math.max(0, Math.floor((camera.x - viewW / (2 * zoom)) / tileSize) - 1);
    const maxCol = Math.min(cols - 1, Math.ceil((camera.x + viewW / (2 * zoom)) / tileSize) + 1);
    const minRow = Math.max(0, Math.floor((camera.y - viewH / (2 * zoom)) / tileSize) - 1);
    const maxRow = Math.min(rows - 1, Math.ceil((camera.y + viewH / (2 * zoom)) / tileSize) + 1);

    for (let r = minRow; r <= maxRow; r++) {
      for (let col = minCol; col <= maxCol; col++) {
        const cell = grid[r][col];
        const px = col * tileSize;
        const py = r * tileSize;

        // Base tile drawing
        switch (cell.base) {
          case "grass":
            c.fillStyle = "#3e6a3d";
            c.fillRect(px, py, tileSize, tileSize);
            // subtle grass blade texture
            c.fillStyle = "#4a7d48";
            c.fillRect(px + 8, py + 12, 4, 8);
            c.fillRect(px + 36, py + 40, 5, 9);
            break;

          case "grass_flowers":
            c.fillStyle = "#427141";
            c.fillRect(px, py, tileSize, tileSize);
            // Wild chamomile / buttercups
            c.fillStyle = "#fef08a";
            c.beginPath();
            c.arc(px + 20, py + 24, 4, 0, Math.PI * 2);
            c.arc(px + 44, py + 38, 3.5, 0, Math.PI * 2);
            c.fill();
            c.fillStyle = "#f97316";
            c.beginPath();
            c.arc(px + 20, py + 24, 1.5, 0, Math.PI * 2);
            c.arc(px + 44, py + 38, 1.2, 0, Math.PI * 2);
            c.fill();
            break;

          case "grass_clover":
            c.fillStyle = "#3b653a";
            c.fillRect(px, py, tileSize, tileSize);
            c.fillStyle = "#86efac";
            c.beginPath();
            c.arc(px + 16, py + 20, 3, 0, Math.PI * 2);
            c.arc(px + 40, py + 48, 3, 0, Math.PI * 2);
            c.fill();
            break;

          case "stone_path":
            c.fillStyle = "#52525b";
            c.fillRect(px, py, tileSize, tileSize);
            // Cobblestone outline
            c.strokeStyle = "#3f3f46";
            c.lineWidth = 1.5;
            c.strokeRect(px + 4, py + 4, tileSize - 8, tileSize - 8);
            c.fillStyle = "#71717a";
            c.fillRect(px + 8, py + 8, 20, 20);
            c.fillRect(px + 32, py + 32, 22, 22);
            break;

          case "stone_patio":
            c.fillStyle = "#475569";
            c.fillRect(px, py, tileSize, tileSize);
            c.strokeStyle = "#334155";
            c.lineWidth = 1;
            c.strokeRect(px, py, tileSize, tileSize);
            // Mossy joints
            c.fillStyle = "rgba(74, 222, 128, 0.25)";
            c.fillRect(px + 2, py + 2, 8, 4);
            break;

          case "shrine_circle": {
            c.fillStyle = "#334155";
            c.fillRect(px, py, tileSize, tileSize);
            // Golden glowing runic floor inlay
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

          case "water_deep": {
            // Calm shimmering water
            const wave = Math.sin(animTime * 1.5 + col * 0.4 + r * 0.3) * 6;
            c.fillStyle = "#1e3a5f";
            c.fillRect(px, py, tileSize, tileSize);
            c.fillStyle = "rgba(56, 189, 248, 0.25)";
            c.fillRect(px + 6 + wave, py + 20, 32, 3);
            c.fillRect(px + 18 - wave, py + 44, 26, 2.5);
            break;
          }

          case "water_shore":
            c.fillStyle = "#2d527a";
            c.fillRect(px, py, tileSize, tileSize);
            c.fillStyle = "#a8a29e";
            c.fillRect(px, py + tileSize - 8, tileSize, 8);
            break;

          case "stone_ruin_wall":
            // Shadow behind wall
            c.fillStyle = "#334155";
            c.fillRect(px, py, tileSize, tileSize);
            // Wall face
            c.fillStyle = "#64748b";
            c.fillRect(px + 4, py + 4, tileSize - 8, tileSize - 12);
            // Wall cap
            c.fillStyle = "#94a3b8";
            c.fillRect(px + 2, py + 2, tileSize - 4, 12);
            // Moss ivy creeping up
            c.fillStyle = "#22c55e";
            c.fillRect(px + 8, py + 24, 6, 16);
            c.fillRect(px + 12, py + 18, 5, 8);
            break;

          case "stone_pillar":
            // Floor base
            c.fillStyle = "#475569";
            c.fillRect(px, py, tileSize, tileSize);
            // Column pedestal
            c.fillStyle = "#cbd5e1";
            c.beginPath();
            c.arc(px + tileSize / 2, py + tileSize / 2, 20, 0, Math.PI * 2);
            c.fill();
            c.strokeStyle = "#475569";
            c.lineWidth = 3;
            c.stroke();
            // Ancient carved rune
            c.fillStyle = "#f59e0b";
            c.beginPath();
            c.arc(px + tileSize / 2, py + tileSize / 2, 6, 0, Math.PI * 2);
            c.fill();
            break;
        }

        // If tileset image is ready and valid, overlay Kenney RPG tiles
        if (tileset && tileset.complete && tileset.naturalWidth > 0) {
          // Kenney 2X tiles are 128x128
          const sTile = 128;
          if (cell.base === "stone_patio") {
            // Cobblestone tile in sheet
            c.drawImage(tileset, 0 * sTile, 3 * sTile, sTile, sTile, px, py, tileSize, tileSize);
          } else if (cell.base === "stone_pillar") {
            c.drawImage(tileset, 6 * sTile, 7 * sTile, sTile, sTile, px, py, tileSize, tileSize);
          }
        }
      }
    }
  };

  // Foreground effects (ancient overhanging sunbeams and canopies)
  const drawForeground = (
    c: CanvasRenderingContext2D,
    _camera: { x: number; y: number },
    _viewW: number,
    _viewH: number,
    _zoom: number,
    _animTime: number,
  ) => {
    // Grand South Archway Lintel (Col 17 to 19, Row 25)
    const archX = 17 * tileSize;
    const archY = 25 * tileSize - 24;
    c.save();
    c.fillStyle = "#94a3b8";
    c.fillRect(archX - 10, archY, 3 * tileSize + 20, 28);
    c.strokeStyle = "#475569";
    c.lineWidth = 2;
    c.strokeRect(archX - 10, archY, 3 * tileSize + 20, 28);

    // Ancient Inscription on Archway
    c.font = "bold 11px monospace";
    c.fillStyle = "rgba(245, 158, 11, 0.85)";
    c.textAlign = "center";
    c.fillText("ᚠ ᚢ ᚦ ᚨ ᚱ ᚲ — SUNKEN CITADEL", archX + (3 * tileSize) / 2, archY + 18);
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
