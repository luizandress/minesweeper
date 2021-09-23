// canvas.arc(x, y, radius, startAngle, endAngle [, counterclockwise]);
const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");
const width = canvas.getAttribute("width");
const height = canvas.getAttribute("height");
const size = 9;
const cell_count = size * size;
const item_size = width / size;
const gap_size = item_size / 7;
const inner_rect_size = item_size - gap_size * 2;
const clue_colors = [];
let cells_status = [];
let first_cell = true;
let mousedown_x = 0;
let mousedown_y = 0;
let game_over = false;
let bomb_count = 10;
let empty_cells_remaining = cell_count - bomb_count;

const BOMB          = 0;
const BOMB_AND_FLAG = 1;
const FLAG          = 2;
const OPENED        = 3;
const NO_BOMB       = 4;

canvas.addEventListener("mousedown", (e) => {
    const [x, y] = getMousePosition(e);
    [mousedown_x, mousedown_y] = translatePixelToIndex(x, y);
    if (cells_status[getArrayIndexOfXY(mousedown_x, mousedown_y)] == OPENED ||
        game_over ||
        empty_cells_remaining == 0) {
        return;
    }
    drawCellMouseDown(mousedown_x, mousedown_y);
});

canvas.addEventListener("click", async (e) => {
    if (game_over || empty_cells_remaining == 0) {
        drawField();
        game_over = false;
        empty_cells_remaining = -1;
        first_cell = true;
        cells_status = []
        return;
    }

    [click_x, click_y] = translatePixelToIndex(...getMousePosition(e));

    if (clickCancelled(click_x, click_y)) {
        return;
    }

    if (first_cell) {
        init(click_x, click_y);
    }

    let cell_status = cells_status[getArrayIndexOfXY(click_x, click_y)];
    switch (cell_status) {
        case BOMB:
            game_over = true;
            first_cell = true;
            for (let i = 0; i < size; i++) {
                for (let j = 0; j < size; j++) {
                    if (cells_status[getArrayIndexOfXY(i, j)] == BOMB) {
                        drawBomb(i, j);
                        await sleep(2);
                    }
                }
            }
            drawBomb(click_x, click_y, "#FF0000");
            drawGameOverScreen(win = false);
            break;

        case FLAG:
        case BOMB_AND_FLAG:
            drawFlag(click_x, click_y);
            break;

        case NO_BOMB:
            calculateValueForOpenedCell(click_x, click_y);
            if (empty_cells_remaining == 0) {
                drawGameOverScreen(win = true);
            }
            break;
    }
});

canvas.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    if (game_over || empty_cells_remaining == 0) {
        return;
    }
    [click_x, click_y] = translatePixelToIndex(...getMousePosition(e));

    if (clickCancelled(click_x, click_y))
        return;

    if (first_cell) {
        drawCell(click_x, click_y)
        return;
    };

    const i = getArrayIndexOfXY(click_x, click_y)
    const cell_value = cells_status[i];

    if (cell_value == OPENED) {
    } else if (cell_value == BOMB_AND_FLAG || cell_value == FLAG) {
        drawCell(click_x, click_y);
        if (cell_value == BOMB_AND_FLAG) {
            cells_status[i] = BOMB;
        } else if (cell_value == FLAG) {
            cells_status[i] = NO_BOMB;
        }
    } else {
        drawFlag(click_x, click_y);
        if (cell_value == BOMB) {
            cells_status[i] = BOMB_AND_FLAG;
        } else if (cell_value == NO_BOMB) {
            cells_status[i] = FLAG;
        }
    }
});

