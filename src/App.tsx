import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { collision } from "./collision";
import { Boundary, Sprite } from "./class";
import {
  checkCollision,
  getPlayerHitbox,
  type Point,
} from "./game/pathfinding";
import { buildClickPath, getNextClickMovement } from "./game/clickMovement";
import {
  createSprinkles,
  drawSprinkles,
  type SprinkleParticle,
} from "./game/particles";
import {
  createAmbientSystem,
  updateAmbient,
  drawAmbient,
} from "./game/ambient";
import { audioManager } from "./game/audioManager";
import {
  GameContext,
  DEFAULT_SETTINGS,
  CHARACTER_OPTIONS,
  type GamePhase,
  type PlayerConfig,
  type GameSettings,
} from "./game/gameContext";
import { StartScreen } from "./components/StartScreen";
import { GameHUD } from "./components/GameHUD";

const MOVE_SPEED = 5;
const WAYPOINT_STOP_DISTANCE = 4;
const MAP_TILE_SIZE = 64;
const MAP_COLS = 64;
const MAP_ROWS_APPROX = 56;

// ── Session persistence helpers ────────────────────────────────────────────
const SESSION_KEY = "og_player_config";

function saveSession(config: PlayerConfig) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({
      name: config.name,
      characterId: config.character.id,
    }));
  } catch { /* ignore */ }
}

function loadSession(): PlayerConfig | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const { name, characterId } = JSON.parse(raw) as { name: string; characterId: string };
    const character = CHARACTER_OPTIONS.find(c => c.id === characterId);
    if (!character) return null;
    return { name, character };
  } catch { return null; }
}

