import { aStar } from './astar';
import {
  HOUSE_FOOTPRINTS,
  TERRAIN_PIECES,
} from './atlas';
import { RNG } from './rng';
import { applyTerrainTopology } from './terrainRules';

import type {
  Bridge,
  Cell,
  Decoration,
  ElevatedFeature,
  GenerateOptions,
  House,
  HouseType,
  Pit,
  Point,
  Rect,
  Stairs,
  TerrainType,
  Tree,
  TreeType,
  VillageMap,
  VisualPlacement,
} from './types';

import {
  clamp,
  distance,
  inBounds,
  key,
  neighbors4,
} from './utils';

type Edge = {
  a: number;
  b: number;
  cost: number;
};

type ReservedGrid = boolean[][];

const DEFAULT_WIDTH = 72;
const DEFAULT_HEIGHT = 46;

const HOUSE_TYPES: HouseType[] = [
  'blueHouse',
  'orangeHouse',
  'largeHouse',
];

const TREE_TYPES: TreeType[] = [
  'greenTree',
  'autumnTree',
  'whiteTree',
  'pinkTree',
  'tealTree',
];

export function generateWorld(
  seed: number,
  options: GenerateOptions = {},
): VillageMap {
  const width =
    options.width ?? DEFAULT_WIDTH;
  const height =
    options.height ?? DEFAULT_HEIGHT;
  const houseCount =
    options.houseCount ?? 11;

  const rng =
    new RNG(seed);
  const cells =
    createCells(
      width,
      height,
    );
  const reserved =
    createReservedGrid(
      width,
      height,
    );

  const terrainPieces: VisualPlacement[] =
    [];

  generateRiver(
    cells,
    rng,
  );

  generateForestRegions(
    cells,
    rng,
  );

  const pits =
    placePits(
      cells,
      reserved,
      terrainPieces,
      rng,
    );

  const elevated =
    placeElevatedFeatures(
      cells,
      reserved,
      terrainPieces,
      rng,
    );

  const stairs =
    placeStairs(
      cells,
      reserved,
      terrainPieces,
      elevated,
    );

  const houses =
    placeHouses(
      cells,
      reserved,
      rng,
      houseCount,
    );

  clearHouseClearings(
    cells,
    houses,
  );

  const roadTiles =
    createRoadNetwork(
      cells,
      houses,
      rng,
    );

  const bridges =
    resolveBridgeCrossings(
      cells,
      reserved,
      terrainPieces,
      roadTiles,
    );

  const trees =
    placeTrees(
      cells,
      reserved,
      houses,
      bridges,
      roadTiles,
      rng,
    );

  const decorations =
    placeDecorations(
      cells,
      houses,
      trees,
      bridges,
      rng,
    );

  const map: VillageMap = {
    width,
    height,
    seed,
    cells,
    terrain: cells.map((row) =>
      row.map(
        (cell) => cell.terrain,
      ),
    ),
    collision: cells.map((row) =>
      row.map(
        (cell) => !cell.walkable,
      ),
    ),
    houses,
    trees,
    decorations,
    bridges,
    stairs,
    pits,
    elevated,
    terrainPieces,
    roadTiles,
    riverPath: collectTerrain(
      cells,
      'water',
    ),
  };

  applyTerrainTopology(map);
  rebuildCollision(map);

  return map;
}

export const generateVillage =
  generateWorld;

function createCells(
  width: number,
  height: number,
): Cell[][] {
  return Array.from(
    {
      length: height,
    },
    () =>
      Array.from(
        {
          length: width,
        },
        () => ({
          terrain:
            'grass' as TerrainType,
          walkable: true,
        }),
      ),
  );
}

function createReservedGrid(
  width: number,
  height: number,
): ReservedGrid {
  return Array.from(
    {
      length: height,
    },
    () =>
      Array.from(
        {
          length: width,
        },
        () => false,
      ),
  );
}

