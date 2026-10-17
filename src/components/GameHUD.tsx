import { useState, useCallback, useEffect } from "react";
import type { GameSettings } from "../game/gameContext";
import { audioManager } from "../game/audioManager";
import "./GameHUD.css";

type Props = {
  playerName: string;
  settings: GameSettings;
  onUpdateSettings: (partial: Partial<GameSettings>) => void;
  fps?: number;
};

// ─── Controls reference ───────────────────────────────────────────────────

const CONTROLS = [
  { keys: ["W", "A", "S", "D"], desc: "Move character" },
  { keys: ["Double-click"], desc: "Move to location (pathfinding)" },
  { keys: ["+", "="], desc: "Zoom in" },
  { keys: ["-"], desc: "Zoom out" },
  { keys: ["Scroll"], desc: "Zoom in / out" },
  { keys: ["?"], desc: "Toggle controls help" },
  { keys: ["Esc"], desc: "Close modals" },
];

// ─── Volume Slider ────────────────────────────────────────────────────────

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

// ─── Settings Modal ───────────────────────────────────────────────────────

function SettingsModal({
  settings,
  onUpdate,
  onClose,
}: {
  settings: GameSettings;
  onUpdate: (p: Partial<GameSettings>) => void;
  onClose: () => void;
}) {
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
          <h2 className="hud-modal-title">⚙️ Settings</h2>
          <button className="hud-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="hud-modal-body">
          <section className="hud-section">
            <h3 className="hud-section-title">🔊 Audio</h3>
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
          </section>

          <section className="hud-section">
            <h3 className="hud-section-title">🎮 Display</h3>
            <label className="hud-toggle-row">
              <span className="hud-toggle-label">Show FPS</span>
              <div
                className={`hud-toggle ${settings.showFps ? "hud-toggle--on" : ""}`}
                onClick={() => onUpdate({ showFps: !settings.showFps })}
                role="switch"
                aria-checked={settings.showFps}
              >
                <div className="hud-toggle-knob" />
              </div>
            </label>
            <label className="hud-toggle-row">
              <span className="hud-toggle-label">Show Nameplates</span>
              <div
                className={`hud-toggle ${settings.showNameplates ? "hud-toggle--on" : ""}`}
                onClick={() => onUpdate({ showNameplates: !settings.showNameplates })}
                role="switch"
                aria-checked={settings.showNameplates}
              >
                <div className="hud-toggle-knob" />
              </div>
            </label>
          </section>
        </div>
      </div>
    </div>
  );
}

// ─── Controls Modal ───────────────────────────────────────────────────────

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
          <h2 className="hud-modal-title">🎮 Controls</h2>
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
            <span className="hud-tip-icon">💡</span>
            <span>Double-click anywhere on the map to walk there automatically.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main HUD ─────────────────────────────────────────────────────────────

export function GameHUD({ playerName, settings, onUpdateSettings, fps }: Props) {
  const [showSettings, setShowSettings] = useState(false);
  const [showControls, setShowControls] = useState(false);

  const openSettings = useCallback(() => {
    audioManager.playSFX("click");
    setShowSettings(true);
    setShowControls(false);
  }, []);

  const openControls = useCallback(() => {
    audioManager.playSFX("click");
    setShowControls((v) => !v);
    setShowSettings(false);
  }, []);

  const closeAll = useCallback(() => {
    setShowSettings(false);
    setShowControls(false);
  }, []);

  // Global key listener for ? and Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "?" || e.key === "/") {
        e.preventDefault();
        setShowControls((v) => !v);
        setShowSettings(false);
      }
      if (e.key === "Escape") {
        closeAll();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [closeAll]);

  return (
    <>
      {/* Top-right HUD bar */}
      <div className="hud-bar">
        {settings.showFps && fps !== undefined && (
          <div className="hud-fps">{fps} FPS</div>
        )}
        <div className="hud-player-chip">
          <span className="hud-player-dot" />
          <span className="hud-player-name">{playerName}</span>
        </div>
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
          title="Settings"
          aria-label="Open settings"
        >
          ⚙
        </button>
      </div>

      {/* Modals */}
      {showSettings && (
        <SettingsModal
          settings={settings}
          onUpdate={onUpdateSettings}
          onClose={closeAll}
        />
      )}
      {showControls && <ControlsModal onClose={closeAll} />}
    </>
  );
}
