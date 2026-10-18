import { useState, useCallback, useEffect } from "react";
import type { GameSettings } from "../game/gameContext";
import { audioManager } from "../game/audioManager";
import "./GameHUD.css";

type Props = {
  playerName: string;
  settings: GameSettings;
  onUpdateSettings: (partial: Partial<GameSettings>) => void;
  fps?: number;
  onExitWorld?: () => void;
  onTeleportToWell?: () => void;
  onSaveGame?: () => void;
};

// ─── Controls Reference ─────────────────────────────────────────────────────
const CONTROLS = [
  { keys: ["W", "A", "S", "D"], desc: "Move character" },
  { keys: ["E"], desc: "Interact with NPC or object" },
  { keys: ["B", "I"], desc: "Open traveler's bag / satchel" },
  { keys: ["Double-click"], desc: "Walk to destination (pathfinding)" },
  { keys: ["+", "="], desc: "Zoom in camera" },
  { keys: ["-", "_"], desc: "Zoom out camera" },
  { keys: ["Scroll"], desc: "Zoom in / out" },
  { keys: ["?"], desc: "Toggle controls help" },
  { keys: ["Esc"], desc: "Close menus & dialogues" },
];

// ─── Volume Slider ──────────────────────────────────────────────────────────
function VolumeSlider({
  label,
  value,
  muted,
  onVolume,
  onToggleMute,
  icon,
}: {
  label: string;
  value: number;
  muted: boolean;
  onVolume: (v: number) => void;
  onToggleMute: () => void;
  icon: string;
}) {
  return (
    <div className="hud-vol-row">
      <button
        className={`hud-mute-btn ${muted ? "hud-mute-btn--muted" : ""}`}
        onClick={onToggleMute}
        title={muted ? "Unmute" : "Mute"}
      >
        {icon}
      </button>
      <span className="hud-vol-label">{label}</span>
      <input
        type="range"
        min={0}
        max={1}
        step={0.02}
        value={muted ? 0 : value}
        onChange={(e) => onVolume(parseFloat(e.target.value))}
        className="hud-slider"
      />
      <span className="hud-vol-pct">{Math.round((muted ? 0 : value) * 100)}%</span>
    </div>
  );
}

// ─── Settings Modal with Tabs ───────────────────────────────────────────────
type TabType = "audio" | "gameplay" | "graphics" | "session";

