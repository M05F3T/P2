//initialize connection between server and client
const socket = io();
const ctx = document.getElementById("ctx").getContext("2d");
const form = document.getElementById("name-color-form");
const formMenu = document.getElementById("form-menu");
const spawnBtn = document.getElementById("spawn");


//set canvas size to window size.
ctx.canvas.width = window.innerWidth;
ctx.canvas.height = window.innerHeight;

ctx.font = "30px Arial";


socket.on("newPosistion", (data) => {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    console.log(data);
    for (let i = 0; i < data.entities.length; i++) {
        ctx.beginPath();
        ctx.rect(data.entities[i].x, data.entities[i].y, data.entities[i].height, data.entities[i].width);
        ctx.stroke();   
    }

    for (const key in data.players) {
             //draw green circle
        const radius = 70;
        ctx.beginPath();
        ctx.arc(data.players[key].x, data.players[key].y, 40, 0, 2 * Math.PI);
        ctx.fillStyle = data.players[key].color;
        ctx.fill();
        ctx.lineWidth = 5;
        ctx.strokeStyle = 'black';
        ctx.stroke();

        //draw number untop
        ctx.textAlign = "center";
        ctx.fillStyle = 'black';
        ctx.fillText(data.players[key].name, data.players[key].x, data.players[key].y + 80);

    }
});


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
    }
}