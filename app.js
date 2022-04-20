const settings = require('./js/settings.js');
const objConstructor = require('./js/objConstructors.js');
const worldHandler = require('./js/worldHandler.js');



const express = require('express');


var tinycolor = require("tinycolor2");
const app = express();
const server = require('http').Server(app);

let SOCKET_LIST = {}; //keeps tracks of connected clients



/*  Collision squares conditional
    self.x  < object.x + object.w &&
    self.x + self.w  > object.x &&
    self.y < object.y + object.h &&
    self.h + self.y > object.y
*/


runServer();


function runServer() {

    worldHandler.createDefaultWorlds();

    startExpress(settings.servThisFile, settings.allowAccessTo);

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

    server.listen(settings.PORT);
    console.log("Server started.. " + settings.PORT);

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
            sendWorldUpdate("updateLists",worldHandler.worlds[dataObj.worldId],dataObj.worldId);
            //socket.emit("updateLists", worldHandler.worlds[dataObj.worldId]);
        });

        socket.on("removeSelectedList", (id, listId) => {
            console.log("trying to remove list with id:" + listId);
            console.log(listId);
            
            let tempListCount = 0;
            
            delete worldHandler.worlds[id].lists[listId];
            console.log("Removed list with id: " + listId);

            for (const key in worldHandler.worlds[id].lists) {
                worldHandler.worlds[id].lists[key].x = 50 + tempListCount * 300;
                tempListCount++;
            }

            --worldHandler.worlds[id].listCount;
            sendWorldUpdate("updateLists",worldHandler.worlds[id],id);
            //socket.emit("updateLists", worldHandler.worlds[id]);
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
            worldHandler.deleteEmptyWorlds();

            //sendWorldUpdate("worldUpdate",{},worldId);

            console.log("Player disconnected " + socket.id);
        });
    });
}

function findPlayerWorld(id) {

    for(const world in worldHandler.worlds) {

        for(const player in worldHandler.worlds[world]) {

            if(worldHandler.worlds[world].players[player].id === id) {

                return worldHandler.worlds[world].worldId;

            }
        }
    }

}


function initializeConnection(socket) {
    console.log("Player connected " + socket.id);

    //add connection to socket list
    SOCKET_LIST[socket.id] = socket;

    socket.emit("sendId", socket.id);

    let currentWorlds = worldHandler.listCurrentWorld();

    socket.emit("currentWorlds", currentWorlds)

    return objConstructor.Player(socket.id);
}

function hostServer(data, player, socket) {
    let world = objConstructor.World();

    player.color = data.color;
    player.name = data.name;
    player.myWorldId = world.worldId;
    player.viewIndicatorColor = determineIndicatorColor(data.color);
    //add world to worldHandler.worlds object
    worldHandler.worlds[world.worldId] = world;

    //add player to world
    worldHandler.worlds[world.worldId].players[socket.id] = player;

    //update world before updateing playerjoined
    sendServerData("worldUpdate",worldHandler.worlds[world.worldId]);
    
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
        worldHandler.worlds[data.sessionId].players[socket.id] = player;

        //update world before updateing playerjoined
        sendWorldUpdate("worldUpdate",worldHandler.worlds[data.sessionId],data.sessionId);

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
        if (worldHandler.isEmpty(worldHandler.worlds) === false) {

            for (const world in worldHandler.worlds) {

                for (const key in worldHandler.worlds[world].lists) {
                    worldHandler.worlds[world].lists[key].detect_colision();
                }

                for (const key in worldHandler.worlds[world].players) {

                    worldHandler.worlds[world].players[key].updatePosistion();
                    worldHandler.worlds[world].players[key].detect_colision();

                    for (let i in SOCKET_LIST) {
                        let socket = SOCKET_LIST[i];
                        if (worldHandler.isEmpty(worldHandler.worlds[world].players) === false && worldHandler.worlds[world].players[key].id === socket.id) {

                            yourWorld = worldHandler.worlds[world];
                            socket.emit('worldUpdate', yourWorld);


                        }
                    }

                }
            }

        }

    }, 1000 / 60);
}







function deleteAllEntities(id, socket) {
    if (doesWorldExist(id, socket)) {
        for (const key in worldHandler.worlds[id].entities) {
            delete worldHandler.worlds[id].entities[key];
        }
    } else {
        socket.emit("error", "This world is closed please refresh and select a new world");
    }

}

function spawnElement(id, socket, title, description,w) {
    if (doesWorldExist(id, socket)) {
        let element = objConstructor.Entity(Math.floor(Math.random() * 1000), Math.floor(Math.random() * 1000));

        element.title = title;
        element.description = description;
        element.w = w;

        worldHandler.worlds[id].entities[element.id] = element;

        console.log(element);
    } else {
        socket.emit("error", "This world is closed please refresh and select a new world");
    }
}

function spawnList(id, socket, title) {
    if (worldHandler.worlds[id].listCount <= worldHandler.worlds[id].maxListCount) {
        if (doesWorldExist(id, socket)) {
            let list = objConstructor.List(50 + worldHandler.worlds[id].listCount * 300, 70, title, id);
            worldHandler.worlds[id].lists[list.id] = list;
            console.log("Spawned list with title: " + list.title);
            worldHandler.worlds[id].listCount++;
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
        worldHandler.worlds[data.worldID].players[data.playerId].mousePos.x = data.x;
        worldHandler.worlds[data.worldID].players[data.playerId].mousePos.y = data.y;
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
    for (const world in worldHandler.worlds) {
        for (const key in worldHandler.worlds[world].players) {
            if (worldHandler.worlds[world].players[key].id === socket.id) {
                delete worldHandler.worlds[world].players[key];
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

function doesWorldExist(worldId, socket) {
    for (const world in worldHandler.worlds) {
        if (worldId === worldHandler.worlds[world].worldId) {
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

    for (const key in worldHandler.worlds[worldId].players) {

        for (let i in SOCKET_LIST) {
            let socket = SOCKET_LIST[i];
            if (worldHandler.isEmpty(worldHandler.worlds[worldId].players) === false && worldHandler.worlds[worldId].players[key].id === socket.id) {

                socket.emit(emit,obj);


            }
        }

    }

}

function sendServerData(emit, obj){

        for (const world in worldHandler.worlds) {

            for (const key in worldHandler.worlds[world].players) {

                for (let i in SOCKET_LIST) {
                    let socket = SOCKET_LIST[i];
                    if (worldHandler.isEmpty(worldHandler.worlds[world].players) === false && worldHandler.worlds[world].players[key].id === socket.id) {

                        socket.emit(emit,obj);


                    }
                }

            }
        }

}
