import {
  DECORATION_SPRITES,
  HOUSE_SPRITES,
  TERRAIN_PIECES,
  TERRAIN_TILE_SPRITES,
  TREE_SPRITES,
  themedSprite,
} from './atlas';

import {
  TILE_SIZE,
} from './types';

import type {
  Point,
  SpriteRect,
  Theme,
  VillageMap,
} from './types';

type RenderOptions = {
  camera?: Point;
  scale?: number;
  theme?: Theme;
  debugCollision?: boolean;
};

function drawSprite(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  sprite: SpriteRect,
  x: number,
  y: number,
): void {
  ctx.drawImage(
    image,
    sprite.sx,
    sprite.sy,
    sprite.sw,
    sprite.sh,
    x,
    y,
    sprite.sw,
    sprite.sh,
  );
}

function spriteForTheme(
  sprite: Record<Theme, SpriteRect>,
  theme: Theme,
): SpriteRect {
  return themedSprite(
    sprite,
    theme,
  );
}

export function drawVillage(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  map: VillageMap,
  cameraOrOptions: Point | RenderOptions = {
    x: 0,
    y: 0,
  },
  legacyScale = 2,
): void {
  const options: RenderOptions =
    isRenderOptions(
      cameraOrOptions,
    )
      ? cameraOrOptions
      : {
          camera:
            cameraOrOptions,
          scale:
            legacyScale,
        };

  const camera =
    options.camera ?? {
      x: 0,
      y: 0,
    };
  const scale =
    options.scale ?? 2;
  const theme =
    options.theme ?? 'day';

  ctx.imageSmoothingEnabled =
    false;
  ctx.clearRect(
    0,
    0,
    ctx.canvas.width,
    ctx.canvas.height,
  );

  ctx.save();
  ctx.scale(scale, scale);
  ctx.translate(
    -camera.x,
    -camera.y,
  );

  drawTerrain(
    ctx,
    image,
    map,
    theme,
  );
  drawTerrainPieces(
    ctx,
    image,
    map,
    theme,
  );
  drawDecorations(
    ctx,
    image,
    map,
    theme,
  );
  drawHouses(
    ctx,
    image,
    map,
    theme,
  );
  drawTrees(
    ctx,
    image,
    map,
  );

  if (options.debugCollision) {
    drawCollisionDebug(
      ctx,
      map,
    );
  }

  ctx.restore();
}

function isRenderOptions(
  value: Point | RenderOptions,
): value is RenderOptions {
  return (
    'camera' in value ||
    'theme' in value ||
    'scale' in value ||
    'debugCollision' in value
  );
}

function drawTerrain(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  map: VillageMap,
  theme: Theme,
): void {
  const grass =
    spriteForTheme(
      TERRAIN_TILE_SPRITES.grass,
      theme,
    );
  const forest =
    spriteForTheme(
      TERRAIN_TILE_SPRITES.forestGround,
      theme,
    );
  const water =
    spriteForTheme(
      TERRAIN_TILE_SPRITES.water,
      theme,
    );
  const gravel =
    spriteForTheme(
      TERRAIN_TILE_SPRITES.gravel,
      theme,
    );

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
      const px =
        x * TILE_SIZE;
      const py =
        y * TILE_SIZE;
      const cell =
        map.cells[y][x];

      drawSprite(
        ctx,
        image,
        grass,
        px,
        py,
      );

      if (
        cell.terrain === 'forest'
      ) {
        drawSprite(
          ctx,
          image,
          forest,
          px,
          py,
        );
      }

      if (
        cell.terrain === 'water'
      ) {
        drawSprite(
          ctx,
          image,
          water,
          px,
          py,
        );
      }

      if (
        cell.terrain === 'road'
      ) {
        drawSprite(
          ctx,
          image,
          gravel,
          px,
          py,
        );
      }

      if (
        cell.terrain === 'gravel'
      ) {
        drawSprite(
          ctx,
          image,
          gravel,
          px,
          py,
        );
      }
    }
  }
}

function drawTerrainPieces(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  map: VillageMap,
  theme: Theme,
): void {
  for (
    const placement of
      map.terrainPieces
  ) {
    const piece =
      TERRAIN_PIECES[
        placement.pieceId
      ];

    if (!piece) {
      continue;
    }

    drawSprite(
      ctx,
      image,
      spriteForTheme(
        piece.sprites,
        theme,
      ),
      placement.x *
        TILE_SIZE,
      placement.y *
        TILE_SIZE,
    );
  }
}

function drawDecorations(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  map: VillageMap,
  theme: Theme,
): void {
  for (
    const decoration of
      map.decorations
  ) {
    const sprite =
      DECORATION_SPRITES[
        decoration.type
      ];

    drawSprite(
      ctx,
      image,
      spriteForTheme(
        sprite,
        theme,
      ),
      decoration.x *
        TILE_SIZE,
      decoration.y *
        TILE_SIZE,
    );
  }
}

function drawHouses(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  map: VillageMap,
  theme: Theme,
): void {
  for (
    const house of map.houses
  ) {
    const sprite =
      HOUSE_SPRITES[
        house.type
      ];

    drawSprite(
      ctx,
      image,
      spriteForTheme(
        sprite,
        theme,
      ),
      house.x * TILE_SIZE,
      house.y * TILE_SIZE,
    );
  }
}

function drawTrees(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  map: VillageMap,
): void {
  const sorted =
    [...map.trees].sort(
      (a, b) =>
        a.y - b.y ||
        a.x - b.x,
    );

  for (const tree of sorted) {
    const sprite =
      TREE_SPRITES[
        tree.type
      ];

    drawSprite(
      ctx,
      image,
      sprite,
      tree.x * TILE_SIZE,
      tree.y * TILE_SIZE,
    );
  }
}

function drawCollisionDebug(
  ctx: CanvasRenderingContext2D,
  map: VillageMap,
): void {
  ctx.save();
  ctx.fillStyle =
    'rgba(255, 0, 60, 0.25)';

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
      if (!map.collision[y][x]) {
        continue;
      }

      ctx.fillRect(
        x * TILE_SIZE,
        y * TILE_SIZE,
        TILE_SIZE,
        TILE_SIZE,
      );
    }
  }

  ctx.restore();
}
