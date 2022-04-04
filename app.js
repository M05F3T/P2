const express = require('express');
const { v4: idGenerator } = require("uuid");
const app = express();
const server = require('http').Server(app);


//Global variables
const PORT = 4200;
const defaultWorldsActive = false; //default worlds with no active players wont be deleted.   
const servThisFile = '/client/index.html'
const allowAccessTo = '/client'

let SOCKET_LIST = {}; //keeps tracks of connected clients
let worlds = {} //holds data on all current worlds

//Object constructors

let Player = (id, color, name) => {
    let self = {
        x: 250,
        y: 250,
        w: 50,
        h: 50,
        id: id,
        mousePos: { x: 0, y: 0 },
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

let Entity = (posX, posY, id) => {
    let self = {
        x: posX,
        y: posY,
        h: 150,
        w: 150,
        id: idGenerator(),
        color: "gray"
    }
    return self;
}

let World = () => {
    let self = {
        worldId: idGenerator(),
        name: "This is the world name",
        players: {

        },
        entities: {

        }
    }

    return self;
}

runServer();


function runServer() {

    createDefaultWorlds();

    startExpress(servThisFile, allowAccessTo);

    startClientUpdates();

    startGameLoop();
}

function startExpress(filePath, directoryPath) {
    // in case user tries to get "http://www.hostwebsite.com/" we send index.html
    app.get('/', function (req, res) {
        res.sendFile(__dirname + filePath);
    });

    //User can accses all files in /client (ex: http://www.hostwebsite.com/client/img.jpg)
    app.use('/client', express.static(__dirname + directoryPath));

    server.listen(PORT);
    console.log("Server started.. " + PORT);

}

function startClientUpdates() {
    const io = require('socket.io')(server, {});

    io.sockets.on('connection', (socket) => {

        let player = initializeConnection(socket);

        socket.on('join', (data) => {
            if (data.host === true) {
                hostServer(data, player, socket);
            } else if (data.host === false) {
                joinServer(data, player, socket);
            }
        });

        socket.on('clear', (id) => {
            deleteAllEntities(id, socket);
        });

        socket.on('spawnElement', (id) => {
            spawnElement(id, socket);
        });

        socket.on("playerMousePos", (data) => {
            updateMousePos(data, socket);
        });

        socket.on('keyPress', (data) => {
            updateKeyState(data, socket, player);
        });

        socket.on('disconnect', () => {

            removePlayer(socket);
            //check if no players is present and delete world if empty
            deleteEmptyWorlds();

            console.log("Player disconnected " + socket.id);
        });
    });
}

function initializeConnection(socket) {
    console.log("Player connected " + socket.id);

    //add connection to socket list
    SOCKET_LIST[socket.id] = socket;

    socket.emit("sendId", socket.id);

    let currentWorlds = listCurrentWorld();

    socket.emit("currentWorlds", currentWorlds)

    return Player(socket.id);
}

function hostServer(data, player, socket) {

    let world = World();

    player.color = data.color;
    player.name = data.name;
    player.myWorldId = world.worldId;

    //add world to worlds object
    worlds[world.worldId] = world;

    //add player to world
    worlds[world.worldId].players[socket.id] = player;

    //sendInitWorld(socket, worlds[world.worldId]);



    console.log(`player: ${player.name} => created world: ${world.worldId}`);
}

function joinServer(data, player, socket) {
    if (doesWorldExist(data.sessionId)) {
        player.color = data.color;
        player.name = data.name;
        player.myWorldId = data.sessionId;

        //check for valid session id HERE

        //add player to world
        worlds[data.sessionId].players[socket.id] = player;

        console.log(`player: ${player.name} => joined world: ${data.sessionId}`);
    } else {
        socket.emit("error", "This world is closed please refresh and select a new world");
    }


}

function startGameLoop() {
    setInterval(() => {
        if (isEmpty(worlds) === false) {

            for (const world in worlds) {

                for (const key in worlds[world].players) {

                    worlds[world].players[key].updatePosistion();
                    worlds[world].players[key].detect_colision();


                    for (let i in SOCKET_LIST) {
                        let socket = SOCKET_LIST[i];
                        if (isEmpty(worlds[world].players) === false && worlds[world].players[key].id === socket.id) {

                            yourWorld = worlds[world];
                            socket.emit('worldUpdate', yourWorld);


                        }
                    }

                }
            }

        }

    }, 1000 / 60);
}

function createDefaultWorlds() {
    if (defaultWorldsActive) {
        let defaultWorld = World();
        defaultWorld.name = "Default World";
        worlds[defaultWorld.worldId] = defaultWorld;
    }
}

function listCurrentWorld() {
    let list = { };

    for (const world in worlds) {
        list[worlds[world].worldId] = worlds[world].worldId;
    }

    return list;
}

function deleteEmptyWorlds() {
    for (const world in worlds) {
        if (isEmpty(worlds[world].players) && worlds[world].name !== "Default World") {
            delete worlds[world];
        }
    }
}

function deleteAllEntities(id, socket) {
    if (doesWorldExist(id, socket)) {
        for (const key in worlds[id].entities) {
            delete worlds[id].entities[key];
        }
    } else {
        socket.emit("error", "This world is closed please refresh and select a new world");
    }

}

function spawnElement(id, socket) {
    if (doesWorldExist(id, socket)) {
        let element = Entity(Math.floor(Math.random() * 1000), Math.floor(Math.random() * 1000));
        worlds[id].entities[element.id] = element;
    } else {
        socket.emit("error", "This world is closed please refresh and select a new world");
    }
}

function updateMousePos(data, socket) {
    if (doesWorldExist(data.worldID, socket)) {
        worlds[data.worldID].players[data.playerId].mousePos.x = data.x;
        worlds[data.worldID].players[data.playerId].mousePos.y = data.y;
    }
}

function updateKeyState(data, socket, player) {
    if (doesWorldExist(data.worldId)) {
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
    } else {
        socket.emit("error", "This world is closed please refresh and select a new world");
    }
}

function removePlayer(socket) {
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
}

function isEmpty(obj) {
    return Object.keys(obj).length === 0;
}

function doesWorldExist(worldId, socket) {
    for (const world in worlds) {
        if (worldId === worlds[world].worldId) {
            return true;
        }
        else {
            return false;
        }
    }

    /*
    The for loop has bad time complexity maybe one of these methods work better?

    how to check if object exists in javascript
    if (typeof maybeObject != "undefined") {
        alert("GOT THERE");
    }
    check if field exists in object javascript
    if ('field' in obj) {

    }

    */

}
