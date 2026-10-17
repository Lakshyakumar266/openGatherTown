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
  const [selectedChar, setSelectedChar] = useState<CharacterOption>(CHARACTER_OPTIONS[0]);
  const [charIdx, setCharIdx] = useState(0);
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  const [entering, setEntering] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    audioManager.init(DEFAULT_SETTINGS);
  }, []);

  const selectChar = useCallback((char: CharacterOption, idx: number) => {
    setSelectedChar(char);
    setCharIdx(idx);
    audioManager.playSelect();
  }, []);

  const prevChar = useCallback(() => {
    const idx = (charIdx - 1 + CHARACTER_OPTIONS.length) % CHARACTER_OPTIONS.length;
    selectChar(CHARACTER_OPTIONS[idx], idx);
  }, [charIdx, selectChar]);

  const nextChar = useCallback(() => {
    const idx = (charIdx + 1) % CHARACTER_OPTIONS.length;
    selectChar(CHARACTER_OPTIONS[idx], idx);
  }, [charIdx, selectChar]);

  const goToName = useCallback(() => {
    audioManager.playClick();
    setStep("name");
    setTimeout(() => inputRef.current?.focus(), 80);
  }, []);

  const goBack = useCallback(() => {
    audioManager.playClick();
    setStep("character");
    setNameError("");
  }, []);

  const handleEnter = useCallback(() => {
    const trimmed = name.trim();
    if (!trimmed) { setNameError("Please enter your name."); return; }
    if (trimmed.length < 2) { setNameError("At least 2 characters required."); return; }
    setNameError("");
    setEntering(true);
    audioManager.playJoin();
    audioManager.playBGM();
    setTimeout(() => {
      onEnter({ name: trimmed, character: selectedChar });
    }, 650);
  }, [name, selectedChar, onEnter]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") handleEnter();
      if (e.key === "Escape") goBack();
    },
    [handleEnter, goBack],
  );

  return (
    <div className={`ss ${entering ? "ss--out" : ""}`}>
      {/* Split layout */}
      <div className="ss-left">
        <div className="ss-brand">
          <div className="ss-logo">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="13" stroke="#2d6a4f" strokeWidth="2"/>
              <circle cx="14" cy="14" r="6" fill="#2d6a4f" opacity="0.25"/>
              <circle cx="14" cy="14" r="2.5" fill="#2d6a4f"/>
            </svg>
            <span className="ss-brand-name">OpenGather</span>
          </div>
          <p className="ss-tagline">A shared world,<br/>yours to explore.</p>
        </div>

        {/* Character preview area */}
        <div className="ss-preview">
          <div className="ss-preview-scene">
            {/* Grass dots decoration */}
            <div className="ss-grass" />
            <div
              className="ss-char-display"
              style={{ "--cc": selectedChar.color } as React.CSSProperties}
            >
              <div className="ss-char-shadow" />
              <div className="ss-char-sprite">
                <img
                  src={`/characters/${selectedChar.folder}/playerDown.png`}
                  alt={selectedChar.name}
                  draggable={false}
                />
              </div>
            </div>
          </div>

          <div className="ss-char-label">
            <span className="ss-char-dot" style={{ background: selectedChar.color }} />
            <strong>{selectedChar.name}</strong>
            <span className="ss-char-desc-sm">{selectedChar.description}</span>
          </div>
        </div>

        <p className="ss-hint">WASD to move · Double-click to explore · ? for controls</p>
      </div>

      <div className="ss-right">
        {step === "character" && (
          <div className="ss-panel" key="char">
            <h1 className="ss-heading">Pick your character</h1>
            <p className="ss-sub">You can always change this later.</p>

            {/* Grid */}
            <div className="ss-grid">
              {CHARACTER_OPTIONS.map((c, i) => (
                <button
                  key={c.id}
                  className={`ss-card ${i === charIdx ? "ss-card--active" : ""}`}
                  onClick={() => selectChar(c, i)}
                  style={{ "--cc": c.color } as React.CSSProperties}
                >
                  <div className="ss-card-sprite">
                    <img
                      src={`/characters/${c.folder}/playerDown.png`}
                      alt={c.name}
                      draggable={false}
                    />
                  </div>
                  <span className="ss-card-name">{c.name}</span>
                  {i === charIdx && <div className="ss-card-ring" />}
                </button>
              ))}
            </div>

            {/* Carousel arrows */}
            <div className="ss-nav">
              <button className="ss-nav-btn" onClick={prevChar}>←</button>
              <span className="ss-nav-dots">
                {CHARACTER_OPTIONS.map((_, i) => (
                  <span key={i} className={`ss-dot ${i === charIdx ? "ss-dot--on" : ""}`} />
                ))}
              </span>
              <button className="ss-nav-btn" onClick={nextChar}>→</button>
            </div>

            <button className="ss-cta" onClick={goToName}>
              Continue
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        )}

        {step === "name" && (
          <div className="ss-panel" key="name">
            <button className="ss-back" onClick={goBack}>← Back</button>
            <h1 className="ss-heading">What's your name?</h1>
            <p className="ss-sub">This is what others will see above your character.</p>

            <div className="ss-field">
              <input
                ref={inputRef}
                type="text"
                className={`ss-input ${nameError ? "ss-input--err" : ""}`}
                placeholder="Your name here…"
                value={name}
                maxLength={MAX_NAME_LENGTH}
                onChange={(e) => { setName(e.target.value); if (nameError) setNameError(""); }}
                onKeyDown={onKeyDown}
                autoComplete="off"
                spellCheck={false}
              />
              <span className="ss-counter">{name.length}/{MAX_NAME_LENGTH}</span>
            </div>
            {nameError && <p className="ss-err">{nameError}</p>}

            <button className="ss-cta" onClick={handleEnter} disabled={entering}>
              {entering ? "Entering…" : "Enter World"}
              {!entering && (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
