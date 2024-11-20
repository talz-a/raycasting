const EPS = 1e-6;
const PLAYER_SPEED = 2;
const NEAR_CLIPPING_PLANE = 0.5;
const FAR_CLIPPING_PLANE = 20;
const FOV = Math.PI * 0.5;
const SCREEN_FACTOR = 30;
const SCREEN_WIDTH = Math.floor(16 * SCREEN_FACTOR);
const SCREEN_HEIGHT = Math.floor(9 * SCREEN_FACTOR);

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
    brightness(factor: number): Color {
        return new Color(
            factor * this.r,
            factor * this.g,
            factor * this.b,
            this.a,
        );
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
    static fromAngle(angle: number): Vector2 {
        return new Vector2(Math.cos(angle), Math.sin(angle));
    }
    clone(): Vector2 {
        return new Vector2(this.x, this.y);
    }
    sqrLength(): number {
        return this.x ** 2 + this.y ** 2;
    }
    sqrDistanceTo(that: Vector2): number {
        return that.clone().sub(this).sqrLength();
    }
    array(): [number, number] {
        return [this.x, this.y];
    }
    length(): number {
        return Math.sqrt(this.x ** 2 + this.y ** 2);
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
    sub(that: Vector2): this {
        this.x -= that.x;
        this.y -= that.y;
        return this;
    }
    div(that: Vector2): this {
        this.x /= that.x;
        this.y /= that.y;
        return this;
    }
    lerp(that: Vector2, t: number): this {
        this.x = this.x + (that.x - this.x) * t;
        this.y = this.y + (that.y - this.y) * t;
        return this;
    }
    dot(that: Vector2): number {
        return this.x * that.x + this.y * that.y;
    }
    mul(that: Vector2): this {
        this.x *= that.x;
        this.y *= that.y;
        return this;
    }
    norm(): Vector2 {
        const l = this.length();
        if (l === 0) return Vector2.zero();
        return new Vector2(this.x / l, this.y / l);
    }
    rot90(): this {
        const temp = this.x;
        this.x = -this.y;
        this.y = temp;
        return this;
    }
}

class Player {
    position: Vector2;
    direction: number;
    constructor(position: Vector2, direction: number) {
        this.position = position;
        this.direction = direction;
    }
    fovRange(): [Vector2, Vector2] {
        const p = this.position
            .clone()
            .add(Vector2.fromAngle(this.direction).scale(NEAR_CLIPPING_PLANE));
        const offsetLength = Math.tan(FOV * 0.5) * NEAR_CLIPPING_PLANE;
        const directionVector = Vector2.fromAngle(this.direction);
        const scaledPerp = directionVector.rot90().norm().scale(offsetLength);
        const p1 = p.clone().sub(scaledPerp);
        const p2 = p.clone().add(scaledPerp);
        return [p1, p2];
    }
}

type Scene = Array<Array<Color | null>>;

function fillCircle(
    ctx: CanvasRenderingContext2D,
    center: Vector2,
    radius: number,
) {
    ctx.beginPath();
    ctx.arc(...center.array(), radius, 0, 2 * Math.PI);
    ctx.fill();
}

function strokeLine(ctx: CanvasRenderingContext2D, p1: Vector2, p2: Vector2) {
    ctx.beginPath();
    ctx.moveTo(...p1.array());
    ctx.lineTo(...p2.array());
    ctx.stroke();
}

function sceneSize(scene: Scene): Vector2 {
    const y = scene.length;
    let x = Number.MIN_VALUE;
    for (let row of scene) {
        x = Math.max(x, row.length);
    }
    return new Vector2(x, y);
}

function canvasSize(ctx: CanvasRenderingContext2D): Vector2 {
    return new Vector2(ctx.canvas.width, ctx.canvas.height);
}

function renderMinimap(
    ctx: CanvasRenderingContext2D,
    player: Player,
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
            const color = scene[y][x];
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

    ctx.fillStyle = "magenta";
    fillCircle(ctx, player.position, 0.3);
    const [p1, p2] = player.fovRange();

    ctx.strokeStyle = "magenta";
    strokeLine(ctx, p1, p2);
    strokeLine(ctx, player.position, p1);
    strokeLine(ctx, player.position, p2);

    ctx.restore();
}

function hittingCell(p1: Vector2, p2: Vector2): Vector2 {
    const d = p2.clone().sub(p1);
    return new Vector2(
        Math.floor(p2.x + Math.sign(d.x) * EPS),
        Math.floor(p2.y + Math.sign(d.y) * EPS),
    );
}

function insideScene(scene: Scene, p: Vector2): boolean {
    const size = sceneSize(scene);
    return 0 <= p.x && p.x < size.x && 0 <= p.y && p.y < size.y;
}

function snap(x: number, dx: number): number {
    if (dx > 0) return Math.ceil(x + Math.sign(dx) * EPS);
    if (dx < 0) return Math.floor(x + Math.sign(dx) * EPS);
    return x;
}

function rayStep(p1: Vector2, p2: Vector2): Vector2 {
    // y = k*x + c
    // x = (y - c)/k
    //
    // p1 = (x1, y1)
    // p2 = (x2, y2)
    //
    // | y1 = k*x1 + c
    // | y2 = k*x2 + c
    //
    // dy = y2 - y1
    // dx = x2 - x1
    // c = y1 - k*x1
    // k = dy/dx
    let p3 = p2;
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    if (dx !== 0) {
        const k = dy / dx;
        const c = p1.y - k * p1.x;

        {
            const x3 = snap(p2.x, dx);
            const y3 = x3 * k + c;
            p3 = new Vector2(x3, y3);
        }

        if (k !== 0) {
            const y3 = snap(p2.y, dy);
            const x3 = (y3 - c) / k;
            const p3t = new Vector2(x3, y3);
            if (p2.sqrDistanceTo(p3t) < p2.sqrDistanceTo(p3)) {
                p3 = p3t;
            }
        }
    } else {
        const y3 = snap(p2.y, dy);
        const x3 = p2.x;
        p3 = new Vector2(x3, y3);
    }

    return p3;
}

function castRay(scene: Scene, p1: Vector2, p2: Vector2): Vector2 {
    let start = p1;
    while (start.sqrDistanceTo(p1) < FAR_CLIPPING_PLANE * FAR_CLIPPING_PLANE) {
        const c = hittingCell(p1, p2);
        if (insideScene(scene, c) && scene[c.y][c.x] !== null) break;
        const p3 = rayStep(p1, p2);
        p1 = p2;
        p2 = p3;
    }
    return p2;
}

function renderScene(
    ctx: CanvasRenderingContext2D,
    player: Player,
    scene: Scene,
) {
    ctx.save();
    ctx.scale(
        ctx.canvas.width / SCREEN_WIDTH,
        ctx.canvas.height / SCREEN_HEIGHT,
    );
    const [r1, r2] = player.fovRange();
    for (let x = 0; x < SCREEN_WIDTH; ++x) {
        const p = castRay(
            scene,
            player.position,
            r1.clone().lerp(r2, x / SCREEN_WIDTH),
        );
        const c = hittingCell(player.position, p);
        if (insideScene(scene, c)) {
            const color = scene[c.y][c.x];
            if (color !== null) {
                const v = p.sub(player.position);
                const d = Vector2.fromAngle(player.direction);
                const distance = v.dot(d);
                const stripHeight = Math.floor(SCREEN_HEIGHT / distance);
                const yOffset = Math.floor((SCREEN_HEIGHT - stripHeight) * 0.5);
                ctx.fillStyle = color.brightness(1 / distance).toStyle();
                ctx.fillRect(x, yOffset, 1.0, stripHeight);
            }
        }
    }
    ctx.restore();
}

function renderGame(
    ctx: CanvasRenderingContext2D,
    player: Player,
    scene: Scene,
) {
    const minimapPosition = Vector2.zero().add(canvasSize(ctx).scale(0.03));
    const cellSize = ctx.canvas.width * 0.03;
    const minimapSize = sceneSize(scene).scale(cellSize);

    ctx.fillStyle = "#181818";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    renderScene(ctx, player, scene);
    renderMinimap(ctx, player, minimapPosition, minimapSize, scene);
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
    [null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null],
];

(() => {
    const gameCanvas = document.getElementById(
        "game",
    ) as HTMLCanvasElement | null;
    if (!gameCanvas) throw new Error("ERROR: canvas not found");
    const factor = 80;
    gameCanvas.width = 16 * factor;
    gameCanvas.height = 9 * factor;
    const ctx = gameCanvas.getContext("2d");
    if (!ctx) throw new Error("ERROR: 2d context not supported");
    ctx.imageSmoothingEnabled = false;

    const player = new Player(
        sceneSize(scene).mul(new Vector2(0.63, 0.63)),
        Math.PI * 1.25,
    );
    let movingForward = false;
    let movingBackward = false;
    let turningRight = false;
    let turningLeft = false;

    window.addEventListener("keydown", (e) => {
        if (!e.repeat) {
            switch (e.code) {
                case "KeyW":
                    movingForward = true;
                    break;
                case "KeyS":
                    movingBackward = true;
                    break;
                case "KeyA":
                    turningLeft = true;
                    break;
                case "KeyD":
                    turningRight = true;
                    break;
            }
        }
    });
    window.addEventListener("keyup", (e) => {
        if (!e.repeat) {
            switch (e.code) {
                case "KeyW":
                    movingForward = false;
                    break;
                case "KeyS":
                    movingBackward = false;
                    break;
                case "KeyA":
                    turningLeft = false;
                    break;
                case "KeyD":
                    turningRight = false;
                    break;
            }
        }
    });

    let prevTimestamp = 0;
    const frame = (timestamp: number) => {
        const deltaTime = (timestamp - prevTimestamp) / 1000;
        prevTimestamp = timestamp;
        let velocity = Vector2.zero();
        let angularVelocity = 0.0;
        if (movingForward) {
            velocity.add(
                Vector2.fromAngle(player.direction).scale(PLAYER_SPEED),
            );
        }
        if (movingBackward) {
            velocity.sub(
                Vector2.fromAngle(player.direction).scale(PLAYER_SPEED),
            );
        }
        if (turningLeft) {
            angularVelocity -= Math.PI;
        }
        if (turningRight) {
            angularVelocity += Math.PI;
        }
        player.direction = player.direction + angularVelocity * deltaTime;
        player.position.add(velocity.scale(deltaTime));
        renderGame(ctx, player, scene);
        window.requestAnimationFrame(frame);
    };
    window.requestAnimationFrame((timestamp) => {
        prevTimestamp = timestamp;
        window.requestAnimationFrame(frame);
    });
})();
