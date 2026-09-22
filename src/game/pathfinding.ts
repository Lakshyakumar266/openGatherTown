import { Boundary } from "../class";

export type Point = { x: number; y: number };
export type Tile = { row: number; col: number };
export type Rect = {
  position: Point;
  width: number;
  height: number;
};

const PLAYER_HITBOX = {
  offsetX: 10,
  offsetY: 34,
  width: 28,
  height: 28,
};

const CARDINAL_DIRECTIONS: Tile[] = [
  { row: -1, col: 0 },
  { row: 0, col: 1 },
  { row: 1, col: 0 },
  { row: 0, col: -1 },
];

export const tileKey = (tile: Tile) => `${tile.row},${tile.col}`;

export const checkCollision = (rect1: Rect, rect2: Rect) =>
  rect1.position.x < rect2.position.x + rect2.width &&
  rect1.position.x + rect1.width > rect2.position.x &&
  rect1.position.y < rect2.position.y + rect2.height &&
  rect1.position.y + rect1.height > rect2.position.y;

const playerPositionFromCenter = (
  center: Point,
  playerSize: { width: number; height: number },
): Point => ({
  x: center.x - playerSize.width / 2,
  y: center.y - playerSize.height / 2,
});

export const getPlayerHitbox = (position: Point): Rect => ({
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

export const worldToTile = (point: Point, mapOrigin: Point): Tile => ({
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

export const canPlayerStandAt = ({
  center,
  collisionsMap,
  mapOrigin,
  playerSize,
}: {
  center: Point;
  collisionsMap: number[][];
  mapOrigin: Point;
  playerSize: { width: number; height: number };
}) =>
  !collidesWithCollisionMap(
    getPlayerHitbox(playerPositionFromCenter(center, playerSize)),
    collisionsMap,
    mapOrigin,
  );

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

export const nearestStandableTile = ({
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
    isStandableTile({ tile: candidate, collisionsMap, mapOrigin, playerSize });

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

export const findShortestCardinalPath = ({
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
    isStandableTile({ tile, collisionsMap, mapOrigin, playerSize });

  if (!canStandOnTile(start) || !canStandOnTile(end)) return [];

  const openSet: Tile[] = [start];
  const closedSet = new Set<string>();
  const previous = new Map<string, string>();
  const tilesByKey = new Map([[tileKey(start), start]]);
  const gScore = new Map([[tileKey(start), 0]]);
  const endKey = tileKey(end);
  const heuristic = (candidate: Tile) =>
    Math.abs(candidate.row - end.row) + Math.abs(candidate.col - end.col);

  while (openSet.length > 0) {
    let bestIndex = 0;

    for (let index = 1; index < openSet.length; index++) {
      const currentKey = tileKey(openSet[index]);
      const bestKey = tileKey(openSet[bestIndex]);
      const currentScore =
        (gScore.get(currentKey) ?? Infinity) + heuristic(openSet[index]);
      const bestScore =
        (gScore.get(bestKey) ?? Infinity) + heuristic(openSet[bestIndex]);

      if (currentScore < bestScore) bestIndex = index;
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

      if (!openSet.some((candidate) => tileKey(candidate) === nextKey)) {
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

export const appendExactTargetWaypoints = ({
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

  if (xThenY.every(canStandAt)) nextPath.push(...xThenY);
  else if (yThenX.every(canStandAt)) nextPath.push(...yThenX);

  return nextPath;
};