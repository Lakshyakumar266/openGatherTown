import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import "./App.css";
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
  type MapType,
} from "./game/gameContext";
import {
  POIS,
  DIALOGUE_NODES,
  loadSavedStory,
  saveStoryState,
  type StoryState,
  type InteractablePOI,
  type DialogueNode,
  type DialogueOption,
} from "./game/story";
import {
  createMeadowAnimals,
  updateAnimals,
  drawAnimals,
  type AnimalSprites,
} from "./game/animals";
import {
  createEnvironmentSystem,
  updateEnvironment,
  drawEnvironment,
} from "./game/environment";
import {
  generateWhisperingRuinsMap,
  type ProceduralMap,
} from "./game/mapGenerator";
import { StartScreen } from "./components/StartScreen";
import { GameHUD } from "./components/GameHUD";
import { DialogueBox } from "./components/DialogueBox";
import { QuestTracker } from "./components/QuestTracker";
import { MiniMap } from "./components/MiniMap";

const WAYPOINT_STOP_DISTANCE = 4;
const MAP_TILE_SIZE = 64;
const MAP_COLS = 64;
const MAP_ROWS_APPROX = 56;

// Fixed world coordinates outside the cottage door for Legacy Map on dry land
const SPAWN_WORLD_X = 730;
const SPAWN_WORLD_Y = 480;

// ── Session persistence helpers ────────────────────────────────────────────
const SESSION_KEY = "og_player_config";
const POSITION_KEY = "og_player_pos";

function saveSession(config: PlayerConfig) {
  try {
    sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        name: config.name,
        characterId: config.character.id,
      }),
    );
  } catch {
    /* ignore */
  }
}

function loadSession(): PlayerConfig | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const { name, characterId } = JSON.parse(raw) as { name: string; characterId: string };
    const character = CHARACTER_OPTIONS.find((c) => c.id === characterId);
    if (!character) return null;
    return { name, character };
  } catch {
    return null;
  }
}

function clearSession() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

function savePlayerPos(x: number, y: number, mapType: MapType = "new") {
  try {
    localStorage.setItem(`${POSITION_KEY}_${mapType}`, JSON.stringify({ x, y }));
  } catch {
    /* ignore */
  }
}

