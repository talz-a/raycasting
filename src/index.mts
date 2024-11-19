const FACTOR = 80;

type Scene = Array<Array<Color | null>>;

class Color {
    r: number;
    g: number;
    b: number;
    a: number;
    constructor(r: number, g: number, b: number, a: number) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }
    static red(): Color {
        return new Color(1, 0, 0, 1);
    }
    static green(): Color {
        return new Color(0, 1, 0, 1);
    }
    static blue(): Color {
        return new Color(0, 0, 1, 1);
    }
    static yellow(): Color {
        return new Color(1, 1, 0, 1);
    }
    static purple(): Color {
        return new Color(1, 0, 1, 1);
    }
    static cyan(): Color {
        return new Color(0, 1, 1, 1);
    }
    toStyle(): string {
        return (
            `rgba(` +
            `${Math.floor(this.r * 255)}, ` +
            `${Math.floor(this.g * 255)}, ` +
            `${Math.floor(this.b * 255)}, ` +
            `${this.a})`
        );
    }
}

class Vector2 {
    x: number;
    y: number;
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
    static zero(): Vector2 {
        return new Vector2(0, 0);
    }
    clone(): Vector2 {
        return new Vector2(this.x, this.y);
    }
    array(): [number, number] {
        return [this.x, this.y];
    }
    scale(value: number): this {
        this.x *= value;
        this.y *= value;
        return this;
    }
    add(that: Vector2): this {
        this.x += that.x;
        this.y += that.y;
        return this;
    }
    div(that: Vector2): this {
        this.x /= that.x;
        this.y /= that.y;
        return this;
    }
}

function renderMinimap(
    ctx: CanvasRenderingContext2D,
    minimapPosition: Vector2,
    minimapSize: Vector2,
    scene: Scene,
) {
    ctx.save();

    const gridSize = sceneSize(scene);
    ctx.translate(...minimapPosition.array());
    ctx.scale(...minimapSize.clone().div(gridSize).array());

    ctx.fillStyle = "#131313";
    ctx.fillRect(0, 0, ...gridSize.array());

    ctx.lineWidth = 0.1;
    for (let y = 0; y < gridSize.x; y++) {
        for (let x = 0; x < gridSize.y; x++) {
            const color = scene[x][y];
            if (color !== null) {
                ctx.fillStyle = color.toStyle();
                ctx.fillRect(x, y, 1, 1);
            }
        }
    }

    ctx.strokeStyle = "#303030";
    for (let x = 0; x <= gridSize.x; ++x) {
        strokeLine(ctx, new Vector2(x, 0), new Vector2(x, gridSize.y));
    }
    for (let y = 0; y <= gridSize.y; ++y) {
        strokeLine(ctx, new Vector2(0, y), new Vector2(gridSize.x, y));
    }
    ctx.restore();
}

function sceneSize(scene: Scene): Vector2 {
    const y = scene.length;
    let x = Number.MIN_VALUE;
    for (let row of scene) {
        x = Math.max(x, row.length);
    }
    return new Vector2(x, y);
}

function strokeLine(ctx: CanvasRenderingContext2D, p1: Vector2, p2: Vector2) {
    ctx.beginPath();
    ctx.moveTo(...p1.array());
    ctx.lineTo(...p2.array());
    ctx.stroke();
}

function canvasSize(ctx: CanvasRenderingContext2D): Vector2 {
    return new Vector2(ctx.canvas.width, ctx.canvas.height);
}

const scene: Scene = [
    [null, null, Color.cyan(), Color.purple(), null, null, null, null, null],
    [null, null, null, Color.yellow(), null, null, null, null, null],
    [
        null,
        Color.red(),
        Color.green(),
        Color.blue(),
        null,
        null,
        null,
        null,
        null,
    ],
    [null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null],
];

(() => {
    const gameCanvas = document.getElementById(
        "game",
    ) as HTMLCanvasElement | null;
    if (!gameCanvas) throw new Error("ERROR: canvas not found");
    gameCanvas.width = 16 * FACTOR;
    gameCanvas.height = 9 * FACTOR;

    const ctx = gameCanvas.getContext("2d");
    if (!ctx) throw new Error("ERROR: 2d context not supported");
    ctx.imageSmoothingEnabled = false;

    ctx.fillStyle = "#181818";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    const minimapPosition = Vector2.zero().add(canvasSize(ctx).scale(0.03));
    const cellSize = ctx.canvas.width * 0.03;
    const minimapSize = sceneSize(scene).scale(cellSize);
    renderMinimap(ctx, minimapPosition, minimapSize, scene);
})();
