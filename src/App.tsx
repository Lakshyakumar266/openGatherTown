import { useEffect, useMemo, useRef } from "react";
import { collision } from "./collision";

class Sprite {
  ctx: CanvasRenderingContext2D;
  image: HTMLImageElement;
  position: { x: number; y: number };
  frames: { max: number };
  width: number;
  height: number;

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
    this.width = this.image.width / frames.max;
    this.height = this.image.height;
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
      this.width,
      this.height,
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
    this.ctx.fillStyle = "rgba(0, 0, 0, 0)";
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
        x: canvas.width / 2 - 192 / 4,
        y: canvas.height / 2 - 68 / 2,
      },
      frames: { max: 4 },
    });

    const movables = [background, ...boundaries];

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
      background.draw();

      boundaries.forEach((boundary) => {
        boundary.draw();
      });
      player.draw();
      let moving = true;
      if (keys.w && LastKey === "w") {
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
      } else if (keys.a && LastKey === "a") {
        for (let i = 0; i < boundaries.length; i++) {
          const boundary = boundaries[i];
          if (
            checkCollision(player, {
              ...boundary,
              position: {
                x: boundary.position.x+3,
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
      } else if (keys.s && LastKey === "s") {
        for (let i = 0; i < boundaries.length; i++) {
          const boundary = boundaries[i];
          if (
            checkCollision(player, {
              ...boundary,
              position: {
                x: boundary.position.x,
                y: boundary.position.y-3,
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
        });}
      } else if (keys.d && LastKey === "d") {
        for (let i = 0; i < boundaries.length; i++) {
          const boundary = boundaries[i];
          if (
            checkCollision(player, {
              ...boundary,
              position: {
                x: boundary.position.x-3,
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
        });}
      }
      requestAnimationFrame(gameLoop);
    }

    gameLoop();

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
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
