const express = require('express');
const { v4: idGenerator } = require("uuid");
var { nanoid } = require("nanoid");
var tinycolor = require("tinycolor2");
const app = express();
const server = require('http').Server(app);



//Global variables
const PORT = 3000;
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
        viewIndicatorColor: "#000000", //black by default
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
        h: 65,
        w: 0,
        id: idGenerator(),
        title: "",
        description: "",
        color: "gray"
    }
    return self;
}

let World = () => {
    let self = {
        worldId: nanoid(6),
        name: "This is the world name",
        listCount: 0,
        maxListCount: 5 - 1,
        players: {

        },
        entities: {

        },
        lists: {

        },
    }

    return self;
}

let List = (posX, posY, title, myWorldId) => {
    let self = {
        x: posX,
        y: posY,
        w: 200,
        h: 300,
        id: idGenerator(),
        myWorldId: myWorldId,
        color: "gray",
        title: title,
        containedIdeas: {}
    };
    self.detect_colision = () => {
        for (const key in worlds[self.myWorldId].entities) {
            let object = worlds[self.myWorldId].entities[key];
            if (
                self.x  < object.x + object.w &&
                self.x + self.w  > object.x &&
                self.y < object.y + object.h &&
                self.h + self.y > object.y
            ) {
                console.log(`COLISSION: list: ${self.title} and ${object.id}`)
                self.connectToList(object);
            } else {
                console.log("ingen collision")
            }
        }
    };
    self.connectToList = (idea) => {
        self.containedIdeas[idea.id] = idea;
        console.log(
            `list: ${self.id} connected an idea: ${self.containedIdeas[idea.id]}`
        );
        delete worlds[self.myWorldId].entities[idea.id];
    };
    return self;
};

/*  Collision squares conditional
    self.x  < object.x + object.w &&
    self.x + self.w  > object.x &&
    self.y < object.y + object.h &&
    self.h + self.y > object.y
*/


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

        socket.on('spawnElement', (dataObj) => {
            spawnElement(dataObj.worldId, socket,dataObj.ideaName,dataObj.ideaDescription,dataObj.width);
        });

        socket.on("spawnList", (dataObj) => {
            spawnList(dataObj.worldId, socket, dataObj.listName);
            socket.emit("updateLists", worlds[dataObj.worldId]);
        });

        socket.on("removeSelectedList", (id, listId) => {
            console.log("trying to remove list with id:" + listId);
            console.log(listId);
            
            let tempListCount = 0;
            
            delete worlds[id].lists[listId];
            console.log("Removed list with id: " + listId);

            for (const key in worlds[id].lists) {
                worlds[id].lists[key].x = 50 + tempListCount * 300;
                tempListCount++;
            }

            --worlds[id].listCount;
            socket.emit("updateLists", worlds[id]);
        });

        socket.on("playerMousePos", (data) => {
            updateMousePos(data, socket);
        });

        socket.on('keyPress', (data) => {
            updateKeyState(data, socket, player);
        });

        socket.on('disconnect', () => {

            //let worldId = findPlayerWorld(socket.id);

            removePlayer(socket);
            //check if no players is present and delete world if empty
            deleteEmptyWorlds();

            //sendWorldUpdate("worldUpdate",{},worldId);

            console.log("Player disconnected " + socket.id);
        });
    });
}

function findPlayerWorld(id) {

    for(const world in worlds) {

        for(const player in worlds[world]) {

            if(worlds[world].players[player].id === id) {

                return worlds[world].worldId;

            }
        }
    }

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
    player.viewIndicatorColor = determineIndicatorColor(data.color);
    //add world to worlds object
    worlds[world.worldId] = world;

    //add player to world
    worlds[world.worldId].players[socket.id] = player;

    //update world before updateing playerjoined
    sendServerData("worldUpdate",worlds[world.worldId]);
    
    sendWorldUpdate("newPlayerJoined",{},world.worldId);

    

    //Send world id to client
    socket.emit("worldId", world.worldId);

    console.log(`player: ${player.name} => created world: ${world.worldId}`);
}

function joinServer(data, player, socket) {
    if (doesWorldExist(data.sessionId)) {
        player.color = data.color;
        player.name = data.name;
        player.myWorldId = data.sessionId;
        player.viewIndicatorColor = determineIndicatorColor(data.color);

        //check for valid session id HERE

        //add player to world
        worlds[data.sessionId].players[socket.id] = player;

        //update world before updateing playerjoined
        sendWorldUpdate("worldUpdate",worlds[data.sessionId],data.sessionId);

        sendWorldUpdate("newPlayerJoined",{},data.sessionId);
        

        //Send world id to client
        socket.emit("worldId", data.sessionId);

        console.log(`player: ${player.name} => joined world: ${data.sessionId}`);
    } else {
        socket.emit("error", "This world is closed please refresh and select a new world");
    }


}

function startGameLoop() {
    setInterval(() => {
        if (isEmpty(worlds) === false) {

            for (const world in worlds) {

                for (const key in worlds[world].lists) {
                    worlds[world].lists[key].detect_colision();
                }

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

function spawnElement(id, socket, title, description,w) {
    if (doesWorldExist(id, socket)) {
        let element = Entity(Math.floor(Math.random() * 1000), Math.floor(Math.random() * 1000));

        element.title = title;
        element.description = description;
        element.w = w;

        worlds[id].entities[element.id] = element;

        console.log(element);
    } else {
        socket.emit("error", "This world is closed please refresh and select a new world");
    }
}

function spawnList(id, socket, title) {
    if (worlds[id].listCount <= worlds[id].maxListCount) {
        if (doesWorldExist(id, socket)) {
            let list = List(50 + worlds[id].listCount * 300, 70, title, id);
            worlds[id].lists[list.id] = list;
            console.log("Spawned list with title: " + list.title);
            worlds[id].listCount++;
        } else {
            socket.emit(
                "error",
                "This world is closed please refresh and select a new world"
            );
        }
    } else {
        socket.emit(
            "error",
            "Reached max of 5 lists"
        );
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

function determineIndicatorColor(colorHex) {
    var color1 = tinycolor(colorHex);
    if(color1.getBrightness() > 128){ //get brightness returns value between 0 - 255 with 0 being darkest
        return "#000" //return black
    }
    else {
        return "#fff"   //return white
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
    }
    return false;

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

function sendWorldUpdate(emit, obj,worldId) {

    for (const key in worlds[worldId].players) {

        for (let i in SOCKET_LIST) {
            let socket = SOCKET_LIST[i];
            if (isEmpty(worlds[worldId].players) === false && worlds[worldId].players[key].id === socket.id) {

                socket.emit(emit,obj);


            }
        }

    }

}

function sendServerData(emit, obj){

        for (const world in worlds) {

            for (const key in worlds[world].players) {

                for (let i in SOCKET_LIST) {
                    let socket = SOCKET_LIST[i];
                    if (isEmpty(worlds[world].players) === false && worlds[world].players[key].id === socket.id) {

                        socket.emit(emit,obj);


                    }
                }

            }
        }

}
