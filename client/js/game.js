//initialize connection between server and client
const socket = io();
const canvas = document.getElementById("ctx");
const ctx = document.getElementById("ctx").getContext("2d");
const form = document.getElementById("name-color-form");
const formMenu = document.getElementById("form-menu");
const spawnBtn = document.getElementById("spawn");







let myId;
let localWorld;

getServerData();
sendClientData();




function drawElements(data) {
    for (const key in data.entities) {
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.rect(data.entities[key].x, data.entities[key].y, data.entities[key].h, data.entities[key].w);
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

        //draw name
        ctx.font = "30px Arial";
        ctx.textAlign = "center";
        ctx.fillStyle = "black";
        ctx.fillText(data.players[key].name, data.players[key].x, data.players[key].y + 65)

        //draw picked up entity
        if (isEmpty(data.players[key].connectedEntity) === false) {
            ctx.beginPath();
            ctx.rect(data.players[key].connectedEntity.x, data.players[key].connectedEntity.y, data.players[key].connectedEntity.h, data.players[key].connectedEntity.w);
            ctx.stroke();
        }

    }
}

function renderCanvas() {
    //set canvas size to window size.
    ctx.canvas.width = window.innerWidth;
    ctx.canvas.height = window.innerHeight;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    drawElements(localWorld);
    drawPlayers(localWorld);
    drawPickUpToolTip(localWorld);
}

function sendClientData() {

    spawnBtn.addEventListener("click", (e) => {
        socket.emit("spawnElement");
    });

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        let name = form.elements['name'].value;
        let color = form.elements["color"].value;
        formMenu.style = "display: none;";
        socket.emit("submit-form", {
            name: name,
            color: color,
        })
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

    socket.on("newPosistion", (data) => {

        //update local world storage
        localWorld = data;
        //render new update
        renderCanvas();
    });
}


//----helper functions---
function isEmpty(obj) {
    return Object.keys(obj).length === 0;
}

canvas.onmousemove = function (e) {
    // Get the current mouse position
    var r = canvas.getBoundingClientRect(),
        x = e.clientX - r.left, y = e.clientY - r.top;
    hover = false;
    if (!isEmpty(localWorld.entities)) {
        for (const key in localWorld.entities) {
            if (x >= localWorld.entities[key].x && x <= localWorld.entities[key].x + localWorld.entities[key].w && y >= localWorld.entities[key].y && y <= localWorld.entities[key].y + localWorld.entities[key].h) {
                hover = true
                console.log(`I FOUND ENTITY: ${localWorld.entities[key].id}`);
                break;
            }
        }
    }
}