function clearSession() {
  try { sessionStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
}

// ── Hash routing helpers ───────────────────────────────────────────────────
function getHashPhase(): GamePhase {
  return window.location.hash === "#game" ? "game" : "start";
}

function setHashPhase(phase: GamePhase) {
  const target = phase === "game" ? "#game" : "#";
  if (window.location.hash !== target) {
    window.location.hash = phase === "game" ? "game" : "";
  }
}

// ── Image loading helper ───────────────────────────────────────────────────
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load: ${src}`));
    img.src = src;
  });
}

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Derive initial phase from hash + session
  const [phase, setPhaseState] = useState<GamePhase>(() => {
    const hashPhase = getHashPhase();
    if (hashPhase === "game") {
      const session = loadSession();
      if (session) return "game";
    }
    return "start";
  });

  const [playerConfig, setPlayerConfigState] = useState<PlayerConfig | null>(() => {
    if (getHashPhase() === "game") return loadSession();
    return null;
  });

  const [settings, setSettings] = useState<GameSettings>(() => {
    const audioSet = audioManager.getSettings();
    return {
      ...DEFAULT_SETTINGS,
      bgmVolume: audioSet.bgmVolume,
      sfxVolume: audioSet.sfxVolume,
      bgmMuted: audioSet.bgmMuted,
      sfxMuted: audioSet.sfxMuted,
    };
  });
  const [fps, setFps] = useState(0);

  const updateSettings = useCallback((partial: Partial<GameSettings>) => {
    setSettings((s) => ({ ...s, ...partial }));
  }, []);

  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  // Listen to back/forward hash changes
  useEffect(() => {
    const onHash = () => {
      const hp = getHashPhase();
      if (hp === "start") {
        clearSession();
        setPhaseState("start");
        setPlayerConfigState(null);
        audioManager.stopBGM();
      }
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const setPhase = useCallback((p: GamePhase) => {
    setHashPhase(p);
    setPhaseState(p);
  }, []);

  const setPlayerConfig = useCallback((cfg: PlayerConfig) => {
    setPlayerConfigState(cfg);
  }, []);

  const collisionsMap: number[][] = useMemo(() => {
    const map: number[][] = [];
    for (let i = 0; i < collision.length; i += MAP_COLS) {
      map.push(collision.slice(i, i + MAP_COLS));
    }
    return map;
  }, []);

  const offset = { x: 0, y: -430 };

  // ── Game loop ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "game" || !playerConfig) return;

    // Re-init audio if entering game via direct URL (page refresh)
    audioManager.init();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId = 0;
    let cancelled = false;

    // ── Boundaries ──
    const boundaries: Boundary[] = [];
    collisionsMap.forEach((row, i) => {
      row.forEach((item, j) => {
        if (item !== 0) {
          boundaries.push(
            new Boundary({
              ctx,
              position: {
                x: j * Boundary.width + offset.x,
                y: i * Boundary.height + offset.y,
              },
            }),
          );
        }
      });
    });

    // ── Load ALL images before starting game loop ──
    const folder = playerConfig.character.folder;
    const imageSources = {
      bg: "/BackgroundTerrain.png",
      fg: "/forground.png",
      pUp: `/characters/${folder}/playerUp.png`,
      pDown: `/characters/${folder}/playerDown.png`,
      pLeft: `/characters/${folder}/playerLeft.png`,
      pRight: `/characters/${folder}/playerRight.png`,
      npcDown: "/playerDown.png",
      npcUp: "/playerUp.png",
      npcLeft: "/playerLeft.png",
      npcRight: "/playerRight.png",
    };

    Promise.all(
      Object.entries(imageSources).map(([key, src]) =>
        loadImage(src).then((img) => [key, img] as [string, HTMLImageElement]),
      ),
    )
      .then((entries) => {
        if (cancelled) return;
        const imgs = Object.fromEntries(entries) as Record<string, HTMLImageElement>;

        // ── Sprites ──
        const background = new Sprite({
          ctx,
          image: imgs.bg,
          position: { x: offset.x, y: offset.y },
        });

        const forground = new Sprite({
          ctx,
          image: imgs.fg,
          position: { x: offset.x, y: offset.y },
        });

        const player = new Sprite({
          ctx,
          image: imgs.pDown,
          name: playerConfig.name,
          position: {
            x: canvas.width / 2 - 192 / 4,
            y: canvas.height / 2 - 68 / 2,
          },
          frames: { max: 4 },
          sprites: {
            up: imgs.pUp,
            down: imgs.pDown,
            right: imgs.pRight,
            left: imgs.pLeft,
          },
        });

        const npc = new Sprite({
          ctx,
          image: imgs.npcDown,
          name: "Echo",
          position: {
            x: canvas.width / 2 - 192 + 84,
            y: canvas.height / 2 - 68 + 84,
          },
          frames: { max: 4 },
          sprites: {
            up: imgs.npcUp,
            down: imgs.npcDown,
            right: imgs.npcRight,
            left: imgs.npcLeft,
          },
        });

        const allPlayers = [player, npc];

        // ── Ambient system ──
        const mapW = MAP_COLS * MAP_TILE_SIZE;
        const mapH = MAP_ROWS_APPROX * MAP_TILE_SIZE;
        const ambientSys = createAmbientSystem(offset.x, offset.y, mapW, mapH);

        // ── Input ──
        const keys = { w: false, a: false, s: false, d: false };
        type MovementKey = keyof typeof keys;
        const keyOrder: MovementKey[] = [];
        const sprinkles: SprinkleParticle[] = [];
        let clickPath: Point[] = [];
        let zoom = 1;

        const clampZoom = (v: number) => Math.max(0.9, Math.min(1.5, v));
        const changeZoom = (amount: number) => { zoom = clampZoom(zoom + amount); };
        const isMovementKey = (v: string): v is MovementKey =>
          v === "w" || v === "a" || v === "s" || v === "d";

        const handleKeyDown = (e: KeyboardEvent) => {
          const key = e.key.toLowerCase();
          if (key === "+" || key === "=") { e.preventDefault(); changeZoom(0.05); return; }
          if (key === "-" || key === "_") { e.preventDefault(); changeZoom(-0.05); return; }
          if (!isMovementKey(key)) return;
          clickPath = [];
          keys[key] = true;
          const idx = keyOrder.indexOf(key);
          if (idx !== -1) keyOrder.splice(idx, 1);
          keyOrder.push(key);
        };

        const handleKeyUp = (e: KeyboardEvent) => {
          const key = e.key.toLowerCase();
          if (!isMovementKey(key)) return;
          keys[key] = false;
          const idx = keyOrder.indexOf(key);
          if (idx !== -1) keyOrder.splice(idx, 1);
        };

        const handleWindowBlur = () => {
          keyOrder.length = 0;
          keys.w = keys.a = keys.s = keys.d = false;
        };

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);
        window.addEventListener("blur", handleWindowBlur);

        const handleWheel = (e: WheelEvent) => {
          e.preventDefault();
          changeZoom(e.deltaY < 0 ? 0.05 : -0.05);
        };
        canvas.addEventListener("wheel", handleWheel, { passive: false });

        // ── Camera + helpers ──
        const camera = {
          position: {
            x: player.position.x + player.width / 2,
            y: player.position.y + player.height / 2,
          },
        };

        const screenToWorld = (clientX: number, clientY: number): Point => {
          const rect = canvas.getBoundingClientRect();
          const cx = ((clientX - rect.left) / rect.width) * canvas.width;
          const cy = ((clientY - rect.top) / rect.height) * canvas.height;
          return {
            x: camera.position.x + (cx - canvas.width / 2) / zoom,
            y: camera.position.y + (cy - canvas.height / 2) / zoom,
          };
        };

        const playerCenter = (): Point => ({
          x: player.position.x + player.width / 2,
          y: player.position.y + player.height / 2,
        });

        const playerSize = () => ({ width: player.width, height: player.height });
        const mapOrigin = () => background.position;

        const wouldCollide = (delta: Point) => {
          const next = {
            x: player.position.x + delta.x,
            y: player.position.y + delta.y,
          };
          const hitbox = getPlayerHitbox(next);
          for (const b of boundaries) {
            if (checkCollision(hitbox, { position: b.position, width: b.width, height: b.height }))
              return true;
          }
          for (const other of allPlayers) {
            if (other === player) continue;
            if (checkCollision(hitbox, other)) return true;
          }
          return false;
        };

        const movePlayer = (delta: Point) => {
          player.position.x += delta.x;
          player.position.y += delta.y;
        };

        const handleDblClick = (e: MouseEvent) => {
          e.preventDefault();
          const target = screenToWorld(e.clientX, e.clientY);
          clickPath = buildClickPath({
            center: playerCenter(),
            target,
            collisionsMap,
            mapOrigin: mapOrigin(),
            playerSize: playerSize(),
          });
          createSprinkles(target, sprinkles);
          audioManager.playClick();
        };

        canvas.addEventListener("dblclick", handleDblClick);

        const followClickPath = () => {
          if (clickPath.length === 0 || keyOrder.length > 0) return false;
          const move = getNextClickMovement({
            path: clickPath,
            center: playerCenter(),
            stopDistance: WAYPOINT_STOP_DISTANCE,
            maxStep: MOVE_SPEED,
          });
          if (!move) return clickPath.length > 0;
          player.moving = true;
          player.image =
            move.x !== 0
              ? move.x > 0 ? player.sprites!.right : player.sprites!.left
              : move.y > 0 ? player.sprites!.down : player.sprites!.up;
          if (wouldCollide(move)) { clickPath = []; player.moving = false; return false; }
          movePlayer(move);
          return true;
        };

        // FPS
        let lastTime = performance.now();
        let frameCount = 0;

        // ── Game loop ──
        function gameLoop(): void {
          if (cancelled || !ctx || !canvas) return;
          animId = requestAnimationFrame(gameLoop);

          frameCount++;
          const now = performance.now();
          if (now - lastTime >= 500) {
            setFps(Math.round((frameCount * 1000) / (now - lastTime)));
            frameCount = 0;
            lastTime = now;
          }

          camera.position.x = player.position.x + player.width / 2;
          camera.position.y = player.position.y + player.height / 2;

          ctx.fillStyle = "rgb(44 87 145)";
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          ctx.save();
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.scale(zoom, zoom);
          ctx.translate(-camera.position.x, -camera.position.y);

          background.draw();
          boundaries.forEach((b) => b.draw());

          updateAmbient(ambientSys);
          drawAmbient(ctx, ambientSys);

          const sortedPlayers = [...allPlayers].sort((a, b) => a.position.y - b.position.y);
          sortedPlayers.forEach((s) => {
            const originalName = s.name;
            if (!settingsRef.current.showNameplates) s.name = undefined;
            s.draw();
            s.name = originalName;
          });

          forground.draw();
          drawSprinkles(ctx, sprinkles);

          ctx.restore();

          let moved = false;
          player.moving = false;
          const activeKey = keyOrder[keyOrder.length - 1];

          if (activeKey === "w" && keys.w) {
            player.image = player.sprites!.up;
            player.moving = true;
            if (!wouldCollide({ x: 0, y: -MOVE_SPEED })) { movePlayer({ x: 0, y: -MOVE_SPEED }); moved = true; }
          } else if (activeKey === "a" && keys.a) {
            player.image = player.sprites!.left;
            player.moving = true;
            if (!wouldCollide({ x: -MOVE_SPEED, y: 0 })) { movePlayer({ x: -MOVE_SPEED, y: 0 }); moved = true; }
          } else if (activeKey === "s" && keys.s) {
            player.image = player.sprites!.down;
            player.moving = true;
            if (!wouldCollide({ x: 0, y: MOVE_SPEED })) { movePlayer({ x: 0, y: MOVE_SPEED }); moved = true; }
          } else if (activeKey === "d" && keys.d) {
            player.image = player.sprites!.right;
            player.moving = true;
            if (!wouldCollide({ x: MOVE_SPEED, y: 0 })) { movePlayer({ x: MOVE_SPEED, y: 0 }); moved = true; }
          } else {
            moved = followClickPath();
          }

          audioManager.playFootstep(moved && player.moving);
        }

        // Auto-play BGM if entering via refresh (no start screen click)
        audioManager.playBGM();
        gameLoop();

        // Store cleanup inside the then() block
        (canvas as unknown as { _cleanup?: () => void })._cleanup = () => {
          cancelled = true;
          cancelAnimationFrame(animId);
          window.removeEventListener("keydown", handleKeyDown);
          window.removeEventListener("keyup", handleKeyUp);
          window.removeEventListener("blur", handleWindowBlur);
          canvas.removeEventListener("wheel", handleWheel);
          canvas.removeEventListener("dblclick", handleDblClick);
        };
      })
      .catch((err) => {
        console.error("Failed to load game assets:", err);
      });

    return () => {
      cancelled = true;
      cancelAnimationFrame(animId);
      const c = canvasRef.current as unknown as { _cleanup?: () => void } | null;
      if (c?._cleanup) c._cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, playerConfig, collisionsMap]);

  const handleEnterWorld = useCallback((config: PlayerConfig) => {
    saveSession(config);
    setPlayerConfigState(config);
    setPhase("game");
  }, [setPhase]);

  const handleExitWorld = useCallback(() => {
    clearSession();
    audioManager.stopBGM();
    setPhase("start");
    setPlayerConfigState(null);
  }, [setPhase]);

  return (
    <GameContext.Provider
      value={{
        phase,
        playerConfig,
        settings,
        setPhase,
        setPlayerConfig,
        updateSettings,
      }}
    >
      {phase === "start" && <StartScreen onEnter={handleEnterWorld} />}

      {phase === "game" && (
        <>
          <canvas
            ref={canvasRef}
            width={window.innerWidth}
            height={window.innerHeight}
            style={{ display: "block", background: "rgb(44 87 145)" }}
          />
          {playerConfig && (
            <GameHUD
              playerName={playerConfig.name}
              settings={settings}
              onUpdateSettings={updateSettings}
              fps={fps}
              onExitWorld={handleExitWorld}
            />
          )}
        </>
      )}
    </GameContext.Provider>
  );
}

export default App;
