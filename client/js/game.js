//initialize connection between server and client
const socket = io();
const ctx = document.getElementById("ctx").getContext("2d");

//set canvas size to window size.
ctx.canvas.width = window.innerWidth;
ctx.canvas.height = window.innerHeight;

ctx.font = "30px Arial";


socket.on("newPosistion", (data) => {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    for (let i = 0; i < data.length; i++) {

        //draw green circle
        const radius = 70;
        ctx.beginPath();
        ctx.arc(data[i].x, data[i].y, 50, 0, 2 * Math.PI);
        ctx.fillStyle = 'green';
        ctx.fill();
        ctx.lineWidth = 5;
        ctx.strokeStyle = '#003300';
        ctx.stroke();

        //draw number untop
        ctx.fillStyle = 'black';
        ctx.fillText(data[i].number, data[i].x - 10, data[i].y + 10);

    }


});


document.onkeydown = (event) => {
    if (event.key === 'd') {
        socket.emit('keyPress', {
            inputId: 'right',
            state: true
        })
    } else if (event.key === 's') {
        socket.emit('keyPress', {
            inputId: 'down',
            state: true
        })
    } else if (event.key === 'a') {
        socket.emit('keyPress', {
            inputId: 'left',
            state: true
        })
    } else if (event.key === 'w') {
        socket.emit('keyPress', {
            inputId: 'up',
            state: true
        })
    }
}

document.onkeyup = (event) => {
    if (event.key === 'd') {
        socket.emit('keyPress', {
            inputId: 'right',
            state: false
        })
    } else if (event.key === 's') {
        socket.emit('keyPress', {
            inputId: 'down',
            state: false
        })
    } else if (event.key === 'a') {
        socket.emit('keyPress', {
            inputId: 'left',
            state: false
        })
    } else if (event.key === 'w') {
        socket.emit('keyPress', {
            inputId: 'up',
            state: false
        })
    }
}