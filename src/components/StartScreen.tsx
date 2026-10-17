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

const MAX_NAME_LENGTH = 18;

export function StartScreen({ onEnter }: Props) {
  const [step, setStep] = useState<"character" | "name">("character");
  const [selectedChar, setSelectedChar] = useState<CharacterOption>(
    CHARACTER_OPTIONS[0],
  );
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  const [charIdx, setCharIdx] = useState(0);
  const [entering, setEntering] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [starField] = useState(() =>
    Array.from({ length: 60 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 0.5 + Math.random() * 1.5,
      delay: Math.random() * 4,
      duration: 2 + Math.random() * 3,
    }))
  );

  // Init audio on first mount (needs user interaction via clicking)
  useEffect(() => {
    audioManager.init(DEFAULT_SETTINGS);
  }, []);

  const handleSelectChar = useCallback(
    (char: CharacterOption, idx: number) => {
      setSelectedChar(char);
      setCharIdx(idx);
      audioManager.playSFX("click");
    },
    [],
  );

  const handleNext = useCallback(() => {
    audioManager.playSFX("click");
    setStep("name");
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleBack = useCallback(() => {
    audioManager.playSFX("click");
    setStep("character");
    setNameError("");
  }, []);

  const handleEnter = useCallback(() => {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError("Please enter a name.");
      return;
    }
    if (trimmed.length < 2) {
      setNameError("Name must be at least 2 characters.");
      return;
    }
    setNameError("");
    setEntering(true);
    audioManager.playSFX("join");
    audioManager.playBGM();
    setTimeout(() => {
      onEnter({ name: trimmed, character: selectedChar });
    }, 700);
  }, [name, selectedChar, onEnter]);

  const handleNameKey = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") handleEnter();
      if (e.key === "Escape") handleBack();
    },
    [handleEnter, handleBack],
  );

  const prevChar = useCallback(() => {
    const idx = (charIdx - 1 + CHARACTER_OPTIONS.length) % CHARACTER_OPTIONS.length;
    handleSelectChar(CHARACTER_OPTIONS[idx], idx);
  }, [charIdx, handleSelectChar]);

  const nextChar = useCallback(() => {
    const idx = (charIdx + 1) % CHARACTER_OPTIONS.length;
    handleSelectChar(CHARACTER_OPTIONS[idx], idx);
  }, [charIdx, handleSelectChar]);

  return (
    <div className={`ss-root ${entering ? "ss-entering" : ""}`}>
      {/* Starfield background */}
      <div className="ss-stars">
        {starField.map((star, i) => (
          <div
            key={i}
            className="ss-star"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: star.size,
              height: star.size,
              animationDelay: `${star.delay}s`,
              animationDuration: `${star.duration}s`,
            }}
          />
        ))}
      </div>

      {/* Gradient orbs */}
      <div className="ss-orb ss-orb1" />
      <div className="ss-orb ss-orb2" />
      <div className="ss-orb ss-orb3" />

      {/* Main Card */}
      <div className="ss-card">
        {/* Logo / Title */}
        <div className="ss-logo">
          <div className="ss-logo-icon">🌍</div>
          <h1 className="ss-title">OpenGather</h1>
          <p className="ss-subtitle">A world of your own — together.</p>
        </div>

        {/* Step: Character Selection */}
        {step === "character" && (
          <div className="ss-step ss-step-char">
            <h2 className="ss-step-heading">Choose your character</h2>

            {/* Featured character display */}
            <div className="ss-char-featured">
              <button className="ss-arrow-btn" onClick={prevChar} aria-label="Previous character">
                ‹
              </button>
              <div
                className="ss-char-avatar-big"
                style={{ "--char-color": selectedChar.color } as React.CSSProperties}
              >
                <img
                  src={`/characters/${selectedChar.folder}/playerDown.png`}
                  alt={selectedChar.name}
                  className="ss-char-sprite-big"
                />
                <div className="ss-char-glow" />
              </div>
              <button className="ss-arrow-btn" onClick={nextChar} aria-label="Next character">
                ›
              </button>
            </div>

            <div className="ss-char-info">
              <span
                className="ss-char-name-badge"
                style={{ "--char-color": selectedChar.color } as React.CSSProperties}
              >
                {selectedChar.name}
              </span>
              <p className="ss-char-desc">{selectedChar.description}</p>
            </div>

            {/* Character grid thumbnails */}
            <div className="ss-char-grid">
              {CHARACTER_OPTIONS.map((char, idx) => (
                <button
                  key={char.id}
                  className={`ss-char-thumb ${idx === charIdx ? "ss-char-thumb--active" : ""}`}
                  onClick={() => handleSelectChar(char, idx)}
                  style={
                    {
                      "--char-color": char.color,
                    } as React.CSSProperties
                  }
                  title={char.name}
                >
                  <img
                    src={`/characters/${char.folder}/playerDown.png`}
                    alt={char.name}
                    className="ss-char-thumb-img"
                  />
                </button>
              ))}
            </div>

            <button className="ss-btn ss-btn-primary" onClick={handleNext}>
              Continue →
            </button>
          </div>
        )}

        {/* Step: Name Entry */}
        {step === "name" && (
          <div className="ss-step ss-step-name">
            <div className="ss-mini-char" style={{ "--char-color": selectedChar.color } as React.CSSProperties}>
              <img
                src={`/characters/${selectedChar.folder}/playerDown.png`}
                alt={selectedChar.name}
                className="ss-mini-sprite"
              />
              <span className="ss-mini-name">{selectedChar.name}</span>
            </div>

            <h2 className="ss-step-heading">What's your name?</h2>
            <p className="ss-step-hint">This is how others will see you in the world.</p>

            <div className="ss-name-field-wrap">
              <input
                ref={inputRef}
                type="text"
                className={`ss-name-input ${nameError ? "ss-name-input--error" : ""}`}
                placeholder="Enter your name…"
                value={name}
                maxLength={MAX_NAME_LENGTH}
                onChange={(e) => {
                  setName(e.target.value);
                  if (nameError) setNameError("");
                }}
                onKeyDown={handleNameKey}
              />
              <span className="ss-name-counter">
                {name.length}/{MAX_NAME_LENGTH}
              </span>
            </div>
            {nameError && <p className="ss-name-error">{nameError}</p>}

            <div className="ss-row">
              <button className="ss-btn ss-btn-ghost" onClick={handleBack}>
                ← Back
              </button>
              <button className="ss-btn ss-btn-primary" onClick={handleEnter}>
                Enter World 🌍
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="ss-footer">
        OpenGather · Use WASD or double-click to move · Press ? for controls
      </p>
    </div>
  );
}
