import {
  appendExactTargetWaypoints,
  canPlayerStandAt,
  findShortestCardinalPath,
  nearestStandableTile,
  tileKey,
  worldToTile,
  type Point,
} from "./pathfinding";

export const buildClickPath = ({
  center,
  target,
  collisionsMap,
  mapOrigin,
  playerSize,
}: {
  center: Point;
  target: Point;
  collisionsMap: number[][];
  mapOrigin: Point;
  playerSize: { width: number; height: number };
}): Point[] => {
  const canStandAt = (point: Point) =>
    canPlayerStandAt({
      center: point,
      collisionsMap,
      mapOrigin,
      playerSize,
    });
  const targetTile = nearestStandableTile({
    tile: worldToTile(target, mapOrigin),
    collisionsMap,
    mapOrigin,
    playerSize,
  });

  let path = targetTile
    ? findShortestCardinalPath({
        start: worldToTile(center, mapOrigin),
        end: targetTile,
        collisionsMap,
        mapOrigin,
        playerSize,
      })
    : [];

  if (
    targetTile &&
    canStandAt(target) &&
    tileKey(worldToTile(target, mapOrigin)) === tileKey(targetTile)
  ) {
    path = appendExactTargetWaypoints({
      path,
      start: center,
      target,
      canStandAt,
    });
  }

  return path;
};

export const getNextClickMovement = ({
  path,
  center,
  stopDistance,
  maxStep,
}: {
  path: Point[];
  center: Point;
  stopDistance: number;
  maxStep: number;
}): Point | null => {
  if (path.length === 0) return null;

  const waypoint = path[0];
  const distanceX = waypoint.x - center.x;
  const distanceY = waypoint.y - center.y;
  const hasHorizontalDistance = Math.abs(distanceX) > stopDistance;
  const hasVerticalDistance = Math.abs(distanceY) > stopDistance;

  if (!hasHorizontalDistance && !hasVerticalDistance) {
    path.shift();
    return null;
  }

  const axis = hasHorizontalDistance ? "x" : "y";
  const axisDistance = axis === "x" ? distanceX : distanceY;
  const step = Math.min(maxStep, Math.abs(axisDistance));

  return {
    x: axis === "x" ? Math.sign(axisDistance) * step : 0,
    y: axis === "y" ? Math.sign(axisDistance) * step : 0,
  };
};
