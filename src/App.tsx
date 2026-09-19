import { useEffect, useRef } from "react";
import { collision } from "./collision";

class Sprite {
  ctx: CanvasRenderingContext2D;
  image: HTMLImageElement;
  position: { x: number; y: number };
  frames: { max: number };

  constructor({
    ctx,
    image,
    position,
    frames = { max: 1 },
  }: {
    ctx: CanvasRenderingContext2D;
    image: HTMLImageElement;
    position: { x: number; y: number };
    frames?: { max: number };
  }) {
    this.ctx = ctx;
    this.image = image;
    this.position = position;
    this.frames = frames;
  }
  draw() {
    this.ctx.drawImage(
      this.image,
      0,
      0,
      this.image.width / this.frames.max,
      this.image.height,
      this.position.x,
      this.position.y,
      this.image.width / this.frames.max,
      this.image.height,
    );
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
    this.ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
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
  const collisionsMap: number[][] = [];
  const offset = {
    x: 0,
    y: -430,
  };
  for (let i = 0; i < collision.length; i += 64) {
    collisionsMap.push(collision.slice(i, i + 64));
  }

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
    const PlayerImage = new Image();
    PlayerImage.src = "/playerDown.png";

    const keys: { w: boolean; a: boolean; s: boolean; d: boolean } = {
      w: false,
      a: false,
      s: false,
      d: false,
    };

    let LastKey = "";

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      if (key in keys) keys[key as keyof typeof keys] = true;
      LastKey = key.toString();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key in keys) keys[key as keyof typeof keys] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    const background = new Sprite({
      ctx: ctx,
      image: BackgroundImage,
      position: {
        x: offset.x,
        y: offset.y,
      },
    });
    const player = new Sprite({
      ctx: ctx,
      image: PlayerImage,
      position: {
        x: canvas.width / 2 - PlayerImage.width / 4,
        y: canvas.height / 2 - PlayerImage.height / 2,
      },
      frames: { max: 4 },
    });

    const movables = [background, ...boundaries];

    function gameLoop(): void {
      if (!ctx || !canvas) return;
      background.draw();

      boundaries.forEach((b) => {
        b.draw();
      });

      player.draw();
      player.draw();

      if (keys.w && LastKey === "w") {
        movables.forEach((e) => {
          e.position.y += 3;
        });
      } else if (keys.a && LastKey === "a") {
        movables.forEach((e) => {
          e.position.x += 3;
        });
      } else if (keys.s && LastKey === "s") {
        movables.forEach((e) => {
          e.position.y -= 3;
        });
      } else if (keys.d && LastKey === "d") {
        movables.forEach((e) => {
          e.position.x -= 3;
        });
      }
      requestAnimationFrame(gameLoop);
    }

    gameLoop();

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [collisionsMap]);

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
