import { useState, useCallback, useEffect, useRef } from "react";
import {
  CHARACTER_OPTIONS,
  DEFAULT_SETTINGS,
  type CharacterOption,
  type PlayerConfig,
} from "../game/gameContext";
import { audioManager } from "../game/audioManager";
import "./StartScreen.css";

type Props = {
  onEnter: (config: PlayerConfig) => void;
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
 * drifting wind blossoms, golden sun motes, and soft warm lighting.
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

    // 36 ambient floating particles (petals, dandelion fluff, and golden sun motes)
    const particles = Array.from({ length: 36 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: 2 + Math.random() * 3.5,
      speedX: 0.35 + Math.random() * 0.65,
      speedY: 0.1 + Math.random() * 0.35,
      sway: Math.random() * Math.PI * 2,
      swaySpeed: 0.02 + Math.random() * 0.03,
      alpha: 0.3 + Math.random() * 0.5,
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
        const scale = Math.max(w / 1900, h / 1150, 0.75);
        // Village house & well center coordinates on the 4096x2304 map
        const targetFocusX = 1680;
        const targetFocusY = 980;
        const driftX = Math.sin(time * 0.25) * 8;
        const driftY = Math.cos(time * 0.2) * 6;

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

      // Warm relaxing golden-hour overlay with soft vignette
      const sunGrad = ctx.createRadialGradient(
        w * 0.5,
        h * 0.3,
        120,
        w * 0.5,
        h * 0.5,
        Math.max(w, h) * 0.75,
      );
      sunGrad.addColorStop(0, "rgba(255, 245, 210, 0.22)");
      sunGrad.addColorStop(0.4, "rgba(45, 106, 79, 0.42)");
      sunGrad.addColorStop(1, "rgba(12, 32, 22, 0.78)");
      ctx.fillStyle = sunGrad;
      ctx.fillRect(0, 0, w, h);

      // Animated floating petals and sun motes
      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY + Math.sin(p.sway) * 0.35;
        p.sway += p.swaySpeed;

        if (p.x > w + 20) p.x = -20;
        if (p.y > h + 20) p.y = -20;

        ctx.save();
        ctx.globalAlpha = p.alpha;
        if (p.type === "petal") {
          ctx.fillStyle = "#a7f3d0";
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, p.size * 1.6, p.size * 0.75, p.sway, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = "#fef08a";
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.7, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });
    };

    render();

    return () => {
      running = false;
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="ss-bg-canvas" />;
}

export function StartScreen({ onEnter }: Props) {
  const [mode, setMode] = useState<MenuMode>("main");
  const [selectedChar, setSelectedChar] = useState<CharacterOption>(CHARACTER_OPTIONS[0]);
  const [name, setName] = useState("Wanderer");
  const [entering, setEntering] = useState(false);
  const [bgmMuted, setBgmMuted] = useState(false);
  const [bgmVolume, setBgmVolume] = useState(0.45);
  const [sfxVolume, setSfxVolume] = useState(0.65);

  useEffect(() => {
    audioManager.init(DEFAULT_SETTINGS);
    const s = audioManager.getSettings();
    setBgmMuted(s.bgmMuted);
    setBgmVolume(s.bgmVolume);
    setSfxVolume(s.sfxVolume);
  }, []);

  const handleStartGame = useCallback(() => {
    const finalName = name.trim() || selectedChar.name;
    setEntering(true);
    audioManager.playJoin();
    audioManager.playBGM();
    setTimeout(() => {
      onEnter({ name: finalName, character: selectedChar });
    }, 600);
  }, [name, selectedChar, onEnter]);

  const selectCharacter = useCallback((char: CharacterOption) => {
    setSelectedChar(char);
    audioManager.playSelect();
  }, []);

  const randomizeName = useCallback(() => {
    audioManager.playClick();
    const pick = COZY_NAMES[Math.floor(Math.random() * COZY_NAMES.length)];
    setName(pick);
  }, []);

  const toggleMusic = useCallback(() => {
    audioManager.playClick();
    const muted = audioManager.toggleBGMMute();
    setBgmMuted(muted);
    if (!muted) {
      audioManager.playBGM();
    }
  }, []);

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

  return (
    <div className={`ss-root ${entering ? "ss-root--entering" : ""}`}>
      {/* 2D Meadow scenic background canvas */}
      <TitleBackgroundCanvas />

      {/* Top right quick atmospheric controls */}
      <div className="ss-top-bar">
        <button
          className={`ss-audio-pill ${bgmMuted ? "ss-audio-pill--muted" : ""}`}
          onClick={toggleMusic}
          title={bgmMuted ? "Turn music on" : "Turn music off"}
        >
          <span className="ss-audio-icon">{bgmMuted ? "🔇" : "🎵"}</span>
          <span className="ss-audio-label">{bgmMuted ? "Music: Off" : "Music: On"}</span>
        </button>
        <button
          className="ss-audio-pill"
          onClick={openSettings}
          title="Audio & Game Settings"
        >
          <span className="ss-audio-icon">⚙</span>
          <span className="ss-audio-label">Settings</span>
        </button>
      </div>

      {/* Main Title Container */}
      <div className="ss-main-container">
        {/* Title Header with classic 2D game aesthetics */}
        <header className="ss-header">
          <div className="ss-emblem">
            <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
              <rect x="3" y="3" width="28" height="28" rx="8" fill="#1b4332" stroke="#52b788" strokeWidth="2" />
              <circle cx="17" cy="17" r="7" fill="#52b788" opacity="0.3" />
              <path d="M17 9v16M9 17h16" stroke="#d8f3dc" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
          <h1 className="ss-game-title">OPENGATHER</h1>
          <p className="ss-game-tagline">~ A Peaceful Top-Down Journey ~</p>
        </header>

        {/* ─── Mode 1: Main Title Screen ─────────────────────────────────── */}
        {mode === "main" && (
          <div className="ss-card-stage ss-card-stage--pop">
            {/* Hero Spotlight Stage */}
            <div className="ss-hero-spotlight">
              <div className="ss-pedestal">
                <div className="ss-pedestal-ring" />
                <div className="ss-hero-sprite-box">
                  <img
                    src={`/characters/${selectedChar.folder}/playerDown.png`}
                    alt={selectedChar.name}
                    className="ss-hero-sprite-img"
                    draggable={false}
                  />
                </div>
              </div>

              <div className="ss-hero-info">
                <div className="ss-hero-badge" style={{ borderColor: selectedChar.color }}>
                  <span className="ss-badge-dot" style={{ backgroundColor: selectedChar.color }} />
                  <span className="ss-badge-title">{selectedChar.name}</span>
                </div>
                <p className="ss-hero-desc">{selectedChar.description}</p>
              </div>
            </div>

            {/* Quick Name Field */}
            <div className="ss-name-row">
              <span className="ss-name-prefix">Adventurer:</span>
              <div className="ss-name-input-wrapper">
                <input
                  type="text"
                  className="ss-name-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={18}
                  placeholder="Your Name"
                  spellCheck={false}
                />
                <button
                  className="ss-dice-btn"
                  onClick={randomizeName}
                  title="Randomize cozy name"
                >
                  🎲
                </button>
              </div>
            </div>

            {/* Main 2D Game Menu Actions */}
            <div className="ss-menu-actions">
              <button
                className="ss-btn ss-btn--play"
                onClick={handleStartGame}
                disabled={entering}
              >
                <span className="ss-btn-icon">▶</span>
                <span className="ss-btn-text">
                  {entering ? "Entering Meadow…" : "Enter World"}
                </span>
              </button>

              <div className="ss-btn-row">
                <button className="ss-btn ss-btn--sub" onClick={openRoster}>
                  <span className="ss-btn-sub-icon">👤</span>
                  <span>Change Hero</span>
                </button>
                <button className="ss-btn ss-btn--sub" onClick={openControls}>
                  <span className="ss-btn-sub-icon">❓</span>
                  <span>How to Play</span>
                </button>
              </div>
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

            {/* 7 Characters Grid including classic Wanderer */}
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
                    {isSelected && <div className="ss-roster-active-badge">✓</div>}
                  </button>
                );
              })}
            </div>

            {/* Selected Hero Preview Summary */}
            <div className="ss-roster-summary">
              <span className="ss-badge-dot" style={{ backgroundColor: selectedChar.color }} />
              <strong>{selectedChar.name}:</strong>
              <span>{selectedChar.description}</span>
            </div>

            <button className="ss-btn ss-btn--play" onClick={handleStartGame}>
              <span>Confirm & Enter World ▶</span>
            </button>
          </div>
        )}

        {/* ─── Mode 3: Settings ─────────────────────────────────────────── */}
        {mode === "settings" && (
          <div className="ss-card-stage ss-card-stage--dialog">
            <div className="ss-stage-header">
              <button className="ss-back-link" onClick={backToMain}>
                ← Back
              </button>
              <h2 className="ss-stage-title">⚙️ Audio & Ambience</h2>
            </div>

            <div className="ss-settings-body">
              <div className="ss-setting-row">
                <span className="ss-setting-label">🎵 Peaceful Music</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={bgmMuted ? 0 : bgmVolume}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setBgmVolume(v);
                    setBgmMuted(v === 0);
                    audioManager.setBGMVolume(v);
                  }}
                  className="ss-slider"
                />
                <span className="ss-pct">{Math.round((bgmMuted ? 0 : bgmVolume) * 100)}%</span>
              </div>

              <div className="ss-setting-row">
                <span className="ss-setting-label">🔔 Sound Effects</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={sfxVolume}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setSfxVolume(v);
                    audioManager.setSFXVolume(v);
                    audioManager.playClick();
                  }}
                  className="ss-slider"
                />
                <span className="ss-pct">{Math.round(sfxVolume * 100)}%</span>
              </div>
            </div>

            <button className="ss-btn ss-btn--sub" onClick={backToMain}>
              Done
            </button>
          </div>
        )}

        {/* ─── Mode 4: Controls ─────────────────────────────────────────── */}
        {mode === "controls" && (
          <div className="ss-card-stage ss-card-stage--dialog">
            <div className="ss-stage-header">
              <button className="ss-back-link" onClick={backToMain}>
                ← Back
              </button>
              <h2 className="ss-stage-title">🎮 How to Play</h2>
            </div>

            <div className="ss-controls-list">
              <div className="ss-control-item">
                <div className="ss-keys">
                  <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd>
                </div>
                <span>Walk in four directions through the world</span>
              </div>
              <div className="ss-control-item">
                <div className="ss-keys">
                  <kbd>Double Click</kbd>
                </div>
                <span>Auto-walk pathfinding to clicked tile</span>
              </div>
              <div className="ss-control-item">
                <div className="ss-keys">
                  <kbd>+</kbd><kbd>-</kbd><kbd>Scroll</kbd>
                </div>
                <span>Zoom camera closer or panoramic</span>
              </div>
              <div className="ss-control-item">
                <div className="ss-keys">
                  <kbd>?</kbd>
                </div>
                <span>Toggle in-game controls overlay anytime</span>
              </div>
            </div>

            <button className="ss-btn ss-btn--sub" onClick={backToMain}>
              Got It
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
