import { useState, useCallback, useEffect, useRef } from "react";
import {
  CHARACTER_OPTIONS,
  type CharacterOption,
  type PlayerConfig,
  type MapType,
} from "../game/gameContext";
import { audioManager } from "../game/audioManager";
import "./StartScreen.css";

type Props = {
  onEnter: (config: PlayerConfig, mapType: MapType) => void;
  initialMap?: MapType;
};

const COZY_NAMES = [
  "Fern",
  "River",
  "Bramble",
  "Cedar",
  "Sage",
  "Hazel",
  "Rowan",
  "Moss",
  "Robin",
  "Jasper",
  "Wren",
  "Clover",
];

type MenuMode = "main" | "roster" | "settings" | "controls";

/**
 * Atmospheric 2D background canvas rendering the living meadow scenery,
 * sunbeams/god-rays from upper-right, drifting wind blossoms, golden sun motes,
 * and soft warm lighting matching Concept A.
 */
function TitleBackgroundCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId = 0;
    let running = true;

    const bgImg = new Image();
    bgImg.src = "/BackgroundTerrain.png";

    // 40 ambient floating particles (petals, dandelion fluff, and golden sun motes)
    const particles = Array.from({ length: 40 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: 2 + Math.random() * 3.5,
      speedX: -0.3 - Math.random() * 0.5,
      speedY: 0.2 + Math.random() * 0.4,
      sway: Math.random() * Math.PI * 2,
      swaySpeed: 0.02 + Math.random() * 0.03,
      alpha: 0.35 + Math.random() * 0.5,
      type: Math.random() > 0.4 ? "petal" : "mote",
    }));

    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const render = () => {
      if (!running) return;
      animId = requestAnimationFrame(render);
      time += 0.016;

      const w = canvas.width;
      const h = canvas.height;

      // Draw peaceful background terrain centered on the cottage & well
      if (bgImg.complete && bgImg.naturalWidth > 0) {
        const scale = Math.max(w / 1920, h / 1080, 0.72);
        const targetFocusX = 1680;
        const targetFocusY = 980;
        const driftX = Math.sin(time * 0.2) * 6;
        const driftY = Math.cos(time * 0.16) * 4;

        ctx.save();
        ctx.translate(w / 2, h / 2);
        ctx.scale(scale, scale);
        ctx.drawImage(bgImg, -targetFocusX + driftX, -targetFocusY + driftY);
        ctx.restore();
      } else {
        const grad = ctx.createLinearGradient(0, 0, w, h);
        grad.addColorStop(0, "#2d6a4f");
        grad.addColorStop(1, "#1b4332");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      }

      // Atmospheric God Rays / Sunbeams from top right
      ctx.save();
      const numRays = 4;
      for (let i = 0; i < numRays; i++) {
        const rayAngle = 0.58 + Math.sin(time * 0.15 + i) * 0.03;
        const rayX = w * 0.85 - i * 140;
        const driftRayX = rayX - h * Math.tan(rayAngle);
        const rayGrad = ctx.createLinearGradient(rayX, 0, driftRayX, h);
        rayGrad.addColorStop(0, "rgba(255, 255, 220, 0.2)");
        rayGrad.addColorStop(0.35, "rgba(254, 243, 199, 0.1)");
        rayGrad.addColorStop(1, "rgba(255, 255, 255, 0)");

        ctx.fillStyle = rayGrad;
        ctx.beginPath();
        ctx.moveTo(rayX, 0);
        ctx.lineTo(rayX + 90, 0);
        ctx.lineTo(driftRayX + 90, h);
        ctx.lineTo(driftRayX, h);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      // Soft vignette
      const sunGrad = ctx.createRadialGradient(
        w * 0.5,
        h * 0.45,
        150,
        w * 0.5,
        h * 0.5,
        Math.max(w, h) * 0.75,
      );
      sunGrad.addColorStop(0, "rgba(255, 250, 220, 0.05)");
      sunGrad.addColorStop(0.5, "rgba(20, 45, 30, 0.2)");
      sunGrad.addColorStop(1, "rgba(10, 25, 17, 0.65)");
      ctx.fillStyle = sunGrad;
      ctx.fillRect(0, 0, w, h);

      // Animated floating petals and sun motes
      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.sway += p.swaySpeed;
        const currentX = p.x + Math.sin(p.sway) * 16;

        if (p.y > h + 20) {
          p.y = -20;
          p.x = Math.random() * (w + 200);
        }
        if (p.x < -40) {
          p.x = w + 40;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        if (p.type === "petal") {
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.ellipse(
            currentX,
            p.y,
            p.size * 1.5,
            p.size * 0.8,
            p.sway,
            0,
            Math.PI * 2,
          );
          ctx.fill();
        } else {
          ctx.fillStyle = "#fef08a";
          ctx.shadowColor = "#f59e0b";
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(currentX, p.y, p.size * 0.6, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });
    };

    bgImg.onload = () => {};
    render();

    return () => {
      running = false;
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="ss-bg-canvas" />;
}

export function StartScreen({ onEnter, initialMap = "new" }: Props) {
  const [name, setName] = useState(() => {
    return COZY_NAMES[Math.floor(Math.random() * COZY_NAMES.length)];
  });

  const [selectedChar, setSelectedChar] = useState<CharacterOption>(
    () => CHARACTER_OPTIONS[0],
  );

  const [mapType, setMapType] = useState<MapType>(initialMap);
  const [mode, setMode] = useState<MenuMode>("main");
  const [entering, setEntering] = useState(false);

  // Audio settings synchronized with audioManager
  const [audioSettings, setAudioSettings] = useState(() => audioManager.getSettings());
  const [bgmMuted, setBgmMuted] = useState(audioSettings.bgmMuted);

  const toggleMusic = useCallback(() => {
    const nextMuted = audioManager.toggleBGMMute();
    setBgmMuted(nextMuted);
    setAudioSettings((prev) => ({ ...prev, bgmMuted: nextMuted }));
  }, []);

  const handleStartGame = useCallback(() => {
    audioManager.playJoin();
    setEntering(true);
    setTimeout(() => {
      onEnter(
        {
          name: name.trim() || "Adventurer",
          character: selectedChar,
        },
        mapType,
      );
    }, 450);
  }, [name, selectedChar, mapType, onEnter]);

  const randomizeName = useCallback(() => {
    audioManager.playSelect();
    const current = name.trim();
    const available = COZY_NAMES.filter((n) => n !== current);
    const chosen = available[Math.floor(Math.random() * available.length)];
    setName(chosen);
  }, [name]);

  const openRoster = useCallback(() => {
    audioManager.playOpen();
    setMode("roster");
  }, []);

  const openSettings = useCallback(() => {
    audioManager.playOpen();
    setMode("settings");
  }, []);

  const openControls = useCallback(() => {
    audioManager.playOpen();
    setMode("controls");
  }, []);

  const backToMain = useCallback(() => {
    audioManager.playClose();
    setMode("main");
  }, []);

  const selectCharacter = useCallback((char: CharacterOption) => {
    audioManager.playSelect();
    setSelectedChar(char);
    setMode("main");
  }, []);

  return (
    <div className={`ss-root ${entering ? "ss-root--entering" : ""}`}>
      {/* 2D Meadow scenic background canvas with sunbeams */}
      <TitleBackgroundCanvas />

      {/* Top right Music On/Off toggle switch matching Concept A */}
      <div className="ss-top-bar">
        <button
          className={`ss-music-switch ${!bgmMuted ? "ss-music-switch--on" : ""}`}
          onClick={toggleMusic}
          title={bgmMuted ? "Turn music on" : "Turn music off"}
        >
          <span className="ss-music-label">Music On</span>
          <span className="ss-music-pill">
            <span className="ss-music-pill-knob">{bgmMuted ? "OFF" : "ON"}</span>
          </span>
        </button>
      </div>

      {/* Main Title Modal Container */}
      <div className="ss-main-container">
        {/* ─── Mode 1: Main Title Screen (Exact Concept A Layout) ─────────── */}
        {mode === "main" && (
          <div className="ss-card-stage ss-card-stage--concept">
            {/* 1. Header with stylized title & leaf vine flourishes */}
            <div className="ss-concept-header">
              <div className="ss-vine-top">🌿 ✧ 🌿</div>
              <h1 className="ss-concept-title">WHISPERING MEADOWS</h1>
            </div>

            {/* 2. Hero Spotlight on Carved Stone Pedestal */}
            <div className="ss-pedestal-section">
              <div className="ss-halo-glow" />
              <div className="ss-pedestal-stone">
                <div className="ss-pedestal-gem">◇</div>
                <div className="ss-hero-sprite-frame">
                  <img
                    src={`/characters/${selectedChar.folder}/playerDown.png`}
                    alt={selectedChar.name}
                    className="ss-hero-sprite-img"
                    draggable={false}
                  />
                </div>
              </div>

              {/* Adventurer Identity & Quick Reroll */}
              <div className="ss-hero-identity">
                <div className="ss-identity-badge" style={{ borderColor: selectedChar.color }}>
                  <span className="ss-badge-dot" style={{ backgroundColor: selectedChar.color }} />
                  <span className="ss-badge-hero">{selectedChar.name}</span>
                </div>
                <div className="ss-name-chip" onClick={randomizeName} title="Click to reroll cozy name">
                  <span className="ss-name-text">{name}</span>
                  <span className="ss-dice-icon">🎲</span>
                </div>
              </div>
            </div>

            {/* 3. Map Selection Toggle: Whispering Ruins vs Oakhaven Glade */}
            <div className="ss-map-bar">
              <span className="ss-map-bar-label">🗺️ Realm:</span>
              <div className="ss-map-pills">
                <button
                  className={`ss-map-pill ${mapType === "new" ? "ss-map-pill--active" : ""}`}
                  onClick={() => {
                    audioManager.playSelect();
                    setMapType("new");
                  }}
                >
                  Whispering Ruins (New)
                </button>
                <button
                  className={`ss-map-pill ${mapType === "legacy" ? "ss-map-pill--active" : ""}`}
                  onClick={() => {
                    audioManager.playSelect();
                    setMapType("legacy");
                  }}
                >
                  Oakhaven Glade (Legacy)
                </button>
              </div>
            </div>

            {/* 4. Four Stacked Vertical Action Buttons */}
            <div className="ss-stacked-actions">
              <button
                className="ss-btn-exact ss-btn-exact--play"
                onClick={handleStartGame}
                disabled={entering}
              >
                <span className="ss-btn-play-text">
                  {entering ? "Entering Realm…" : "Enter World"}
                </span>
              </button>

              <button className="ss-btn-exact ss-btn-exact--slate" onClick={openRoster}>
                Change Hero
              </button>

              <button className="ss-btn-exact ss-btn-exact--slate" onClick={openSettings}>
                Settings
              </button>

              <button className="ss-btn-exact ss-btn-exact--slate" onClick={openControls}>
                How to Play
              </button>
            </div>
          </div>
        )}

        {/* ─── Mode 2: Character Roster ──────────────────────────────────── */}
        {mode === "roster" && (
          <div className="ss-card-stage ss-card-stage--roster">
            <div className="ss-stage-header">
              <button className="ss-back-link" onClick={backToMain}>
                ← Back to Menu
              </button>
              <h2 className="ss-stage-title">Choose Your Adventurer</h2>
              <p className="ss-stage-sub">Select your traveler to explore the meadow with.</p>
            </div>

            <div className="ss-roster-grid">
              {CHARACTER_OPTIONS.map((char) => {
                const isSelected = char.id === selectedChar.id;
                return (
                  <button
                    key={char.id}
                    className={`ss-roster-card ${isSelected ? "ss-roster-card--active" : ""}`}
                    onClick={() => selectCharacter(char)}
                    style={{ "--char-color": char.color } as React.CSSProperties}
                  >
                    <div className="ss-roster-sprite-box">
                      <img
                        src={`/characters/${char.folder}/playerDown.png`}
                        alt={char.name}
                        className="ss-roster-sprite-img"
                        draggable={false}
                      />
                    </div>
                    <span className="ss-roster-name">{char.name}</span>
                    {isSelected && <span className="ss-roster-active-badge">✓</span>}
                  </button>
                );
              })}
            </div>

            <div className="ss-roster-summary">
              <strong>{selectedChar.name}:</strong> {selectedChar.description}
            </div>

            <button className="ss-btn-exact ss-btn-exact--play" onClick={backToMain}>
              Confirm Selection
            </button>
          </div>
        )}

        {/* ─── Mode 3: Quick Settings ─────────────────────────────────────── */}
        {mode === "settings" && (
          <div className="ss-card-stage ss-card-stage--dialog">
            <div className="ss-stage-header">
              <button className="ss-back-link" onClick={backToMain}>
                ← Back to Menu
              </button>
              <h2 className="ss-stage-title">Audio & Sound</h2>
              <p className="ss-stage-sub">Adjust your acoustic relaxing atmosphere.</p>
            </div>

            <div className="ss-settings-body">
              <div className="ss-setting-row">
                <span className="ss-setting-label">Music Volume</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={audioSettings.bgmMuted ? 0 : audioSettings.bgmVolume}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    audioManager.setBGMVolume(v);
                    setAudioSettings(audioManager.getSettings());
                  }}
                  className="ss-slider"
                />
                <span className="ss-pct">
                  {audioSettings.bgmMuted ? 0 : Math.round(audioSettings.bgmVolume * 100)}%
                </span>
              </div>

              <div className="ss-setting-row">
                <span className="ss-setting-label">Sound FX</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={audioSettings.sfxMuted ? 0 : audioSettings.sfxVolume}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    audioManager.setSFXVolume(v);
                    setAudioSettings(audioManager.getSettings());
                  }}
                  className="ss-slider"
                />
                <span className="ss-pct">
                  {audioSettings.sfxMuted ? 0 : Math.round(audioSettings.sfxVolume * 100)}%
                </span>
              </div>
            </div>

            <button className="ss-btn-exact ss-btn-exact--play" onClick={backToMain}>
              Save & Return
            </button>
          </div>
        )}

        {/* ─── Mode 4: Controls ───────────────────────────────────────────── */}
        {mode === "controls" && (
          <div className="ss-card-stage ss-card-stage--dialog">
            <div className="ss-stage-header">
              <button className="ss-back-link" onClick={backToMain}>
                ← Back to Menu
              </button>
              <h2 className="ss-stage-title">Keybindings</h2>
              <p className="ss-stage-sub">How to navigate the Whispering Meadows.</p>
            </div>

            <div className="ss-controls-list">
              <div className="ss-control-item">
                <div className="ss-keys">
                  <kbd>W</kbd>
                  <kbd>A</kbd>
                  <kbd>S</kbd>
                  <kbd>D</kbd>
                </div>
                <span>Walk in four directions</span>
              </div>
              <div className="ss-control-item">
                <div className="ss-keys">
                  <kbd>E</kbd>
                </div>
                <span>Talk to NPCs / Inspect ancient landmarks</span>
              </div>
              <div className="ss-control-item">
                <div className="ss-keys">
                  <kbd>B</kbd>
                  <kbd>I</kbd>
                </div>
                <span>Open Traveler's Bag & inventory satchel</span>
              </div>
              <div className="ss-control-item">
                <div className="ss-keys">
                  <kbd>Double-click</kbd>
                </div>
                <span>Auto-walk pathfinding to target</span>
              </div>
              <div className="ss-control-item">
                <div className="ss-keys">
                  <kbd>+</kbd>
                  <kbd>-</kbd>
                </div>
                <span>Zoom camera in & out (or mouse wheel)</span>
              </div>
            </div>

            <button className="ss-btn-exact ss-btn-exact--play" onClick={backToMain}>
              Got It
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
