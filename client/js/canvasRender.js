const trashcan_open = new Image();
trashcan_open.src = `./img/trashcan_open.svg`

const trashcan_closed = new Image();
trashcan_closed.src = `./img/trashcan_closed.svg`


function drawTrashcan() {
    let open;
    for (const key in localWorld.players) {
        if (localWorld.players[key].isCollidingWithTrashcan === true) {
            open = true
        } else {
            open = false
        }
    }

    if(open) {
        ctx.drawImage(trashcan_open, 800, 800, 100, 100);
    } else {
        ctx.drawImage(trashcan_closed, 800, 800, 100, 100);
    }

}


function drawElements(data) {
    for (const key in data.entities) {
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.fillStyle = data.entities[key].color;
        ctx.rect(data.entities[key].x, data.entities[key].y, data.entities[key].w, data.entities[key].h);
        ctx.fill();
        ctx.stroke();

        drawCardText(data.entities[key].title, data.entities[key].x + (data.entities[key].w / 2), data.entities[key].y + (data.entities[key].h / 2));
    }
}


function drawCardText(title, x, y) {
    ctx.font = "20px Arial";
    ctx.textAlign = "center";
    ctx.fillStyle = "black";
    ctx.textBaseline = "middle";
    ctx.fillText(title, x, y);
}

function drawLists(data) {
    let i = localWorld.listCount - 1;

    for (const key in data.lists) {
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.fillStyle = data.lists[key].color;
        ctx.rect(
            data.lists[key].x,
            data.lists[key].y,
            data.lists[key].w,
            data.lists[key].h
        );
        ctx.fill();
        ctx.stroke();

        //draw list name
        ctx.font = "20px Arial";
        ctx.textAlign = "center";
        ctx.fillStyle = "black";
        ctx.fillText(
            data.lists[key].title,
            data.lists[key].x + 100,
            data.lists[key].y + 25
        );

        //draw ideas
        let containedIdeasCount = 0;
        for (const object in data.lists[key].containedIdeas) {
            ctx.font = "15px Arial";
            ctx.textAlign = "center";
            ctx.fillStyle = "black";
            ctx.fillText(
                data.lists[key].containedIdeas[object].title,
                data.lists[key].x + 100,
                data.lists[key].y + 45 + containedIdeasCount * 20
            );
            ++containedIdeasCount;
        }
        i--;
    }
}

function drawPickUpToolTip(data) {
    for (const key in data.players) {
        //only draws for the current clients player
        if (
            (data.players[key].id === myId &&
                data.players[key].isColliding === true &&
                isEmpty(data.players[key].connectedEntity) === true) ||
            (data.players[key].id === myId &&
                data.players[key].isCollidingWithList === true &&
                isEmpty(data.players[key].connectedEntity) === true)
        ) {
            ctx.font = "30px Arial";
            ctx.textAlign = "center";
            ctx.fillStyle = "black";
            ctx.fillText(
                "Press E to interact",
                data.players[key].x,
                data.players[key].y - 45
            );
        }
    }
}

function drawLineLength(x1, y1, x2, y2, maxLen, color) {
    let vx = x2 - x1; // get dist between start and end of line
    let vy = y2 - y1; // for x and y
    // use pythagoras to get line total length
    let mag = Math.sqrt(vx * vx + vy * vy);
    // calculate how much to scale the line to get the correct distance
    mag = maxLen / mag;
    vx *= mag;
    vy *= mag;
    ctx.strokeStyle = color;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 + vx, y1 + vy);
    ctx.stroke();
}

function drawPlayers(data) {
    
    for (const key in data.players) {
        ctx.save();
        //draw player circle
        ctx.beginPath();
        ctx.arc(data.players[key].x, data.players[key].y, data.players[key].h / 2, 0, 2 * Math.PI);
        ctx.fillStyle = data.players[key].color;
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 5;
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'black';
        ctx.stroke();



        drawLineLength(
            data.players[key].x,
            data.players[key].y,
            data.players[key].mousePos.x,
            data.players[key].mousePos.y,
            data.players[key].h / 2,
            data.players[key].viewIndicatorColor
        );

        ctx.restore();

        //draw name
        ctx.font = "30px Arial";
        ctx.textAlign = "center";
        ctx.fillStyle = "black";
        ctx.fillText(data.players[key].name, data.players[key].x, data.players[key].y + 65)

        //draw picked up entity
        if (isEmpty(data.players[key].connectedEntity) === false) {
            ctx.beginPath();
            ctx.strokeStyle = data.players[key].color;
            ctx.fillStyle = data.players[key].connectedEntity.color;
            ctx.rect(data.players[key].connectedEntity.x, data.players[key].connectedEntity.y, data.players[key].connectedEntity.w, data.players[key].connectedEntity.h);
            ctx.fill();
            ctx.stroke();

            drawCardText(data.players[key].connectedEntity.title, data.players[key].connectedEntity.x + (data.players[key].connectedEntity.w / 2), data.players[key].connectedEntity.y + (data.players[key].connectedEntity.h / 2));
        }

    }
}

function renderCanvas() {


    ctx.save();

    resetCanvas();
    ctx.translate(-localWorld.players[myId].x + ctx.canvas.width / 2, -localWorld.players[myId].y + ctx.canvas.height / 2);
    ctx.restore();

    drawPlayers(localWorld);

    drawTrashcan(true);
    drawLists(localWorld);
    drawElements(localWorld);
    
    drawPickUpToolTip(localWorld);
    
}

function resetCanvas() {

    
// ...your drawing code...

    
    //set canvas size to window size.
    ctx.canvas.width = window.innerWidth - 350;
    ctx.canvas.height = window.innerHeight;

    //clear canvas berfore new frame
    ctx.clearRect(0, 0, window.innerWidth - 350, window.innerHeight);
}
