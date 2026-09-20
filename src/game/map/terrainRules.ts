import type {
  Cell,
  Point,
  TerrainTopology,
  TerrainType,
  VillageMap,
} from './types';

import {
  inBounds,
} from './utils';

type NeighborMask = {
  n: boolean;
  e: boolean;
  s: boolean;
  w: boolean;
};

export function terrainMatches(
  cells: Cell[][],
  x: number,
  y: number,
  terrain: TerrainType,
): boolean {
  if (
    !inBounds(
      x,
      y,
      cells[0]?.length ?? 0,
      cells.length,
    )
  ) {
    return false;
  }

  return cells[y][x].terrain === terrain;
}

function maskForTerrain(
  cells: Cell[][],
  x: number,
  y: number,
  terrain: TerrainType,
): NeighborMask {
  return {
    n: terrainMatches(
      cells,
      x,
      y - 1,
      terrain,
    ),
    e: terrainMatches(
      cells,
      x + 1,
      y,
      terrain,
    ),
    s: terrainMatches(
      cells,
      x,
      y + 1,
      terrain,
    ),
    w: terrainMatches(
      cells,
      x - 1,
      y,
      terrain,
    ),
  };
}

export function topologyFromMask(
  mask: NeighborMask,
): TerrainTopology {
  const count =
    Number(mask.n) +
    Number(mask.e) +
    Number(mask.s) +
    Number(mask.w);

  if (count === 0) {
    return 'isolated';
  }

  if (count === 4) {
    return 'cross';
  }

  if (count === 1) {
    if (mask.n) {
      return 'end-n';
    }

    if (mask.e) {
      return 'end-e';
    }

    if (mask.s) {
      return 'end-s';
    }

    return 'end-w';
  }

  if (count === 2) {
    if (mask.n && mask.s) {
      return 'vertical';
    }

    if (mask.e && mask.w) {
      return 'horizontal';
    }

    if (mask.n && mask.e) {
      return 'corner-ne';
    }

    if (mask.e && mask.s) {
      return 'corner-se';
    }

    if (mask.s && mask.w) {
      return 'corner-sw';
    }

    return 'corner-nw';
  }

  if (!mask.n) {
    return 't-n';
  }

  if (!mask.e) {
    return 't-e';
  }

  if (!mask.s) {
    return 't-s';
  }

  return 't-w';
}

export function applyTerrainTopology(
  map: VillageMap,
): void {
  for (
    let y = 0;
    y < map.height;
    y += 1
  ) {
    for (
      let x = 0;
      x < map.width;
      x += 1
    ) {
      const cell =
        map.cells[y][x];

      if (
        cell.terrain === 'road' ||
        cell.terrain === 'gravel'
      ) {
        cell.roadTopology =
          topologyFromMask({
            ...maskForTerrain(
              map.cells,
              x,
              y,
              'road',
            ),
            ...connectedGravelMask(
              map.cells,
              x,
              y,
            ),
          });
      }

      if (cell.terrain === 'water') {
        cell.waterTopology =
          topologyFromMask(
            maskForTerrain(
              map.cells,
              x,
              y,
              'water',
            ),
          );
      }
    }
  }
}

function connectedGravelMask(
  cells: Cell[][],
  x: number,
  y: number,
): {
  n: boolean;
  e: boolean;
  s: boolean;
  w: boolean;
} {
  const isPath = (
    point: Point,
  ) => {
    if (
      !inBounds(
        point.x,
        point.y,
        cells[0]?.length ?? 0,
        cells.length,
      )
    ) {
      return false;
    }

    const terrain =
      cells[point.y][point.x]
        .terrain;

    return (
      terrain === 'road' ||
      terrain === 'gravel'
    );
  };

  return {
    n: isPath({
      x,
      y: y - 1,
    }),
    e: isPath({
      x: x + 1,
      y,
    }),
    s: isPath({
      x,
      y: y + 1,
    }),
    w: isPath({
      x: x - 1,
      y,
    }),
  };
}
