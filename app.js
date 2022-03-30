const express = require('express');
const app = express();
const server = require('http').Server(app);
const PORT = 3000;

// in case user tries to get "Danielsejersen.com/" we send index.html
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/client/index.html');
});

//User can accses all files in /client (ex: Danielsejersen.com/client/img.jpg)
app.use('/client', express.static(__dirname + '/client'));

server.listen(PORT);
console.log("Server started.. " + PORT);


let SOCKET_LIST = {};
let ID_COUNTER = 0;
let WORLD_ID_COUNTER = 0;

let worlds = {}


let World = () => {
    let self = {
        worldId: generateWorldId(),
        players: {

        },
        entities: {

        }
    }

    return self;
}

let Element = (posX, posY, id) => {
    let self = {
        x: posX,
        y: posY,
        h: 150,
        w: 150,
        id: generateEntityId(),
        color: "gray"
    }
    return self;
}

function generateWorldId() {
    return ++WORLD_ID_COUNTER;
}

function generateEntityId() {
    return ++ID_COUNTER;
}


let Player = (id, color, name) => {
    let self = {
        x: 250,
        y: 250,
        w: 50,
        h: 50,
        id: id,
        number: "" + Math.floor(Math.random() * 10),
        color: color,
        name: name,
        myWorldId: 0,
        isColliding: false,
        canPickUp: true,
        pickUpKeyPressed: false,
        connectedEntity: {},
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
            self.y -= self.maxSpd * 0.75; //up
            self.x += self.maxSpd * 0.75; //right
        }
        if (self.pressingRight && self.pressingDown) {
            self.x += self.maxSpd * 0.75; // right
            self.y += self.maxSpd * 0.75; //down
        }
        if (self.pressingDown && self.pressingLeft) {
            self.x -= self.maxSpd * 0.75; //left
            self.y += self.maxSpd * 0.75; //down
        }
        if (self.pressingLeft && self.pressingUp) {
            self.x -= self.maxSpd * 0.75; //left
            self.y -= self.maxSpd * 0.75; //up
        }

        if (isEmpty(self.connectedEntity) === false && self.pickUpKeyPressed === true && self.canPickUp === false) {
            self.connectToWorld();

            setTimeout(() => {
                self.canPickUp = true;
            }, 500)


        }

        if (!(isEmpty(self.connectedEntity))) {
            self.connectedEntity.x = (self.x - self.connectedEntity.w / 2);
            self.connectedEntity.y = (self.y - self.connectedEntity.h / 2) - 110;
        }

    }
    self.detect_colision = () => {
        for (const key in worlds[self.myWorldId].entities) {
            let object = worlds[self.myWorldId].entities[key];
            if ((self.x - self.w / 2) < object.x + object.w &&
                (self.x - self.w / 2) + self.w > object.x &&
                (self.y - self.h / 2) < object.y + object.h &&
                self.h + (self.y - self.h / 2) > object.y) {


                //console.log(`COLISSION: player: ${self.id} and ${object.id}`)

                self.isColliding = true;


                //pick up element
                if (self.pickUpKeyPressed === true && self.canPickUp === true && isEmpty(self.connectedEntity)) {

                    self.connectToPlayer(object);
                    setTimeout(() => {
                        self.canPickUp = false;
                    }, 500)

                }


            } else {
                setTimeout(() => {
                    self.isColliding = false;
                }, 200);

            }
        }
    }
    self.connectToWorld = () => {
        worlds[self.myWorldId].entities[self.connectedEntity.id] = self.connectedEntity;
        console.log(`player: ${self.id} placed an entity: ${self.connectedEntity.id}`);
        self.connectedEntity = {};
    }
    self.connectToPlayer = (entity) => {
        self.connectedEntity = entity;
        console.log(`player: ${self.id} connected an entity: ${self.connectedEntity.id}`);
        delete worlds[self.myWorldId].entities[entity.id];
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

    socket.emit("sendId", socket.id);

    let currentWorlds = listCurrentWorld();

    socket.emit("currentWorlds", currentWorlds)

    socket.on('join', (data) => {

        if (data.host === true) {
            player.color = data.color;
            player.name = data.name;

            let world = World();
            player.myWorldId = world.worldId;
            worlds[world.worldId] = world;
            worlds[world.worldId].players[socket.id] = player;
            console.log(`player ${player.name} created world ${world.worldId}`);
        } else if (data.host === false) {

            player.color = data.color;
            player.name = data.name;
            player.myWorldId = data.sessionId;
            //check for valid session id
            worlds[data.sessionId].players[socket.id] = player;
            console.log(`player ${player.name} joined world ${data.sessionId}`);
        }



    })

    socket.on('clear', (id) => {
        deleteAllEntities(id);
    });

    socket.on('spawnElement', (id) => {
        let element = Element(Math.floor(Math.random() * 1000), Math.floor(Math.random() * 1000));
        worlds[id].entities[element.id] = element;
    });

    socket.on('newEntityColor', (data) => {
        if (!(isEmpty(worlds[data.worldId].entities))) {


            //THERE IS BUG HERE it tries to change color of picked up object sometimes resolveing in crash
            try {
                worlds[data.worldId].entities[data.id].color = data.color;
            }
            catch {
                console.log("tried to change color of picked up object");
            }


        }

    });

    socket.on('keyPress', (data) => {
        if (data.inputId === "left") {
            player.pressingLeft = data.state;
        } else if (data.inputId === "right") {
            player.pressingRight = data.state;
        } else if (data.inputId === "up") {
            player.pressingUp = data.state;
        } else if (data.inputId === "down") {
            player.pressingDown = data.state;
        } else if (data.inputId === "pickUpKeyPressed") {
            player.pickUpKeyPressed = data.state;
        }
    });


    socket.on('disconnect', () => {
        //remove disconnected person
        delete SOCKET_LIST[socket.id];
        //delete PLAYER_LIST[socket.id];

        //delete player from world
        for (const world in worlds) {
            for (const key in worlds[world].players) {
                if (worlds[world].players[key].id === socket.id) {
                    delete worlds[world].players[key];
                }
            }
        }

        //check if no players is present and delete world if empty maybe???
        deleteEmptyWorlds();
        //delete world.players[socket.id];
        console.log("Player disconnected " + socket.id);
    });
});

setInterval(() => {
    if (isEmpty(worlds) == false) {

        for (const world in worlds) {

            for (const key in worlds[world].players) {

                worlds[world].players[key].updatePosistion();
                worlds[world].players[key].detect_colision();


                for (let i in SOCKET_LIST) {
                    let socket = SOCKET_LIST[i];
                    if (isEmpty(worlds[world].players) === false && worlds[world].players[key].id === socket.id) {

                        yourWorld = worlds[world];
                        socket.emit('newPosistion', yourWorld);

                    }
                }

            }
        }

    }


}, 1000 / 60);


function listCurrentWorld() {
    let list = {};

    for (const world in worlds) {
        list[worlds[world].worldId] = worlds[world].worldId;
    }

    return list;
}

function deleteEmptyWorlds() {
    for (const world in worlds) {
        if (isEmpty(worlds[world].players)) {
            delete worlds[world];
        }
    }
}

function deleteAllEntities(id) {
    for (const key in worlds[id].entities) {
        delete worlds[id].entities[key];
    }
}

function isEmpty(obj) {
    return Object.keys(obj).length === 0;
}
