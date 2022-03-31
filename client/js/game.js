//initialize connection between server and client
const socket = io();
const canvas = document.getElementById("ctx");
const ctx = document.getElementById("ctx").getContext("2d");
//const form = document.getElementById("name-color-form");
const spawnBtn = document.getElementById("spawn");
const spawnListBtn = document.getElementById("create-list");
const clearBtn = document.getElementById("delete");
const idText = document.getElementById("worldId");


const formMenu = document.getElementById("form-menu");

const hostBtn = document.getElementById("host");
const joinBtn = document.getElementById("join");
const worldSelect = document.getElementById("worldSelect");
const colorInput = document.getElementById("color");
const nameInput = document.getElementById("name");



let myId;
let localWorld;
let hover = false;
let targetEntityId;

getServerData();
sendClientData();

let mouseX;
let mouseY;

function insertWorldsInSelect(data) {
    for (const world in data) {
        let option = document.createElement('option');
        option.value = data[world];
        option.innerHTML = "World: " + data[world];

        worldSelect.appendChild(option);
    }

}


function drawElements(data) {
    for (const key in data.entities) {
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.fillStyle = data.entities[key].color;
        ctx.rect(data.entities[key].x, data.entities[key].y, data.entities[key].h, data.entities[key].w);
        ctx.fill();
        ctx.stroke();
    }
}

function drawLists (data) {
    for (const key in data.lists) {
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.fillStyle = data.lists[key].color;
        ctx.rect(
            data.lists[key].x,
            data.lists[key].y,
            data.lists[key].h,
            data.lists[key].w
        );
        ctx.fill();
        ctx.stroke();
    }
}

function drawPickUpToolTip(data) {
    for (const key in data.players) {
        //only draws for the current clients player
        if (data.players[key].id === myId && data.players[key].isColliding === true && isEmpty(data.players[key].connectedEntity) === true) {
            ctx.font = "30px Arial";
            ctx.textAlign = "center";
            ctx.fillStyle = "black";
            ctx.fillText("Press E to interact", data.players[key].x, data.players[key].y - 35)
        }
    }
}

function drawLineLength(x1, y1, x2, y2, maxLen) {
    var vx = x2 - x1; // get dist between start and end of line
    var vy = y2 - y1; // for x and y

    // use pythagoras to get line total length
    var mag = Math.sqrt(vx * vx + vy * vy);
    if (mag > maxLen) {
        // is the line longer than needed?

        // calculate how much to scale the line to get the correct distance
        mag = maxLen / mag;
        vx *= mag;
        vy *= mag;
    } else if (mag < maxLen) {
        maxLen = maxLen / mag;
        vx *= maxLen;
        vy *= maxLen;
    }
    ctx.strokeStyle = "red";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 + vx, y1 + vy);
    ctx.stroke();
}

function drawPlayers(data) {
    for (const key in data.players) {

        //draw player circle
        ctx.beginPath();
        ctx.arc(data.players[key].x, data.players[key].y, data.players[key].h / 2, 0, 2 * Math.PI);
        ctx.fillStyle = data.players[key].color;
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'black';
        ctx.stroke();



        drawLineLength(
            data.players[key].x,
            data.players[key].y,
            data.players[key].mousePos.x,
            data.players[key].mousePos.y,
            data.players[key].h / 2
        );

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
            ctx.rect(data.players[key].connectedEntity.x, data.players[key].connectedEntity.y, data.players[key].connectedEntity.h, data.players[key].connectedEntity.w);
            ctx.fill();
            ctx.stroke();
        }

    }
}

function renderCanvas(localWorld) {
    //set canvas size to window size.
    idText.innerHTML = "world: " + localWorld.worldId;
    ctx.canvas.width = window.innerWidth;
    ctx.canvas.height = window.innerHeight;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    drawLists(localWorld);
    drawElements(localWorld);
    drawPlayers(localWorld);
    drawPickUpToolTip(localWorld);
}

