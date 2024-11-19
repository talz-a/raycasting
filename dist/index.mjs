const FACTOR = 80;
const PLAYER_SPEED = 2;
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
    static fromAngle(angle) {
        return new Vector2(Math.cos(angle), Math.sin(angle));
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
    sub(that) {
        this.x -= that.x;
        this.y -= that.y;
        return this;
    }
    div(that) {
        this.x /= that.x;
        this.y /= that.y;
        return this;
    }
    mul(that) {
        this.x *= that.x;
        this.y *= that.y;
        return this;
    }
}
class Player {
    position;
    direction;
    constructor(position, direction) {
        this.position = position;
        this.direction = direction;
    }
}
function fillCircle(ctx, center, radius) {
    ctx.beginPath();
    ctx.arc(...center.array(), radius, 0, 2 * Math.PI);
    ctx.fill();
}
function strokeLine(ctx, p1, p2) {
    ctx.beginPath();
    ctx.moveTo(...p1.array());
    ctx.lineTo(...p2.array());
    ctx.stroke();
}
function sceneSize(scene) {
    const y = scene.length;
    let x = Number.MIN_VALUE;
    for (let row of scene) {
        x = Math.max(x, row.length);
    }
    return new Vector2(x, y);
}
function canvasSize(ctx) {
    return new Vector2(ctx.canvas.width, ctx.canvas.height);
}
function renderMinimap(ctx, player, minimapPosition, minimapSize, scene) {
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
    ctx.restore();
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
    ctx.fillStyle = "#121212";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    const minimapPosition = Vector2.zero().add(canvasSize(ctx).scale(0.03));
    const cellSize = ctx.canvas.width * 0.03;
    const minimapSize = sceneSize(scene).scale(cellSize);
    const player = new Player(sceneSize(scene).mul(new Vector2(0.63, 0.63)), Math.PI * 1.25);
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
    const frame = (timestamp) => {
        const deltaTime = (timestamp - prevTimestamp) / 1000;
        prevTimestamp = timestamp;
        let velocity = Vector2.zero();
        let angularVelocity = 0.0;
        if (movingForward) {
            velocity.add(Vector2.fromAngle(player.direction).scale(PLAYER_SPEED));
        }
        if (movingBackward) {
            velocity.sub(Vector2.fromAngle(player.direction).scale(PLAYER_SPEED));
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
export {};
//# sourceMappingURL=index.mjs.map