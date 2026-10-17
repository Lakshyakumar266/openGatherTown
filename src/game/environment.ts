export type FallingLeaf = {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  sway: number;
  swaySpeed: number;
  alpha: number;
  color: string;
};

export type TreeLocation = {
  x: number;
  y: number;
  radius: number;
  canopyHeight: number;
};

export interface EnvironmentSystem {
  time: number;
  windStrength: number;
  leaves: FallingLeaf[];
  trees: TreeLocation[];
}

export function createEnvironmentSystem(mapType: "legacy" | "new"): EnvironmentSystem {
  const trees: TreeLocation[] =
    mapType === "legacy"
      ? [
          { x: 530, y: 180, radius: 48, canopyHeight: 70 },
          { x: 990, y: 190, radius: 56, canopyHeight: 80 },
          { x: 380, y: 480, radius: 52, canopyHeight: 75 },
          { x: 1040, y: 460, radius: 50, canopyHeight: 72 },
          { x: 740, y: 640, radius: 46, canopyHeight: 65 },
        ]
      : [
          { x: 1800, y: 3100, radius: 52, canopyHeight: 75 },
          { x: 2350, y: 3250, radius: 56, canopyHeight: 80 },
          { x: 1900, y: 1500, radius: 50, canopyHeight: 72 },
          { x: 2600, y: 1400, radius: 54, canopyHeight: 78 },
          { x: 1400, y: 2400, radius: 48, canopyHeight: 70 },
        ];

  const colors = ["#86efac", "#4ade80", "#22c55e", "#fef08a", "#f59e0b", "#fed7aa"];

  const leaves: FallingLeaf[] = Array.from({ length: 45 }, () => {
    const parentTree = trees[Math.floor(Math.random() * trees.length)];
    return {
      x: parentTree.x + (Math.random() - 0.5) * 200,
      y: parentTree.y + Math.random() * 250,
      size: 2 + Math.random() * 3,
      speedX: 0.35 + Math.random() * 0.5,
      speedY: 0.25 + Math.random() * 0.45,
      sway: Math.random() * Math.PI * 2,
      swaySpeed: 0.025 + Math.random() * 0.035,
      alpha: 0.4 + Math.random() * 0.5,
      color: colors[Math.floor(Math.random() * colors.length)],
    };
  });

  return {
    time: 0,
    windStrength: 1.0,
    leaves,
    trees,
  };
}

export function updateEnvironment(env: EnvironmentSystem) {
  env.time += 0.016;
  env.windStrength = 1.0 + Math.sin(env.time * 0.4) * 0.35;

  for (const leaf of env.leaves) {
    leaf.x += leaf.speedX * env.windStrength;
    leaf.y += leaf.speedY;
    leaf.sway += leaf.swaySpeed;

    // Reset leaf when it drifts out of range
    if (leaf.y > 4500 || leaf.x > 4500) {
      const parent = env.trees[Math.floor(Math.random() * env.trees.length)];
      leaf.x = parent.x - 80 + Math.random() * 60;
      leaf.y = parent.y - 30 + Math.random() * 40;
    }
  }
}

// Draw environmental enhancements: animated tree wind shadows, falling leaves, and sunbeams
export function drawEnvironment(
  ctx: CanvasRenderingContext2D,
  env: EnvironmentSystem,
) {
  // 1. Draw animated tree wind sway rings / canopy wind whispers
  for (const tree of env.trees) {
    const swayOffset = Math.sin(env.time * 1.6 + tree.x * 0.01) * 4 * env.windStrength;
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(
      tree.x + swayOffset * 0.5,
      tree.y - tree.canopyHeight * 0.6,
      tree.radius * 0.9,
      tree.radius * 0.8,
      swayOffset * 0.02,
      0,
      Math.PI * 2,
    );
    ctx.fillStyle = "rgba(134, 239, 172, 0.05)";
    ctx.fill();
    ctx.restore();
  }

  // 2. Draw drifting leaves and blossoms
  for (const leaf of env.leaves) {
    const currentX = leaf.x + Math.sin(leaf.sway) * 12;
    ctx.save();
    ctx.globalAlpha = leaf.alpha;
    ctx.fillStyle = leaf.color;
    ctx.beginPath();
    ctx.ellipse(
      currentX,
      leaf.y,
      leaf.size * 1.4,
      leaf.size * 0.75,
      leaf.sway,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.restore();
  }

  // 3. Draw soft sunbeams (god rays) streaming through canopies
  ctx.save();
  const rayGrad = ctx.createLinearGradient(0, 0, 800, 800);
  rayGrad.addColorStop(0, "rgba(254, 240, 138, 0.08)");
  rayGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.03)");
  rayGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = rayGrad;

  for (let i = 0; i < 3; i++) {
    const beamX = 400 + i * 280 + Math.sin(env.time * 0.3 + i) * 15;
    ctx.beginPath();
    ctx.moveTo(beamX, 0);
    ctx.lineTo(beamX + 110, 0);
    ctx.lineTo(beamX - 180, 900);
    ctx.lineTo(beamX - 300, 900);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}
