import { useEffect, useMemo, useRef } from "react";
import { collision } from "./collision";

class Sprite {
  ctx: CanvasRenderingContext2D;
  image: HTMLImageElement;
  position: { x: number; y: number };
  frames: { max: number; val: number; elapsed: number };
  width: number;
  height: number;
  moving?: boolean;
  sprites?: {
    up: HTMLImageElement;
    down: HTMLImageElement;
    left: HTMLImageElement;
    right: HTMLImageElement;
  };

  constructor({
    ctx,
    image,
    position,
    frames = { max: 1 },
    moving = false,
    sprites,
  }: {
    ctx: CanvasRenderingContext2D;
    image: HTMLImageElement;
    position: { x: number; y: number };
    frames?: { max: number; val?: number; elapsed?: number };
    moving?: boolean;
    sprites?: {
      up: HTMLImageElement;
      down: HTMLImageElement;
      left: HTMLImageElement;
      right: HTMLImageElement;
    };
  }) {
    this.ctx = ctx;
    this.image = image;
    this.position = position;
    this.frames = { ...frames, val: 0, elapsed: 0 };
    this.width = this.image.width / frames.max;
    this.height = this.image.height;
    this.moving = moving;
    this.sprites = sprites;
  }
  draw() {
    this.ctx.drawImage(
      this.image,
      this.frames.val * this.width,
      0,
      this.width,
      this.height,
      this.position.x,
      this.position.y,
      this.width,
      this.height,
    );

    if (this.frames.max > 1 && this.moving) {
      this.frames.elapsed++;

      // Higher number = slower animation
      if (this.frames.elapsed >= 10) {
        this.frames.elapsed = 0;
        this.frames.val++;

        if (this.frames.val >= this.frames.max) {
          this.frames.val = 0;
        }
      }
    }
  }
}

class Boundary {
  static width = 64;
  static height = 64;

  ctx: CanvasRenderingContext2D;
  position: { x: number; y: number };
  width: number;
  height: number;

  constructor({
    ctx,
    position,
  }: {
    ctx: CanvasRenderingContext2D;
    position: { x: number; y: number };
  }) {
    this.ctx = ctx;
    this.position = position;
    this.width = Boundary.width;
    this.height = Boundary.height;
  }

