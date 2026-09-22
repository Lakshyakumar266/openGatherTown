import { useEffect, useMemo, useRef } from "react";
import { collision } from "./collision";
import { Boundary, Sprite } from "./class";

const MOVE_SPEED = 5;
const WAYPOINT_STOP_DISTANCE = 4;
const SPRINKLE_PARTICLE_COUNT = 24;
const SPRINKLE_LIFETIME = 34;
const PLAYER_HITBOX = {
  offsetX: 10,
  offsetY: 34,
  width: 28,
  height: 28,
};

const players: Sprite[] = [];

type Point = { x: number; y: number };
type Tile = { row: number; col: number };
type Rect = {
  position: Point;
  width: number;
  height: number;
};

type SprinkleParticle = {
  position: Point;
  velocity: Point;
  radius: number;
  color: string;
  life: number;
  maxLife: number;
};

const CARDINAL_DIRECTIONS: Tile[] = [
  { row: -1, col: 0 },
  { row: 0, col: 1 },
  { row: 1, col: 0 },
  { row: 0, col: -1 },
];

const tileKey = (tile: Tile) => `${tile.row},${tile.col}`;

const checkCollision = (rect1: Rect, rect2: Rect) => {
  return (
    rect1.position.x < rect2.position.x + rect2.width &&
    rect1.position.x + rect1.width > rect2.position.x &&
    rect1.position.y < rect2.position.y + rect2.height &&
    rect1.position.y + rect1.height > rect2.position.y
  );
};

const playerPositionFromCenter = (
  center: Point,
  playerSize: { width: number; height: number },
): Point => ({
  x: center.x - playerSize.width / 2,
  y: center.y - playerSize.height / 2,
});

const getPlayerHitbox = (position: Point): Rect => ({
  position: {
    x: position.x + PLAYER_HITBOX.offsetX,
    y: position.y + PLAYER_HITBOX.offsetY,
  },
  width: PLAYER_HITBOX.width,
  height: PLAYER_HITBOX.height,
});

const isTileInMap = (collisionsMap: number[][], tile: Tile) =>
  tile.row >= 0 &&
  tile.row < collisionsMap.length &&
  tile.col >= 0 &&
  tile.col < collisionsMap[0].length;

const isWalkableTile = (collisionsMap: number[][], tile: Tile) =>
  isTileInMap(collisionsMap, tile) && collisionsMap[tile.row][tile.col] === 0;

const worldToTile = (point: Point, mapOrigin: Point): Tile => ({
  row: Math.floor((point.y - mapOrigin.y) / Boundary.height),
  col: Math.floor((point.x - mapOrigin.x) / Boundary.width),
});

const tileToWorldCenter = (tile: Tile, mapOrigin: Point): Point => ({
  x: mapOrigin.x + tile.col * Boundary.width + Boundary.width / 2,
  y: mapOrigin.y + tile.row * Boundary.height + Boundary.height / 2,
});

const collidesWithCollisionMap = (
  rect: Rect,
  collisionsMap: number[][],
  mapOrigin: Point,
) => {
  const left = Math.floor((rect.position.x - mapOrigin.x) / Boundary.width);
  const right = Math.floor(
    (rect.position.x + rect.width - 1 - mapOrigin.x) / Boundary.width,
  );
  const top = Math.floor((rect.position.y - mapOrigin.y) / Boundary.height);
  const bottom = Math.floor(
    (rect.position.y + rect.height - 1 - mapOrigin.y) / Boundary.height,
  );

  for (let row = top; row <= bottom; row++) {
    for (let col = left; col <= right; col++) {
      if (
        !isTileInMap(collisionsMap, { row, col }) ||
        collisionsMap[row][col] !== 0
      ) {
        return true;
      }
    }
  }

  return false;
};

const canPlayerStandAt = ({
  center,
  collisionsMap,
  mapOrigin,
  playerSize,
}: {
  center: Point;
  collisionsMap: number[][];
  mapOrigin: Point;
  playerSize: { width: number; height: number };
}) => {
  const position = playerPositionFromCenter(center, playerSize);

  return !collidesWithCollisionMap(
    getPlayerHitbox(position),
    collisionsMap,
    mapOrigin,
  );
};

