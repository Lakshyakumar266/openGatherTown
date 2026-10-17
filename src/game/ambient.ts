import type { Point } from "./pathfinding";

// ─── Ambient Particle Types ────────────────────────────────────────────────

export type AmbientParticle = {
  position: Point;
  velocity: Point;
  radius: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  type: "firefly" | "leaf" | "dust" | "bubble" | "butterfly";
  wobble: number;
  wobbleSpeed: number;
};

export type AmbientSystem = {
  particles: AmbientParticle[];
  spawnTimer: number;
  mapWidth: number;
  mapHeight: number;
  mapOriginX: number;
  mapOriginY: number;
};

const FIREFLY_COLORS = ["#ffe566", "#ffd700", "#e8ff66", "#9effd4"];
const LEAF_COLORS = ["#5dbb63", "#3da147", "#86e06e", "#c9f296"];
const DUST_COLORS = ["rgba(255,240,200,0.6)", "rgba(220,200,180,0.4)"];

// ─── Spawn helpers ─────────────────────────────────────────────────────────

function spawnFirefly(sys: AmbientSystem): AmbientParticle {
  const x = sys.mapOriginX + Math.random() * sys.mapWidth;
  const y = sys.mapOriginY + Math.random() * sys.mapHeight;
  const life = 120 + Math.floor(Math.random() * 200);
  return {
    position: { x, y },
    velocity: {
      x: (Math.random() - 0.5) * 0.4,
      y: (Math.random() - 0.5) * 0.4,
    },
    radius: 1.5 + Math.random() * 1.5,
    color: FIREFLY_COLORS[Math.floor(Math.random() * FIREFLY_COLORS.length)],
    alpha: 0,
    life,
    maxLife: life,
    type: "firefly",
    wobble: Math.random() * Math.PI * 2,
    wobbleSpeed: 0.025 + Math.random() * 0.03,
  };
}

function spawnLeaf(sys: AmbientSystem): AmbientParticle {
  const x = sys.mapOriginX + Math.random() * sys.mapWidth;
  const y = sys.mapOriginY + Math.random() * sys.mapHeight * 0.4;
  const life = 160 + Math.floor(Math.random() * 120);
  return {
    position: { x, y },
    velocity: {
      x: (Math.random() - 0.5) * 0.7,
      y: 0.3 + Math.random() * 0.5,
    },
    radius: 2 + Math.random() * 1.5,
    color: LEAF_COLORS[Math.floor(Math.random() * LEAF_COLORS.length)],
    alpha: 0.7,
    life,
    maxLife: life,
    type: "leaf",
    wobble: Math.random() * Math.PI * 2,
    wobbleSpeed: 0.04 + Math.random() * 0.04,
  };
}

function spawnDust(sys: AmbientSystem): AmbientParticle {
  const x = sys.mapOriginX + Math.random() * sys.mapWidth;
  const y = sys.mapOriginY + Math.random() * sys.mapHeight;
  const life = 200 + Math.floor(Math.random() * 150);
  return {
    position: { x, y },
    velocity: {
      x: (Math.random() - 0.5) * 0.2,
      y: -0.05 - Math.random() * 0.1,
    },
    radius: 1 + Math.random() * 2,
    color: DUST_COLORS[Math.floor(Math.random() * DUST_COLORS.length)],
    alpha: 0.3,
    life,
    maxLife: life,
    type: "dust",
    wobble: Math.random() * Math.PI * 2,
    wobbleSpeed: 0.02,
  };
}

const BUTTERFLY_COLORS = ["#f472b6", "#c084fc", "#38bdf8", "#fbbf24", "#34d399"];

function spawnButterfly(sys: AmbientSystem): AmbientParticle {
  const x = sys.mapOriginX + Math.random() * sys.mapWidth;
  const y = sys.mapOriginY + Math.random() * sys.mapHeight;
  const life = 240 + Math.floor(Math.random() * 200);
  return {
    position: { x, y },
    velocity: {
      x: (Math.random() - 0.5) * 0.7,
      y: (Math.random() - 0.5) * 0.5,
    },
    radius: 3.5 + Math.random() * 1.5,
    color: BUTTERFLY_COLORS[Math.floor(Math.random() * BUTTERFLY_COLORS.length)],
    alpha: 0.85,
    life,
    maxLife: life,
    type: "butterfly",
    wobble: Math.random() * Math.PI * 2,
    wobbleSpeed: 0.06 + Math.random() * 0.04,
  };
}

// ─── Public API ────────────────────────────────────────────────────────────