  draw() {
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.04)";
    this.ctx.fillRect(
      this.position.x,
      this.position.y,
      this.width,
      this.height,
    );
  }
}

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const collisionsMap: number[][] = useMemo(() => {
    const map: number[][] = [];
    for (let i = 0; i < collision.length; i += 64) {
      map.push(collision.slice(i, i + 64));
    }
    return map;
  }, []);

  const offset = {
    x: 0,
    y: -430,
  };
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const boundaries: Boundary[] = [];

    collisionsMap.forEach((row, i) => {
      row.forEach((item, j) => {
        if (item != 0) {
          boundaries.push(
            new Boundary({
              ctx,
              position: {
                x: j * Boundary.width + offset.x,
                y: i * Boundary.height + offset.y,
              },
            }),
          );
        }
      });
    });

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const BackgroundImage = new Image();
    BackgroundImage.src = "/BackgroundTerrain.png";
    const ForgroundImage = new Image();
    ForgroundImage.src = "/forground.png";

    const keys: { w: boolean; a: boolean; s: boolean; d: boolean } = {
      w: false,
      a: false,
      s: false,
      d: false,
    };

    type MovementKey = keyof typeof keys;
    const keyOrder: MovementKey[] = [];
    let zoom = 1;

    const clampZoom = (value: number) =>
      Math.max(0.9, Math.min(1.5, value));

    const changeZoom = (amount: number) => {
      zoom = clampZoom(zoom + amount);
    };

    const isMovementKey = (
      value: string,
    ): value is MovementKey =>
      value === "w" ||
      value === "a" ||
      value === "s" ||
      value === "d";

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      if (
        key === "+" ||
        key === "="
      ) {
        e.preventDefault();
        changeZoom(0.05);
        return;
      }

      if (
        key === "-" ||
        key === "_"
      ) {
        e.preventDefault();
        changeZoom(-0.05);
        return;
      }

      if (!isMovementKey(key)) return;

      keys[key] = true;

      // Keep the most recently pressed key on top. Repeated keydown events
      // must not create duplicates, or releasing once would leave it stuck.
      const existingIndex = keyOrder.indexOf(key);
      if (existingIndex !== -1) {
        keyOrder.splice(existingIndex, 1);
      }
      keyOrder.push(key);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      if (!isMovementKey(key)) return;

      keys[key] = false;
      const index = keyOrder.indexOf(key);
      if (index !== -1) {
        keyOrder.splice(index, 1);
      }
    };

    const handleWindowBlur = () => {
      keyOrder.length = 0;
      keys.w = false;
      keys.a = false;
      keys.s = false;
      keys.d = false;
    };

      window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleWindowBlur);

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      changeZoom(e.deltaY < 0 ? 0.05 : -0.05);
    };

    canvas.addEventListener("wheel", handleWheel, {
      passive: false,
    });

    const background = new Sprite({
      ctx: ctx,
      image: BackgroundImage,
      position: {
        x: offset.x,
        y: offset.y,
      },
    });
    const forground = new Sprite({
      ctx: ctx,
      image: ForgroundImage,
      position: {
        x: offset.x,
        y: offset.y,
      },
    });

    const PlayerUpImage = new Image();
    PlayerUpImage.src = "/playerUp.png";
    const PlayerDownImage = new Image();
    PlayerDownImage.src = "/playerDown.png";
    const PlayerLeftImage = new Image();
    PlayerLeftImage.src = "/playerLeft.png";
    const PlayerRightImage = new Image();
    PlayerRightImage.src = "/playerRight.png";
    const player = new Sprite({
      ctx: ctx,
      image: PlayerDownImage,
      position: {
        x: canvas.width / 2 - 192 / 4,
        y: canvas.height / 2 - 68 / 2,
      },
      frames: { max: 4 },
      sprites: {
        up: PlayerUpImage,
        down: PlayerDownImage,
        right: PlayerRightImage,
        left: PlayerLeftImage,
      },
    });

    const movables = [background, ...boundaries, forground];

    const checkCollision = (
      rect1: Sprite,
      rect2: {
        position: { x: number; y: number };
        width: number;
        height: number;
      },
    ) => {
      return (
        rect1.position.x < rect2.position.x + rect2.width &&
        rect1.position.x + rect1.width > rect2.position.x &&
        rect1.position.y < rect2.position.y + rect2.height &&
        rect1.position.y + rect1.width > rect2.position.y
      );
    };
    function gameLoop(): void {
      if (!ctx || !canvas) return;

      ctx.fillStyle = "rgb(44 87 145)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.scale(zoom, zoom);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);

      background.draw();
      boundaries.forEach((boundary) => {
        boundary.draw();
      });
      player.draw();

      forground.draw();
      let moving = true;
      player.moving = false;
      const activeKey = keyOrder[keyOrder.length - 1];

      if (activeKey === "w" && keys.w) {
        player.image = player.sprites!.up;
        player.moving = true;
        for (let i = 0; i < boundaries.length; i++) {
          const boundary = boundaries[i];
          if (
            checkCollision(player, {
              ...boundary,
              position: {
                x: boundary.position.x,
                y: boundary.position.y + 3,
              },
            })
          ) {
            console.log("coliding");
            moving = false;
            break;
          }
        }
        if (moving) {
          movables.forEach((e) => {
            e.position.y += 3;
          });
        }
      } else if (activeKey === "a" && keys.a) {
        player.image = player.sprites!.left;
        player.moving = true;
        for (let i = 0; i < boundaries.length; i++) {
          const boundary = boundaries[i];
          if (
            checkCollision(player, {
              ...boundary,
              position: {
                x: boundary.position.x + 3,
                y: boundary.position.y,
              },
            })
          ) {
            console.log("coliding");
            moving = false;
            break;
          }
        }
        if (moving) {
          movables.forEach((e) => {
            e.position.x += 3;
          });
        }
      } else if (activeKey === "s" && keys.s) {
        player.moving = true;
        player.image = player.sprites!.down;
        for (let i = 0; i < boundaries.length; i++) {
          const boundary = boundaries[i];
          if (
            checkCollision(player, {
              ...boundary,
              position: {
                x: boundary.position.x,
                y: boundary.position.y - 3,
              },
            })
          ) {
            console.log("coliding");
            moving = false;
            break;
          }
        }
        if (moving) {
          movables.forEach((e) => {
            e.position.y -= 3;
          });
        }
      } else if (activeKey === "d" && keys.d) {
        player.moving = true;
        player.image = player.sprites!.right;
        for (let i = 0; i < boundaries.length; i++) {
          const boundary = boundaries[i];
          if (
            checkCollision(player, {
              ...boundary,
              position: {
                x: boundary.position.x - 3,
                y: boundary.position.y,
              },
            })
          ) {
            console.log("coliding");
            moving = false;
            break;
          }
        }
        if (moving) {
          movables.forEach((e) => {
            e.position.x -= 3;
          });
        }
      }

      ctx.restore();
      requestAnimationFrame(gameLoop);
    }

    gameLoop();

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleWindowBlur);
      canvas.removeEventListener("wheel", handleWheel);
    };
  }, [collisionsMap, offset.x, offset.y]);

  return (
    <div style={{ backgroundColor: "black" }}>
      <canvas
        ref={canvasRef}
        width={innerWidth}
        height={innerHeight}
        style={{ display: "block" }}
      ></canvas>
    </div>
  );
}

export default App;