const isStandableTile = ({
  tile,
  collisionsMap,
  mapOrigin,
  playerSize,
}: {
  tile: Tile;
  collisionsMap: number[][];
  mapOrigin: Point;
  playerSize: { width: number; height: number };
}) =>
  isWalkableTile(collisionsMap, tile) &&
  canPlayerStandAt({
    center: tileToWorldCenter(tile, mapOrigin),
    collisionsMap,
    mapOrigin,
    playerSize,
  });

const nearestStandableTile = ({
  tile,
  collisionsMap,
  mapOrigin,
  playerSize,
}: {
  tile: Tile;
  collisionsMap: number[][];
  mapOrigin: Point;
  playerSize: { width: number; height: number };
}): Tile | null => {
  const canStandOnTile = (candidate: Tile) =>
    isStandableTile({
      tile: candidate,
      collisionsMap,
      mapOrigin,
      playerSize,
    });

  if (canStandOnTile(tile)) return tile;
  if (!isTileInMap(collisionsMap, tile)) return null;

  const queue: Tile[] = [tile];
  const visited = new Set([tileKey(tile)]);

  for (let index = 0; index < queue.length; index++) {
    const current = queue[index];

    for (const direction of CARDINAL_DIRECTIONS) {
      const next = {
        row: current.row + direction.row,
        col: current.col + direction.col,
      };
      const key = tileKey(next);

      if (visited.has(key) || !isTileInMap(collisionsMap, next)) continue;
      if (canStandOnTile(next)) return next;

      visited.add(key);
      queue.push(next);
    }
  }

  return null;
};

const findShortestCardinalPath = ({
  start,
  end,
  collisionsMap,
  mapOrigin,
  playerSize,
}: {
  start: Tile;
  end: Tile;
  collisionsMap: number[][];
  mapOrigin: Point;
  playerSize: { width: number; height: number };
}): Point[] => {
  const canStandOnTile = (tile: Tile) =>
    isStandableTile({
      tile,
      collisionsMap,
      mapOrigin,
      playerSize,
    });

  if (!canStandOnTile(start) || !canStandOnTile(end)) return [];

  const openSet: Tile[] = [start];
  const closedSet = new Set<string>();
  const previous = new Map<string, string>();
  const tilesByKey = new Map([[tileKey(start), start]]);
  const gScore = new Map([[tileKey(start), 0]]);
  const endKey = tileKey(end);
  const heuristic = (tile: Tile) =>
    Math.abs(tile.row - end.row) + Math.abs(tile.col - end.col);

  while (openSet.length > 0) {
    let bestIndex = 0;

    for (let i = 1; i < openSet.length; i++) {
      const currentKey = tileKey(openSet[i]);
      const bestKey = tileKey(openSet[bestIndex]);
      const currentScore =
        (gScore.get(currentKey) ?? Infinity) + heuristic(openSet[i]);
      const bestScore =
        (gScore.get(bestKey) ?? Infinity) + heuristic(openSet[bestIndex]);

      if (currentScore < bestScore) {
        bestIndex = i;
      }
    }

    const [current] = openSet.splice(bestIndex, 1);
    const currentKey = tileKey(current);

    if (currentKey === endKey) break;
    closedSet.add(currentKey);

    for (const direction of CARDINAL_DIRECTIONS) {
      const next = {
        row: current.row + direction.row,
        col: current.col + direction.col,
      };
      const nextKey = tileKey(next);

      if (closedSet.has(nextKey) || !canStandOnTile(next)) continue;

      const possibleGScore = (gScore.get(currentKey) ?? Infinity) + 1;

      if (possibleGScore >= (gScore.get(nextKey) ?? Infinity)) continue;

      previous.set(nextKey, currentKey);
      tilesByKey.set(nextKey, next);
      gScore.set(nextKey, possibleGScore);

      if (!openSet.some((tile) => tileKey(tile) === nextKey)) {
        openSet.push(next);
      }
    }
  }

  if (!previous.has(endKey) && tileKey(start) !== endKey) return [];

  const pathTiles: Tile[] = [];
  let currentKey = endKey;

  while (currentKey !== tileKey(start)) {
    const tile = tilesByKey.get(currentKey);
    const parentKey = previous.get(currentKey);

    if (!tile || !parentKey) return [];

    pathTiles.unshift(tile);
    currentKey = parentKey;
  }

  return pathTiles.map((tile) => tileToWorldCenter(tile, mapOrigin));
};

