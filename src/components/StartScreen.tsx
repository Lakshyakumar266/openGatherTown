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
  "Luna",
  "Orion",
  "Silas",
];

type MenuMode = "main" | "roster" | "settings" | "controls";
type MainTab = "adventure" | "realm";

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

      // Render Floating Petals & Sun Motes
      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.sway += p.swaySpeed;

        if (p.x < -20) p.x = w + 20;
        if (p.y > h + 20) {
          p.y = -20;
          p.x = Math.random() * w;
        }

        ctx.save();
        ctx.translate(p.x + Math.sin(p.sway) * 12, p.y);
        ctx.globalAlpha = p.alpha * (0.8 + Math.sin(p.sway * 2) * 0.2);

        if (p.type === "petal") {
          ctx.rotate(p.sway * 0.8);
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size * 1.5, p.size * 0.8, 0, 0, Math.PI * 2);
          ctx.fillStyle = "#ffffff";
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 0.8, 0, Math.PI * 2);
          ctx.fillStyle = "#fef08a";
          ctx.shadowColor = "#f59e0b";
          ctx.shadowBlur = 6;
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
  const [activeTab, setActiveTab] = useState<MainTab>("adventure");
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
        {/* ─── Mode 1: Main Title Screen ─────────────────────────────────── */}
        {mode === "main" && (
          <div className="ss-card-stage ss-card-stage--concept">
            {/* 1. Header with OPENGATHER & leaf vine flourishes */}
            <div className="ss-concept-header">
              <div className="ss-vine-top">🌿 ✧ 🌿</div>
              <h1 className="ss-concept-title">OPENGATHER</h1>
            </div>

            {/* 2. Top Navigation Tabs: Adventure vs Realm */}
            <div className="ss-nav-tabs">
              <button
                className={`ss-nav-tab ${activeTab === "adventure" ? "ss-nav-tab--active" : ""}`}
                onClick={() => {
                  audioManager.playSelect();
                  setActiveTab("adventure");
                }}
              >
                ⚔️ Adventure
              </button>
              <button
                className={`ss-nav-tab ${activeTab === "realm" ? "ss-nav-tab--active" : ""}`}
                onClick={() => {
                  audioManager.playSelect();
                  setActiveTab("realm");
                }}
              >
                🗺️ Realm: {mapType === "new" ? "Ruins" : "Glade"}
              </button>
            </div>

            {/* ── Subtab A: Adventure Main Screen ── */}
            {activeTab === "adventure" && (
              <>
                {/* Hero Spotlight on Carved Stone Pedestal */}
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

                  {/* Adventurer Identity & Editable Name Input */}
                  <div className="ss-hero-identity">
                    <div className="ss-identity-badge" style={{ borderColor: selectedChar.color }}>
                      <span className="ss-badge-dot" style={{ backgroundColor: selectedChar.color }} />
                      <span className="ss-badge-hero">{selectedChar.name}</span>
                    </div>

                    <div className="ss-name-input-group">
                      <input
                        type="text"
                        className="ss-name-text-input"
                        value={name}
                        maxLength={18}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Hero Name"
                        aria-label="Hero Name"
                      />
                      <button
                        type="button"
                        className="ss-name-dice-btn"
                        onClick={randomizeName}
                        title="Roll cozy name"
                      >
                        🎲
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sleek Realm Indicator Pill (Click to open Realm Tab) */}
                <div
                  className="ss-realm-indicator-bar"
                  onClick={() => {
                    audioManager.playSelect();
                    setActiveTab("realm");
                  }}
                  title="Switch Game World"
                >
                  <span className="ss-realm-ind-icon">🗺️</span>
                  <span className="ss-realm-ind-text">
                    World: <strong>{mapType === "new" ? "Whispering Ruins (Big WFC)" : "Oakhaven Glade (Legacy)"}</strong>
                  </span>
                  <span className="ss-realm-ind-change">Change ➔</span>
                </div>

                {/* Four Stacked Vertical Action Buttons */}
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
              </>
            )}

            {/* ── Subtab B: Dedicated Realm Tab ── */}
            {activeTab === "realm" && (
              <div className="ss-realm-tab-view">
                <div className="ss-realm-tab-intro">
                  Choose the realm you wish to explore:
                </div>

                <div className="ss-realm-cards-list">
                  <div
                    className={`ss-realm-card ${mapType === "new" ? "ss-realm-card--selected" : ""}`}
                    onClick={() => {
                      audioManager.playSelect();
                      setMapType("new");
                    }}
                  >
                    <div className="ss-realm-card-header">
                      <span className="ss-realm-card-title">🏛️ Whispering Ruins</span>
                      <span className="ss-realm-card-tag">Big WFC Multi-Biome</span>
                    </div>
                    <p className="ss-realm-card-desc">
                      An expansive procedural world generated by Wave Function Collapse. Features ancient temple colonnades, runic sun altars, whispering lakes with stone bridges, lush wildflower meadows, and roaming wild animals.
                    </p>
                    {mapType === "new" && <span className="ss-realm-active-badge">✓ Active Realm</span>}
                  </div>

                  <div
                    className={`ss-realm-card ${mapType === "legacy" ? "ss-realm-card--selected" : ""}`}
                    onClick={() => {
                      audioManager.playSelect();
                      setMapType("legacy");
                    }}
                  >
                    <div className="ss-realm-card-header">
                      <span className="ss-realm-card-title">🏡 Oakhaven Glade</span>
                      <span className="ss-realm-card-tag">Legacy Village</span>
                    </div>
                    <p className="ss-realm-card-desc">
                      The classic, cozy glade featuring Elder Oakhaven’s garden, the cottage cache, the ancient well, swaying trees, and peaceful meadow rabbits.
                    </p>
                    {mapType === "legacy" && <span className="ss-realm-active-badge">✓ Active Realm</span>}
                  </div>
                </div>

                <button
                  className="ss-btn-exact ss-btn-exact--play"
                  onClick={() => {
                    audioManager.playSelect();
                    setActiveTab("adventure");
                  }}
                  style={{ marginTop: 14 }}
                >
                  <span className="ss-btn-play-text">Confirm & Return ➔</span>
                </button>
              </div>
            )}
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
                const isSelected = selectedChar.id === char.id;
                return (
                  <button
                    key={char.id}
                    className={`ss-roster-item ${isSelected ? "ss-roster-item--selected" : ""}`}
                    onClick={() => selectCharacter(char)}
                  >
                    <div className="ss-roster-preview" style={{ borderColor: char.color }}>
                      <div className="ss-roster-sprite-box">
                        <img
                          src={`/characters/${char.folder}/playerDown.png`}
                          alt={char.name}
                          className="ss-roster-img"
                          draggable={false}
                        />
                      </div>
                    </div>
                    <span className="ss-roster-name">{char.name}</span>
                    <span className="ss-roster-class">{char.description}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── Mode 3: Settings ─────────────────────────────────────────── */}
        {mode === "settings" && (
          <div className="ss-card-stage ss-card-stage--modal">
            <div className="ss-stage-header">
              <button className="ss-back-link" onClick={backToMain}>
                ← Back to Menu
              </button>
              <h2 className="ss-stage-title">Audio & Sound Options</h2>
              <p className="ss-stage-sub">Configure audio levels for your journey.</p>
            </div>

            <div className="ss-settings-body">
              <div className="ss-setting-row">
                <div className="ss-setting-info">
                  <span className="ss-setting-title">Acoustic BGM</span>
                  <span className="ss-setting-desc">Long tranquil melody & ambiance</span>
                </div>
                <button
                  className={`ss-toggle-btn ${!bgmMuted ? "ss-toggle-btn--on" : ""}`}
                  onClick={toggleMusic}
                >
                  {!bgmMuted ? "ENABLED" : "MUTED"}
                </button>
              </div>

              <div className="ss-setting-row">
                <div className="ss-setting-info">
                  <span className="ss-setting-title">Sound Effects (SFX)</span>
                  <span className="ss-setting-desc">Footsteps, clicks & interaction sounds</span>
                </div>
                <button
                  className={`ss-toggle-btn ${!audioSettings.sfxMuted ? "ss-toggle-btn--on" : ""}`}
                  onClick={() => {
                    const next = audioManager.toggleSFXMute();
                    setAudioSettings((prev) => ({ ...prev, sfxMuted: next }));
                  }}
                >
                  {!audioSettings.sfxMuted ? "ENABLED" : "MUTED"}
                </button>
              </div>

              <div className="ss-setting-row">
                <div className="ss-setting-info">
                  <span className="ss-setting-title">BGM Volume</span>
                  <span className="ss-setting-desc">
                    {Math.round(audioSettings.bgmVolume * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={audioSettings.bgmVolume}
                  onChange={(e) => {
                    const vol = parseFloat(e.target.value);
                    audioManager.setBGMVolume(vol);
                    setAudioSettings((prev) => ({ ...prev, bgmVolume: vol }));
                  }}
                  className="ss-volume-slider"
                />
              </div>

              <div className="ss-setting-row">
                <div className="ss-setting-info">
                  <span className="ss-setting-title">SFX Volume</span>
                  <span className="ss-setting-desc">
                    {Math.round(audioSettings.sfxVolume * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={audioSettings.sfxVolume}
                  onChange={(e) => {
                    const vol = parseFloat(e.target.value);
                    audioManager.setSFXVolume(vol);
                    setAudioSettings((prev) => ({ ...prev, sfxVolume: vol }));
                  }}
                  className="ss-volume-slider"
                />
              </div>
            </div>

            <button className="ss-btn-exact ss-btn-exact--play" onClick={backToMain}>
              <span className="ss-btn-play-text">Save & Close</span>
            </button>
          </div>
        )}

        {/* ─── Mode 4: Controls / How to Play ────────────────────────────── */}
        {mode === "controls" && (
          <div className="ss-card-stage ss-card-stage--modal">
            <div className="ss-stage-header">
              <button className="ss-back-link" onClick={backToMain}>
                ← Back to Menu
              </button>
              <h2 className="ss-stage-title">How to Play</h2>
              <p className="ss-stage-sub">Exploration & interaction guide.</p>
            </div>

            <div className="ss-controls-list">
              <div className="ss-control-row">
                <span className="ss-key-badge">W A S D</span>
                <span className="ss-control-label">Walk through the meadow & ruins</span>
              </div>
              <div className="ss-control-row">
                <span className="ss-key-badge">Double Click</span>
                <span className="ss-control-label">Click-to-Move with auto-pathfinding</span>
              </div>
              <div className="ss-control-row">
                <span className="ss-key-badge">[ E ]</span>
                <span className="ss-control-label">Interact with NPCs, Well & Supply Crates</span>
              </div>
              <div className="ss-control-row">
                <span className="ss-key-badge">1 - 4</span>
                <span className="ss-control-label">Choose dialogue options</span>
              </div>
              <div className="ss-control-row">
                <span className="ss-key-badge">+ / - / Wheel</span>
                <span className="ss-control-label">Zoom camera in / out smoothly</span>
              </div>
              <div className="ss-control-row">
                <span className="ss-key-badge">ESC</span>
                <span className="ss-control-label">Close dialogue / cancel interaction</span>
              </div>
            </div>

            <button className="ss-btn-exact ss-btn-exact--play" onClick={backToMain}>
              <span className="ss-btn-play-text">Got It ➔</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
