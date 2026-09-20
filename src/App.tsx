import { useEffect, useMemo, useRef } from "react";
import { collision } from "./collision";

const MOVE_SPEED = 5;
const ANIMATION_FRAME_DELAY = 5;
const PLAYER_NAME = "me";
const WAYPOINT_STOP_DISTANCE = 4;
const SPRINKLE_PARTICLE_COUNT = 24;
const SPRINKLE_LIFETIME = 34;

type Point = { x: number; y: number };
type Tile = { row: number; col: number };

type SprinkleParticle = {
  position: Point;
  velocity: Point;
  radius: number;
  color: string;
  life: number;
  maxLife: number;
};

class Sprite {
  ctx: CanvasRenderingContext2D;
  image: HTMLImageElement;
  position: { x: number; y: number };
  frames: { max: number; val: number; elapsed: number };
  width: number;
  height: number;
  moving?: boolean;
  sprites?: {
    up: HTMLImageElement;
    down: HTMLImageElement;
    left: HTMLImageElement;
    right: HTMLImageElement;
  };

  constructor({
    ctx,
    image,
    position,
    frames = { max: 1 },
    moving = false,
    sprites,
  }: {
    ctx: CanvasRenderingContext2D;
    image: HTMLImageElement;
    position: { x: number; y: number };
    frames?: { max: number; val?: number; elapsed?: number };
    moving?: boolean;
    sprites?: {
      up: HTMLImageElement;
      down: HTMLImageElement;
      left: HTMLImageElement;
      right: HTMLImageElement;
    };
  }) {
    this.ctx = ctx;
    this.image = image;
    this.position = position;
    this.frames = { ...frames, val: 0, elapsed: 0 };
    this.width = this.image.width / frames.max;
    this.height = this.image.height;
    this.moving = moving;
    this.sprites = sprites;
  }
  draw() {
    this.ctx.drawImage(
      this.image,
      this.frames.val * this.width,
      0,
      this.width,
      this.height,
      this.position.x,
      this.position.y,
      this.width,
      this.height,
    );

    if (this.frames.max > 1 && this.moving) {
      this.frames.elapsed++;

      // Higher number = slower animation
      if (this.frames.elapsed >= ANIMATION_FRAME_DELAY) {
        this.frames.elapsed = 0;
        this.frames.val++;

        if (this.frames.val >= this.frames.max) {
          this.frames.val = 0;
        }
      }
    }
  }
}

class Boundary {
  static width = 64;
  static height = 64;

  ctx: CanvasRenderingContext2D;
  position: { x: number; y: number };
  width: number;
  height: number;

  constructor({
    ctx,
    position,
  }: {
    ctx: CanvasRenderingContext2D;
    position: { x: number; y: number };
  }) {
    this.ctx = ctx;
    this.position = position;
    this.width = Boundary.width;
    this.height = Boundary.height;
  }