const appendExactTargetWaypoints = ({
  path,
  start,
  target,
  canStandAt,
}: {
  path: Point[];
  start: Point;
  target: Point;
  canStandAt: (point: Point) => boolean;
}) => {
  const nextPath = [...path];
  const from = nextPath[nextPath.length - 1] ?? start;

  if (from.x === target.x && from.y === target.y) return nextPath;

  const xThenY = [{ x: target.x, y: from.y }, target];
  const yThenX = [{ x: from.x, y: target.y }, target];

  if (xThenY.every(canStandAt)) {
    nextPath.push(...xThenY);
  } else if (yThenX.every(canStandAt)) {
    nextPath.push(...yThenX);
  }

  return nextPath;
};

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

    const createSprinkle = (position: Point) => {
      const colors = ["#ffffff", "#ffe082", "#7dd3fc", "#86efac", "#f9a8d4"];

      for (let i = 0; i < SPRINKLE_PARTICLE_COUNT; i++) {
        const angle =
          (Math.PI * 2 * i) / SPRINKLE_PARTICLE_COUNT + Math.random() * 0.35;
        const speed = 1.6 + Math.random() * 2.6;
        const life = SPRINKLE_LIFETIME + Math.floor(Math.random() * 14);

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

    const playerCanStandAt = (center: Point) =>
      canPlayerStandAt({
        center,
        collisionsMap,
        mapOrigin: mapOrigin(),
        playerSize: playerSize(),
      });

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
      console.log(players);

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
      const center = playerCenter();
      const origin = mapOrigin();
      const size = playerSize();
      const startTile = worldToTile(center, origin);
      const targetTile = nearestStandableTile({
        tile: worldToTile(target, origin),
        collisionsMap,
        mapOrigin: origin,
        playerSize: size,
      });

      clickPath = targetTile
        ? findShortestCardinalPath({
            start: startTile,
            end: targetTile,
            collisionsMap,
            mapOrigin: origin,
            playerSize: size,
          })
        : [];

      if (
        targetTile &&
        playerCanStandAt(target) &&
        tileKey(worldToTile(target, origin)) === tileKey(targetTile)
      ) {
        clickPath = appendExactTargetWaypoints({
          path: clickPath,
          start: center,
          target,
          canStandAt: playerCanStandAt,
        });
      }

      createSprinkle(target);
    };

    canvas.addEventListener("dblclick", handleDoubleClick);

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
      const hasHorizontalDistance =
        Math.abs(distanceX) > WAYPOINT_STOP_DISTANCE;
      const hasVerticalDistance = Math.abs(distanceY) > WAYPOINT_STOP_DISTANCE;

      if (!hasHorizontalDistance && !hasVerticalDistance) {
        clickPath.shift();
        return clickPath.length > 0;
      }

      const axis: "x" | "y" = hasHorizontalDistance ? "x" : "y";
      const axisDistance = axis === "x" ? distanceX : distanceY;
      const step = Math.min(MOVE_SPEED, Math.abs(axisDistance));
      const playerMove = {
        x: axis === "x" ? Math.sign(axisDistance) * step : 0,
        y: axis === "y" ? Math.sign(axisDistance) * step : 0,
      };

      player.moving = true;

      if (axis === "x") {
        player.image =
          distanceX > 0 ? player.sprites!.right : player.sprites!.left;
      } else {
        player.image =
          distanceY > 0 ? player.sprites!.down : player.sprites!.up;
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
      drawSprinkles();

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
          console.log("coliding");
          moving = false;
        }
        if (moving) {
          movePlayer(player, { x: 0, y: -MOVE_SPEED });
        }
      } else if (activeKey === "a" && keys.a) {
        player.image = player.sprites!.left;
        player.moving = true;
        if (wouldCollideAfterPlayerMove({ x: -MOVE_SPEED, y: 0 })) {
          console.log("coliding");
          moving = false;
        }
        if (moving) {
          movePlayer(player, { x: -MOVE_SPEED, y: 0 });
        }
      } else if (activeKey === "s" && keys.s) {
        player.moving = true;
        player.image = player.sprites!.down;
        if (wouldCollideAfterPlayerMove({ x: 0, y: MOVE_SPEED })) {
          console.log("coliding");
          moving = false;
        }
        if (moving) {
          movePlayer(player, { x: 0, y: MOVE_SPEED });
        }
      } else if (activeKey === "d" && keys.d) {
        player.moving = true;
        player.image = player.sprites!.right;
        if (wouldCollideAfterPlayerMove({ x: MOVE_SPEED, y: 0 })) {
          console.log("coliding");
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