function SettingsModal({
  settings,
  onUpdate,
  onClose,
  onExitWorld,
  onTeleportToWell,
  onSaveGame,
}: {
  settings: GameSettings;
  onUpdate: (p: Partial<GameSettings>) => void;
  onClose: () => void;
  onExitWorld?: () => void;
  onTeleportToWell?: () => void;
  onSaveGame?: () => void;
}) {
  const [activeTab, setActiveTab] = useState<TabType>("audio");
  const [saveToast, setSaveToast] = useState(false);

  const handleBgmVolume = useCallback(
    (v: number) => {
      onUpdate({ bgmVolume: v, bgmMuted: v === 0 });
      audioManager.setBGMVolume(v);
    },
    [onUpdate],
  );

  const handleSfxVolume = useCallback(
    (v: number) => {
      onUpdate({ sfxVolume: v, sfxMuted: v === 0 });
      audioManager.setSFXVolume(v);
    },
    [onUpdate],
  );

  const handleToggleBgmMute = useCallback(() => {
    const muted = audioManager.toggleBGMMute();
    onUpdate({ bgmMuted: muted });
  }, [onUpdate]);

  const handleToggleSfxMute = useCallback(() => {
    const muted = audioManager.toggleSFXMute();
    onUpdate({ sfxMuted: muted });
  }, [onUpdate]);

  const handleSave = () => {
    if (onSaveGame) onSaveGame();
    audioManager.playJoin();
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2400);
  };

  return (
    <div className="hud-modal-overlay" onClick={onClose}>
      <div
        className="hud-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
      >
        <div className="hud-modal-header">
          <h2 className="hud-modal-title">⚙️ Game Options</h2>
          <button className="hud-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Tab Headers */}
        <div className="hud-tabs">
          <button
            className={`hud-tab-btn ${activeTab === "audio" ? "hud-tab-btn--active" : ""}`}
            onClick={() => setActiveTab("audio")}
          >
            🔊 Audio
          </button>
          <button
            className={`hud-tab-btn ${activeTab === "gameplay" ? "hud-tab-btn--active" : ""}`}
            onClick={() => setActiveTab("gameplay")}
          >
            🎮 Controls
          </button>
          <button
            className={`hud-tab-btn ${activeTab === "graphics" ? "hud-tab-btn--active" : ""}`}
            onClick={() => setActiveTab("graphics")}
          >
            🌿 Display
          </button>
          <button
            className={`hud-tab-btn ${activeTab === "session" ? "hud-tab-btn--active" : ""}`}
            onClick={() => setActiveTab("session")}
          >
            💾 System
          </button>
        </div>

        <div className="hud-modal-body">
          {/* TAB 1: AUDIO */}
          {activeTab === "audio" && (
            <section className="hud-section">
              <h3 className="hud-section-title">Sound & Music Levels</h3>
              <VolumeSlider
                label="Music"
                value={settings.bgmVolume}
                muted={settings.bgmMuted}
                onVolume={handleBgmVolume}
                onToggleMute={handleToggleBgmMute}
                icon={settings.bgmMuted ? "🔇" : "🎵"}
              />
              <VolumeSlider
                label="Sounds"
                value={settings.sfxVolume}
                muted={settings.sfxMuted}
                onVolume={handleSfxVolume}
                onToggleMute={handleToggleSfxMute}
                icon={settings.sfxMuted ? "🔇" : "🔔"}
              />
              <label className="hud-toggle-row">
                <span className="hud-toggle-label">Grass Footsteps Audio</span>
                <div
                  className={`hud-toggle ${settings.footstepsEnabled ? "hud-toggle--on" : ""}`}
                  onClick={() => onUpdate({ footstepsEnabled: !settings.footstepsEnabled })}
                >
                  <div className="hud-toggle-knob" />
                </div>
              </label>
            </section>
          )}

          {/* TAB 2: GAMEPLAY */}
          {activeTab === "gameplay" && (
            <section className="hud-section">
              <h3 className="hud-section-title">Movement Pace</h3>
              <div className="hud-segment-group">
                <button
                  className={`hud-segment-btn ${settings.moveSpeed === "walk" ? "hud-segment-btn--active" : ""}`}
                  onClick={() => onUpdate({ moveSpeed: "walk" })}
                >
                  🚶 Stroll (Slow)
                </button>
                <button
                  className={`hud-segment-btn ${settings.moveSpeed === "jog" ? "hud-segment-btn--active" : ""}`}
                  onClick={() => onUpdate({ moveSpeed: "jog" })}
                >
                  🏃 Jog (Standard)
                </button>
                <button
                  className={`hud-segment-btn ${settings.moveSpeed === "swift" ? "hud-segment-btn--active" : ""}`}
                  onClick={() => onUpdate({ moveSpeed: "swift" })}
                >
                  ⚡ Swift (Fast)
                </button>
              </div>

              <h3 className="hud-section-title" style={{ marginTop: "10px" }}>Pathfinding & Clicks</h3>
              <label className="hud-toggle-row">
                <span className="hud-toggle-label">Double-Click Auto-Walk</span>
                <div
                  className={`hud-toggle ${settings.clickToMove ? "hud-toggle--on" : ""}`}
                  onClick={() => onUpdate({ clickToMove: !settings.clickToMove })}
                >
                  <div className="hud-toggle-knob" />
                </div>
              </label>
            </section>
          )}

          {/* TAB 3: GRAPHICS / DISPLAY */}
          {activeTab === "graphics" && (
            <section className="hud-section">
              <h3 className="hud-section-title">Camera Zoom Presets</h3>
              <div className="hud-segment-group">
                <button
                  className={`hud-segment-btn ${settings.zoomLevel === 0.8 ? "hud-segment-btn--active" : ""}`}
                  onClick={() => onUpdate({ zoomLevel: 0.8 })}
                >
                  0.8x Wide
                </button>
                <button
                  className={`hud-segment-btn ${settings.zoomLevel === 1.0 ? "hud-segment-btn--active" : ""}`}
                  onClick={() => onUpdate({ zoomLevel: 1.0 })}
                >
                  1.0x Normal
                </button>
                <button
                  className={`hud-segment-btn ${settings.zoomLevel === 1.25 ? "hud-segment-btn--active" : ""}`}
                  onClick={() => onUpdate({ zoomLevel: 1.25 })}
                >
                  1.25x Cozy
                </button>
                <button
                  className={`hud-segment-btn ${settings.zoomLevel === 1.5 ? "hud-segment-btn--active" : ""}`}
                  onClick={() => onUpdate({ zoomLevel: 1.5 })}
                >
                  1.5x Close
                </button>
              </div>

              <h3 className="hud-section-title" style={{ marginTop: "10px" }}>Environment & HUD</h3>
              <label className="hud-toggle-row">
                <span className="hud-toggle-label">Ambient Leaves & Fireflies</span>
                <div
                  className={`hud-toggle ${settings.particlesEnabled ? "hud-toggle--on" : ""}`}
                  onClick={() => onUpdate({ particlesEnabled: !settings.particlesEnabled })}
                >
                  <div className="hud-toggle-knob" />
                </div>
              </label>
              <label className="hud-toggle-row">
                <span className="hud-toggle-label">Show FPS Monitor</span>
                <div
                  className={`hud-toggle ${settings.showFps ? "hud-toggle--on" : ""}`}
                  onClick={() => onUpdate({ showFps: !settings.showFps })}
                >
                  <div className="hud-toggle-knob" />
                </div>
              </label>
              <label className="hud-toggle-row">
                <span className="hud-toggle-label">Character Nameplates</span>
                <div
                  className={`hud-toggle ${settings.showNameplates ? "hud-toggle--on" : ""}`}
                  onClick={() => onUpdate({ showNameplates: !settings.showNameplates })}
                >
                  <div className="hud-toggle-knob" />
                </div>
              </label>
            </section>
          )}

          {/* TAB 4: SESSION */}
          {activeTab === "session" && (
            <section className="hud-section">
              <h3 className="hud-section-title">Save & Checkpoint</h3>
              <button className="hud-btn hud-btn--save" onClick={handleSave}>
                💾 Save Game Progress
              </button>
              {saveToast && (
                <div style={{ color: "#86efac", fontSize: "0.78rem", textAlign: "center", fontWeight: 700 }}>
                  ✓ Progress, inventory & quests saved!
                </div>
              )}

              <h3 className="hud-section-title" style={{ marginTop: "10px" }}>World Helpers</h3>
              {onTeleportToWell && (
                <button
                  className="hud-btn hud-btn--unstuck"
                  onClick={() => {
                    audioManager.playClick();
                    onTeleportToWell();
                    onClose();
                  }}
                >
                  🧭 Return to Ancient Well (Unstuck)
                </button>
              )}

              {onExitWorld && (
                <button
                  className="hud-btn hud-btn--leave"
                  onClick={() => {
                    audioManager.playClick();
                    onClose();
                    onExitWorld();
                  }}
                >
                  🚪 Return to Title Menu
                </button>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Controls Help Modal ───────────────────────────────────────────────────
function ControlsModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="hud-modal-overlay" onClick={onClose}>
      <div
        className="hud-modal hud-modal--controls"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Controls"
      >
        <div className="hud-modal-header">
          <h2 className="hud-modal-title">🎮 Keybindings</h2>
          <button className="hud-close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="hud-modal-body">
          <table className="hud-controls-table">
            <tbody>
              {CONTROLS.map(({ keys, desc }, i) => (
                <tr key={i} className="hud-ctrl-row">
                  <td className="hud-ctrl-keys">
                    {keys.map((k) => (
                      <kbd key={k} className="hud-kbd">{k}</kbd>
                    ))}
                  </td>
                  <td className="hud-ctrl-desc">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="hud-tip">
            <span>💡</span>
            <span>Walk up to NPCs or landmarks and press [E] to talk or inspect.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Game HUD ─────────────────────────────────────────────────────────
export function GameHUD({
  playerName: _playerName,
  settings,
  onUpdateSettings,
  fps,
  onExitWorld,
  onTeleportToWell,
  onSaveGame,
}: Props) {
  const [showSettings, setShowSettings] = useState(false);
  const [showControls, setShowControls] = useState(false);

  const openSettings = useCallback(() => {
    audioManager.playOpen();
    setShowSettings(true);
    setShowControls(false);
  }, []);

  const openControls = useCallback(() => {
    setShowControls((v) => {
      if (!v) audioManager.playOpen();
      else audioManager.playClose();
      return !v;
    });
    setShowSettings(false);
  }, []);

  const closeAll = useCallback(() => {
    setShowSettings(false);
    setShowControls(false);
    audioManager.playClose();
  }, []);

  // Global key listener for ? and Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === "?" || e.key === "/") {
        e.preventDefault();
        openControls();
      }
      if (e.key === "Escape") {
        closeAll();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [openControls, closeAll]);

  return (
    <>
      {/* Top-Right Minimal HUD Bar */}
      <div className="hud-bar">
        {settings.showFps && fps !== undefined && (
          <div className="hud-fps">{fps} FPS</div>
        )}
        <button
          id="hud-controls-btn"
          className={`hud-icon-btn ${showControls ? "hud-icon-btn--active" : ""}`}
          onClick={openControls}
          title="Controls (?)"
          aria-label="Show controls"
        >
          ?
        </button>
        <button
          id="hud-settings-btn"
          className={`hud-icon-btn ${showSettings ? "hud-icon-btn--active" : ""}`}
          onClick={openSettings}
          title="Settings & Options"
          aria-label="Open settings"
        >
          ⚙
        </button>
        {onExitWorld && (
          <button
            id="hud-exit-btn"
            className="hud-icon-btn hud-icon-btn--exit"
            onClick={() => {
              audioManager.playClick();
              onExitWorld();
            }}
            title="Leave World to Title"
            aria-label="Leave world"
          >
            🚪
          </button>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          settings={settings}
          onUpdate={onUpdateSettings}
          onClose={closeAll}
          onExitWorld={onExitWorld}
          onTeleportToWell={onTeleportToWell}
          onSaveGame={onSaveGame}
        />
      )}

      {/* Controls Modal */}
      {showControls && <ControlsModal onClose={closeAll} />}
    </>
  );
}