function sendClientData() {

    spawnListBtn.addEventListener("click", (e) => {
        socket.emit("spawnList", localWorld.worldId);
    });

    spawnBtn.addEventListener("click", (e) => {
        socket.emit("spawnElement", localWorld.worldId);
    });

    clearBtn.addEventListener("click", (e) => {
        socket.emit("clear", localWorld.worldId);
    });

    joinBtn.addEventListener('click', (e) => {
        e.preventDefault();
        let name = nameInput.value;
        let color = colorInput.value;
        let Id = worldSelect.value;

        //hide form
        formMenu.style = "display: none;";

        socket.emit('join', {
            name: name,
            color: color,
            sessionId: Id,
            host: false
        });
    });

    hostBtn.addEventListener('click', (e) => {
        e.preventDefault();
        let name = nameInput.value;
        let color = colorInput.value;

        //hide form
        formMenu.style = "display: none;";


        socket.emit('join', {
            name: name,
            color: color,
            sessionId: "",
            host: true
        });
    });


    document.onkeydown = (event) => {
        if (event.key === 'd' || event.key === 'D') {
            socket.emit('keyPress', {
                inputId: 'right',
                state: true
            })
        } else if (event.key === 's' || event.key === 'S') {
            socket.emit('keyPress', {
                inputId: 'down',
                state: true
            })
        } else if (event.key === 'a' || event.key === 'A') {
            socket.emit('keyPress', {
                inputId: 'left',
                state: true
            })
        } else if (event.key === 'w' || event.key === 'W') {
            socket.emit('keyPress', {
                inputId: 'up',
                state: true
            })
        } else if (event.key === 'e' || event.key === 'E') {

            socket.emit('keyPress', {
                inputId: 'pickUpKeyPressed',
                state: true
            })
        }
    }

    document.onkeyup = (event) => {
        if (event.key === 'd' || event.key === 'D') {
            socket.emit('keyPress', {
                inputId: 'right',
                state: false
            })
        } else if (event.key === 's' || event.key === 'S') {
            socket.emit('keyPress', {
                inputId: 'down',
                state: false
            })
        } else if (event.key === 'a' || event.key === 'A') {
            socket.emit('keyPress', {
                inputId: 'left',
                state: false
            })
        } else if (event.key === 'w' || event.key === 'W') {
            socket.emit('keyPress', {
                inputId: 'up',
                state: false
            })
        } else if (event.key === 'e' || event.key === 'E') {
            socket.emit('keyPress', {
                inputId: 'pickUpKeyPressed',
                state: false
            })
        }
    }

}

function getServerData() {

    socket.on("sendId", (data) => {
        myId = data;
        console.log(`my socket ID is: ${myId}`);
    });

    socket.on("currentWorlds", (data) => {
        insertWorldsInSelect(data);
        if (worldSelect.value == "") {
            joinBtn.disabled = true;
        }
    });


    socket.on("newPosistion", (data) => {
        console.log("world id: " + data.worldId);

        //update local world storage
        localWorld = data;
        //render new update
        renderCanvas(localWorld);

    });
}


//----helper functions---
function isEmpty(obj) {
    return Object.keys(obj).length === 0;
}

canvas.onmousemove = function (e) {
    // Get the current mouse position
    let r = canvas.getBoundingClientRect(),
        x = e.clientX - r.left, y = e.clientY - r.top;

    socket.emit("playerMousePos", { x: x, y: y, playerId: myId, worldID: localWorld.worldId });

    hover = false;
    targetEntityId = "";
    if (!isEmpty(localWorld.entities)) {
        for (const key in localWorld.entities) {
            if (x >= localWorld.entities[key].x && x <= localWorld.entities[key].x + localWorld.entities[key].w && y >= localWorld.entities[key].y && y <= localWorld.entities[key].y + localWorld.entities[key].h) {
                hover = true
                targetEntityId = localWorld.entities[key].id;
                console.log(`I FOUND ENTITY: ${localWorld.entities[key].id}`);

                socket.emit("newEntityColor", { worldId: localWorld.worldId, id: localWorld.entities[key].id, color: "green" });
                document.body.style.cursor = "pointer";
                break;
            } else {
                socket.emit("newEntityColor", { worldId: localWorld.worldId, id: localWorld.entities[key].id, color: "gray" }); //local change

                document.body.style.cursor = "default";
            }
        }
    }
}