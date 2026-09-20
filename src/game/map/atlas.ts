import type {
  DecorationType,
  HouseType,
  SpriteRect,
  TerrainPiece,
  Theme,
  ThemeSprite,
  TreeType,
} from './types';

const rect = (
  sx: number,
  sy: number,
  sw: number,
  sh: number,
): SpriteRect => ({
  sx,
  sy,
  sw,
  sh,
});

const themed = (
  day: SpriteRect,
  night: SpriteRect,
): ThemeSprite => ({
  day,
  night,
});

export const ASSET_ANALYSIS = [
  'public/assets/tileset.png is 384x400 and mostly 16x16 aligned.',
  'The atlas contains composite house sprites at 5x7 and 11x7 tiles.',
  'The two house rows are paired variants: y=112 is used as day, y=0 as night.',
  'Terrain composites live at y=224 for day and y=288 for night.',
  'The bridge is a 6x3 tile horizontal composite with day/night variants at y=352.',
  'The isolated plain interior fills are the atlas cells: grass at (352,272), dark-blue water at (368,256), and gravel at (368,272), with night variants 64 pixels below.',
  'The bank, cliff, curve, and transition artwork is composite edge art and is never used as a repeating 1x1 interior fill.',
  'No standalone PNGs for the named TERRAIN SET 1-5 groups are present in this repo.',
  'Road and water rendering therefore uses the atlas-aligned fill tiles plus topology metadata, while cliffs, bridge, stairs, pits, houses, trees, and patches stay atomic.',
] as const;

export const TERRAIN_TILE_SPRITES = {
  grass: themed(
    rect(352, 272, 16, 16),
    rect(352, 336, 16, 16),
  ),
  forestGround: themed(
    rect(352, 272, 16, 16),
    rect(352, 336, 16, 16),
  ),
  water: themed(
    rect(368, 256, 16, 16),
    rect(368, 320, 16, 16),
  ),
  road: themed(
    rect(368, 272, 16, 16),
    rect(368, 336, 16, 16),
  ),
  gravel: themed(
    rect(368, 272, 16, 16),
    rect(368, 336, 16, 16),
  ),
};

export const TERRAIN_PIECES: Record<string, TerrainPiece> = {
  pit: {
    id: 'pit',
    terrain: 'pit',
    width: 3,
    height: 3,
    sprites: themed(
      rect(16, 224, 48, 48),
      rect(16, 288, 48, 48),
    ),
    sockets: {
      top: 'grass',
      right: 'grass',
      bottom: 'grass',
      left: 'grass',
    },
    weight: 1,
    walkable: false,
    atomic: true,
    notes: 'Small dirt-and-rock depression. It is placed as a single 3x3 terrain feature.',
  },
  elevatedPlateau: {
    id: 'elevatedPlateau',
    terrain: 'elevated',
    width: 4,
    height: 4,
    sprites: themed(
      rect(80, 224, 64, 64),
      rect(80, 288, 64, 64),
    ),
    sockets: {
      top: 'grass',
      right: 'grass',
      bottom: 'cliff',
      left: 'grass',
    },
    weight: 1,
    walkable: false,
    atomic: true,
    notes: 'Raised grass/cliff block. The front cliff is authored into the composite.',
  },
  grassRise: {
    id: 'grassRise',
    terrain: 'grass',
    width: 4,
    height: 3,
    sprites: themed(
      rect(144, 224, 64, 48),
      rect(144, 288, 64, 48),
    ),
    sockets: {
      top: 'grass',
      right: 'grass',
      bottom: 'grass',
      left: 'grass',
    },
    weight: 2,
    walkable: true,
    atomic: true,
    notes: 'Clean grass patch with authored border detail.',
  },
  stairs: {
    id: 'stairs',
    terrain: 'elevated',
    width: 3,
    height: 4,
    sprites: themed(
      rect(208, 224, 48, 64),
      rect(208, 288, 48, 64),
    ),
    sockets: {
      top: 'cliff',
      right: 'grass',
      bottom: 'grass',
      left: 'grass',
    },
    weight: 1,
    walkable: true,
    atomic: true,
    notes: 'Stone stairs. Only placed at generated elevation transitions.',
  },
  waterBankPlatform: {
    id: 'waterBankPlatform',
    terrain: 'elevated',
    width: 4,
    height: 4,
    sprites: themed(
      rect(256, 224, 64, 64),
      rect(256, 288, 64, 64),
    ),
    sockets: {
      top: 'water',
      right: 'water',
      bottom: 'water',
      left: 'water',
    },
    weight: 1,
    walkable: false,
    atomic: true,
    notes: 'Water-edged raised land composite. Reserved as an atomic island/bank accent.',
  },
  bridge: {
    id: 'bridge',
    terrain: 'road',
    width: 6,
    height: 3,
    sprites: themed(
      rect(0, 352, 96, 48),
      rect(96, 352, 96, 48),
    ),
    sockets: {
      top: 'water',
      right: 'road',
      bottom: 'water',
      left: 'road',
    },
    weight: 1,
    walkable: true,
    atomic: true,
    notes: 'Horizontal bridge composite. The atlas does not include a vertical bridge variant.',
  },
};

export const HOUSE_SPRITES: Record<HouseType, ThemeSprite> = {
  blueHouse: themed(
    rect(0, 112, 80, 112),
    rect(0, 0, 80, 112),
  ),
  orangeHouse: themed(
    rect(80, 112, 80, 112),
    rect(80, 0, 80, 112),
  ),
  largeHouse: themed(
    rect(160, 112, 176, 112),
    rect(160, 0, 176, 112),
  ),
};

export const HOUSE_FOOTPRINTS: Record<
  HouseType,
  {
    width: number;
    height: number;
  }
> = {
  blueHouse: {
    width: 5,
    height: 7,
  },
  orangeHouse: {
    width: 5,
    height: 7,
  },
  largeHouse: {
    width: 11,
    height: 7,
  },
};

export const TREE_SPRITES: Record<TreeType, SpriteRect> = {
  greenTree: rect(192, 352, 48, 48),
  autumnTree: rect(240, 352, 48, 48),
  whiteTree: rect(288, 352, 48, 48),
  pinkTree: rect(336, 80, 48, 48),
  tealTree: rect(336, 176, 48, 48),
};

export const DECORATION_SPRITES: Record<DecorationType, ThemeSprite> = {
  dirtPatch: themed(
    rect(16, 224, 48, 48),
    rect(16, 288, 48, 48),
  ),
  grassPatch: themed(
    rect(64, 224, 32, 32),
    rect(64, 288, 32, 32),
  ),
  stone: themed(
    rect(0, 272, 16, 16),
    rect(0, 336, 16, 16),
  ),
  flowers: themed(
    rect(16, 272, 16, 16),
    rect(16, 336, 16, 16),
  ),
  smallGrass: themed(
    rect(32, 272, 16, 16),
    rect(32, 336, 16, 16),
  ),
  well: themed(
    rect(304, 224, 32, 48),
    rect(304, 288, 32, 48),
  ),
};

export function themedSprite(
  sprites: ThemeSprite,
  theme: Theme,
): SpriteRect {
  return sprites[theme];
}