function generateRiver(
  cells: Cell[][],
  rng: RNG,
): void {
  const height =
    cells.length;
  const width =
    cells[0].length;
  let x =
    rng.int(
      6,
      Math.floor(width * 0.45),
    );
  let y = 0;
  const bendStrength =
    rng.float(
      -0.25,
      0.25,
    );

  while (y < height) {
    const center =
      clamp(
        x,
        3,
        width - 4,
      );
    const radius =
      rng.chance(0.2) ? 2 : 1;

    for (
      let dy = -radius;
      dy <= radius;
      dy += 1
    ) {
      for (
        let dx = -radius;
        dx <= radius;
        dx += 1
      ) {
        if (
          Math.abs(dx) +
            Math.abs(dy) >
          radius + 1
        ) {
          continue;
        }

        setTerrain(
          cells,
          center + dx,
          y + dy,
          'water',
          false,
        );
      }
    }

    if (
      rng.chance(
        0.45 +
          Math.abs(
            bendStrength,
          ),
      )
    ) {
      x += rng.pick([
        -1,
        0,
        1,
      ]);
    }

    if (
      rng.chance(0.22)
    ) {
      x += bendStrength > 0
        ? 1
        : -1;
    }

    x = clamp(
      x,
      4,
      width - 5,
    );
    y += 1;
  }

  const pondCount =
    rng.chance(0.5) ? 2 : 1;

  for (
    let i = 0;
    i < pondCount;
    i += 1
  ) {
    // Keep ponds on the outer side of the world. The village and its road
    // graph are generated afterward, so a central pond would split the hub
    // and make the water feature look like an accidental hole in the map.
    const cx =
      rng.int(
        Math.floor(width * 0.72),
        width - 7,
      );
    const cy =
      rng.int(
        5,
        Math.floor(height * 0.38),
      );
    const rx =
      rng.int(3, 6);
    const ry =
      rng.int(2, 4);

    for (
      let py = cy - ry;
      py <= cy + ry;
      py += 1
    ) {
      for (
        let px = cx - rx;
        px <= cx + rx;
        px += 1
      ) {
        const normalized =
          ((px - cx) *
            (px - cx)) /
            (rx * rx) +
          ((py - cy) *
            (py - cy)) /
            (ry * ry);

        if (
          normalized <
          rng.float(0.75, 1.2)
        ) {
          setTerrain(
            cells,
            px,
            py,
            'water',
            false,
          );
        }
      }
    }
  }
}

function generateForestRegions(
  cells: Cell[][],
  rng: RNG,
): void {
  const height =
    cells.length;
  const width =
    cells[0].length;

  const centers =
    Array.from(
      {
        length: rng.int(6, 9),
      },
      () => ({
        x: rng.chance(0.58)
          ? rng.pick([
              rng.int(2, 10),
              rng.int(
                width - 12,
                width - 3,
              ),
            ])
          : rng.int(
              5,
              width - 6,
            ),
        y: rng.chance(0.45)
          ? rng.pick([
              rng.int(2, 9),
              rng.int(
                height - 10,
                height - 3,
              ),
            ])
          : rng.int(
              4,
              height - 5,
            ),
        radius: rng.int(5, 10),
      }),
    );

  for (
    let y = 1;
    y < height - 1;
    y += 1
  ) {
    for (
      let x = 1;
      x < width - 1;
      x += 1
    ) {
      if (
        cells[y][x].terrain !==
        'grass'
      ) {
        continue;
      }

      const density =
        centers.reduce(
          (score, center) => {
            const d =
              distance(
                center,
                {
                  x,
                  y,
                },
              );

            return (
              score +
              Math.max(
                0,
                1 -
                  d /
                    center.radius,
              )
            );
          },
          0,
        );

      if (
        density >
          rng.float(
            0.55,
            1.25,
          ) ||
        (
          isNearMapEdge(
            x,
            y,
            width,
            height,
            4,
          ) &&
          rng.chance(0.32)
        )
      ) {
        setTerrain(
          cells,
          x,
          y,
          'forest',
          true,
        );
      }
    }
  }

  for (
    let pass = 0;
    pass < 2;
    pass += 1
  ) {
    const copy =
      cells.map((row) =>
        row.map((cell) => ({
          ...cell,
        })),
      );

    for (
      let y = 1;
      y < height - 1;
      y += 1
    ) {
      for (
        let x = 1;
        x < width - 1;
        x += 1
      ) {
        if (
          cells[y][x].terrain ===
          'water'
        ) {
          continue;
        }

        const forestNeighbors =
          neighbors4(
            x,
            y,
          ).filter(
            (point) =>
              cells[point.y][point.x]
                .terrain ===
              'forest',
          ).length;

        if (
          forestNeighbors >= 3
        ) {
          copy[y][x].terrain =
            'forest';
        }

        if (
          forestNeighbors === 0 &&
          rng.chance(0.35)
        ) {
          copy[y][x].terrain =
            'grass';
        }
      }
    }

    for (
      let y = 0;
      y < height;
      y += 1
    ) {
      for (
        let x = 0;
        x < width;
        x += 1
      ) {
        cells[y][x] = copy[y][x];
      }
    }
  }
}

