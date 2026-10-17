export type AnimalType = "rabbit" | "deer" | "fox";
export type AnimalState = "idle" | "wander" | "graze" | "flee";

export interface Animal {
  id: string;
  type: AnimalType;
  x: number;
  y: number;
  facing: 1 | -1;
  state: AnimalState;
  frameIndex: number;
  frameElapsed: number;
  stateTimer: number;
  targetX: number;
  targetY: number;
  baseSpeed: number;
  width: number;
  height: number;
  idleFrames: number;
  moveFrames: number;
}

export type AnimalSprites = {
  rabbitIdle: HTMLImageElement;
  rabbitHop: HTMLImageElement;
  deerIdle: HTMLImageElement;
  deerWalk: HTMLImageElement;
  foxIdle: HTMLImageElement;
  foxWalk: HTMLImageElement;
};

// Spawn default animals for the meadow
export function createMeadowAnimals(mapType: "legacy" | "new"): Animal[] {
  if (mapType === "legacy") {
    return [
      // 3 Cozy Rabbits in the meadow around the cottage
      {
        id: "rabbit_1",
        type: "rabbit",
        x: 690,
        y: 430,
        facing: 1,
        state: "idle",
        frameIndex: 0,
        frameElapsed: 0,
        stateTimer: 120,
        targetX: 690,
        targetY: 430,
        baseSpeed: 1.8,
        width: 32,
        height: 26,
        idleFrames: 10,
        moveFrames: 10,
      },
      {
        id: "rabbit_2",
        type: "rabbit",
        x: 880,
        y: 350,
        facing: -1,
        state: "graze",
        frameIndex: 0,
        frameElapsed: 0,
        stateTimer: 180,
        targetX: 880,
        targetY: 350,
        baseSpeed: 1.8,
        width: 32,
        height: 26,
        idleFrames: 10,
        moveFrames: 10,
      },
      {
        id: "rabbit_3",
        type: "rabbit",
        x: 520,
        y: 490,
        facing: 1,
        state: "idle",
        frameIndex: 0,
        frameElapsed: 0,
        stateTimer: 150,
        targetX: 520,
        targetY: 490,
        baseSpeed: 1.8,
        width: 32,
        height: 26,
        idleFrames: 10,
        moveFrames: 10,
      },
      // 2 Forest Deer near the tree line
      {
        id: "deer_1",
        type: "deer",
        x: 960,
        y: 220,
        facing: -1,
        state: "graze",
        frameIndex: 0,
        frameElapsed: 0,
        stateTimer: 240,
        targetX: 960,
        targetY: 220,
        baseSpeed: 1.2,
        width: 72,
        height: 52,
        idleFrames: 10,
        moveFrames: 8,
      },
      {
        id: "deer_2",
        type: "deer",
        x: 440,
        y: 240,
        facing: 1,
        state: "idle",
        frameIndex: 0,
        frameElapsed: 0,
        stateTimer: 300,
        targetX: 440,
        targetY: 240,
        baseSpeed: 1.2,
        width: 72,
        height: 52,
        idleFrames: 10,
        moveFrames: 8,
      },
      // 1 Curious Glade Fox
      {
        id: "fox_1",
        type: "fox",
        x: 620,
        y: 530,
        facing: 1,
        state: "idle",
        frameIndex: 0,
        frameElapsed: 0,
        stateTimer: 200,
        targetX: 620,
        targetY: 530,
        baseSpeed: 1.5,
        width: 64,
        height: 36,
        idleFrames: 6,
        moveFrames: 8,
      },
    ];
  } else {
    // New Map (Ancient Ruins) animals
    return [
      {
        id: "rabbit_new_1",
        type: "rabbit",
        x: 750,
        y: 500,
        facing: 1,
        state: "idle",
        frameIndex: 0,
        frameElapsed: 0,
        stateTimer: 140,
        targetX: 750,
        targetY: 500,
        baseSpeed: 1.8,
        width: 32,
        height: 26,
        idleFrames: 10,
        moveFrames: 10,
      },
      {
        id: "rabbit_new_2",
        type: "rabbit",
        x: 920,
        y: 650,
        facing: -1,
        state: "graze",
        frameIndex: 0,
        frameElapsed: 0,
        stateTimer: 160,
        targetX: 920,
        targetY: 650,
        baseSpeed: 1.8,
        width: 32,
        height: 26,
        idleFrames: 10,
        moveFrames: 10,
      },
      {
        id: "deer_new_1",
        type: "deer",
        x: 1050,
        y: 420,
        facing: -1,
        state: "graze",
        frameIndex: 0,
        frameElapsed: 0,
        stateTimer: 220,
        targetX: 1050,
        targetY: 420,
        baseSpeed: 1.2,
        width: 72,
        height: 52,
        idleFrames: 10,
        moveFrames: 8,
      },
      {
        id: "fox_new_1",
        type: "fox",
        x: 600,
        y: 620,
        facing: 1,
        state: "idle",
        frameIndex: 0,
        frameElapsed: 0,
        stateTimer: 200,
        targetX: 600,
        targetY: 620,
        baseSpeed: 1.5,
        width: 64,
        height: 36,
        idleFrames: 6,
        moveFrames: 8,
      },
    ];
  }
}