function loadPlayerPos(mapType: MapType = "new"): Point | null {
  try {
    const raw = localStorage.getItem(`${POSITION_KEY}_${mapType}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      typeof parsed?.x === "number" &&
      typeof parsed?.y === "number" &&
      !isNaN(parsed.x) &&
      !isNaN(parsed.y)
    ) {
      // Legacy map dry land bounds check: y >= 260 prevents water spawn
      if (mapType === "legacy") {
        if (parsed.x >= 200 && parsed.x <= 1800 && parsed.y >= 260 && parsed.y <= 1400) {
          return parsed;
        }
        return null; // Fallback to safe SPAWN_WORLD_X, SPAWN_WORLD_Y
      }

      // New map bounds check
      if (parsed.x >= 256 && parsed.x <= 3840 && parsed.y >= 256 && parsed.y <= 3840) {
        return parsed;
      }
    }
    return null;
  } catch {
    return null;
  }
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

// ── Resilient Image loading helper ─────────────────────────────────────────
function safeLoadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => {
      console.warn(`[SafeImage] Failed to load ${src}, generating placeholder`);
      const c = document.createElement("canvas");
      c.width = 64;
      c.height = 64;
      const fallback = new Image();
      fallback.src = c.toDataURL();
      fallback.onload = () => resolve(fallback);
    };
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
  const [isAssetsLoading, setIsAssetsLoading] = useState(false);

  // Story state, active POI, and active dialogue
  const [storyState, setStoryState] = useState<StoryState>(() => loadSavedStory());
  const [activePOI, setActivePOI] = useState<InteractablePOI | null>(null);
  const [activeDialogue, setActiveDialogue] = useState<DialogueNode | null>(null);

  // MiniMap radar states
  const [playerHudPos, setPlayerHudPos] = useState<Point>({ x: 730, y: 480 });
  const [playerHudFacing, setPlayerHudFacing] = useState<"up" | "down" | "left" | "right">("down");
  const [activeProceduralMap, setActiveProceduralMap] = useState<ProceduralMap | null>(null);
  const [currentActivePOIs, setCurrentActivePOIs] = useState<InteractablePOI[]>(POIS);

  const updateSettings = useCallback((partial: Partial<GameSettings>) => {
    setSettings((s) => ({ ...s, ...partial }));
  }, []);

  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const storyStateRef = useRef(storyState);
  storyStateRef.current = storyState;

  const activeDialogueRef = useRef(activeDialogue);
  activeDialogueRef.current = activeDialogue;

  const nearestPOIRef = useRef<InteractablePOI | null>(null);

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

  // Ref to trigger teleport from HUD
  const teleportRef = useRef<((target: Point) => void) | null>(null);
  const getPlayerPosRef = useRef<(() => Point) | null>(null);

  // Dialogue Interaction Triggers
  const handleStartInteract = useCallback((poi: InteractablePOI) => {
    audioManager.playOpen();
    const nodeId = poi.initialNodeId(storyStateRef.current);
    const node = DIALOGUE_NODES[nodeId];
    if (node) {
      setActiveDialogue(node);
    }
  }, []);

  // ── Game loop ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "game" || !playerConfig) {
      setIsAssetsLoading(false);
      return;
    }

    setIsAssetsLoading(true);

    // Re-init audio if entering game via direct URL (page refresh)
    audioManager.init();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId = 0;
    let cancelled = false;

    // Responsive Canvas Resizing
    const handleResize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    const activeMapType: MapType = settings.selectedMap || "legacy";

    // ── Build Legacy Boundaries ──
    const legacyBoundaries: Boundary[] = [];
    collisionsMap.forEach((row, i) => {
      row.forEach((item, j) => {
        if (item !== 0) {
          legacyBoundaries.push(
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

    // ── Build Procedural Ruins Map if active ──
    let proceduralMap: ProceduralMap | null = null;
    let activeBoundaries: Boundary[] = legacyBoundaries;
    let activePOIs: InteractablePOI[] = POIS;

    if (activeMapType === "new") {
      proceduralMap = generateWhisperingRuinsMap(ctx, 42);
      activeBoundaries = proceduralMap.boundaries;
      activePOIs = proceduralMap.pois;
    } else {
      activeBoundaries = legacyBoundaries;
      activePOIs = POIS;
    }

    // ── Load ALL images before starting game loop ──
    const folder = playerConfig.character.folder;
    const imageSources: Record<string, string> = {
      pUp: `/characters/${folder}/playerUp.png`,
      pDown: `/characters/${folder}/playerDown.png`,
      pLeft: `/characters/${folder}/playerLeft.png`,
      pRight: `/characters/${folder}/playerRight.png`,
      npcDown: "/characters/00-classic/playerDown.png",
      npcUp: "/characters/00-classic/playerUp.png",
      npcLeft: "/characters/00-classic/playerLeft.png",
      npcRight: "/characters/00-classic/playerRight.png",
      elderDown: "/characters/03-brom/playerDown.png",
      elderUp: "/characters/03-brom/playerUp.png",
      elderLeft: "/characters/03-brom/playerLeft.png",
      elderRight: "/characters/03-brom/playerRight.png",
      silasDown: "/characters/05-rowan/playerDown.png",
      silasUp: "/characters/05-rowan/playerUp.png",
      silasLeft: "/characters/05-rowan/playerLeft.png",
      silasRight: "/characters/05-rowan/playerRight.png",
      joshuaDown: "/characters/01-aldric/playerDown.png",
      joshuaUp: "/characters/01-aldric/playerUp.png",
      joshuaLeft: "/characters/01-aldric/playerLeft.png",
      joshuaRight: "/characters/01-aldric/playerRight.png",
      rabbitIdle: "/animals/rabbit_idle.png",
      rabbitHop: "/animals/rabbit_hop.png",
      deerIdle: "/animals/deer_idle.png",
      deerWalk: "/animals/deer_walk.png",
      foxIdle: "/animals/fox_idle.png",
      foxWalk: "/animals/fox_walk.png",
      tileset: "/tiles/RPGpack_sheet_2X.png",
    };

    if (activeMapType === "legacy") {
      imageSources.bg = "/BackgroundTerrain.png";
      imageSources.fg = "/forground.png";
    }

    Promise.all(
      Object.entries(imageSources).map(([key, src]) =>
        safeLoadImage(src).then((img) => [key, img] as [string, HTMLImageElement]),
      ),
    )
      .then((entries) => {
        if (cancelled) return;
        setIsAssetsLoading(false);
        setActiveProceduralMap(proceduralMap);
        setCurrentActivePOIs(activePOIs);

        const imgs = Object.fromEntries(entries) as Record<string, HTMLImageElement>;

        // ── Sprites ──
        let background: Sprite | null = null;
        let forground: Sprite | null = null;

        if (activeMapType === "legacy" && imgs.bg && imgs.fg) {
          background = new Sprite({
            ctx,
            image: imgs.bg,
            position: { x: offset.x, y: offset.y },
          });

          forground = new Sprite({
            ctx,
            image: imgs.fg,
            position: { x: offset.x, y: offset.y },
          });
        }

        const savedPos = loadPlayerPos(activeMapType);
        const initialX =
          savedPos?.x ??
          (activeMapType === "new" ? proceduralMap!.spawnPoint.x : SPAWN_WORLD_X);
        const initialY =
          savedPos?.y ??
          (activeMapType === "new" ? proceduralMap!.spawnPoint.y : SPAWN_WORLD_Y);

        const player = new Sprite({
          ctx,
          image: imgs.pDown,
          name: playerConfig.name,
          position: {
            x: initialX,
            y: initialY,
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
            x: activePOIs[1].position.x,
            y: activePOIs[1].position.y,
          },
          frames: { max: 4 },
          sprites: {
            up: imgs.npcUp,
            down: imgs.npcDown,
            right: imgs.npcRight,
            left: imgs.npcLeft,
          },
        });

        const elder = new Sprite({
          ctx,
          image: imgs.elderDown,
          name: "Elder Oakhaven",
          position: {
            x: activePOIs[0].position.x,
            y: activePOIs[0].position.y,
          },
          frames: { max: 4 },
          sprites: {
            up: imgs.elderUp,
            down: imgs.elderDown,
            right: imgs.elderRight,
            left: imgs.elderLeft,
          },
        });

        const silas = new Sprite({
          ctx,
          image: imgs.silasDown,
          name: "Silas the Hermit",
          position: {
            x: activePOIs[2]?.position.x ?? 41 * 64 + 32,
            y: activePOIs[2]?.position.y ?? 35 * 64 + 32,
          },
          frames: { max: 4 },
          sprites: {
            up: imgs.silasUp,
            down: imgs.silasDown,
            right: imgs.silasRight,
            left: imgs.silasLeft,
          },
        });

        const joshua = new Sprite({
          ctx,
          image: imgs.joshuaDown,
          name: "Captain Joshua",
          position: {
            x: activePOIs[3]?.position.x ?? 50 * 64 + 32,
            y: activePOIs[3]?.position.y ?? 28 * 64 + 32,
          },
          frames: { max: 4 },
          sprites: {
            up: imgs.joshuaUp,
            down: imgs.joshuaDown,
            right: imgs.joshuaRight,
            left: imgs.joshuaLeft,
          },
        });

        const allPlayers = [player, npc, elder, silas, joshua];
        const npcs = [npc, elder, silas, joshua];
        const npcBaseY = new Map<Sprite, number>();
        npcs.forEach((s) => npcBaseY.set(s, s.position.y));

        // ── Animated Animals System ──
        const animals = createMeadowAnimals(activeMapType);
        const animalSprites: AnimalSprites = {
          rabbitIdle: imgs.rabbitIdle,
          rabbitHop: imgs.rabbitHop,
          deerIdle: imgs.deerIdle,
          deerWalk: imgs.deerWalk,
          foxIdle: imgs.foxIdle,
          foxWalk: imgs.foxWalk,
        };

        // ── Environmental Swaying Trees & Falling Leaves System ──
        const envSystem = createEnvironmentSystem(activeMapType);

        // Teleport helper
        teleportRef.current = (target: Point) => {
          player.position.x = target.x;
          player.position.y = target.y;
          savePlayerPos(target.x, target.y);
        };

        getPlayerPosRef.current = () => ({
          x: player.position.x,
          y: player.position.y,
        });

        // ── Ambient system ──
        const mapW = activeMapType === "new" ? proceduralMap!.width : MAP_COLS * MAP_TILE_SIZE;
        const mapH = activeMapType === "new" ? proceduralMap!.height : MAP_ROWS_APPROX * MAP_TILE_SIZE;
        const ambientSys = createAmbientSystem(
          activeMapType === "new" ? 0 : offset.x,
          activeMapType === "new" ? 0 : offset.y,
          mapW,
          mapH,
        );

        // ── Input ──
        const keys = { w: false, a: false, s: false, d: false };
        type MovementKey = keyof typeof keys;
        const keyOrder: MovementKey[] = [];
        const sprinkles: SprinkleParticle[] = [];
        let clickPath: Point[] = [];
        let currentZoom = settingsRef.current.zoomLevel || 1.0;

        const normalizeMovementKey = (rawKey: string): MovementKey | null => {
          const k = rawKey.toLowerCase();
          if (k === "w" || k === "arrowup") return "w";
          if (k === "a" || k === "arrowleft") return "a";
          if (k === "s" || k === "arrowdown") return "s";
          if (k === "d" || k === "arrowright") return "d";
          return null;
        };

        const handleKeyDown = (e: KeyboardEvent) => {
          if (activeDialogueRef.current) return; // Freeze movement during dialogue

          const key = e.key.toLowerCase();

          // Press E or Space to interact with closest POI
          if ((key === "e" || key === " ") && nearestPOIRef.current) {
            e.preventDefault();
            handleStartInteract(nearestPOIRef.current);
            return;
          }

          if (key === "+" || key === "=") {
            e.preventDefault();
            currentZoom = Math.min(1.5, currentZoom + 0.05);
            return;
          }
          if (key === "-" || key === "_") {
            e.preventDefault();
            currentZoom = Math.max(0.75, currentZoom - 0.05);
            return;
          }

          const moveKey = normalizeMovementKey(e.key);
          if (!moveKey) return;
          e.preventDefault();
          clickPath = [];
          keys[moveKey] = true;
          const idx = keyOrder.indexOf(moveKey);
          if (idx !== -1) keyOrder.splice(idx, 1);
          keyOrder.push(moveKey);
        };

        const handleKeyUp = (e: KeyboardEvent) => {
          const moveKey = normalizeMovementKey(e.key);
          if (!moveKey) return;
          keys[moveKey] = false;
          const idx = keyOrder.indexOf(moveKey);
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
          const delta = e.deltaY < 0 ? 0.05 : -0.05;
          currentZoom = Math.max(0.75, Math.min(1.5, currentZoom + delta));
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
            x: camera.position.x + (cx - canvas.width / 2) / currentZoom,
            y: camera.position.y + (cy - canvas.height / 2) / currentZoom,
          };
        };

        const playerCenter = (): Point => ({
          x: player.position.x + player.width / 2,
          y: player.position.y + player.height / 2,
        });

        const playerSize = () => ({ width: player.width, height: player.height });
        const mapOrigin = () => (activeMapType === "new" ? { x: 0, y: 0 } : offset);

        const wouldCollide = (delta: Point) => {
          const next = {
            x: player.position.x + delta.x,
            y: player.position.y + delta.y,
          };
          const hitbox = getPlayerHitbox(next);
          for (const b of activeBoundaries) {
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
          if (!settingsRef.current.clickToMove || activeDialogueRef.current) return;
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

        // Movement Speed Calculation
        const getPaceSpeed = () => {
          let base = 5.2; // jog
          if (settingsRef.current.moveSpeed === "walk") base = 3.6;
          if (settingsRef.current.moveSpeed === "swift") base = 6.8;
          // Whisperwind Cloak speed boost
          if (storyStateRef.current.inventory.some((i) => i.id === "whisperCloak")) {
            base += 1.2;
          }
          return base;
        };

        const followClickPath = () => {
          if (clickPath.length === 0 || keyOrder.length > 0) return false;
          const pace = getPaceSpeed();
          const move = getNextClickMovement({
            path: clickPath,
            center: playerCenter(),
            stopDistance: WAYPOINT_STOP_DISTANCE,
            maxStep: pace,
          });
          if (!move) return clickPath.length > 0;
          player.moving = true;
          player.image =
            move.x !== 0
              ? move.x > 0 ? player.sprites!.right : player.sprites!.left
              : move.y > 0 ? player.sprites!.down : player.sprites!.up;
          if (wouldCollide(move)) {
            clickPath = [];
            player.moving = false;
            return false;
          }
          movePlayer(move);
          return true;
        };

        // FPS & timing
        let lastTime = performance.now();
        let frameCount = 0;
        let lastPosSave = 0;
        let lastMiniMapUpdate = 0;
        let lastNearestId = "";

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

          // Periodic player position save (every 5 seconds)
          if (now - lastPosSave > 5000) {
            savePlayerPos(player.position.x, player.position.y, activeMapType);
            lastPosSave = now;
          }

          // Synchronize MiniMap radar (throttled to 100ms)
          if (now - lastMiniMapUpdate > 100) {
            lastMiniMapUpdate = now;
            setPlayerHudPos({ x: player.position.x, y: player.position.y });
            let facing: "up" | "down" | "left" | "right" = "down";
            if (player.sprites) {
              if (player.image === player.sprites.up) facing = "up";
              else if (player.image === player.sprites.left) facing = "left";
              else if (player.image === player.sprites.right) facing = "right";
              else if (player.image === player.sprites.down) facing = "down";
            }
            setPlayerHudFacing(facing);
          }

          // Smooth Camera tracking per camera-systems skill
          const targetCamX = player.position.x + player.width / 2;
          const targetCamY = player.position.y + player.height / 2;
          camera.position.x += (targetCamX - camera.position.x) * 0.15;
          camera.position.y += (targetCamY - camera.position.y) * 0.15;

          // Clear Canvas
          ctx.fillStyle = activeMapType === "new" ? "#1e293b" : "rgb(44 87 145)";
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Render World
          ctx.save();
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.scale(currentZoom, currentZoom);
          ctx.translate(-camera.position.x, -camera.position.y);
          ctx.imageSmoothingEnabled = false;

          // 1. Draw Ground & Base Layer
          if (activeMapType === "new" && proceduralMap) {
            proceduralMap.draw(
              ctx,
              imgs.tileset,
              camera.position,
              canvas.width,
              canvas.height,
              currentZoom,
              now * 0.001,
            );
          } else if (background) {
            background.draw();
            activeBoundaries.forEach((b) => b.draw());
          }

          // 2. Ambient Particles (if enabled)
          if (settingsRef.current.particlesEnabled) {
            updateAmbient(ambientSys);
            drawAmbient(ctx, ambientSys);
          }

          // 3. Render POI ground markers / halos
          activePOIs.forEach((poi) => {
            if (poi.type === "object") {
              ctx.save();
              ctx.beginPath();
              ctx.arc(poi.position.x, poi.position.y, 22, 0, Math.PI * 2);
              ctx.fillStyle = "rgba(245, 158, 11, 0.15)";
              ctx.fill();
              ctx.lineWidth = 1.5;
              ctx.strokeStyle = "rgba(245, 158, 11, 0.4)";
              ctx.stroke();
              ctx.restore();
            }
          });

          // 4. Environmental Wind / Tree Shadows & Blossom/Leaf Drift
          updateEnvironment(envSystem);
          drawEnvironment(ctx, envSystem);

          // 5. Autonomous Meadow Animals
          updateAnimals(animals, player.position.x, player.position.y);
          drawAnimals(ctx, animals, animalSprites);

          // 6. Animate NPCs: breathing bobbing & turning to face player within 85px
          npcs.forEach((s, idx) => {
            const baseY = npcBaseY.get(s) ?? s.position.y;
            s.position.y = baseY + Math.sin(now * 0.003 + idx * 1.5) * 1.5;

            const dx = player.position.x - s.position.x;
            const dy = player.position.y - s.position.y;
            const dist = Math.hypot(dx, dy);
            if (dist < 85 && s.sprites) {
              if (Math.abs(dx) >= Math.abs(dy)) {
                s.image = dx > 0 ? s.sprites.right : s.sprites.left;
              } else {
                s.image = dy > 0 ? s.sprites.down : s.sprites.up;
              }
            } else if (s.sprites && dist > 115) {
              s.image = s.sprites.down;
            }
          });

          // 7. Y-Sorted Characters
          const sortedPlayers = [...allPlayers].sort((a, b) => a.position.y - b.position.y);
          sortedPlayers.forEach((s) => {
            const originalName = s.name;
            if (!settingsRef.current.showNameplates) s.name = undefined;
            s.draw();
            s.name = originalName;
          });

          // 8. Foreground Layer
          if (activeMapType === "new" && proceduralMap) {
            proceduralMap.drawForeground(
              ctx,
              camera.position,
              canvas.width,
              canvas.height,
              currentZoom,
              now * 0.001,
            );
          } else if (forground) {
            forground.draw();
          }

          drawSprinkles(ctx, sprinkles);

          // 9. Proximity detection for POIs
          const pCenter = playerCenter();
          let nearestPOI: InteractablePOI | null = null;
          let nearestDist = Infinity;

          for (const poi of activePOIs) {
            const dx = pCenter.x - poi.position.x;
            const dy = pCenter.y - poi.position.y;
            const dist = Math.hypot(dx, dy);
            if (dist <= poi.radius && dist < nearestDist) {
              nearestDist = dist;
              nearestPOI = poi;
            }
          }

          nearestPOIRef.current = nearestPOI;
          const currentNearestId = nearestPOI ? nearestPOI.id : "";
          if (currentNearestId !== lastNearestId) {
            lastNearestId = currentNearestId;
            setActivePOI(nearestPOI);
          }

          // 10. Floating interactable speech bubble above nearest POI if not in dialogue
          if (nearestPOI && !activeDialogueRef.current) {
            ctx.save();
            const glyphY = nearestPOI.position.y - (nearestPOI.type === "npc" ? 54 : 36) + Math.sin(now * 0.005) * 2.5;
            const label = nearestPOI.type === "npc" ? `💬 Press [E] to talk` : `✨ Press [E] to inspect`;
            ctx.font = "bold 11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
            const textW = ctx.measureText(label).width;

            ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
            ctx.strokeStyle = "rgba(245, 158, 11, 0.7)";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.roundRect(nearestPOI.position.x - textW / 2 - 8, glyphY - 14, textW + 16, 20, 6);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = "#fef08a";
            ctx.textAlign = "center";
            ctx.fillText(label, nearestPOI.position.x, glyphY);
            ctx.restore();
          }

          ctx.restore();

          // 10. Vector-Based Movement with Wall-Sliding
          let moved = false;
          player.moving = false;

          if (!activeDialogueRef.current) {
            let inputX = 0;
            let inputY = 0;
            if (keys.w) inputY -= 1;
            if (keys.s) inputY += 1;
            if (keys.a) inputX -= 1;
            if (keys.d) inputX += 1;

            if (inputX !== 0 || inputY !== 0) {
              clickPath = [];
              player.moving = true;
              const pace = getPaceSpeed();

              // Normalize diagonal vector so diagonal speed is consistent
              const length = Math.hypot(inputX, inputY);
              const vx = (inputX / length) * pace;
              const vy = (inputY / length) * pace;

              // Set sprite facing based on primary axis
              if (Math.abs(inputX) >= Math.abs(inputY)) {
                player.image = inputX > 0 ? player.sprites!.right : player.sprites!.left;
              } else {
                player.image = inputY > 0 ? player.sprites!.down : player.sprites!.up;
              }

              // Smooth Wall-Sliding: check X and Y separately
              if (vx !== 0 && !wouldCollide({ x: vx, y: 0 })) {
                movePlayer({ x: vx, y: 0 });
                moved = true;
              }
              if (vy !== 0 && !wouldCollide({ x: 0, y: vy })) {
                movePlayer({ x: 0, y: vy });
                moved = true;
              }
            } else {
              moved = followClickPath();
            }
          }

          if (settingsRef.current.footstepsEnabled) {
            audioManager.playFootstep(moved && player.moving);
          }
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
          window.removeEventListener("resize", handleResize);
          canvas.removeEventListener("wheel", handleWheel);
          canvas.removeEventListener("dblclick", handleDblClick);
        };
      })
      .catch((err) => {
        console.error("Failed to load game assets:", err);
        setIsAssetsLoading(false);
      });

    return () => {
      cancelled = true;
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      const c = canvasRef.current as unknown as { _cleanup?: () => void } | null;
      if (c?._cleanup) c._cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, playerConfig, collisionsMap, settings.selectedMap]);

  const handleSelectDialogueOption = useCallback((option: DialogueOption) => {
    const state = { ...storyStateRef.current };

    if (option.onSelect) {
      option.onSelect(state);
      setStoryState({ ...state });
      saveStoryState(state);
    }

    if (option.nextNodeId) {
      const nextNode = DIALOGUE_NODES[option.nextNodeId];
      if (nextNode) {
        setActiveDialogue(nextNode);
        return;
      }
    }

    // Close dialogue
    setActiveDialogue(null);
  }, []);

  const handleCloseDialogue = useCallback(() => {
    setActiveDialogue(null);
  }, []);

  const handleTeleportToWell = useCallback(() => {
    if (teleportRef.current) {
      if (settings.selectedMap === "new") {
        teleportRef.current({ x: 44 * 64 + 32, y: 28 * 64 + 32 });
      } else {
        teleportRef.current({ x: 810, y: 220 });
      }
    }
  }, [settings.selectedMap]);

  const handleSaveGame = useCallback(() => {
    if (playerConfig) saveSession(playerConfig);
    if (getPlayerPosRef.current) {
      const pos = getPlayerPosRef.current();
      savePlayerPos(pos.x, pos.y, settings.selectedMap);
    }
    saveStoryState(storyStateRef.current);
  }, [playerConfig, settings.selectedMap]);

  const handleEnterWorld = useCallback(
    (config: PlayerConfig, mapType?: MapType) => {
      saveSession(config);
      setPlayerConfigState(config);
      if (mapType) {
        updateSettings({ selectedMap: mapType });
      }
      setPhase("game");
    },
    [setPhase, updateSettings],
  );

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
      {phase === "start" && (
        <StartScreen
          onEnter={handleEnterWorld}
          initialMap={settings.selectedMap}
        />
      )}

      {phase === "game" && (
        <>
          <canvas
            ref={canvasRef}
            width={window.innerWidth}
            height={window.innerHeight}
            style={{
              display: "block",
              background: settings.selectedMap === "new" ? "#1e293b" : "rgb(44 87 145)",
            }}
          />

          {isAssetsLoading && (
            <div className="world-loading-overlay">
              <div className="world-loading-card">
                <div className="world-loading-spinner" />
                <div className="world-loading-title">🌿 Awakening Whispering Meadows...</div>
                <div className="world-loading-sub">
                  {settings.selectedMap === "new"
                    ? "Weaving the ancient stones of the Sunken Citadel..."
                    : "Summoning Oakhaven Glade and the ancient trees..."}
                </div>
              </div>
            </div>
          )}

          {playerConfig && (
            <>
              <GameHUD
                playerName={playerConfig.name}
                settings={settings}
                onUpdateSettings={updateSettings}
                fps={fps}
                onExitWorld={handleExitWorld}
                onTeleportToWell={handleTeleportToWell}
                onSaveGame={handleSaveGame}
              />

              <QuestTracker
                storyState={storyState}
                activePOI={activePOI}
                onInteract={handleStartInteract}
              />

              <MiniMap
                playerPos={playerHudPos}
                playerFacing={playerHudFacing}
                pois={currentActivePOIs}
                worldWidth={settings.selectedMap === "new" ? (activeProceduralMap?.width ?? 4096) : 4096}
                worldHeight={settings.selectedMap === "new" ? (activeProceduralMap?.height ?? 4096) : 2304}
                mapType={settings.selectedMap || "new"}
                proceduralMap={activeProceduralMap}
                onTeleport={(x, y) => {
                  if (teleportRef.current) teleportRef.current({ x, y });
                }}
                activeQuestTitle={storyState.quests.find((q) => q.active && !q.completed)?.title}
              />

              {activeDialogue && (
                <DialogueBox
                  node={activeDialogue}
                  onSelectOption={handleSelectDialogueOption}
                  onClose={handleCloseDialogue}
                />
              )}
            </>
          )}
        </>
      )}
    </GameContext.Provider>
  );
}

export default App;