function placePits(
  cells: Cell[][],
  reserved: ReservedGrid,
  terrainPieces: VisualPlacement[],
  rng: RNG,
): Pit[] {
  const pits: Pit[] = [];
  const width =
    cells[0].length;
  const height =
    cells.length;
  const count =
    rng.chance(0.5) ? 2 : 1;

  for (
    let attempt = 0;
    attempt < 250 &&
    pits.length < count;
    attempt += 1
  ) {
    const candidate: Pit = {
      x: rng.int(2, width - 5),
      y: rng.int(2, height - 5),
      width: 3,
      height: 3,
    };

    if (
      !canReserveRect(
        cells,
        reserved,
        candidate,
        2,
        ['grass', 'forest'],
      ) ||
      isNearCenter(
        candidate,
        width,
        height,
        12,
      )
    ) {
      continue;
    }

    reserveRect(
      cells,
      reserved,
      candidate,
      'pit',
      false,
    );
    terrainPieces.push({
      x: candidate.x,
      y: candidate.y,
      pieceId: TERRAIN_PIECES.pit.id,
    });
    pits.push(candidate);
  }

  return pits;
}

function placeElevatedFeatures(
  cells: Cell[][],
  reserved: ReservedGrid,
  terrainPieces: VisualPlacement[],
  rng: RNG,
): ElevatedFeature[] {
  const features: ElevatedFeature[] =
    [];
  const width =
    cells[0].length;
  const height =
    cells.length;
  const count =
    rng.chance(0.4) ? 2 : 1;

  for (
    let attempt = 0;
    attempt < 320 &&
    features.length < count;
    attempt += 1
  ) {
    const candidate: ElevatedFeature =
      {
        x: rng.int(
          Math.floor(width * 0.48),
          width - 8,
        ),
        y: rng.int(4, height - 8),
        width: 4,
        height: 4,
      };

    if (
      !canReserveRect(
        cells,
        reserved,
        candidate,
        2,
        ['grass', 'forest'],
      )
    ) {
      continue;
    }

    reserveRect(
      cells,
      reserved,
      candidate,
      'elevated',
      false,
    );
    terrainPieces.push({
      x: candidate.x,
      y: candidate.y,
      pieceId:
        TERRAIN_PIECES
          .elevatedPlateau.id,
    });
    features.push(candidate);
  }

  return features;
}

function placeStairs(
  cells: Cell[][],
  reserved: ReservedGrid,
  terrainPieces: VisualPlacement[],
  elevated: ElevatedFeature[],
): Stairs[] {
  const stairs: Stairs[] = [];

  for (const feature of elevated) {
    const stair: Stairs = {
      x: feature.x,
      y:
        feature.y +
        feature.height -
        1,
      width: 3,
      height: 4,
      connects:
        'grass-to-elevated',
    };

    if (
      !stairsFootprintFits(
        cells,
        stair,
      )
    ) {
      continue;
    }

    reserveRect(
      cells,
      reserved,
      stair,
      'elevated',
      true,
    );
    terrainPieces.push({
      x: stair.x,
      y: stair.y,
      pieceId:
        TERRAIN_PIECES.stairs.id,
    });
    stairs.push(stair);
  }

  return stairs;
}

function placeHouses(
  cells: Cell[][],
  reserved: ReservedGrid,
  rng: RNG,
  count: number,
): House[] {
  const width =
    cells[0].length;
  const height =
    cells.length;
  const houses: House[] = [];
  const villageCenter = {
    x: Math.floor(width * 0.56),
    y: Math.floor(height * 0.52),
  };

  for (
    let attempt = 0;
    attempt < count * 420 &&
    houses.length < count;
    attempt += 1
  ) {
    const type =
      rng.pick(HOUSE_TYPES);
    const size =
      HOUSE_FOOTPRINTS[type];
    const cluster =
      houses.length % 4 === 0
        ? {
            x: Math.floor(
              width * 0.34,
            ),
            y: Math.floor(
              height * 0.48,
            ),
          }
        : villageCenter;
    const angle =
      rng.float(
        0,
        Math.PI * 2,
      );
    const radius =
      rng.float(3, 22);
    const x =
      clamp(
        Math.round(
          cluster.x +
            Math.cos(angle) *
              radius -
            size.width / 2,
        ),
        2,
        width - size.width - 3,
      );
    const y =
      clamp(
        Math.round(
          cluster.y +
            Math.sin(angle) *
              radius *
              0.72 -
            size.height / 2,
        ),
        2,
        height - size.height - 4,
      );

    const house: House = {
      x,
      y,
      type,
      width: size.width,
      height: size.height,
      entrance: {
        x:
          x +
          Math.floor(
            size.width / 2,
          ),
        y: y + size.height,
      },
      collision: {
        x,
        y:
          y +
          Math.floor(
            size.height * 0.38,
          ),
        width: size.width,
        height:
          size.height -
          Math.floor(
            size.height * 0.38,
          ),
      },
    };

    if (
      !houseFits(
        cells,
        reserved,
        houses,
        house,
      )
    ) {
      continue;
    }

    markReserved(
      reserved,
      {
        x: house.x - 1,
        y: house.y - 1,
        width: house.width + 2,
        height: house.height + 3,
      },
    );
    houses.push(house);
  }

  return houses;
}

