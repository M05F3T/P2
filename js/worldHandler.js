const settings = require('./settings.js');
const objConstructor = require('./objConstructors.js');


var tinycolor = require("tinycolor2");

let worlds = {} //holds data on all current worlds
let SOCKET_LIST = {}; //keeps tracks of connected clients

function createDefaultWorlds() {
    if (settings.defaultWorldsActive) {
        let defaultWorld = objConstructor.World();
        defaultWorld.name = "Default World";
        worlds[defaultWorld.worldId] = defaultWorld;
    }
}

function listCurrentWorld() {
    let list = {};

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

function sendServerData(emit, obj) {

    for (const world in worlds) {

        for (const key in worlds[world].players) {

            for (let i in SOCKET_LIST) {
                let socket = SOCKET_LIST[i];
                if (isEmpty(worlds[world].players) === false && worlds[world].players[key].id === socket.id) {

                    socket.emit(emit, obj);


                }
            }

        }
    }

}

function sendWorldUpdate(emit, obj, worldId) {

    for (const key in worlds[worldId].players) {

        for (let i in SOCKET_LIST) {
            let socket = SOCKET_LIST[i];
            if (isEmpty(worlds[worldId].players) === false && worlds[worldId].players[key].id === socket.id) {

                socket.emit(emit, obj);


            }
        }

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

function updateMousePos(data, socket) {
    if (doesWorldExist(data.worldID, socket)) {
        worlds[data.worldID].players[data.playerId].mousePos.x = data.x;
        worlds[data.worldID].players[data.playerId].mousePos.y = data.y;
    }
}

function isEmpty(obj) {
    return Object.keys(obj).length === 0;
}

function determineIndicatorColor(colorHex) {
    var color1 = tinycolor(colorHex);
    if (color1.getBrightness() > 128) { //get brightness returns value between 0 - 255 with 0 being darkest
        return "#000" //return black
    }
    else {
        return "#fff"   //return white
    }
}

function initializeConnection(socket) {
    console.log("Player connected " + socket.id);

    //add connection to socket list
    SOCKET_LIST[socket.id] = socket;

    socket.emit("sendId", socket.id);

    let currentWorlds = listCurrentWorld();

    socket.emit("currentWorlds", currentWorlds)

    return objConstructor.Player(socket.id);
}

function hostServer(data, player, socket) {
    let world = objConstructor.World();

    player.color = data.color;
    player.name = data.name;
    player.myWorldId = world.worldId;
    player.viewIndicatorColor = determineIndicatorColor(data.color);
    //add world to worlds object
    worlds[world.worldId] = world;

    //add player to world
    worlds[world.worldId].players[socket.id] = player;

    //update world before updateing playerjoined
    sendServerData("worldUpdate", worlds[world.worldId]);

    sendWorldUpdate("newPlayerJoined", {}, world.worldId);



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
        sendWorldUpdate("worldUpdate", worlds[data.sessionId], data.sessionId);

        sendWorldUpdate("newPlayerJoined", {}, data.sessionId);


        //Send world id to client
        socket.emit("worldId", data.sessionId);

        console.log(`player: ${player.name} => joined world: ${data.sessionId}`);
    } else {
        socket.emit("error", "This world is closed please refresh and select a new world");
    }


}

function spawnElement(id, socket, title, description, w) {
    if (doesWorldExist(id, socket)) {
        let element = objConstructor.Entity(Math.floor(Math.random() * 1000), Math.floor(Math.random() * 1000));

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
            let list = objConstructor.List(50 + worlds[id].listCount * 300, 70, title, id);
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

function startGameLoop() {
    setInterval(() => {
        if (isEmpty(worlds) === false) {

            for (const world in worlds) {

                for (const key in worlds[world].lists) {
                    detect_list_colision(worlds[world].lists[key]);
                }

                for (const key in worlds[world].players) {

                    updatePosistion(worlds[world].players[key]);
                    detect_player_colision(worlds[world].players[key]);

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


function detect_colision(x1,y1,w1,h1,x2,y2,w2,h2){
    //af en eller anden grund er den her anderledes fra collision detection på lister. kan ikke få den til at virke ens plz investigate. 
    if((x1 - w1 / 2) < x2 + w2 &&
    (x1 - w1 / 2) + w1 > x2 &&
    (y1 - h1 / 2) < y2 + h2 && 
    h1 + (y1 - h1 / 2) > y2) {
        return true
    } else {
        return false
    }
}

/*PLAYER LOGIC */

function updatePosistion(playerObj) {
    //move oneway


    if (playerObj.pressingRight && !playerObj.pressingLeft && !playerObj.pressingUp && !playerObj.pressingDown) {
        playerObj.x += playerObj.maxSpd;
    }
    if (playerObj.pressingLeft && !playerObj.pressingRight && !playerObj.pressingUp && !playerObj.pressingDown) {
        playerObj.x -= playerObj.maxSpd;
    }
    if (playerObj.pressingUp && !playerObj.pressingRight && !playerObj.pressingLeft && !playerObj.pressingDown) {
        playerObj.y -= playerObj.maxSpd;
    }
    if (playerObj.pressingDown && !playerObj.pressingRight && !playerObj.pressingUp && !playerObj.pressingLeft) {
        playerObj.y += playerObj.maxSpd;
    }

    //move sideways
    if (playerObj.pressingRight && playerObj.pressingUp) {
        playerObj.y -= playerObj.maxSpd * 0.75; //up
        playerObj.x += playerObj.maxSpd * 0.75; //right
    }
    if (playerObj.pressingRight && playerObj.pressingDown) {
        playerObj.x += playerObj.maxSpd * 0.75; // right
        playerObj.y += playerObj.maxSpd * 0.75; //down
    }
    if (playerObj.pressingDown && playerObj.pressingLeft) {
        playerObj.x -= playerObj.maxSpd * 0.75; //left
        playerObj.y += playerObj.maxSpd * 0.75; //down
    }
    if (playerObj.pressingLeft && playerObj.pressingUp) {
        playerObj.x -= playerObj.maxSpd * 0.75; //left
        playerObj.y -= playerObj.maxSpd * 0.75; //up
    }

    if (isEmpty(playerObj.connectedEntity) === false && playerObj.pickUpKeyPressed === true && playerObj.canPickUp === false) {
        connectToWorld(playerObj);

        setTimeout(() => {
            playerObj.canPickUp = true;
        }, 500)


    }

    if (!(isEmpty(playerObj.connectedEntity))) {
        playerObj.connectedEntity.x = (playerObj.x - playerObj.connectedEntity.w / 2);
        playerObj.connectedEntity.y = (playerObj.y - playerObj.connectedEntity.h / 2) - 110;
    }

}

function detect_player_colision(playerObj) {
    for (const key in worlds[playerObj.myWorldId].entities) {
        let object = worlds[playerObj.myWorldId].entities[key];
        
        if (detect_colision(playerObj.x,playerObj.y,playerObj.w,playerObj.h,object.x,object.y,object.w,object.h)) {
            //console.log(`COLISSION: player: ${playerObj.id} and ${object.id}`)

            playerObj.isColliding = true;


            //pick up element
            if (playerObj.pickUpKeyPressed === true && playerObj.canPickUp === true && isEmpty(playerObj.connectedEntity)) {

                connectToPlayer(playerObj, object);
                setTimeout(() => {
                    playerObj.canPickUp = false;
                }, 500)

            }


        } else {
            setTimeout(() => {
                playerObj.isColliding = false;
            }, 200);

        }
    }
}

function connectToWorld(playerObj) {
    worlds[playerObj.myWorldId].entities[playerObj.connectedEntity.id] = playerObj.connectedEntity;
    console.log(`player: ${playerObj.id} placed an entity: ${playerObj.connectedEntity.id}`);
    playerObj.connectedEntity = {};
}

function connectToPlayer(playerObj, entity) {
    playerObj.connectedEntity = entity;
    console.log(`player: ${playerObj.id} connected an entity: ${playerObj.connectedEntity.id}`);
    delete worlds[playerObj.myWorldId].entities[entity.id];
}

/*LIST LOGIC*/

function connectToList(listObj, idea) {
    listObj.containedIdeas[idea.id] = idea;
    console.log(
        `list: ${listObj.id} connected an idea: ${listObj.containedIdeas[idea.id]}`
    );
    delete worlds[listObj.myWorldId].entities[idea.id];
};

function detect_list_colision(listObj) {
    for (const key in worlds[listObj.myWorldId].entities) {
        let object = worlds[listObj.myWorldId].entities[key];
        if (
            listObj.x < object.x + object.w &&
            listObj.x + listObj.w > object.x &&
            listObj.y < object.y + object.h &&
            listObj.h + listObj.y > object.y
        ) {
            connectToList(listObj, object);
        }
    }
};



module.exports = { worlds, SOCKET_LIST, startGameLoop, spawnList, spawnElement, initializeConnection, hostServer, joinServer, determineIndicatorColor, removePlayer, sendWorldUpdate, sendServerData, createDefaultWorlds, isEmpty, listCurrentWorld, deleteEmptyWorlds, doesWorldExist, updateKeyState, updateMousePos, deleteAllEntities };