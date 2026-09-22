
const ANIMATION_FRAME_DELAY = 5;

export class Sprite {
    ctx: CanvasRenderingContext2D;
    image: HTMLImageElement;
    name: string | undefined;
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
        name,
        position,
        frames = { max: 1 },
        moving = false,
        sprites,
    }: {
        ctx: CanvasRenderingContext2D;
        image: HTMLImageElement;
        name?: string | undefined;
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
        this.name = name || undefined;
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

        if (this.name) {
            this.ctx.font = "bold 12px monospace";
            this.ctx.textAlign = "center";
            this.ctx.textBaseline = "bottom";
            this.ctx.lineWidth = 3;
            this.ctx.strokeStyle = "rgba(0, 0, 0, 0.85)";
            this.ctx.fillStyle = "#ffffff";
            const nameX =
                this.position.x +
                this.width / 2;
            const nameY = this.position.y - 4;
            this.ctx.strokeText(this.name,
                nameX,
                nameY,
            );
            this.ctx.fillText(
                this.name,
                nameX,
                nameY,
            );
        }

        if (this.frames.max > 1 && this.moving) {
            this.frames.elapsed++;

            // Higher number = slower animation
            if (this.frames.elapsed >= ANIMATION_FRAME_DELAY) {
                this.frames.elapsed = 0;
                this.frames.val++;

                if (this.frames.val >= this.frames.max) {
                    this.frames.val = 0;
                }
            }
        }
    }
}

export class Boundary {
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