function houseFits(
  cells: Cell[][],
  reserved: ReservedGrid,
  houses: House[],
  house: House,
): boolean {
  if (
    !inBounds(
      house.entrance.x,
      house.entrance.y,
      cells[0].length,
      cells.length,
    )
  ) {
    return false;
  }

  for (
    let y = house.y - 2;
    y <=
    house.y + house.height + 2;
    y += 1
  ) {
    for (
      let x = house.x - 2;
      x <=
      house.x + house.width + 2;
      x += 1
    ) {
      if (
        !inBounds(
          x,
          y,
          cells[0].length,
          cells.length,
        )
      ) {
        return false;
      }

      if (
        reserved[y][x] ||
        cells[y][x].terrain ===
          'water' ||
        cells[y][x].terrain ===
          'pit' ||
        cells[y][x].terrain ===
          'elevated'
      ) {
        return false;
      }
    }
  }

  return !houses.some(
    (other) =>
      rectsOverlap(
        {
          x: house.x - 2,
          y: house.y - 2,
          width:
            house.width + 4,
          height:
            house.height + 4,
        },
        {
          x: other.x,
          y: other.y,
          width: other.width,
          height: other.height,
        },
      ),
  );
}

function clearHouseClearings(
  cells: Cell[][],
  houses: House[],
): void {
  for (const house of houses) {
    for (
      let y = house.y - 2;
      y <=
      house.y + house.height + 2;
      y += 1
    ) {
      for (
        let x = house.x - 2;
        x <=
        house.x + house.width + 2;
        x += 1
      ) {
        if (
          !inBounds(
            x,
            y,
            cells[0].length,
            cells.length,
          )
        ) {
          continue;
        }

        if (
          cells[y][x].terrain ===
            'forest'
        ) {
          setTerrain(
            cells,
            x,
            y,
            'grass',
            true,
          );
        }
      }
    }
  }
}

function createRoadNetwork(
  cells: Cell[][],
  houses: House[],
  rng: RNG,
): Point[] {
  if (houses.length === 0) {
    return [];
  }

  const center = {
    x: Math.floor(
      cells[0].length * 0.56,
    ),
    y: Math.floor(
      cells.length * 0.52,
    ),
  };
  const westGate = {
    x: 3,
    y: center.y,
  };

  const nodes = [
    ...houses.map(
      (house) => house.entrance,
    ),
    center,
    westGate,
  ];

  const edges: Edge[] = [];

  for (
    let a = 0;
    a < nodes.length;
    a += 1
  ) {
    for (
      let b = a + 1;
      b < nodes.length;
      b += 1
    ) {
      edges.push({
        a,
        b,
        cost: distance(
          nodes[a],
          nodes[b],
        ),
      });
    }
  }

  edges.sort(
    (a, b) =>
      a.cost - b.cost,
  );

  const selected =
    kruskal(
      nodes.length,
      edges,
    );

  for (const edge of edges) {
    if (
      selected.length >
      nodes.length + 1
    ) {
      break;
    }

    if (
      rng.chance(0.14) &&
      !selected.includes(edge)
    ) {
      selected.push(edge);
    }
  }

  const roads =
    new Map<string, Point>();

  for (const edge of selected) {
    const path =
      aStar(
        cells,
        nodes[edge.a],
        nodes[edge.b],
        houses,
      );

    for (const point of path) {
      roads.set(
        key(point.x, point.y),
        point,
      );
    }
  }

  for (
    let y = center.y - 2;
    y <= center.y + 2;
    y += 1
  ) {
    for (
      let x = center.x - 4;
      x <= center.x + 4;
      x += 1
    ) {
      if (
        inBounds(
          x,
          y,
          cells[0].length,
          cells.length,
        ) &&
        cells[y][x].terrain !==
          'water'
      ) {
        setTerrain(
          cells,
          x,
          y,
          'gravel',
          true,
        );
        roads.set(
          key(x, y),
          {
            x,
            y,
          },
        );
      }
    }
  }

  for (const point of roads.values()) {
    if (
      cells[point.y][point.x]
        .terrain !== 'water'
    ) {
      setTerrain(
        cells,
        point.x,
        point.y,
        'road',
        true,
      );
    }
  }

  for (const house of houses) {
    const door =
      house.entrance;

    for (
      let y = door.y;
      y <= door.y + 1;
      y += 1
    ) {
      if (
        inBounds(
          door.x,
          y,
          cells[0].length,
          cells.length,
        ) &&
        cells[y][door.x]
          .terrain !== 'water'
      ) {
        setTerrain(
          cells,
          door.x,
          y,
          'road',
          true,
        );
        roads.set(
          key(door.x, y),
          {
            x: door.x,
            y,
          },
        );
      }
    }
  }

  return [
    ...roads.values(),
  ];
}

