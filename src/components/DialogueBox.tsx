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
  const fullText = node.text;
  const isTyping = displayedChars < fullText.length;
  const timerRef = useRef<number | null>(null);

  // Typewriter effect
  useEffect(() => {
    setDisplayedChars(0);
    let index = 0;

    const tick = () => {
      index += 2; // smooth 2 chars per tick
      if (index >= fullText.length) {
        setDisplayedChars(fullText.length);
      } else {
        setDisplayedChars(index);
        timerRef.current = window.setTimeout(tick, 22);
      }
    };

    timerRef.current = window.setTimeout(tick, 22);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [fullText]);

  const handleSkipTyping = useCallback(() => {
    if (isTyping) {
      if (timerRef.current) clearTimeout(timerRef.current);
      setDisplayedChars(fullText.length);
      audioManager.playClick();
    }
  }, [isTyping, fullText.length]);

  const handleChoice = useCallback(
    (opt: DialogueOption) => {
      audioManager.playSelect();
      onSelectOption(opt);
    },
    [onSelectOption],
  );

  // Keyboard navigation: 1, 2, 3 for choices, Space/Enter to skip or choose, Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        audioManager.playClose();
        onClose();
        return;
      }

      if (isTyping && (e.key === " " || e.key === "Enter")) {
        e.preventDefault();
        handleSkipTyping();
        return;
      }

      // Check number keys
      const num = parseInt(e.key, 10);
      if (!isNaN(num) && num >= 1 && num <= node.options.length) {
        e.preventDefault();
        handleChoice(node.options[num - 1]);
        return;
      }

      if (!isTyping && (e.key === "Enter" || e.key === " ") && node.options.length > 0) {
        e.preventDefault();
        handleChoice(node.options[0]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isTyping, handleSkipTyping, handleChoice, onClose, node.options]);

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

        {!isTyping && node.options.length > 0 && (
          <div className="dlg-choices">
            {node.options.map((opt, i) => (
              <button
                key={i}
                className="dlg-choice-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleChoice(opt);
                }}
              >
                <span className="dlg-choice-key">[{i + 1}]</span>
                <span className="dlg-choice-label">{opt.text}</span>
              </button>
            ))}
            <div className="dlg-prompt-hint">Press 1-{node.options.length} or click to select</div>
          </div>
        )}
      </div>
    </div>
  );
}
