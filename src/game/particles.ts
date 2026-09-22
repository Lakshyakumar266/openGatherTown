import type { Point } from "./pathfinding";

export type SprinkleParticle = {
  position: Point;
  velocity: Point;
  radius: number;
  color: string;
  life: number;
  maxLife: number;
};

const SPRINKLE_PARTICLE_COUNT = 24;
const SPRINKLE_LIFETIME = 34;
const SPRINKLE_COLORS = ["#ffffff", "#ffe082", "#7dd3fc", "#86efac", "#f9a8d4"];

export const createSprinkles = (
  position: Point,
  sprinkles: SprinkleParticle[],
) => {
  for (let index = 0; index < SPRINKLE_PARTICLE_COUNT; index++) {
    const angle =
      (Math.PI * 2 * index) / SPRINKLE_PARTICLE_COUNT + Math.random() * 0.35;
    const speed = 1.6 + Math.random() * 2.6;
    const life = SPRINKLE_LIFETIME + Math.floor(Math.random() * 14);

    sprinkles.push({
      position: { ...position },
      velocity: {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed - 0.8,
      },
      radius: 2 + Math.random() * 2.4,
      color: SPRINKLE_COLORS[index % SPRINKLE_COLORS.length],
      life,
      maxLife: life,
    });
  }
};

export const drawSprinkles = (
  ctx: CanvasRenderingContext2D,
  sprinkles: SprinkleParticle[],
) => {
  for (let index = sprinkles.length - 1; index >= 0; index--) {
    const particle = sprinkles[index];
    const progress = particle.life / particle.maxLife;

    ctx.save();
    ctx.globalAlpha = Math.max(0, progress);
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(
      particle.position.x,
      particle.position.y,
      particle.radius * (0.65 + progress * 0.6),
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.restore();

    particle.position.x += particle.velocity.x;
    particle.position.y += particle.velocity.y;
    particle.velocity.x *= 0.95;
    particle.velocity.y = particle.velocity.y * 0.95 + 0.08;
    particle.life--;

    if (particle.life <= 0) {
      sprinkles.splice(index, 1);
    }
  }
};
