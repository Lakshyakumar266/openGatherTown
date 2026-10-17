import { useEffect, useState, useCallback, useRef } from "react";
import type { DialogueNode, DialogueOption } from "../game/story";
import { audioManager } from "../game/audioManager";
import "./DialogueBox.css";

type Props = {
  node: DialogueNode;
  onSelectOption: (option: DialogueOption) => void;
  onClose: () => void;
};

export function DialogueBox({ node, onSelectOption, onClose }: Props) {
  const [displayedChars, setDisplayedChars] = useState(0);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [canSelect, setCanSelect] = useState(false);
  const fullText = node.text;
  const isTyping = displayedChars < fullText.length;
  const timerRef = useRef<number | null>(null);

  // Reset & Typewriter effect whenever node.id or text changes
  useEffect(() => {
    setDisplayedChars(0);
    setFocusedIndex(0);
    setCanSelect(false);
    let index = 0;

    const tick = () => {
      index += 2;
      if (index >= fullText.length) {
        setDisplayedChars(fullText.length);
        setCanSelect(true);
      } else {
        setDisplayedChars(index);
        timerRef.current = window.setTimeout(tick, 18);
      }
    };

    timerRef.current = window.setTimeout(tick, 18);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [node.id, fullText]);

  // When skipping typewriter effect
  const handleSkipTyping = useCallback(() => {
    if (isTyping) {
      if (timerRef.current) clearTimeout(timerRef.current);
      setDisplayedChars(fullText.length);
      audioManager.playClick();
      // Brief debounce before accepting keyboard selection
      setTimeout(() => setCanSelect(true), 120);
    }
  }, [isTyping, fullText.length]);

  const handleChoice = useCallback(
    (opt: DialogueOption) => {
      audioManager.playSelect();
      onSelectOption(opt);
    },
    [onSelectOption],
  );

  // Keyboard navigation:
  // - Escape: Close dialogue
  // - Space: Skip typewriter animation
  // - Numbers (1-9): Direct choice selection (when text is revealed)
  // - ArrowUp / ArrowDown: Change focused choice
  // - Enter: Select the currently focused choice (when text is revealed)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        audioManager.playClose();
        onClose();
        return;
      }

      // Space only skips typewriter text, never auto-selects choice
      if (e.key === " ") {
        if (isTyping) {
          e.preventDefault();
          handleSkipTyping();
        }
        return;
      }

      // Enter skips typing if typing, or selects focused option if text is fully shown
      if (e.key === "Enter") {
        e.preventDefault();
        if (isTyping) {
          handleSkipTyping();
        } else if (canSelect && node.options.length > 0) {
          const selected = node.options[focusedIndex] || node.options[0];
          handleChoice(selected);
        }
        return;
      }

      // Arrow navigation across choices
      if (!isTyping && node.options.length > 0) {
        if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
          e.preventDefault();
          audioManager.playSelect();
          setFocusedIndex((prev) => (prev + 1) % node.options.length);
          return;
        }
        if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
          e.preventDefault();
          audioManager.playSelect();
          setFocusedIndex((prev) => (prev - 1 + node.options.length) % node.options.length);
          return;
        }
      }

      // Number keys 1-9
      const num = parseInt(e.key, 10);
      if (!isNaN(num) && num >= 1 && num <= node.options.length) {
        e.preventDefault();
        handleChoice(node.options[num - 1]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isTyping, canSelect, handleSkipTyping, handleChoice, onClose, node.options, focusedIndex]);

  const isPortraitImage = node.portrait.startsWith("/");

  return (
    <div className="dlg-overlay">
      <div className="dlg-panel" onClick={handleSkipTyping}>
        <div className="dlg-header">
          <div className="dlg-portrait-box">
            {isPortraitImage ? (
              <img
                src={node.portrait}
                alt={node.speaker}
                className="dlg-portrait-img"
              />
            ) : (
              <span className="dlg-portrait-emoji">{node.portrait}</span>
            )}
          </div>
          <div className="dlg-speaker-info">
            <span className="dlg-speaker-name">{node.speaker}</span>
            <span className="dlg-speaker-title">{node.title}</span>
          </div>
          <button
            className="dlg-close-btn"
            onClick={(e) => {
              e.stopPropagation();
              audioManager.playClose();
              onClose();
            }}
            title="Close (Esc)"
          >
            ✕
          </button>
        </div>

        <div className="dlg-body">
          <p className="dlg-text">
            {fullText.slice(0, displayedChars)}
            {isTyping && <span className="dlg-cursor" />}
          </p>
        </div>

        {/* Options are shown once text has rendered or skipped */}
        {!isTyping && node.options.length > 0 && (
          <div className="dlg-choices">
            {node.options.map((opt, i) => (
              <button
                key={`${node.id}-opt-${i}`}
                className={`dlg-choice-btn ${i === focusedIndex ? "dlg-choice-btn--focused" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleChoice(opt);
                }}
                onMouseEnter={() => setFocusedIndex(i)}
              >
                <span className="dlg-choice-key">[{i + 1}]</span>
                <span className="dlg-choice-label">{opt.text}</span>
              </button>
            ))}
            <div className="dlg-prompt-hint">Press 1-{node.options.length}, Arrows+Enter, or click to choose</div>
          </div>
        )}
      </div>
    </div>
  );
}
