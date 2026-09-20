import {
  useEffect,
  useMemo,
  useRef,
} from 'react';

import {
  generateWorld,
} from '../game/map/generator';

import {
  drawVillage,
} from '../game/map/render';

import {
  TILE_SIZE,
} from '../game/map/types';

const SCALE = 2;

const MAP_WIDTH = 72;

const MAP_HEIGHT = 46;

export function VillageMap({
  seed,
  theme = 'day',
  debugCollision = false,
}: {
  seed: number;
  theme?: 'day' | 'night';
  debugCollision?: boolean;
}) {
  const canvasRef =
    useRef<HTMLCanvasElement>(
      null,
    );

  const map = useMemo(
    () =>
      generateWorld(
        seed,
        {
          width:
            MAP_WIDTH,

          height:
            MAP_HEIGHT,

          houseCount:
            10,
        },
      ),

    [seed],
  );

  useEffect(() => {
    const canvas =
      canvasRef.current;

    if (!canvas) {
      return;
    }

    const ctx =
      canvas.getContext(
        '2d',
      );

    if (!ctx) {
      return;
    }

    const image =
      new Image();

    image.src =
      '/assets/tileset.png';

    image.onload = () => {
      canvas.width =
        map.width *
        TILE_SIZE *
        SCALE;

      canvas.height =
        map.height *
        TILE_SIZE *
        SCALE;

      drawVillage(
        ctx,
        image,
        map,
        {
          camera: {
            x: 0,
            y: 0,
          },
          scale:
            SCALE,
          theme,
          debugCollision,
        },
      );
    };
  }, [
    map,
    theme,
    debugCollision,
  ]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        imageRendering:
          'pixelated',

        display:
          'block',

        maxWidth:
          '100%',
      }}
    />
  );
}