// Update animal behaviors & animation frames
export function updateAnimals(animals: Animal[], playerX: number, playerY: number) {
  for (const animal of animals) {
    animal.frameElapsed++;
    const frameDelay = animal.state === "flee" ? 3 : 6;
    if (animal.frameElapsed >= frameDelay) {
      animal.frameElapsed = 0;
      const maxF = animal.state === "wander" || animal.state === "flee" ? animal.moveFrames : animal.idleFrames;
      animal.frameIndex = (animal.frameIndex + 1) % maxF;
    }

    // Distance to player
    const distToPlayer = Math.hypot(animal.x - playerX, animal.y - playerY);

    // Rabbit / Fox / Deer reacts if player gets too close
    if (distToPlayer < 75 && animal.state !== "flee") {
      animal.state = "flee";
      animal.stateTimer = 90;
      // Flee in opposite direction from player
      const angle = Math.atan2(animal.y - playerY, animal.x - playerX);
      animal.targetX = animal.x + Math.cos(angle) * 120;
      animal.targetY = animal.y + Math.sin(angle) * 120;
      animal.facing = animal.targetX > animal.x ? 1 : -1;
    }

    // State machine updates
    if (animal.state === "flee" || animal.state === "wander") {
      const dx = animal.targetX - animal.x;
      const dy = animal.targetY - animal.y;
      const dist = Math.hypot(dx, dy);
      const speed = animal.state === "flee" ? animal.baseSpeed * 2.2 : animal.baseSpeed;

      if (dist > 4) {
        animal.x += (dx / dist) * speed;
        animal.y += (dy / dist) * speed;
        animal.facing = dx >= 0 ? 1 : -1;
      } else {
        // Reached target, transition to grazing/idle
        animal.state = Math.random() > 0.4 ? "idle" : "graze";
        animal.stateTimer = 120 + Math.floor(Math.random() * 180);
      }
    } else {
      // Idle / Graze countdown
      animal.stateTimer--;
      if (animal.stateTimer <= 0) {
        // Pick new wander point nearby (within 60px)
        const wanderDist = 30 + Math.random() * 50;
        const angle = Math.random() * Math.PI * 2;
        animal.targetX = animal.x + Math.cos(angle) * wanderDist;
        animal.targetY = animal.y + Math.sin(angle) * wanderDist;
        animal.state = "wander";
        animal.facing = animal.targetX > animal.x ? 1 : -1;
      }
    }
  }
}

// Draw animals with soft ground shadows and directional flip
export function drawAnimals(ctx: CanvasRenderingContext2D, animals: Animal[], sprites: AnimalSprites) {
  // Sort by Y position for proper isometric depth
  const sorted = [...animals].sort((a, b) => a.y - b.y);

  for (const animal of sorted) {
    let img: HTMLImageElement | null = null;
    let frameW = animal.width;
    let frameH = animal.height;

    if (animal.type === "rabbit") {
      img = animal.state === "wander" || animal.state === "flee" ? sprites.rabbitHop : sprites.rabbitIdle;
    } else if (animal.type === "deer") {
      img = animal.state === "wander" || animal.state === "flee" ? sprites.deerWalk : sprites.deerIdle;
    } else if (animal.type === "fox") {
      img = animal.state === "wander" || animal.state === "flee" ? sprites.foxWalk : sprites.foxIdle;
    }

    if (!img || !img.complete || img.naturalWidth === 0) continue;

    const sourceX = (animal.frameIndex % (animal.state === "wander" || animal.state === "flee" ? animal.moveFrames : animal.idleFrames)) * frameW;

    ctx.save();
    // Draw soft ground shadow
    ctx.beginPath();
    ctx.ellipse(animal.x, animal.y + frameH * 0.45, frameW * 0.35, frameH * 0.16, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(10, 25, 18, 0.32)";
    ctx.fill();

    // Position and facing flip
    ctx.translate(animal.x, animal.y);
    if (animal.facing === -1) {
      ctx.scale(-1, 1);
    }

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      img,
      sourceX,
      0,
      frameW,
      frameH,
      -frameW / 2,
      -frameH / 2,
      frameW,
      frameH,
    );

    ctx.restore();
  }
}
