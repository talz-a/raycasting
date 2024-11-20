const FACTOR = 80;
const PLAYER_SPEED = 2;
const NEAR_CLIPPING_PLANE = 1.0;
const FOV = Math.PI * 0.5;

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
    static fromAngle(angle: number): Vector2 {
        return new Vector2(Math.cos(angle), Math.sin(angle));
    }
    clone(): Vector2 {
        return new Vector2(this.x, this.y);
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
        const scaledPerp = directionVector
            .clone()
            .rot90()
            .norm()
            .scale(offsetLength);
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

    ctx.fillStyle = "magenta";
    fillCircle(ctx, player.position, 0.3);
    const [p1, p2] = player.fovRange();

    ctx.strokeStyle = "magenta";
    strokeLine(ctx, p1, p2);
    strokeLine(ctx, player.position, p1);
    strokeLine(ctx, player.position, p2);

    ctx.restore();
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

    ctx.fillStyle = "#121212";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    const minimapPosition = Vector2.zero().add(canvasSize(ctx).scale(0.03));
    const cellSize = ctx.canvas.width * 0.03;
    const minimapSize = sceneSize(scene).scale(cellSize);

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
        player.position.add(velocity.clone().scale(deltaTime));
        renderMinimap(ctx, player, minimapPosition, minimapSize, scene);
        window.requestAnimationFrame(frame);
    };
    window.requestAnimationFrame((timestamp) => {
        prevTimestamp = timestamp;
        window.requestAnimationFrame(frame);
    });
})();
