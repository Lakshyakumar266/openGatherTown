import type { Point } from './types';

export function distance(
  a: Point,
  b: Point,
): number {
  return Math.hypot(
    a.x - b.x,
    a.y - b.y,
  );
}

export function clamp(
  value: number,
  min: number,
  max: number,
): number {
  return Math.max(
    min,
    Math.min(max, value),
  );
}

export function key(
  x: number,
  y: number,
): string {
  return `${x},${y}`;
}

export function inBounds(
  x: number,
  y: number,
  width: number,
  height: number,
): boolean {
  return (
    x >= 0 &&
    y >= 0 &&
    x < width &&
    y < height
  );
}

export function neighbors4(
  x: number,
  y: number,
): Point[] {
  return [
    {
      x: x + 1,
      y,
    },
    {
      x: x - 1,
      y,
    },
    {
      x,
      y: y + 1,
    },
    {
      x,
      y: y - 1,
    },
  ];
}