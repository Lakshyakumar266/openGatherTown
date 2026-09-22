import { useEffect, useMemo, useRef } from "react";
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

const MOVE_SPEED = 5;
const WAYPOINT_STOP_DISTANCE = 4;
const players: Sprite[] = [];

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const collisionsMap: number[][] = useMemo(() => {
    const map: number[][] = [];
    for (let i = 0; i < collision.length; i += 64) {
      map.push(collision.slice(i, i + 64));
    }
    return map;
  }, []);

  const offset = {
    x: 0,
    y: -430,
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const boundaries: Boundary[] = [];

    collisionsMap.forEach((row, i) => {
      row.forEach((item, j) => {
        if (item != 0) {
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

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const BackgroundImage = new Image();
    BackgroundImage.src = "/BackgroundTerrain.png";
    const ForgroundImage = new Image();
    ForgroundImage.src = "/forground.png";

    const keys: { w: boolean; a: boolean; s: boolean; d: boolean } = {
      w: false,
      a: false,
      s: false,
      d: false,
    };

    type MovementKey = keyof typeof keys;
    const keyOrder: MovementKey[] = [];
    const sprinkles: SprinkleParticle[] = [];
    let clickPath: Point[] = [];
    let zoom = 1;

    const clampZoom = (value: number) => Math.max(0.9, Math.min(1.5, value));

    const changeZoom = (amount: number) => {
      zoom = clampZoom(zoom + amount);
    };

    const isMovementKey = (value: string): value is MovementKey =>
      value === "w" || value === "a" || value === "s" || value === "d";

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      if (key === "+" || key === "=") {
        e.preventDefault();
        changeZoom(0.05);
        return;
      }

      if (key === "-" || key === "_") {
        e.preventDefault();
        changeZoom(-0.05);
        return;
      }

      if (!isMovementKey(key)) return;

      clickPath = [];
      keys[key] = true;

      // Keep the most recently pressed key on top. Repeated keydown events
      // must not create duplicates, or releasing once would leave it stuck.
      const existingIndex = keyOrder.indexOf(key);
      if (existingIndex !== -1) {
        keyOrder.splice(existingIndex, 1);
      }
      keyOrder.push(key);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      if (!isMovementKey(key)) return;

      keys[key] = false;
      const index = keyOrder.indexOf(key);
      if (index !== -1) {
        keyOrder.splice(index, 1);
      }
    };

    const handleWindowBlur = () => {
      keyOrder.length = 0;
      keys.w = false;
      keys.a = false;
      keys.s = false;
      keys.d = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleWindowBlur);

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      changeZoom(e.deltaY < 0 ? 0.05 : -0.05);
    };

    canvas.addEventListener("wheel", handleWheel, {
      passive: false,
    });

    const background = new Sprite({
      ctx: ctx,
      image: BackgroundImage,
      position: {
        x: offset.x,
        y: offset.y,
      },
    });
    const forground = new Sprite({
      ctx: ctx,
      image: ForgroundImage,
      position: {
        x: offset.x,
        y: offset.y,
      },
    });

    const PlayerUpImage = new Image();
    PlayerUpImage.src = "/playerUp.png";
    const PlayerDownImage = new Image();
    PlayerDownImage.src = "/playerDown.png";
    const PlayerLeftImage = new Image();
    PlayerLeftImage.src = "/playerLeft.png";
    const PlayerRightImage = new Image();
    PlayerRightImage.src = "/playerRight.png";
    const player = new Sprite({
      ctx: ctx,
      image: PlayerDownImage,
      name: "mee",
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
    players.push(player);
    const testPlayer = new Sprite({
      ctx: ctx,
      image: PlayerDownImage,
      name: "meeowTOOO",
      position: {
        x: canvas.width / 2 - 192 + 84,
        y: canvas.height / 2 - 68 + 84,
      },
      frames: { max: 4 },
      sprites: {
        up: PlayerUpImage,
        down: PlayerDownImage,
        right: PlayerRightImage,
        left: PlayerLeftImage,
      },
    });
    players.push(testPlayer);

    const screenToWorld = (clientX: number, clientY: number): Point => {
      const rect = canvas.getBoundingClientRect();
      const canvasX = ((clientX - rect.left) / rect.width) * canvas.width;
      const canvasY = ((clientY - rect.top) / rect.height) * canvas.height;

      return {
        x: (canvasX - canvas.width / 2) / zoom + canvas.width / 2,
        y: (canvasY - canvas.height / 2) / zoom + canvas.height / 2,
      };
    };

    const movePlayer = (player: Sprite, delta: Point) => {
      player.position.x += delta.x;
      player.position.y += delta.y;
    };

    const playerCenter = (): Point => ({
      x: player.position.x + player.width / 2,
      y: player.position.y + player.height / 2,
    });

    const playerSize = () => ({
      width: player.width,
      height: player.height,
    });

    const mapOrigin = () => background.position;

    const wouldCollideAfterPlayerMove = (delta: Point) => {
      const nextPlayerPosition = {
        x: player.position.x + delta.x,
        y: player.position.y + delta.y,
      };

      const nextPlayerHitbox = getPlayerHitbox(nextPlayerPosition);

      for (let i = 0; i < boundaries.length; i++) {
        const boundary = boundaries[i];
        if (
          checkCollision(nextPlayerHitbox, {
            position: boundary.position,
            width: boundary.width,
            height: boundary.height,
          })
        ) {
          return true;
        }
      }
      for (const otherPlayer of players) {
        if (otherPlayer === player) continue;
        else if (checkCollision(nextPlayerHitbox, otherPlayer)) {
          return true;
        }
      }
      return false;
    };

    const handleDoubleClick = (e: MouseEvent) => {
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
    };

    canvas.addEventListener("dblclick", handleDoubleClick);

    const followClickPath = () => {
      if (clickPath.length === 0 || keyOrder.length > 0) return false;

      const playerMove = getNextClickMovement({
        path: clickPath,
        center: playerCenter(),
        stopDistance: WAYPOINT_STOP_DISTANCE,
        maxStep: MOVE_SPEED,
      });

      if (!playerMove) return clickPath.length > 0;

      player.moving = true;

      if (playerMove.x !== 0) {
        player.image =
          playerMove.x > 0 ? player.sprites!.right : player.sprites!.left;
      } else {
        player.image =
          playerMove.y > 0 ? player.sprites!.down : player.sprites!.up;
      }

      if (wouldCollideAfterPlayerMove(playerMove)) {
        clickPath = [];
        player.moving = false;
        return false;
      }

      movePlayer(player, playerMove);
      return true;
    };

    const camera = {
      position: {
        x: player.position.x + player.width / 2,
        y: player.position.y + player.height / 2,
      },
    };

    const updateCamera = () => {
      camera.position.x = player.position.x + player.width / 2;
      camera.position.y = player.position.y + player.height / 2;
    };

    function gameLoop(): void {
      if (!ctx || !canvas) return;

      updateCamera();

      ctx.fillStyle = "rgb(44 87 145)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.scale(zoom, zoom);
      ctx.translate(-camera.position.x, -camera.position.y);

      background.draw();
      boundaries.forEach((boundary) => {
        boundary.draw();
      });
      testPlayer.draw();
      player.draw();

      forground.draw();
      drawSprinkles(ctx, sprinkles);

      // // ~~~~~~TEMP CODE
      // ctx.save();
      // ctx.font = "bold 12px monospace";
      // ctx.textAlign = "center";
      // ctx.textBaseline = "bottom";
      // ctx.lineWidth = 3;
      // ctx.strokeStyle = "rgba(0, 0, 0, 0.85)";
      // ctx.fillStyle = "#ffffff";
      // const nameX = player.position.x + player.width / 2;
      // const nameY = player.position.y - 4;

      // ctx.strokeText(
      //   `${wouldCollideAfterPlayerMove(player.position)} for: ${player.position.x}, ${player.position.y}`,
      //   nameX,
      //   nameY,
      // );

      // ctx.fillText(
      //   `${wouldCollideAfterPlayerMove(player.position)} for: ${player.position.x}, ${player.position.y}`,
      //   nameX,
      //   nameY,
      // );
      // ctx.restore();
      // // TEMP CODE~~~~~~

      let moving = true;
      player.moving = false;
      const activeKey = keyOrder[keyOrder.length - 1];
      if (activeKey === "w" && keys.w) {
        player.image = player.sprites!.up;
        player.moving = true;
        if (wouldCollideAfterPlayerMove({ x: 0, y: -MOVE_SPEED })) {
          moving = false;
        }
        if (moving) {
          movePlayer(player, { x: 0, y: -MOVE_SPEED });
        }
      } else if (activeKey === "a" && keys.a) {
        player.image = player.sprites!.left;
        player.moving = true;
        if (wouldCollideAfterPlayerMove({ x: -MOVE_SPEED, y: 0 })) {
          moving = false;
        }
        if (moving) {
          movePlayer(player, { x: -MOVE_SPEED, y: 0 });
        }
      } else if (activeKey === "s" && keys.s) {
        player.moving = true;
        player.image = player.sprites!.down;
        if (wouldCollideAfterPlayerMove({ x: 0, y: MOVE_SPEED })) {
          moving = false;
        }
        if (moving) {
          movePlayer(player, { x: 0, y: MOVE_SPEED });
        }
      } else if (activeKey === "d" && keys.d) {
        player.moving = true;
        player.image = player.sprites!.right;
        if (wouldCollideAfterPlayerMove({ x: MOVE_SPEED, y: 0 })) {
          moving = false;
        }
        if (moving) {
          movePlayer(player, { x: MOVE_SPEED, y: 0 });
        }
      } else {
        followClickPath();
      }

      ctx.restore();
      requestAnimationFrame(gameLoop);
    }

    gameLoop();

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleWindowBlur);
      canvas.removeEventListener("wheel", handleWheel);
      canvas.removeEventListener("dblclick", handleDoubleClick);
    };
  }, [collisionsMap, offset.x, offset.y]);

  return (
    <div style={{ backgroundColor: "black" }}>
      <canvas
        ref={canvasRef}
        width={innerWidth}
        height={innerHeight}
        style={{ display: "block" }}
      ></canvas>
    </div>
  );
}

export default App;
