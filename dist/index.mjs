const FACTOR = 80;
class Color {
    r;
    g;
    b;
    a;
    constructor(r, g, b, a) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }
    static red() {
        return new Color(1, 0, 0, 1);
    }
    static green() {
        return new Color(0, 1, 0, 1);
    }
    static blue() {
        return new Color(0, 0, 1, 1);
    }
    static yellow() {
        return new Color(1, 1, 0, 1);
    }
    static purple() {
        return new Color(1, 0, 1, 1);
    }
    static cyan() {
        return new Color(0, 1, 1, 1);
    }
    toStyle() {
        return (`rgba(` +
            `${Math.floor(this.r * 255)}, ` +
            `${Math.floor(this.g * 255)}, ` +
            `${Math.floor(this.b * 255)}, ` +
            `${this.a})`);
    }
}
class Vector2 {
    x;
    y;
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    static zero() {
        return new Vector2(0, 0);
    }
    clone() {
        return new Vector2(this.x, this.y);
    }
    array() {
        return [this.x, this.y];
    }
    scale(value) {
        this.x *= value;
        this.y *= value;
        return this;
    }
    add(that) {
        this.x += that.x;
        this.y += that.y;
        return this;
    }
    div(that) {
        this.x /= that.x;
        this.y /= that.y;
        return this;
    }
}
function renderMinimap(ctx, minimapPosition, minimapSize, scene) {
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
function sceneSize(scene) {
    const y = scene.length;
    let x = Number.MIN_VALUE;
    for (let row of scene) {
        x = Math.max(x, row.length);
    }
    return new Vector2(x, y);
}
function strokeLine(ctx, p1, p2) {
    ctx.beginPath();
    ctx.moveTo(...p1.array());
    ctx.lineTo(...p2.array());
    ctx.stroke();
}
function canvasSize(ctx) {
    return new Vector2(ctx.canvas.width, ctx.canvas.height);
}
const scene = [
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
    const gameCanvas = document.getElementById("game");
    if (!gameCanvas)
        throw new Error("ERROR: canvas not found");
    gameCanvas.width = 16 * FACTOR;
    gameCanvas.height = 9 * FACTOR;
    const ctx = gameCanvas.getContext("2d");
    if (!ctx)
        throw new Error("ERROR: 2d context not supported");
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#181818";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    const minimapPosition = Vector2.zero().add(canvasSize(ctx).scale(0.03));
    const cellSize = ctx.canvas.width * 0.03;
    const minimapSize = sceneSize(scene).scale(cellSize);
    renderMinimap(ctx, minimapPosition, minimapSize, scene);
})();
export {};
//# sourceMappingURL=index.mjs.map