function kruskal(
  nodeCount: number,
  edges: Edge[],
): Edge[] {
  const parent =
    Array.from(
      {
        length: nodeCount,
      },
      (_, index) => index,
    );

  const find = (
    node: number,
  ): number => {
    while (
      parent[node] !== node
    ) {
      parent[node] =
        parent[parent[node]];
      node = parent[node];
    }

    return node;
  };

  const result: Edge[] = [];

  for (const edge of edges) {
    const a =
      find(edge.a);
    const b =
      find(edge.b);

    if (a === b) {
      continue;
    }

    parent[a] = b;
    result.push(edge);

    if (
      result.length ===
      nodeCount - 1
    ) {
      break;
    }
  }

  return result;
}

function resolveBridgeCrossings(
  cells: Cell[][],
  reserved: ReservedGrid,
  terrainPieces: VisualPlacement[],
  roadTiles: Point[],
): Bridge[] {
  const bridges: Bridge[] = [];
  const roadSet =
    new Set(
      roadTiles.map((point) =>
        key(point.x, point.y),
      ),
    );
  const usedWater =
    new Set<string>();

  for (
    let y = 2;
    y < cells.length - 2;
    y += 1
  ) {
    for (
      let x = 3;
      x < cells[0].length - 8;
      x += 1
    ) {
      const footprint: Rect = {
        x,
        y: y - 1,
        width: 6,
        height: 3,
      };

      const centerLine =
        Array.from(
          {
            length: 6,
          },
          (_, offset) => ({
            x: x + offset,
            y,
          }),
        );

      if (
        !isBridgeCrossingValid(
          cells,
          x,
          y,
        )
      ) {
        continue;
      }

      const leftRoad =
        roadSet.has(key(x - 1, y)) ||
        cells[y][x - 1].terrain ===
          'road';
      const rightRoad =
        roadSet.has(key(x + 6, y)) ||
        cells[y][x + 6].terrain ===
          'road';

      if (!leftRoad || !rightRoad) {
        continue;
      }

      if (
        !canReserveRect(
          cells,
          reserved,
          footprint,
          0,
          [
            'water',
            'road',
            'grass',
            'forest',
          ],
        )
      ) {
        continue;
      }

      if (
        centerLine.some((point) =>
          usedWater.has(
            key(point.x, point.y),
          ),
        )
      ) {
        continue;
      }

      const bridge: Bridge = {
        x,
        y: y - 1,
        width: 6,
        height: 3,
        orientation:
          'east-west',
        roadY: y,
      };

      reserveRect(
        cells,
        reserved,
        footprint,
        'road',
        true,
      );
      terrainPieces.push({
        x: bridge.x,
        y: bridge.y,
        pieceId:
          TERRAIN_PIECES.bridge.id,
      });
      bridges.push(bridge);

      for (const point of centerLine) {
        usedWater.add(
          key(point.x, point.y),
        );
      }

      x += 7;
    }
  }

  if (bridges.length === 0) {
    createFallbackBridge(
      cells,
      reserved,
      terrainPieces,
      roadTiles,
      bridges,
    );
  }

  return bridges;
}

function createFallbackBridge(
  cells: Cell[][],
  reserved: ReservedGrid,
  terrainPieces: VisualPlacement[],
  roadTiles: Point[],
  bridges: Bridge[],
): void {
  const width =
    cells[0].length;
  const height =
    cells.length;
  const centerY =
    Math.floor(height * 0.52);

  for (
    let offset = 0;
    offset < 14;
    offset += 1
  ) {
    for (
      const y of [
        centerY + offset,
        centerY - offset,
      ]
    ) {
      if (
        y < 2 ||
        y >= height - 2
      ) {
        continue;
      }

      for (
        let x = 3;
        x < width - 8;
        x += 1
      ) {
        const footprint: Rect = {
          x,
          y: y - 1,
          width: 6,
          height: 3,
        };
        if (
          !isBridgeCrossingValid(
            cells,
            x,
            y,
          ) ||
          !canReserveRect(
            cells,
            reserved,
            footprint,
            0,
            [
              'water',
              'road',
              'grass',
              'forest',
            ],
          )
        ) {
          continue;
        }

        const bridge: Bridge = {
          x,
          y: y - 1,
          width: 6,
          height: 3,
          orientation:
            'east-west',
          roadY: y,
        };

        reserveRect(
          cells,
          reserved,
          footprint,
          'road',
          true,
        );
        terrainPieces.push({
          x: bridge.x,
          y: bridge.y,
          pieceId:
            TERRAIN_PIECES
              .bridge.id,
        });
        bridges.push(bridge);

        for (
          let px = x - 8;
          px <= x + 13;
          px += 1
        ) {
          if (
            !inBounds(
              px,
              y,
              width,
              height,
            ) ||
            cells[y][px]
              .terrain === 'pit' ||
            cells[y][px]
              .terrain === 'elevated'
          ) {
            continue;
          }

          setTerrain(
            cells,
            px,
            y,
            'road',
            true,
          );
          roadTiles.push({
            x: px,
            y,
          });
        }

        return;
      }
    }
  }
}

