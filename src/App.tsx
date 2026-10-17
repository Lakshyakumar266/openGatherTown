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
  type GamePhase,
  type PlayerConfig,
  type GameSettings,
} from "./game/gameContext";
import { StartScreen } from "./components/StartScreen";
import { GameHUD } from "./components/GameHUD";

const MOVE_SPEED = 5;
const WAYPOINT_STOP_DISTANCE = 4;
// Background map tile size and rough dimensions
const MAP_TILE_SIZE = 64;
const MAP_COLS = 64;
const MAP_ROWS_APPROX = 56;

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<GamePhase>("start");
  const [playerConfig, setPlayerConfig] = useState<PlayerConfig | null>(null);
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [fps, setFps] = useState(0);

  const updateSettings = useCallback((partial: Partial<GameSettings>) => {
    setSettings((s) => ({ ...s, ...partial }));
  }, []);

  // Expose settings ref into game loop
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

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

    // ── Images ──
    const BackgroundImage = new Image();
    BackgroundImage.src = "/BackgroundTerrain.png";
    const ForgroundImage = new Image();
    ForgroundImage.src = "/forground.png";

    const folder = playerConfig.character.folder;
    const PlayerUpImage = new Image();
    PlayerUpImage.src = `/characters/${folder}/playerUp.png`;
    const PlayerDownImage = new Image();
    PlayerDownImage.src = `/characters/${folder}/playerDown.png`;
    const PlayerLeftImage = new Image();
    PlayerLeftImage.src = `/characters/${folder}/playerLeft.png`;
    const PlayerRightImage = new Image();
    PlayerRightImage.src = `/characters/${folder}/playerRight.png`;

    // ── Sprites ──
    const background = new Sprite({
      ctx,
      image: BackgroundImage,
      position: { x: offset.x, y: offset.y },
    });

    const forground = new Sprite({
      ctx,
      image: ForgroundImage,
      position: { x: offset.x, y: offset.y },
    });

    const player = new Sprite({
      ctx,
      image: PlayerDownImage,
      name: playerConfig.name,
      position: {
        x: canvas.width / 2 - 192 / 4,
        y: canvas.height / 2 - 68 / 2,
      },
      frames: { max: 4 },
      sprites: {
        up: PlayerUpImage,
        down: PlayerDownImage,
        right: PlayerRightImage,
        left: PlayerLeftImage,
      },
    });

    // Default dummy player images (use same char as fallback)
    const NpcDownImage = new Image();
    NpcDownImage.src = "/playerDown.png";
    const NpcUpImage = new Image();
    NpcUpImage.src = "/playerUp.png";
    const NpcLeftImage = new Image();
    NpcLeftImage.src = "/playerLeft.png";
    const NpcRightImage = new Image();
    NpcRightImage.src = "/playerRight.png";

    const npc = new Sprite({
      ctx,
      image: NpcDownImage,
      name: "Echo",
      position: {
        x: canvas.width / 2 - 192 + 84,
        y: canvas.height / 2 - 68 + 84,
      },
      frames: { max: 4 },
      sprites: {
        up: NpcUpImage,
        down: NpcDownImage,
        right: NpcRightImage,
        left: NpcLeftImage,
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

    // ── Helpers ──
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
      audioManager.playSFX("click");
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

    // ── FPS counter ──
    let lastTime = performance.now();
    let frameCount = 0;
    let fpsDisplay = 0;

    // ── Game loop ──
    function gameLoop(): void {
      if (cancelled || !ctx || !canvas) return;
      animId = requestAnimationFrame(gameLoop);

      // FPS
      frameCount++;
      const now = performance.now();
      if (now - lastTime >= 500) {
        fpsDisplay = Math.round((frameCount * 1000) / (now - lastTime));
        frameCount = 0;
        lastTime = now;
        setFps(fpsDisplay);
      }

      // Update camera
      camera.position.x = player.position.x + player.width / 2;
      camera.position.y = player.position.y + player.height / 2;

      // Clear
      ctx.fillStyle = "rgb(44 87 145)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.scale(zoom, zoom);
      ctx.translate(-camera.position.x, -camera.position.y);

      // World
      background.draw();
      boundaries.forEach((b) => b.draw());

      // Ambient below foreground
      updateAmbient(ambientSys);
      drawAmbient(ctx, ambientSys);

      // Players (sorted by Y for depth)
      const sortedPlayers = [...allPlayers].sort(
        (a, b) => a.position.y - b.position.y,
      );
      sortedPlayers.forEach((s) => {
        // Respect showNameplates setting
        const originalName = s.name;
        if (!settingsRef.current.showNameplates) s.name = undefined;
        s.draw();
        s.name = originalName;
      });

      forground.draw();
      drawSprinkles(ctx, sprinkles);

      ctx.restore();

      // ── Player movement ──
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

    gameLoop();

    return () => {
      cancelled = true;
      cancelAnimationFrame(animId);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleWindowBlur);
      canvas.removeEventListener("wheel", handleWheel);
      canvas.removeEventListener("dblclick", handleDblClick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, playerConfig, collisionsMap]);

  const handleEnterWorld = useCallback(
    (config: PlayerConfig) => {
      setPlayerConfig(config);
      setPhase("game");
    },
    [],
  );

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
            style={{ display: "block", background: "black" }}
          />
          {playerConfig && (
            <GameHUD
              playerName={playerConfig.name}
              settings={settings}
              onUpdateSettings={updateSettings}
              fps={fps}
            />
          )}
        </>
      )}
    </GameContext.Provider>
  );
}

export default App;
