//initialize connection between server and client
const socket = io();
const ctx = document.getElementById("ctx").getContext("2d");
ctx.font = "30px Arial";


socket.on("newPosistion", (data) => {
    ctx.clearRect(0, 0, 500, 500);
    for (let i = 0; i < data.length; i++) {
        ctx.fillText(data[i].number, data[i].x, data[i].y);
    }


});


document.onkeydown = (event) => {
    if (event.keyCode === 68) //d 
    {
        socket.emit('keyPress', {
            inputId: 'right',
            state: true
        })
    } else if (event.keyCode === 83) //s 
    {
        socket.emit('keyPress', {
            inputId: 'down',
            state: true
        })
    } else if (event.keyCode === 65) //a
    {
        socket.emit('keyPress', {
            inputId: 'left',
            state: true
        })
    } else if (event.keyCode === 87) //d 
    {
        socket.emit('keyPress', {
            inputId: 'up',
            state: true
        })
    }
}

document.onkeyup = (event) => {
    if (event.keyCode === 68) //d 
    {
        socket.emit('keyPress', {
            inputId: 'right',
            state: false
        })
    } else if (event.keyCode === 83) //s 
    {
        socket.emit('keyPress', {
            inputId: 'down',
            state: false
        })
    } else if (event.keyCode === 65) //a
    {
        socket.emit('keyPress', {
            inputId: 'left',
            state: false
        })
    } else if (event.keyCode === 87) //d 
    {
        socket.emit('keyPress', {
            inputId: 'up',
            state: false
        })
    }
}