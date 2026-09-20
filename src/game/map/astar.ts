import type {
  Cell,
  House,
  Point,
  Rect,
  TerrainType,
} from './types';

import {
  inBounds,
  key,
  neighbors4,
} from './utils';

const TERRAIN_COST: Record<TerrainType, number> = {
  grass: 1,
  road: 0.15,
  gravel: 0.35,
  forest: 8,
  water: 34,
  pit: 999,
  elevated: 18,
};

function heuristic(
  a: Point,
  b: Point,
): number {
  return (
    Math.abs(a.x - b.x) +
    Math.abs(a.y - b.y)
  );
}

function rectContains(
  rect: Rect,
  x: number,
  y: number,
): boolean {
  return (
    x >= rect.x &&
    y >= rect.y &&
    x < rect.x + rect.width &&
    y < rect.y + rect.height
  );
}

function blockedByHouse(
  x: number,
  y: number,
  houses: House[],
): boolean {
  return houses.some((house) =>
    rectContains(
      house.collision,
      x,
      y,
    ),
  );
}

export function aStar(
  cells: Cell[][],
  start: Point,
  goal: Point,
  houses: House[],
): Point[] {
  const height =
    cells.length;

  const width =
    cells[0]?.length ?? 0;

  const startKey =
    key(start.x, start.y);

  const goalKey =
    key(goal.x, goal.y);

  const open =
    new Set<string>([
      startKey,
    ]);

  const cameFrom =
    new Map<string, string>();

  const gScore =
    new Map<string, number>([
      [startKey, 0],
    ]);

  const fScore =
    new Map<string, number>([
      [
        startKey,
        heuristic(
          start,
          goal,
        ),
      ],
    ]);

  const points =
    new Map<string, Point>([
      [startKey, start],
      [goalKey, goal],
    ]);

  while (open.size > 0) {
    let currentKey:
      | string
      | undefined;
    let currentScore =
      Infinity;

    for (const candidate of open) {
      const score =
        fScore.get(candidate) ??
        Infinity;

      if (score < currentScore) {
        currentScore = score;
        currentKey = candidate;
      }
    }

    if (!currentKey) {
      break;
    }

    if (
      currentKey === goalKey
    ) {
      const path: Point[] = [];
      let cursor:
        | string
        | undefined =
        currentKey;

      while (cursor) {
        const point =
          points.get(cursor);

        if (!point) {
          break;
        }

        path.push(point);
        cursor =
          cameFrom.get(cursor);
      }

      return path.reverse();
    }

    open.delete(currentKey);

    const current =
      points.get(currentKey)!;

    for (
      const next of neighbors4(
        current.x,
        current.y,
      )
    ) {
      if (
        !inBounds(
          next.x,
          next.y,
          width,
          height,
        )
      ) {
        continue;
      }

      const isStartOrGoal =
        (
          next.x === start.x &&
          next.y === start.y
        ) ||
        (
          next.x === goal.x &&
          next.y === goal.y
        );

      if (
        !isStartOrGoal &&
        blockedByHouse(
          next.x,
          next.y,
          houses,
        )
      ) {
        continue;
      }

      const cell =
        cells[next.y][next.x];

      if (
        !isStartOrGoal &&
        (
          cell.terrain === 'pit' ||
          cell.terrain === 'elevated'
        )
      ) {
        continue;
      }

      const terrainCost =
        TERRAIN_COST[
          cell.terrain
        ];

      const straightBias =
        current.x === next.x ||
        current.y === next.y
          ? 0
          : 0.1;

      const tentative =
        (
          gScore.get(
            currentKey,
          ) ?? Infinity
        ) +
        terrainCost +
        straightBias;

      const nextKey =
        key(
          next.x,
          next.y,
        );

      points.set(
        nextKey,
        next,
      );

      if (
        tentative <
        (
          gScore.get(
            nextKey,
          ) ?? Infinity
        )
      ) {
        cameFrom.set(
          nextKey,
          currentKey,
        );
        gScore.set(
          nextKey,
          tentative,
        );
        fScore.set(
          nextKey,
          tentative +
            heuristic(
              next,
              goal,
            ),
        );
        open.add(nextKey);
      }
    }
  }

  return [start];
}