function clickCancelled(x, y) {
    if (x != mousedown_x || y != mousedown_y) {
        const cell_status = cells_status[getArrayIndexOfXY(mousedown_x, mousedown_y)];

        switch (cell_status) {
            case NO_BOMB:
            case BOMB:
            case undefined:
            drawCell(mousedown_x, mousedown_y);
            break;
            case BOMB_AND_FLAG:
            case FLAG:
            drawFlag(mousedown_x, mousedown_y);
            break;
        }
        return true;
    }
    return false;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getRandomArbitrary(min, max) {
    return Math.trunc(Math.random() * (max - min) + min);
}

function getMousePosition(event) {
    const bounding_client_rect = canvas.getBoundingClientRect();
    const x = event.clientX - bounding_client_rect.left;
    const y = event.clientY - bounding_client_rect.top;
    console.log("Coordinate x: " + x, "Coordinate y: " + y);
    return [x, y];
}

function getArrayIndexOfXY(x, y) {
    return x + y * size;
}

function translatePixelToIndex(x, y) {
    return [Math.trunc(x / item_size), Math.trunc(y / item_size)];
}

function drawCell(x, y) {
    const indices = [
        item_size * x,
        item_size * y,
        item_size * x + item_size,
        item_size * y + item_size
    ];

    context.fillStyle = "#065A82";
    fillTriangle(
        indices[0], indices[1],
        indices[2], indices[1],
        indices[0], indices[3]
    )

    context.fillStyle = "#002A66";
    fillTriangle(
        indices[2], indices[3],
        indices[0], indices[3],
        indices[2], indices[1]
    )

    context.fillStyle = "#003F9A";
    context.fillRect(
        indices[0] + gap_size,
        indices[1] + gap_size,
        inner_rect_size,
        inner_rect_size);
}

function drawCellMouseDown(x, y, c = "#00398C") {
    context.fillStyle = c;
    context.fillRect(
        x * item_size,
        y * item_size,
        item_size,
        item_size
    );
}

function drawFlag(x, y) {
    drawCell(x, y);
    context.font = (item_size * 0.5) + "px Arial";
    context.fillText(
        "🚩",
        x * item_size + item_size * 0.2,
        y * item_size + item_size * 0.6
    );
}

function countNearBombs(x, y) {
    let near_bombs_count = 0

    for (let i = -1; i < 2; i++) {
        for (let j = -1; j < 2; j++) {
            const xi = x + i;
            const yj = y + j;
            if ((xi >= 0 && xi < size) && (yj >= 0 && yj < size)) {
                if (i == 0 && j == 0) {
                    continue;
                }
                const ii = getArrayIndexOfXY(xi, yj);
                if (cells_status[ii] == BOMB || cells_status[ii] == BOMB_AND_FLAG) {
                    near_bombs_count++;
                }
            }
        }
    }

    return near_bombs_count;
}

async function calculateValueForOpenedCell(x, y) {
    cells_status[getArrayIndexOfXY(x, y)] = OPENED;
    empty_cells_remaining--;

    let near_bombs_count = countNearBombs(x, y);

    drawCellMouseDown(x, y);
    if (near_bombs_count > 0) {
        context.fillStyle = "#7f675b";
        context.font = (item_size * 0.6) + "px Arial";
        context.fillText(
            near_bombs_count.toString(),
            x * item_size + item_size * 0.3,
            y * item_size + item_size * 0.7
        );
        await sleep(25);
    } else {
        for (let j = -1; j < 2; j++) {
            for (let i = -1; i < 2; i++) {
                const xi = x + i;
                const yj = y + j;
                if ((xi >= 0 && xi < size) && (yj >= 0 && yj < size)) {
                    if (i == 0 && j == 0) {
                        continue;
                    }
                    const ii = getArrayIndexOfXY(xi, yj);
                    if (cells_status[ii] == FLAG || cells_status[ii] == NO_BOMB) {
                        calculateValueForOpenedCell(xi, yj);
                        await sleep(25);
                    }
                }
            }
        }
    }
}

function drawBomb(x, y, c = "#00398C") {
    drawCellMouseDown(x, y, c);
    context.font = (item_size * 0.5) + "px Arial";
    context.fillText(
        "💣",
        x * item_size + item_size * 0.2,
        y * item_size + item_size * 0.6
    );
}

function fillTriangle(x1, y1, x2, y2, x3, y3) {
    context.beginPath();
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.lineTo(x3, y3);
    context.closePath();
    context.fill();
}

function drawGameOverScreen(win) {
    color = win ? "green" : "red";
    context.fillStyle = color;
    const w = gap_size;
    context.fillRect(0, 0, width, w);
    context.fillRect(0, height - w, width, w);
    context.fillRect(0, 0, w, height);
    context.fillRect(height - w, 0, w, height);
}

function drawField() {
    context.fillStyle = "red";
    context.fillRect(0, 0, 400, 400);

    for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
            drawCell(x, y);
        }
    }
}

function init(x, y) {

    cells_status = []
    mousedown_x = 0;
    mousedown_y = 0;
    empty_cells_remaining = cell_count - bomb_count;
    first_cell = false;
    
    const reserved_cell = getArrayIndexOfXY(x, y);

    for (let index = 0; index < cell_count; index++) {
        cells_status.push(NO_BOMB);
    }

    for (let index = 0; index < bomb_count; index++) {
        let i = getRandomArbitrary(0, cell_count);
        if (i == reserved_cell || cells_status[i] == BOMB) {
            index--;
            continue;
        }
        cells_status[i] = BOMB;
    }
}

function game() {
    drawField()
}

game()