function isBridgeCrossingValid(
  cells: Cell[][],
  x: number,
  y: number,
): boolean {
  if (
    y < 1 ||
    y >= cells.length - 1 ||
    x < 1 ||
    x + 6 >= cells[0].length
  ) {
    return false;
  }

  const approachLeft =
    cells[y][x - 1].terrain;
  const approachRight =
    cells[y][x + 6].terrain;
  const land = (
    terrain: TerrainType,
  ) =>
    terrain === 'grass' ||
    terrain === 'forest' ||
    terrain === 'road' ||
    terrain === 'elevated';

  if (
    !land(approachLeft) ||
    !land(approachRight)
  ) {
    return false;
  }

  // The authored bridge is six cells wide. Its middle must visibly span
  // water; the outer approach cells may be land because they meet the banks.
  return (
    cells[y][x + 2].terrain ===
      'water' &&
    cells[y][x + 3].terrain ===
      'water'
  );
}

function placeTrees(
  cells: Cell[][],
  reserved: ReservedGrid,
  houses: House[],
  bridges: Bridge[],
  roadTiles: Point[],
  rng: RNG,
): Tree[] {
  const trees: Tree[] = [];
  const roadSet =
    new Set(
      roadTiles.map((point) =>
        key(point.x, point.y),
      ),
    );
  const width =
    cells[0].length;
  const height =
    cells.length;
  const target =
    Math.floor(
      (width * height) / 34,
    );

  for (
    let attempt = 0;
    attempt < width * height * 4 &&
    trees.length < target;
    attempt += 1
  ) {
    const x =
      rng.int(1, width - 4);
    const y =
      rng.int(1, height - 4);
    const terrain =
      cells[y][x].terrain;

    if (
      terrain !== 'forest' &&
      !(
        terrain === 'grass' &&
        isNearForest(
          cells,
          x,
          y,
        ) &&
        rng.chance(0.22)
      )
    ) {
      continue;
    }

    const tree: Tree = {
      x,
      y,
      type:
        pickTreeType(rng),
      width: 3,
      height: 3,
      collision: {
        x,
        y: y + 1,
        width: 3,
        height: 2,
      },
    };

    if (
      reserved[y][x] ||
      roadSet.has(
        key(x, y),
      ) ||
      houses.some(
        (house) =>
          rectsOverlap(
            expandedRect(
              house,
              3,
            ),
            tree,
          ) ||
          distance(
            house.entrance,
            tree,
          ) < 5,
      ) ||
      bridges.some((bridge) =>
        rectsOverlap(
          expandedRect(
            bridge,
            2,
          ),
          tree,
        ),
      ) ||
      trees.some(
        (other) =>
          distance(
            other,
            tree,
          ) < rng.float(2.4, 4.6),
      )
    ) {
      continue;
    }

    if (
      !canReserveRect(
        cells,
        reserved,
        tree.collision,
        0,
        ['grass', 'forest'],
      )
    ) {
      continue;
    }

    markReserved(
      reserved,
      tree.collision,
    );
    markWalkable(
      cells,
      tree.collision,
      false,
    );
    trees.push(tree);
  }

  return trees;
}

function placeDecorations(
  cells: Cell[][],
  houses: House[],
  trees: Tree[],
  bridges: Bridge[],
  rng: RNG,
): Decoration[] {
  const decorations: Decoration[] =
    [];
  const width =
    cells[0].length;
  const height =
    cells.length;

  for (
    let attempt = 0;
    attempt < width * height * 2;
    attempt += 1
  ) {
    const x =
      rng.int(1, width - 3);
    const y =
      rng.int(1, height - 3);

    if (
      cells[y][x].terrain !==
        'grass' ||
      !cells[y][x].walkable ||
      houses.some(
        (house) =>
          distance(
            house.entrance,
            {
              x,
              y,
            },
          ) < 5 ||
          rectsOverlap(
            expandedRect(
              house,
              2,
            ),
            {
              x,
              y,
              width: 2,
              height: 2,
            },
          ),
      ) ||
      trees.some(
        (tree) =>
          distance(
            tree,
            {
              x,
              y,
            },
          ) < 3,
      ) ||
      bridges.some((bridge) =>
        rectsOverlap(
          expandedRect(
            bridge,
            2,
          ),
          {
            x,
            y,
            width: 1,
            height: 1,
          },
        ),
      ) ||
      decorations.some(
        (decoration) =>
          distance(
            decoration,
            {
              x,
              y,
            },
          ) < 3,
      )
    ) {
      continue;
    }

    const roll =
      rng.next();

    if (roll < 0.018) {
      decorations.push({
        x,
        y,
        type: 'grassPatch',
        width: 2,
        height: 2,
      });
    } else if (roll < 0.045) {
      decorations.push({
        x,
        y,
        type: 'stone',
        width: 1,
        height: 1,
      });
    } else if (roll < 0.078) {
      decorations.push({
        x,
        y,
        type: 'flowers',
        width: 1,
        height: 1,
      });
    } else if (roll < 0.085) {
      decorations.push({
        x,
        y,
        type: 'smallGrass',
        width: 1,
        height: 1,
      });
    }
  }

  const plaza =
    findPlazaCell(
      cells,
      houses,
      trees,
      bridges,
    );

  if (plaza) {
    decorations.push({
      x: plaza.x,
      y: plaza.y,
      type: 'well',
      width: 2,
      height: 3,
    });
    markWalkable(
      cells,
      {
        x: plaza.x,
        y: plaza.y + 1,
        width: 2,
        height: 2,
      },
      false,
    );
  }

  return decorations;
}