  draw() {
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.04)";
    this.ctx.fillRect(
      this.position.x,
      this.position.y,
      this.width,
      this.height,
    );
  }
}

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

    const clampZoom = (value: number) =>
      Math.max(0.9, Math.min(1.5, value));

    const changeZoom = (amount: number) => {
      zoom = clampZoom(zoom + amount);
    };

    const isMovementKey = (
      value: string,
    ): value is MovementKey =>
      value === "w" ||
      value === "a" ||
      value === "s" ||
      value === "d";

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      if (
        key === "+" ||
        key === "="
      ) {
        e.preventDefault();
        changeZoom(0.05);
        return;
      }

      if (
        key === "-" ||
        key === "_"
      ) {
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

    const movables = [background, ...boundaries, forground];

    const createSprinkle = (position: Point) => {
      const colors = ["#ffffff", "#ffe082", "#7dd3fc", "#86efac", "#f9a8d4"];

      for (let i = 0; i < SPRINKLE_PARTICLE_COUNT; i++) {
        const angle =
          (Math.PI * 2 * i) / SPRINKLE_PARTICLE_COUNT +
          Math.random() * 0.35;
        const speed = 1.6 + Math.random() * 2.6;
        const life =
          SPRINKLE_LIFETIME + Math.floor(Math.random() * 14);

        sprinkles.push({
          position: { ...position },
          velocity: {
            x: Math.cos(angle) * speed,
            y: Math.sin(angle) * speed - 0.8,
          },
          radius: 2 + Math.random() * 2.4,
          color: colors[i % colors.length],
          life,
          maxLife: life,
        });
      }
    };

    const screenToWorld = (clientX: number, clientY: number): Point => {
      const rect = canvas.getBoundingClientRect();
      const canvasX =
        ((clientX - rect.left) / rect.width) * canvas.width;
      const canvasY =
        ((clientY - rect.top) / rect.height) * canvas.height;

      return {
        x: (canvasX - canvas.width / 2) / zoom + canvas.width / 2,
        y: (canvasY - canvas.height / 2) / zoom + canvas.height / 2,
      };
    };

    const moveWorld = (delta: Point) => {
      movables.forEach((movable) => {
        movable.position.x += delta.x;
        movable.position.y += delta.y;
      });

      clickPath.forEach((waypoint) => {
        waypoint.x += delta.x;
        waypoint.y += delta.y;
      });
      sprinkles.forEach((particle) => {
        particle.position.x += delta.x;
        particle.position.y += delta.y;
      });
    };

    const playerCenter = (): Point => ({
      x: player.position.x + player.width / 2,
      y: player.position.y + player.height / 2,
    });

    const wouldCollideAfterWorldMove = (delta: Point) => {
      for (let i = 0; i < boundaries.length; i++) {
        const boundary = boundaries[i];

        if (
          checkCollision(player, {
            ...boundary,
            position: {
              x: boundary.position.x + delta.x,
              y: boundary.position.y + delta.y,
            },
          })
        ) {
          return true;
        }
      }

      return false;
    };

    const tileKey = (tile: Tile) => `${tile.row},${tile.col}`;

    const isTileInMap = (tile: Tile) =>
      tile.row >= 0 &&
      tile.row < collisionsMap.length &&
      tile.col >= 0 &&
      tile.col < collisionsMap[0].length;

    const isWalkableTile = (tile: Tile) =>
      isTileInMap(tile) && collisionsMap[tile.row][tile.col] === 0;

    const worldToTile = (point: Point): Tile => ({
      row: Math.floor((point.y - background.position.y) / Boundary.height),
      col: Math.floor((point.x - background.position.x) / Boundary.width),
    });

    const tileToWorldCenter = (tile: Tile): Point => ({
      x: background.position.x + tile.col * Boundary.width + Boundary.width / 2,
      y:
        background.position.y +
        tile.row * Boundary.height +
        Boundary.height / 2,
    });

    const nearestWalkableTile = (tile: Tile): Tile | null => {
      if (isWalkableTile(tile)) return tile;
      if (!isTileInMap(tile)) return null;

      const queue: Tile[] = [tile];
      const visited = new Set([tileKey(tile)]);
      const directions: Tile[] = [
        { row: -1, col: 0 },
        { row: 0, col: 1 },
        { row: 1, col: 0 },
        { row: 0, col: -1 },
      ];

      for (let index = 0; index < queue.length; index++) {
        const current = queue[index];

        for (const direction of directions) {
          const next = {
            row: current.row + direction.row,
            col: current.col + direction.col,
          };
          const key = tileKey(next);

          if (visited.has(key) || !isTileInMap(next)) continue;
          if (isWalkableTile(next)) return next;

          visited.add(key);
          queue.push(next);
        }
      }

      return null;
    };

    const findShortestPath = (start: Tile, end: Tile): Point[] => {
      if (!isWalkableTile(start) || !isWalkableTile(end)) return [];

      const queue: Tile[] = [start];
      const visited = new Set([tileKey(start)]);
      const previous = new Map<string, string>();
      const tilesByKey = new Map([[tileKey(start), start]]);
      const directions: Tile[] = [
        { row: -1, col: 0 },
        { row: 0, col: 1 },
        { row: 1, col: 0 },
        { row: 0, col: -1 },
      ];
      const endKey = tileKey(end);

      for (let index = 0; index < queue.length; index++) {
        const current = queue[index];
        const currentKey = tileKey(current);

        if (currentKey === endKey) break;

        for (const direction of directions) {
          const next = {
            row: current.row + direction.row,
            col: current.col + direction.col,
          };
          const nextKey = tileKey(next);

          if (visited.has(nextKey) || !isWalkableTile(next)) continue;

          visited.add(nextKey);
          previous.set(nextKey, currentKey);
          tilesByKey.set(nextKey, next);
          queue.push(next);
        }
      }

      if (!visited.has(endKey)) return [];

      const pathTiles: Tile[] = [];
      let currentKey = endKey;

      while (currentKey !== tileKey(start)) {
        const tile = tilesByKey.get(currentKey);
        const parentKey = previous.get(currentKey);

        if (!tile || !parentKey) return [];

        pathTiles.unshift(tile);
        currentKey = parentKey;
      }

      return pathTiles.map(tileToWorldCenter);
    };

    const handleDoubleClick = (e: MouseEvent) => {
      e.preventDefault();
      const target = screenToWorld(e.clientX, e.clientY);
      const startTile = worldToTile(playerCenter());
      const targetTile = nearestWalkableTile(worldToTile(target));

      clickPath = targetTile
        ? findShortestPath(startTile, targetTile)
        : [];
      createSprinkle(target);
    };

    canvas.addEventListener("dblclick", handleDoubleClick);

    const checkCollision = (
      rect1: Sprite,
      rect2: {
        position: { x: number; y: number };
        width: number;
        height: number;
      },
    ) => {
      return (
        rect1.position.x < rect2.position.x + rect2.width &&
        rect1.position.x + rect1.width > rect2.position.x &&
        rect1.position.y < rect2.position.y + rect2.height &&
        rect1.position.y + rect1.height > rect2.position.y
      );
    };

    const drawSprinkles = () => {
      for (let i = sprinkles.length - 1; i >= 0; i--) {
        const particle = sprinkles[i];
        const progress = particle.life / particle.maxLife;

        ctx.save();
        ctx.globalAlpha = Math.max(0, progress);
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(
          particle.position.x,
          particle.position.y,
          particle.radius * (0.65 + progress * 0.6),
          0,
          Math.PI * 2,
        );
        ctx.fill();
        ctx.restore();

        particle.position.x += particle.velocity.x;
        particle.position.y += particle.velocity.y;
        particle.velocity.x *= 0.95;
        particle.velocity.y = particle.velocity.y * 0.95 + 0.08;
        particle.life--;

        if (particle.life <= 0) {
          sprinkles.splice(i, 1);
        }
      }
    };

    const followClickPath = () => {
      if (clickPath.length === 0 || keyOrder.length > 0) return false;

      const center = playerCenter();
      const waypoint = clickPath[0];
      const distanceX = waypoint.x - center.x;
      const distanceY = waypoint.y - center.y;
      const distance = Math.hypot(distanceX, distanceY);

      if (distance <= WAYPOINT_STOP_DISTANCE) {
        clickPath.shift();
        return clickPath.length > 0;
      }

      const step = Math.min(MOVE_SPEED, distance);
      const worldMove = {
        x: -(distanceX / distance) * step,
        y: -(distanceY / distance) * step,
      };

      player.moving = true;

      if (Math.abs(distanceX) > Math.abs(distanceY)) {
        player.image =
          distanceX > 0 ? player.sprites!.right : player.sprites!.left;
      } else {
        player.image =
          distanceY > 0 ? player.sprites!.down : player.sprites!.up;
      }

      if (wouldCollideAfterWorldMove(worldMove)) {
        clickPath = [];
        player.moving = false;
        return false;
      }

      moveWorld(worldMove);
      return true;
    };

    function gameLoop(): void {
      if (!ctx || !canvas) return;

      ctx.fillStyle = "rgb(44 87 145)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.scale(zoom, zoom);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);

      background.draw();
      boundaries.forEach((boundary) => {
        boundary.draw();
      });
      player.draw();

      forground.draw();
      drawSprinkles();

      ctx.save();
      ctx.font = "bold 12px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(0, 0, 0, 0.85)";
      ctx.fillStyle = "#ffffff";
      const nameX =
        player.position.x +
        player.width / 2;
      const nameY =
        player.position.y - 4;
      ctx.strokeText(
        PLAYER_NAME,
        nameX,
        nameY,
      );
      ctx.fillText(
        PLAYER_NAME,
        nameX,
        nameY,
      );
      ctx.restore();

      let moving = true;
      player.moving = false;
      const activeKey = keyOrder[keyOrder.length - 1];

      if (activeKey === "w" && keys.w) {
        player.image = player.sprites!.up;
        player.moving = true;
        for (let i = 0; i < boundaries.length; i++) {
          const boundary = boundaries[i];
          if (
            checkCollision(player, {
              ...boundary,
              position: {
                x: boundary.position.x,
                y: boundary.position.y + MOVE_SPEED,
              },
            })
          ) {
            console.log("coliding");
            moving = false;
            break;
          }
        }
        if (moving) {
          moveWorld({ x: 0, y: MOVE_SPEED });
        }
      } else if (activeKey === "a" && keys.a) {
        player.image = player.sprites!.left;
        player.moving = true;
        for (let i = 0; i < boundaries.length; i++) {
          const boundary = boundaries[i];
          if (
            checkCollision(player, {
              ...boundary,
              position: {
                x: boundary.position.x + MOVE_SPEED,
                y: boundary.position.y,
              },
            })
          ) {
            console.log("coliding");
            moving = false;
            break;
          }
        }
        if (moving) {
          moveWorld({ x: MOVE_SPEED, y: 0 });
        }
      } else if (activeKey === "s" && keys.s) {
        player.moving = true;
        player.image = player.sprites!.down;
        for (let i = 0; i < boundaries.length; i++) {
          const boundary = boundaries[i];
          if (
            checkCollision(player, {
              ...boundary,
              position: {
                x: boundary.position.x,
                y: boundary.position.y - MOVE_SPEED,
              },
            })
          ) {
            console.log("coliding");
            moving = false;
            break;
          }
        }
        if (moving) {
          moveWorld({ x: 0, y: -MOVE_SPEED });
        }
      } else if (activeKey === "d" && keys.d) {
        player.moving = true;
        player.image = player.sprites!.right;
        for (let i = 0; i < boundaries.length; i++) {
          const boundary = boundaries[i];
          if (
            checkCollision(player, {
              ...boundary,
              position: {
                x: boundary.position.x - MOVE_SPEED,
                y: boundary.position.y,
              },
            })
          ) {
            console.log("coliding");
            moving = false;
            break;
          }
        }
        if (moving) {
          moveWorld({ x: -MOVE_SPEED, y: 0 });
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
