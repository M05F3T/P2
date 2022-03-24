const express = require('express');
const app = express();
const server = require('http').Server(app);
const PORT = 3000;

// in case user tries to get "Danielsejersen.com/" we send index.html
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/client/index.html');
});

//User can accses all files in /client (ex: Danielsejersen.com/client/img.jpg)
app.use('/client', express.static(__dirname + '/client'));

server.listen(PORT);
console.log("Server started.. " + PORT);


let SOCKET_LIST = {};
let PLAYER_LIST = {};

let Player = (id) => {
    let self = {
        x: 250,
        y: 250,
        id: id,
        number: "" + Math.floor(Math.random() * 10),
        pressingRight: false,
        pressingLeft: false,
        pressingUp: false,
        pressingDown: false,
        maxSpd: 10,
    }
    self.updatePosistion = () => {
        //move oneway
        if (self.pressingRight && !self.pressingLeft && !self.pressingUp && !self.pressingDown) {
            self.x += self.maxSpd;
        }
        if (self.pressingLeft && !self.pressingRight && !self.pressingUp && !self.pressingDown) {
            self.x -= self.maxSpd;
        }
        if (self.pressingUp && !self.pressingRight && !self.pressingLeft && !self.pressingDown) {
            self.y -= self.maxSpd;
        }
        if (self.pressingDown && !self.pressingRight && !self.pressingUp && !self.pressingLeft) {
            self.y += self.maxSpd;
        }

        //move sideways
        if (self.pressingRight && self.pressingUp) {
            self.y -= self.maxSpd; //up
            self.x += self.maxSpd; //right
        }
        if (self.pressingRight && self.pressingDown) {
            self.x += self.maxSpd; // right
            self.y += self.maxSpd; //down
        }
        if (self.pressingDown && self.pressingLeft) {
            self.x -= self.maxSpd; //left
            self.y += self.maxSpd; //down
        }
        if (self.pressingLeft && self.pressingUp) {
            self.x -= self.maxSpd; //left
            self.y -= self.maxSpd; //up
        }

    }

    return self;
}



const io = require('socket.io')(server, {});

io.sockets.on('connection', (socket) => {
    console.log("Player connected " + socket.id);

    //add connection to socket list
    SOCKET_LIST[socket.id] = socket;

    //create new player and add to player list
    let player = Player(socket.id);
    PLAYER_LIST[socket.id] = player;

    socket.on('keyPress', (data) => {
        if (data.inputId === "left") {
            player.pressingLeft = data.state;
        } else if (data.inputId === "right") {
            player.pressingRight = data.state;
        } else if (data.inputId === "up") {
            player.pressingUp = data.state;
        } else if (data.inputId === "down") {
            player.pressingDown = data.state;
        }
    });


    socket.on('disconnect', () => {
        //remove disconnected person
        delete SOCKET_LIST[socket.id];
        delete PLAYER_LIST[socket.id];
        console.log("Player disconnected " + socket.id);
    });
});

setInterval(() => {
    let pack = [];

    for (let i in PLAYER_LIST) {
        let player = PLAYER_LIST[i];
        player.updatePosistion();
        pack.push({
            x: player.x,
            y: player.y,
            number: player.number
        });
    }

    for (let i in SOCKET_LIST) {
        let socket = SOCKET_LIST[i];
        socket.emit('newPosistion', pack);
    }





}, 1000 / 60);;