function findPlazaCell(
  cells: Cell[][],
  houses: House[],
  trees: Tree[],
  bridges: Bridge[],
): Point | undefined {
  const center = {
    x: Math.floor(
      cells[0].length * 0.56,
    ),
    y: Math.floor(
      cells.length * 0.52,
    ),
  };

  for (
    let radius = 0;
    radius < 8;
    radius += 1
  ) {
    for (
      let y = center.y - radius;
      y <= center.y + radius;
      y += 1
    ) {
      for (
        let x = center.x - radius;
        x <= center.x + radius;
        x += 1
      ) {
        const footprint: Rect = {
          x,
          y,
          width: 2,
          height: 3,
        };

        if (
          !inBounds(
            x,
            y,
            cells[0].length,
            cells.length,
          ) ||
          !inBounds(
            x + 1,
            y + 2,
            cells[0].length,
            cells.length,
          ) ||
          !Array.from(
            { length: footprint.height },
            (_, dy) =>
              Array.from(
                { length: footprint.width },
                (_, dx) =>
                  cells[y + dy][x + dx]
                    .terrain === 'grass',
              ).every(Boolean),
          ).every(Boolean) ||
          houses.some((house) =>
            rectsOverlap(
              expandedRect(house, 1),
              footprint,
            ),
          ) ||
          trees.some((tree) =>
            rectsOverlap(
              expandedRect(tree, 1),
              footprint,
            ),
          ) ||
          bridges.some((bridge) =>
            rectsOverlap(
              expandedRect(bridge, 1),
              footprint,
            ),
          ) ||
          !hasAdjacentRoad(
            cells,
            footprint,
          )
        ) {
          continue;
        }

        if (cells[y][x].terrain === 'grass') {
          return {
            x,
            y,
          };
        }
      }
    }
  }

  return undefined;
}

function hasAdjacentRoad(
  cells: Cell[][],
  rect: Rect,
): boolean {
  for (
    let y = rect.y - 1;
    y <= rect.y + rect.height;
    y += 1
  ) {
    for (
      let x = rect.x - 1;
      x <= rect.x + rect.width;
      x += 1
    ) {
      if (
        !inBounds(
          x,
          y,
          cells[0].length,
          cells.length,
        ) ||
        (x >= rect.x &&
          x < rect.x + rect.width &&
          y >= rect.y &&
          y < rect.y + rect.height)
      ) {
        continue;
      }

      if (
        cells[y][x].terrain === 'road'
      ) {
        return true;
      }
    }
  }

  return false;
}

function setTerrain(
  cells: Cell[][],
  x: number,
  y: number,
  terrain: TerrainType,
  walkable: boolean,
): void {
  if (
    !inBounds(
      x,
      y,
      cells[0]?.length ?? 0,
      cells.length,
    )
  ) {
    return;
  }

  cells[y][x].terrain = terrain;
  cells[y][x].walkable =
    walkable;
}

function stairsFootprintFits(
  cells: Cell[][],
  rect: Rect,
): boolean {
  for (
    let y = rect.y;
    y < rect.y + rect.height;
    y += 1
  ) {
    for (
      let x = rect.x;
      x < rect.x + rect.width;
      x += 1
    ) {
      if (
        !inBounds(
          x,
          y,
          cells[0].length,
          cells.length,
        )
      ) {
        return false;
      }

      if (
        cells[y][x].terrain ===
          'water' ||
        cells[y][x].terrain ===
          'pit'
      ) {
        return false;
      }
    }
  }

  return true;
}