export function createAmbientSystem(
  mapOriginX: number,
  mapOriginY: number,
  mapWidth: number,
  mapHeight: number,
): AmbientSystem {
  const sys: AmbientSystem = {
    particles: [],
    spawnTimer: 0,
    mapWidth,
    mapHeight,
    mapOriginX,
    mapOriginY,
  };

  // Pre-populate with diverse ambient life
  for (let i = 0; i < 35; i++) sys.particles.push(spawnFirefly(sys));
  for (let i = 0; i < 15; i++) sys.particles.push(spawnLeaf(sys));
  for (let i = 0; i < 20; i++) sys.particles.push(spawnDust(sys));
  for (let i = 0; i < 18; i++) sys.particles.push(spawnButterfly(sys));

  return sys;
}

export function updateAmbient(sys: AmbientSystem) {
  sys.spawnTimer++;

  // Spawn rate – one every ~4 frames
  if (sys.spawnTimer % 4 === 0) {
    const roll = Math.random();
    if (roll < 0.35) sys.particles.push(spawnFirefly(sys));
    else if (roll < 0.6) sys.particles.push(spawnLeaf(sys));
    else if (roll < 0.8) sys.particles.push(spawnDust(sys));
    else sys.particles.push(spawnButterfly(sys));
  }

  // Cap particle count
  if (sys.particles.length > 200) {
    sys.particles.splice(0, sys.particles.length - 200);
  }
}

export function drawAmbient(
  ctx: CanvasRenderingContext2D,
  sys: AmbientSystem,
) {
  for (let i = sys.particles.length - 1; i >= 0; i--) {
    const p = sys.particles[i];
    const progress = p.life / p.maxLife;

    p.wobble += p.wobbleSpeed;

    let alpha = p.alpha;

    if (p.type === "firefly") {
      // Pulse fade in/out
      const pulse = 0.5 + 0.5 * Math.sin(p.wobble * 3);
      alpha = progress < 0.1
        ? progress * 10 * pulse
        : progress > 0.9
          ? (1 - progress) * 10 * pulse
          : pulse;

      p.position.x += p.velocity.x + Math.sin(p.wobble) * 0.3;
      p.position.y += p.velocity.y + Math.cos(p.wobble * 0.7) * 0.3;

      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha * 0.85));
      // Glow
      const grd = ctx.createRadialGradient(
        p.position.x, p.position.y, 0,
        p.position.x, p.position.y, p.radius * 4,
      );
      grd.addColorStop(0, p.color);
      grd.addColorStop(1, "transparent");
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(p.position.x, p.position.y, p.radius * 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(p.position.x, p.position.y, p.radius * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (p.type === "leaf") {
      p.position.x += p.velocity.x + Math.sin(p.wobble) * 0.6;
      p.position.y += p.velocity.y;

      const leafAlpha = progress < 0.1
        ? progress * 10 * p.alpha
        : progress > 0.85
          ? (1 - progress) / 0.15 * p.alpha
          : p.alpha;

      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, leafAlpha));
      ctx.translate(p.position.x, p.position.y);
      ctx.rotate(p.wobble);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.radius, p.radius * 1.7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (p.type === "butterfly") {
      p.position.x += p.velocity.x + Math.sin(p.wobble * 0.7) * 0.8;
      p.position.y += p.velocity.y + Math.cos(p.wobble * 0.5) * 0.5;

      const wingFlap = Math.abs(Math.sin(p.wobble * 4.5));
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha * (progress < 0.1 ? progress * 10 : progress > 0.9 ? (1 - progress) * 10 : 1)));
      ctx.translate(p.position.x, p.position.y);
      ctx.fillStyle = p.color;

      // Left wing
      ctx.beginPath();
      ctx.ellipse(-p.radius * 0.6 * wingFlap, 0, p.radius * 0.7 * wingFlap, p.radius, Math.PI / 6, 0, Math.PI * 2);
      ctx.fill();

      // Right wing
      ctx.beginPath();
      ctx.ellipse(p.radius * 0.6 * wingFlap, 0, p.radius * 0.7 * wingFlap, p.radius, -Math.PI / 6, 0, Math.PI * 2);
      ctx.fill();

      // Body
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(-0.75, -p.radius * 0.6, 1.5, p.radius * 1.2);
      ctx.restore();
    } else {
      // dust
      p.position.x += p.velocity.x + Math.sin(p.wobble) * 0.1;
      p.position.y += p.velocity.y;

      const dustAlpha = progress < 0.15
        ? progress / 0.15 * 0.3
        : progress > 0.85
          ? (1 - progress) / 0.15 * 0.3
          : 0.3;

      ctx.save();
      ctx.globalAlpha = Math.max(0, dustAlpha);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.position.x, p.position.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    p.life--;
    if (p.life <= 0) {
      sys.particles.splice(i, 1);
    }
  }
}
