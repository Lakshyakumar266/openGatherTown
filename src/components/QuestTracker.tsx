import { useState, useEffect, useCallback } from "react";
import type { StoryState, InteractablePOI } from "../game/story";
import { audioManager } from "../game/audioManager";
import "./QuestTracker.css";

type Props = {
  storyState: StoryState;
  activePOI: InteractablePOI | null;
  onInteract: (poi: InteractablePOI) => void;
};

export function QuestTracker({ storyState, activePOI, onInteract }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [drinkNotice, setDrinkNotice] = useState<string | null>(null);

  const activeQuest = storyState.quests.find((q) => q.active && !q.completed) || storyState.quests[0];

  // Global key listener for 'E' (interact) and 'B'/'I' (inventory)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if ((e.key === "e" || e.key === "E") && activePOI) {
        e.preventDefault();
        onInteract(activePOI);
      }

      if (e.key === "b" || e.key === "B" || e.key === "i" || e.key === "I") {
        e.preventDefault();
        setShowInventory((prev) => {
          if (!prev) audioManager.playOpen();
          else audioManager.playClose();
          return !prev;
        });
      }

      if (e.key === "Escape" && showInventory) {
        setShowInventory(false);
        audioManager.playClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activePOI, onInteract, showInventory]);

  const handleUseTea = useCallback(() => {
    audioManager.playJoin();
    setDrinkNotice("You sip the warm Chamomile Tea. A wave of peace and calm restores your spirit! ☕✨");
    setTimeout(() => setDrinkNotice(null), 3500);
  }, []);

  return (
    <>
      {/* ── Top-Left Quest Tracker ── */}
      <div className="qt-container">
        {activeQuest && (
          <div className={`qt-panel ${collapsed ? "qt-panel--collapsed" : ""}`}>
            <div className="qt-header" onClick={() => setCollapsed(!collapsed)}>
              <span className="qt-title-badge">
                📜 {collapsed ? activeQuest.title : "Active Quest"}
              </span>
              <button className="qt-toggle-btn" title={collapsed ? "Expand" : "Collapse"}>
                {collapsed ? "▼" : "▲"}
              </button>
            </div>

            {!collapsed && (
              <div className="qt-steps">
                <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#fef08a" }}>
                  {activeQuest.title}
                </div>
                {activeQuest.steps.map((step) => (
                  <div
                    key={step.id}
                    className={`qt-step-item ${step.completed ? "qt-step-item--done" : ""}`}
                  >
                    <span className="qt-step-bullet">{step.completed ? "✓" : "○"}</span>
                    <span>{step.description}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Bottom-Left Inventory Button ── */}
      <div className="inv-bar">
        <button
          className="inv-btn"
          onClick={() => {
            audioManager.playOpen();
            setShowInventory(true);
          }}
          title="Open Bag (B / I)"
        >
          <span>🎒 Bag</span>
          <span className="inv-btn-count">{storyState.inventory.length}</span>
        </button>
      </div>

      {/* ── Contextual Proximity Prompt ── */}
      {activePOI && (
        <div className="poi-prompt-pill" onClick={() => onInteract(activePOI)}>
          <span className="poi-key-badge">E</span>
          <span>{activePOI.prompt}</span>
        </div>
      )}

      {/* ── Inventory Modal ── */}
      {showInventory && (
        <div
          className="inv-modal-overlay"
          onClick={() => {
            audioManager.playClose();
            setShowInventory(false);
          }}
        >
          <div className="inv-modal" onClick={(e) => e.stopPropagation()}>
            <div className="inv-modal-header">
              <h3 className="inv-modal-title">🎒 Traveler's Satchel</h3>
              <button
                className="dlg-close-btn"
                onClick={() => {
                  audioManager.playClose();
                  setShowInventory(false);
                }}
              >
                ✕
              </button>
            </div>

            {drinkNotice && (
              <div
                style={{
                  background: "rgba(82, 183, 136, 0.2)",
                  border: "1px solid #52b788",
                  borderRadius: "4px",
                  padding: "8px 12px",
                  fontSize: "0.8rem",
                  color: "#d1fae5",
                  marginBottom: "12px",
                }}
              >
                {drinkNotice}
              </div>
            )}

            <div className="inv-grid">
              {storyState.inventory.map((item) => (
                <div key={item.id} className="inv-item-card">
                  <div className="inv-item-icon">{item.icon}</div>
                  <div className="inv-item-details">
                    <span className="inv-item-name">{item.name}</span>
                    <span className="inv-item-desc">{item.description}</span>
                    {item.usable && (
                      <button className="inv-use-btn" onClick={handleUseTea}>
                        Drink ☕
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {storyState.inventory.length === 0 && (
                <div style={{ color: "rgba(167, 243, 208, 0.6)", fontSize: "0.82rem", gridColumn: "1 / -1" }}>
                  Your satchel is currently empty. Explore the glade to gather relics and tools.
                </div>
              )}
            </div>

            <div style={{ fontSize: "0.72rem", color: "#a7f3d0", textAlign: "right" }}>
              Press [B] or [Esc] to close
            </div>
          </div>
        </div>
      )}
    </>
  );
}
