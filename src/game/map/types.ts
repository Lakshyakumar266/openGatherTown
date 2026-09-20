export const TILE_SIZE = 16;

export type Theme = 'day' | 'night';

export type TerrainType =
  | 'grass'
  | 'forest'
  | 'water'
  | 'road'
  | 'gravel'
  | 'pit'
  | 'elevated';

export type TerrainSocket =
  | 'grass'
  | 'water'
  | 'road'
  | 'cliff'
  | 'blocked'
  | 'mixed';

export type Point = {
  x: number;
  y: number;
};

export type Rect = Point & {
  width: number;
  height: number;
};

export type Direction =
  | 'north'
  | 'east'
  | 'south'
  | 'west';

export type TerrainTopology =
  | 'isolated'
  | 'end-n'
  | 'end-e'
  | 'end-s'
  | 'end-w'
  | 'vertical'
  | 'horizontal'
  | 'corner-ne'
  | 'corner-se'
  | 'corner-sw'
  | 'corner-nw'
  | 't-n'
  | 't-e'
  | 't-s'
  | 't-w'
  | 'cross'
  | 'solid';

export type Cell = {
  terrain: TerrainType;
  walkable: boolean;
  regionId?: number;
  roadTopology?: TerrainTopology;
  waterTopology?: TerrainTopology;
};

export type SpriteRect = {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
};

export type ThemeSprite = Record<Theme, SpriteRect>;

export type TerrainPiece = {
  id: string;
  terrain: TerrainType;
  width: number;
  height: number;
  sprites: ThemeSprite;
  sockets: {
    top: TerrainSocket;
    right: TerrainSocket;
    bottom: TerrainSocket;
    left: TerrainSocket;
  };
  weight: number;
  walkable: boolean;
  atomic: boolean;
  notes: string;
};

export type HouseType =
  | 'blueHouse'
  | 'orangeHouse'
  | 'largeHouse';

export type TreeType =
  | 'greenTree'
  | 'autumnTree'
  | 'whiteTree'
  | 'pinkTree'
  | 'tealTree';

export type DecorationType =
  | 'dirtPatch'
  | 'grassPatch'
  | 'stone'
  | 'flowers'
  | 'smallGrass'
  | 'well';

export type House = Point & {
  type: HouseType;
  width: number;
  height: number;
  entrance: Point;
  collision: Rect;
};

export type Tree = Point & {
  type: TreeType;
  width: number;
  height: number;
  collision: Rect;
};

export type Decoration = Point & {
  type: DecorationType;
  width: number;
  height: number;
};

export type Bridge = Point & {
  width: 6;
  height: 3;
  orientation: 'east-west';
  roadY: number;
};

export type Stairs = Point & {
  width: 3;
  height: 4;
  connects: 'grass-to-elevated';
};

export type Pit = Point & {
  width: 3;
  height: 3;
};

export type ElevatedFeature = Point & {
  width: 4;
  height: 4;
};

export type VisualPlacement = Point & {
  pieceId: string;
};

export type VillageMap = {
  width: number;
  height: number;
  seed: number;
  cells: Cell[][];
  terrain: TerrainType[][];
  collision: boolean[][];
  houses: House[];
  trees: Tree[];
  decorations: Decoration[];
  bridges: Bridge[];
  stairs: Stairs[];
  pits: Pit[];
  elevated: ElevatedFeature[];
  terrainPieces: VisualPlacement[];
  roadTiles: Point[];
  riverPath: Point[];
};

export type GenerateOptions = {
  width?: number;
  height?: number;
  houseCount?: number;
};
