import { useRef, useEffect, useState, useMemo, useCallback } from "react";
import type { InteractablePOI } from "../game/story";
import type { ProceduralMap } from "../game/mapGenerator";
import {
  TILE_WATER_DEEP,
  TILE_WATER_BANK_N,
  TILE_WATER_CORNER_SE,
  TILE_CLIFF_TOP_N,
  TILE_CLIFF_CORNER_SE,
  TILE_CLIFF_STAIRS,
  TILE_HIGHLAND_GRASS,
} from "../game/mapGenerator";
import { audioManager } from "../game/audioManager";
import "./MiniMap.css";

interface MiniMapProps {
  playerPos: { x: number; y: number };
  playerFacing?: "up" | "down" | "left" | "right";
  pois: InteractablePOI[];
  worldWidth: number;
  worldHeight: number;
  mapType: "legacy" | "new";
  proceduralMap: ProceduralMap | null;
  onTeleport?: (x: number, y: number) => void;
  activeQuestTitle?: string;
}

export function MiniMap({
  playerPos,
  playerFacing = "down",
  pois,
  worldWidth,
  worldHeight,
  mapType,
  proceduralMap,
  onTeleport,
  activeQuestTitle,
}: MiniMapProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const miniCanvasRef = useRef<HTMLCanvasElement>(null);
  const fullCanvasRef = useRef<HTMLCanvasElement>(null);

  // Derive dynamic region name from player coordinates
  const currentRegion = useMemo(() => {
    const { x, y } = playerPos;
    if (mapType === "new") {
      if (y < 1600 && x < 2600) return "⚡ Sunken Citadel Sanctum";
      if (y < 1600 && x >= 2600) return "🏔️ Highland Crag & Mountain Ridge";
      if (x < 2400 && y >= 1600 && y < 3100) return "🌊 Whispering Pond & Shore";
      if (x >= 2400 && y >= 1600 && y < 3100) return "🌲 Whispering Deepwoods";
      if (y >= 3100) return "🏡 Oakhaven Village & Town Manor";
      return "🌿 Wildflower Glade Highway";
    } else {
      if (y < 200) return "🌊 Whispering Shore";
      if (x > 800) return "🏡 Oakhaven Cottages";
      return "🌿 Village Green";
    }
  }, [playerPos, mapType]);

  // Keyboard shortcut toggle with 'M' or 'm'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        setIsExpanded((prev) => {
          if (!prev) audioManager.playOpen();
          else audioManager.playClose();
          return !prev;
        });
      } else if (e.key === "Escape" && isExpanded) {
        e.preventDefault();
        audioManager.playClose();
        setIsExpanded(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isExpanded]);

  // Render authentic terrain, buildings, and pins onto canvas
  const renderMapCanvas = useCallback(
    (
      c: CanvasRenderingContext2D,
      cvWidth: number,
      cvHeight: number,
      isFull: boolean,
    ) => {
      c.clearRect(0, 0, cvWidth, cvHeight);

      // 1. Draw base terrain background
      if (mapType === "new" && proceduralMap) {
        const { cols, rows, grid, compoundStructures } = proceduralMap;
        const cellW = cvWidth / cols;
        const cellH = cvHeight / rows;

        for (let r = 0; r < rows; r++) {
          for (let col = 0; col < cols; col++) {
            const tileIdx = grid[r]?.[col] ?? 0;

            // Accurate Biome Color Mapping
            if (tileIdx === 17) {
              c.fillStyle = "#064e3b"; // Ancient Perimeter Forest (dense dark pine)
            } else if (tileIdx === TILE_WATER_DEEP) {
              c.fillStyle = "#0284c7"; // Deep Sapphire Water
            } else if (tileIdx >= TILE_WATER_BANK_N && tileIdx <= TILE_WATER_CORNER_SE) {
              c.fillStyle = "#38bdf8"; // Whispering Pond Shoreline
            } else if (tileIdx >= TILE_CLIFF_TOP_N && tileIdx <= TILE_CLIFF_CORNER_SE) {
              c.fillStyle = "#475569"; // Mountain Cliff Rock Face
            } else if (tileIdx === TILE_CLIFF_STAIRS) {
              c.fillStyle = "#cbd5e1"; // Carved Stone Mountain Ramp
            } else if (tileIdx === TILE_HIGHLAND_GRASS) {
              c.fillStyle = "#15803d"; // Highland Plateau Emerald
            } else if (tileIdx === 4) {
              c.fillStyle = "#d97706"; // Cobblestone Highway
            } else if (tileIdx === 5 || (tileIdx >= 6 && tileIdx <= 14)) {
              c.fillStyle = "#94a3b8"; // Sunken Citadel Slate & Walls
            } else if (tileIdx === 15 || tileIdx === 16) {
              c.fillStyle = "#cbd5e1"; // Stone Stairs & Gateways
            } else if (tileIdx === 3) {
              c.fillStyle = "#166534"; // Forest Understory
            } else if (tileIdx === 1 || tileIdx === 2) {
              c.fillStyle = "#4ade80"; // Wildflower Glade Meadows
            } else {
              c.fillStyle = "#22c55e"; // Lush Open Grasslands
            }

            c.fillRect(col * cellW, r * cellH, cellW + 0.6, cellH + 0.6);
          }
        }

        // Draw compound structure footprints on map (houses, outposts, manors)
        if (compoundStructures) {
          for (const s of compoundStructures) {
            if (s.type === "cottage" || s.name.toLowerCase().includes("manor") || s.name.toLowerCase().includes("outpost")) {
              const sx = ((s.col * 64) / worldWidth) * cvWidth;
              const sy = ((s.row * 64) / worldHeight) * cvHeight;
              const sw = (s.widthPx / worldWidth) * cvWidth;
              const sh = (s.heightPx / worldHeight) * cvHeight;

              c.fillStyle = "#b45309"; // Warm timber roof
              c.fillRect(sx, sy, Math.max(sw, 4), Math.max(sh, 4));
              c.strokeStyle = "#fef08a";
              c.lineWidth = 0.5;
              c.strokeRect(sx, sy, Math.max(sw, 4), Math.max(sh, 4));
            }
          }
        }
      } else {
        // Legacy world representation
        c.fillStyle = "#15803d";
        c.fillRect(0, 0, cvWidth, cvHeight);
        c.fillStyle = "#0284c7";
        c.fillRect(0, 0, cvWidth, cvHeight * 0.18);
        c.fillStyle = "#d97706";
        c.fillRect(cvWidth * 0.35, cvHeight * 0.25, cvWidth * 0.15, cvHeight * 0.5);
      }

      // 2. Draw POI markers
      for (const poi of pois) {
        const px = (poi.position.x / worldWidth) * cvWidth;
        const py = (poi.position.y / worldHeight) * cvHeight;

        c.save();
        if (poi.type === "npc") {
          c.fillStyle = "#38bdf8"; // Cyan for friendly NPCs
          c.shadowColor = "rgba(56, 189, 248, 0.9)";
          c.shadowBlur = 8;
        } else {
          c.fillStyle = "#fbbf24"; // Radiant amber for shrines / chests
          c.shadowColor = "rgba(251, 191, 36, 0.9)";
          c.shadowBlur = 8;
        }

        const dotSize = isFull ? 6 : 4;
        c.beginPath();
        c.arc(px, py, dotSize, 0, Math.PI * 2);
        c.fill();

        if (isFull) {
          c.font = "bold 10px 'JetBrains Mono', sans-serif";
          c.fillStyle = "#fef3c7";
          c.textAlign = "center";
          c.shadowBlur = 4;
          c.shadowColor = "#000";
          c.fillText(poi.name, px, py - 9);
        }
        c.restore();
      }

      // 3. Draw Player Indicator (Gilded Needle with Vision Cone)
      const pCanvasX = (playerPos.x / worldWidth) * cvWidth;
      const pCanvasY = (playerPos.y / worldHeight) * cvHeight;

      c.save();
      // Pulsing outer sonar wave
      const pulse = (Date.now() % 1600) / 1600;
      c.beginPath();
      c.arc(pCanvasX, pCanvasY, (isFull ? 14 : 9) + pulse * 8, 0, Math.PI * 2);
      c.strokeStyle = `rgba(245, 158, 11, ${1 - pulse})`;
      c.lineWidth = 1.6;
      c.stroke();

      // Heading orientation angle
      c.translate(pCanvasX, pCanvasY);
      let angle = 0;
      if (playerFacing === "up") angle = -Math.PI / 2;
      else if (playerFacing === "down") angle = Math.PI / 2;
      else if (playerFacing === "left") angle = Math.PI;
      else if (playerFacing === "right") angle = 0;
      c.rotate(angle);

      // Vision field subtle sweep cone
      c.fillStyle = "rgba(245, 158, 11, 0.16)";
      c.beginPath();
      c.moveTo(0, 0);
      c.arc(0, 0, isFull ? 28 : 16, -Math.PI / 5, Math.PI / 5);
      c.closePath();
      c.fill();

      // Golden central arrow needle
      c.fillStyle = "#fbbf24";
      c.strokeStyle = "#78350f";
      c.lineWidth = 1;
      c.shadowColor = "rgba(245, 158, 11, 0.9)";
      c.shadowBlur = 10;
      c.beginPath();
      const s = isFull ? 9 : 6;
      c.moveTo(s * 1.6, 0);
      c.lineTo(-s, -s * 0.75);
      c.lineTo(-s * 0.3, 0);
      c.lineTo(-s, s * 0.75);
      c.closePath();
      c.fill();
      c.stroke();
      c.restore();
    },
    [mapType, proceduralMap, pois, worldWidth, worldHeight, playerPos, playerFacing],
  );

  // Redraw Circular MiniMap on player update
  useEffect(() => {
    const cv = miniCanvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    renderMapCanvas(ctx, cv.width, cv.height, false);
  }, [renderMapCanvas]);

  // Redraw Full-Screen Map on open or update
  useEffect(() => {
    if (!isExpanded) return;
    const cv = fullCanvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    renderMapCanvas(ctx, cv.width, cv.height, true);
  }, [isExpanded, renderMapCanvas]);

  return (
    <>
      {/* ─── Circular Brass Astrolabe Compass MiniMap HUD ─── */}
      <div className="minimap-anchor-wrap">
        {/* Floating Region & Coordinates Header */}
        <div className="minimap-header-pill">
          <span className="minimap-region-name">{currentRegion}</span>
          <span className="minimap-coords-badge">
            {Math.round(playerPos.x)}, {Math.round(playerPos.y)}
          </span>
        </div>

        {/* Circular Compass Device Housing */}
        <div
          className="minimap-compass-casing"
          onClick={() => {
            audioManager.playOpen();
            setIsExpanded(true);
          }}
          title="Click or press [M] to open full World Map"
        >
          {/* Engraved Cardinal Direction Notches */}
          <span className="minimap-cardinal minimap-cardinal--n">N</span>
          <span className="minimap-cardinal minimap-cardinal--e">E</span>
          <span className="minimap-cardinal minimap-cardinal--s">S</span>
          <span className="minimap-cardinal minimap-cardinal--w">W</span>

          {/* Compass Bezel Ticks */}
          <div className="minimap-bezel-ticks" />

          {/* Circular Clipped Map Viewport */}
          <div className="minimap-viewport">
            <canvas
              ref={miniCanvasRef}
              width={160}
              height={160}
              className="minimap-canvas"
            />
            {/* Rotating Sonar Radar Sweep */}
            <div className="minimap-radar-sweep" />
            {/* Convex Glass Lens Sheen */}
            <div className="minimap-glass-sheen" />
          </div>

          {/* Expand Map Action Indicator */}
          <div className="minimap-expand-badge" title="Expand Map">
            <span className="minimap-expand-icon">🗺️</span>
            <span>[M]</span>
          </div>
        </div>
      </div>

      {/* ─── Expandable Full-Screen Fantasy World Map Modal ─── */}
      {isExpanded && (
        <div
          className="worldmap-backdrop"
          onClick={() => {
            audioManager.playClose();
            setIsExpanded(false);
          }}
        >
          <div
            className="worldmap-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="worldmap-header">
              <div className="worldmap-title-group">
                <span className="worldmap-title-icon">🧭</span>
                <div>
                  <h3 className="worldmap-title">
                    {mapType === "new"
                      ? "KINGDOM OF OPENGATHER: SUNKEN SANCTUARY"
                      : "OAKHAVEN GLADE WORLD MAP"}
                  </h3>
                  <div className="worldmap-subtitle">
                    {activeQuestTitle
                      ? `Active Quest: ${activeQuestTitle}`
                      : "Procedural realm with mountain cliffs, whispering ponds, ancient citadels, and village manors."}
                  </div>
                </div>
              </div>
              <button
                className="worldmap-close-btn"
                onClick={() => {
                  audioManager.playClose();
                  setIsExpanded(false);
                }}
                title="Close Map (Esc / M)"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="worldmap-body">
              <div className="worldmap-canvas-wrapper">
                <canvas
                  ref={fullCanvasRef}
                  width={600}
                  height={600}
                  className="worldmap-full-canvas"
                />
                <div className="worldmap-teleport-hint">
                  💡 Select any landmark to instantly navigate there
                </div>
              </div>

              <div className="worldmap-sidebar">
                <div className="worldmap-panel">
                  <h4 className="worldmap-panel-title">
                    <span>📍</span> Current Sector
                  </h4>
                  <div className="worldmap-current-region">{currentRegion}</div>
                  <div className="worldmap-current-coords">
                    World Position: X={Math.round(playerPos.x)}, Y={Math.round(playerPos.y)}
                  </div>
                </div>

                <div className="worldmap-panel">
                  <h4 className="worldmap-panel-title">
                    <span>🗺️</span> Terrain & Landmark Legend
                  </h4>
                  <ul className="worldmap-legend-list">
                    <li className="worldmap-legend-item">
                      <span className="worldmap-legend-dot" style={{ backgroundColor: "#fbbf24" }} />
                      <span>Adventurer (You)</span>
                    </li>
                    <li className="worldmap-legend-item">
                      <span className="worldmap-legend-dot" style={{ backgroundColor: "#38bdf8" }} />
                      <span>Friendly Townfolk & NPCs</span>
                    </li>
                    <li className="worldmap-legend-item">
                      <span className="worldmap-legend-dot" style={{ backgroundColor: "#0284c7" }} />
                      <span>Whispering Deep Pond Waters</span>
                    </li>
                    <li className="worldmap-legend-item">
                      <span className="worldmap-legend-dot" style={{ backgroundColor: "#475569" }} />
                      <span>Mountain Cliffs & Escalades</span>
                    </li>
                    <li className="worldmap-legend-item">
                      <span className="worldmap-legend-dot" style={{ backgroundColor: "#cbd5e1" }} />
                      <span>Climbing Stone Stairs</span>
                    </li>
                    <li className="worldmap-legend-item">
                      <span className="worldmap-legend-dot" style={{ backgroundColor: "#b45309" }} />
                      <span>Town Hall Manor & Cottages</span>
                    </li>
                    <li className="worldmap-legend-item">
                      <span className="worldmap-legend-dot" style={{ backgroundColor: "#d97706" }} />
                      <span>Cobblestone King's Highway</span>
                    </li>
                    <li className="worldmap-legend-item">
                      <span className="worldmap-legend-dot" style={{ backgroundColor: "#064e3b" }} />
                      <span>Dense Ancient Perimeter Woods</span>
                    </li>
                  </ul>
                </div>

                <div className="worldmap-panel">
                  <h4 className="worldmap-panel-title">
                    <span>⚡</span> Key Landmarks
                  </h4>
                  <div className="worldmap-poi-list">
                    {pois.map((poi) => {
                      const dist = Math.round(
                        Math.hypot(playerPos.x - poi.position.x, playerPos.y - poi.position.y),
                      );
                      return (
                        <button
                          key={poi.id}
                          className="worldmap-poi-btn"
                          onClick={() => {
                            if (onTeleport) {
                              audioManager.playClick();
                              onTeleport(poi.position.x, poi.position.y + 40);
                              setIsExpanded(false);
                            }
                          }}
                          title={onTeleport ? `Teleport to ${poi.name}` : poi.name}
                        >
                          <div>
                            <span style={{ marginRight: "6px" }}>{poi.icon}</span>
                            <span style={{ fontWeight: 600 }}>{poi.name}</span>
                          </div>
                          <span className="worldmap-poi-dist">{dist}m</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
