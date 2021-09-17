const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");

const width = canvas.getAttribute("width");
const height = canvas.getAttribute("height");

let game_over = false;
let first_click = true;
let click_initial_position_x = 0;
let click_initial_position_y = 0;
const size = 9;
const cell_count = size * size;
const item_size = width / size;
const gap_size = Math.trunc(item_size / 7);
const inner_rect_size = item_size - gap_size * 2;

// canvas.arc(x, y, radius, startAngle, endAngle [, counterclockwise]);

let bomb_count = 10;

let empty_cells_remaining = cell_count - bomb_count;

if (size > 16) {
    bomb_count = 40;
} else if (size > 9) {
    bomb_count = 10;
}

let cell_status = []

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

canvas.addEventListener("mousedown", (e) => {
    const [x, y] = getMousePosition(e);
    [click_initial_position_x, click_initial_position_y] = translatePixelToIndex(x, y);
    if (game_over || cell_status[translateCoordinatesToIndex(click_initial_position_x, click_initial_position_y)] == 3 || empty_cells_remaining == 0) {
        return;
    }
    drawCellMouseDown(click_initial_position_x, click_initial_position_y);
});

canvas.addEventListener("click", (e) => {
    if (game_over || empty_cells_remaining == 0) {
        return;
    }
    let [x, y] = getMousePosition(e);
    [x, y] = translatePixelToIndex(x, y)
    console.log('click');
    if (x != click_initial_position_x || y != click_initial_position_y) {
        drawCell(click_initial_position_x, click_initial_position_y);
        return; 
    }

    if (first_click == true) {
        init(x, y);
    }

    let t_index = translateCoordinatesToIndex(x, y);
    if (cell_status[t_index] == 0) {
        game_over = true;
        console.log('BOMB!!!!!!!!');
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                if (cell_status[translateCoordinatesToIndex(i, j)] == 0) {
                    drawBomb(i, j);
                    console.log('bombaaaaaaaaaa');
                }
            }
        }
        drawBomb(x, y, " #FF0000");
    } else if (cell_status[t_index] == 1 || cell_status[t_index] == 2) {
        drawFlag(x, y);
    } else if (cell_status[t_index] == 4) {
        calculateValueForOpenedCell(x, y);
    }
});

canvas.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    let [x, y] = getMousePosition(e);
    [x, y] = translatePixelToIndex(x, y)
    
    if (first_click) {
        drawCell(x, y)
        return;
    };

    const i = translateCoordinatesToIndex(x, y)
    const cell_value = cell_status[i];

    if (cell_value == 3) {
        drawCell(x, y);
        return;
    }

    if (cell_value == 1 || cell_value == 2) {
        drawCell(x, y);
        if (cell_value == 1) {
            cell_status[i] = 0;
        } else if (cell_value == 2) {
            cell_status[i] = 4;
        }
    } else {
        drawFlag(x, y);
        if (cell_value == 0) {
            cell_status[i] = 1;
        } else if (cell_value == 4) {
            cell_status[i] = 2;
        }
    }
});

function translateCoordinatesToIndex(x, y) {
    return x + y * size;
}

function translatePixelToIndex(x, y) {
    return [Math.trunc(x / item_size), Math.trunc(y / item_size)];
}

function init(x, y) {
    first_click = false;
    console.log('init function called');
    const reserved_cell = translateCoordinatesToIndex(x, y);

    for (let index = 0; index < cell_count; index++) {
        cell_status.push(4);
    }

    for (let index = 0; index < bomb_count; index++) {
        let i = getRandomArbitrary(0, cell_count);
        if (i == reserved_cell || cell_status[i] == 0) {
            index--;
            continue;
        }
        cell_status[i] = 0;
    }
    console.log(cell_status)
}

function drawCell(x, y) {
    const indices = [
        item_size * x,
        item_size * y,
        item_size * x + item_size,
        item_size * y + item_size
    ];

    context.fillStyle = "#004EC0";
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
            if((xi >= 0 && xi < size) && (yj >= 0 && yj < size)) {
                if (i == 0 && j == 0) {
                    continue;
                }
                const ii = translateCoordinatesToIndex(xi, yj);
                if (cell_status[ii] == 0 || cell_status[ii] == 1) {
                    near_bombs_count++;
                }
            }
        }
    }

    return near_bombs_count;
}

function calculateValueForOpenedCell(x, y) {
    cell_status[translateCoordinatesToIndex(x, y)] = 3;
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
    } else {
        for (let j = -1; j < 2; j++) {
            for (let i = -1; i < 2; i++) {
                const xi = x + i;
                const yj = y + j;
                if((xi >= 0 && xi < size) && (yj >= 0 && yj < size)) {
                    if (i == 0 && j == 0) {
                        continue;
                    }
                    // drawCellMouseDown(xi, yj, "#00FF00");
                    const ii = translateCoordinatesToIndex(xi, yj);
                    if (cell_status[ii] == 2 || cell_status[ii] == 4) {
                        calculateValueForOpenedCell(xi, yj);
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

function drawField() {
    context.fillStyle = "#08090A";
    context.fillRect(0, 0, 400, 400);

    for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
            drawCell(x, y);
        }
    }
}

function game() {
    drawField()
}

game()