function canReserveRect(
  cells: Cell[][],
  reserved: ReservedGrid,
  rect: Rect,
  margin: number,
  allowedTerrain: TerrainType[],
): boolean {
  for (
    let y = rect.y - margin;
    y <
    rect.y + rect.height + margin;
    y += 1
  ) {
    for (
      let x = rect.x - margin;
      x <
      rect.x + rect.width + margin;
      x += 1
    ) {
      if (
        !inBounds(
          x,
          y,
          cells[0].length,
          cells.length,
        )
      ) {
        return false;
      }

      if (
        reserved[y][x] ||
        !allowedTerrain.includes(
          cells[y][x].terrain,
        )
      ) {
        return false;
      }
    }
  }

  return true;
}

function reserveRect(
  cells: Cell[][],
  reserved: ReservedGrid,
  rect: Rect,
  terrain: TerrainType,
  walkable: boolean,
): void {
  markReserved(
    reserved,
    rect,
  );

  for (
    let y = rect.y;
    y < rect.y + rect.height;
    y += 1
  ) {
    for (
      let x = rect.x;
      x < rect.x + rect.width;
      x += 1
    ) {
      setTerrain(
        cells,
        x,
        y,
        terrain,
        walkable,
      );
    }
  }
}

function markReserved(
  reserved: ReservedGrid,
  rect: Rect,
): void {
  for (
    let y = rect.y;
    y < rect.y + rect.height;
    y += 1
  ) {
    for (
      let x = rect.x;
      x < rect.x + rect.width;
      x += 1
    ) {
      if (
        inBounds(
          x,
          y,
          reserved[0].length,
          reserved.length,
        )
      ) {
        reserved[y][x] = true;
      }
    }
  }
}

function markWalkable(
  cells: Cell[][],
  rect: Rect,
  walkable: boolean,
): void {
  for (
    let y = rect.y;
    y < rect.y + rect.height;
    y += 1
  ) {
    for (
      let x = rect.x;
      x < rect.x + rect.width;
      x += 1
    ) {
      if (
        inBounds(
          x,
          y,
          cells[0].length,
          cells.length,
        )
      ) {
        cells[y][x].walkable =
          walkable;
      }
    }
  }
}

function rebuildCollision(
  map: VillageMap,
): void {
  map.collision =
    map.cells.map((row) =>
      row.map(
        (cell) => !cell.walkable,
      ),
    );
  map.terrain =
    map.cells.map((row) =>
      row.map(
        (cell) => cell.terrain,
      ),
    );
}

function collectTerrain(
  cells: Cell[][],
  terrain: TerrainType,
): Point[] {
  const points: Point[] = [];

  for (
    let y = 0;
    y < cells.length;
    y += 1
  ) {
    for (
      let x = 0;
      x < cells[0].length;
      x += 1
    ) {
      if (
        cells[y][x].terrain ===
        terrain
      ) {
        points.push({
          x,
          y,
        });
      }
    }
  }

  return points;
}

function rectsOverlap(
  a: Rect,
  b: Rect,
): boolean {
  return !(
    a.x + a.width <= b.x ||
    b.x + b.width <= a.x ||
    a.y + a.height <= b.y ||
    b.y + b.height <= a.y
  );
}

function expandedRect(
  rect: Rect,
  amount: number,
): Rect {
  return {
    x: rect.x - amount,
    y: rect.y - amount,
    width:
      rect.width + amount * 2,
    height:
      rect.height + amount * 2,
  };
}

function isNearMapEdge(
  x: number,
  y: number,
  width: number,
  height: number,
  edge: number,
): boolean {
  return (
    x < edge ||
    y < edge ||
    x >= width - edge ||
    y >= height - edge
  );
}

function isNearCenter(
  rect: Rect,
  width: number,
  height: number,
  radius: number,
): boolean {
  return (
    distance(
      {
        x:
          rect.x +
          rect.width / 2,
        y:
          rect.y +
          rect.height / 2,
      },
      {
        x: width / 2,
        y: height / 2,
      },
    ) < radius
  );
}

function isNearForest(
  cells: Cell[][],
  x: number,
  y: number,
): boolean {
  for (
    let dy = -3;
    dy <= 3;
    dy += 1
  ) {
    for (
      let dx = -3;
      dx <= 3;
      dx += 1
    ) {
      const nx = x + dx;
      const ny = y + dy;

      if (
        inBounds(
          nx,
          ny,
          cells[0].length,
          cells.length,
        ) &&
        cells[ny][nx].terrain ===
          'forest'
      ) {
        return true;
      }
    }
  }

  return false;
}

function pickTreeType(
  rng: RNG,
): TreeType {
  const roll =
    rng.next();

  if (roll < 0.58) {
    return 'greenTree';
  }

  if (roll < 0.77) {
    return 'autumnTree';
  }

  if (roll < 0.9) {
    return 'whiteTree';
  }

  if (roll < 0.96) {
    return 'pinkTree';
  }

  return rng.pick(TREE_TYPES);
}
