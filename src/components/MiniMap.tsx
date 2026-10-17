import { useRef, useEffect, useState, useMemo, useCallback } from "react";
import type { InteractablePOI } from "../game/story";
import type { ProceduralMap } from "../game/mapGenerator";
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

  // Derive active region name from player coordinates
  const currentRegion = useMemo(() => {
    const { x, y } = playerPos;
    if (mapType === "new") {
      if (y < 1400) return "⚡ Sunken Citadel";
      if (x > 2600 && y >= 1400 && y < 2700) return "🌊 Whispering Lake";
      if (x < 1800 && y >= 1600 && y < 2900) return "🌲 Hermit's Grove";
      if (y >= 2900) return "🏡 Oakhaven Haven";
      return "🌿 Wildflower Glade";
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

  // Render terrain and pins onto given canvas context
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
        const { cols, rows, grid } = proceduralMap;
        const cellW = cvWidth / cols;
        const cellH = cvHeight / rows;

        for (let r = 0; r < rows; r++) {
          for (let col = 0; col < cols; col++) {
            const tileIdx = grid[r]?.[col] ?? 0;
            // Palette mapping for radar representation
            if (tileIdx === 0) {
              c.fillStyle = "#1e3a8a"; // Deep Ocean
            } else if (tileIdx >= 1 && tileIdx <= 8) {
              c.fillStyle = "#0284c7"; // Coastline / Shore
            } else if (tileIdx >= 16 && tileIdx <= 24) {
              c.fillStyle = "#ca8a04"; // Cobblestone Highway
            } else if (tileIdx >= 27 && tileIdx <= 38) {
              c.fillStyle = "#64748b"; // Sunken Citadel Slate
            } else if (tileIdx >= 11 && tileIdx <= 13) {
              c.fillStyle = "#15803d"; // Wildflower field
            } else {
              c.fillStyle = "#166534"; // Lush Meadow Grass
            }
            c.fillRect(col * cellW, r * cellH, cellW + 0.5, cellH + 0.5);
          }
        }
      } else {
        // Legacy world representation
        c.fillStyle = "#15803d"; // Lush grass
        c.fillRect(0, 0, cvWidth, cvHeight);
        // Sea border at top
        c.fillStyle = "#1e3a8a";
        c.fillRect(0, 0, cvWidth, cvHeight * 0.18);
        // Pathway
        c.fillStyle = "#ca8a04";
        c.fillRect(cvWidth * 0.35, cvHeight * 0.25, cvWidth * 0.15, cvHeight * 0.5);
      }

      // 2. Draw POI markers
      for (const poi of pois) {
        const px = (poi.position.x / worldWidth) * cvWidth;
        const py = (poi.position.y / worldHeight) * cvHeight;

        c.save();
        if (poi.type === "npc") {
          c.fillStyle = "#38bdf8"; // Cyan for friendly NPCs
          c.shadowColor = "rgba(56, 189, 248, 0.8)";
          c.shadowBlur = 8;
        } else {
          c.fillStyle = "#fbbf24"; // Amber for shrines / objects
          c.shadowColor = "rgba(251, 191, 36, 0.8)";
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

      // 3. Draw Player Indicator
      const pCanvasX = (playerPos.x / worldWidth) * cvWidth;
      const pCanvasY = (playerPos.y / worldHeight) * cvHeight;

      c.save();
      // Pulsing outer ripple
      const pulse = (Date.now() % 1500) / 1500;
      c.beginPath();
      c.arc(pCanvasX, pCanvasY, (isFull ? 12 : 8) + pulse * 6, 0, Math.PI * 2);
      c.strokeStyle = `rgba(245, 158, 11, ${1 - pulse})`;
      c.lineWidth = 1.5;
      c.stroke();

      // Golden central diamond with facing angle
      c.translate(pCanvasX, pCanvasY);
      let angle = 0;
      if (playerFacing === "up") angle = -Math.PI / 2;
      else if (playerFacing === "down") angle = Math.PI / 2;
      else if (playerFacing === "left") angle = Math.PI;
      else if (playerFacing === "right") angle = 0;
      c.rotate(angle);

      c.fillStyle = "#f59e0b";
      c.shadowColor = "rgba(245, 158, 11, 0.9)";
      c.shadowBlur = 10;
      c.beginPath();
      const s = isFull ? 8 : 5.5;
      c.moveTo(s * 1.5, 0);
      c.lineTo(-s, -s * 0.8);
      c.lineTo(-s * 0.4, 0);
      c.lineTo(-s, s * 0.8);
      c.closePath();
      c.fill();
      c.restore();
    },
    [mapType, proceduralMap, pois, worldWidth, worldHeight, playerPos, playerFacing],
  );

  // Redraw MiniMap on movement
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
      {/* Bottom-Left Radar MiniMap Card */}
      <div className="minimap-container">
        <div
          className="minimap-card"
          onClick={() => {
            audioManager.playOpen();
            setIsExpanded(true);
          }}
          title="Click or press [M] to expand full World Map"
        >
          <canvas
            ref={miniCanvasRef}
            width={154}
            height={154}
            className="minimap-canvas"
          />
          <div className="minimap-radar-sweep" />
          <div className="minimap-overlay-badge">
            <span>🗺️</span>
            <span>{currentRegion}</span>
          </div>
          <div className="minimap-expand-hint">[M] Expand ↗</div>
        </div>

        <div className="minimap-coords-row">
          <span>POS</span>
          <span className="minimap-coords-val">
            {Math.round(playerPos.x)}, {Math.round(playerPos.y)}
          </span>
          <span className="minimap-region-pill">{mapType === "new" ? "RUINS" : "VILLAGE"}</span>
        </div>
      </div>

      {/* Expandable Full-Screen World Map Modal */}
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
            <div className="worldmap-header">
              <div className="worldmap-title-group">
                <span className="worldmap-title-icon">🧭</span>
                <div>
                  <h3 className="worldmap-title">
                    {mapType === "new" ? "ANCIENT ARCHIPELAGO OF OPENGATHER" : "OAKHAVEN GLADE WORLD MAP"}
                  </h3>
                  <div className="worldmap-subtitle">
                    {activeQuestTitle ? `Active Quest: ${activeQuestTitle}` : "Explore, discover ancient relics, and restore the Sunken Core."}
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

            <div className="worldmap-body">
              <div className="worldmap-canvas-wrapper">
                <canvas
                  ref={fullCanvasRef}
                  width={560}
                  height={560}
                  className="worldmap-full-canvas"
                />
              </div>

              <div className="worldmap-sidebar">
                <div className="worldmap-panel">
                  <h4 className="worldmap-panel-title">
                    <span>📍</span> Current Region
                  </h4>
                  <div style={{ color: "#38bdf8", fontWeight: 700, fontSize: "14px", marginBottom: "4px" }}>
                    {currentRegion}
                  </div>
                  <div style={{ color: "#94a3b8", fontSize: "11px", fontFamily: "monospace" }}>
                    Coordinates: X={Math.round(playerPos.x)}, Y={Math.round(playerPos.y)}
                  </div>
                </div>

                <div className="worldmap-panel">
                  <h4 className="worldmap-panel-title">
                    <span>🗺️</span> Map Legend
                  </h4>
                  <ul className="worldmap-legend-list">
                    <li className="worldmap-legend-item">
                      <span className="worldmap-legend-dot" style={{ backgroundColor: "#f59e0b" }} />
                      <span>Hero (You)</span>
                    </li>
                    <li className="worldmap-legend-item">
                      <span className="worldmap-legend-dot" style={{ backgroundColor: "#38bdf8" }} />
                      <span>Friendly NPCs</span>
                    </li>
                    <li className="worldmap-legend-item">
                      <span className="worldmap-legend-dot" style={{ backgroundColor: "#fbbf24" }} />
                      <span>Sacred Altars & Relics</span>
                    </li>
                    <li className="worldmap-legend-item">
                      <span className="worldmap-legend-dot" style={{ backgroundColor: "#1e3a8a" }} />
                      <span>Deep Sapphire Ocean</span>
                    </li>
                    <li className="worldmap-legend-item">
                      <span className="worldmap-legend-dot" style={{ backgroundColor: "#ca8a04" }} />
                      <span>Cobblestone Footpaths</span>
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
