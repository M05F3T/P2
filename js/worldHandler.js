const settings = require('./settings.js');
const objConstructor = require('./objConstructors.js');
const trelloApi = require('./trelloApi.js');
const dataLogger = require('./dataLogger.js');


var tinycolor = require("tinycolor2");

let worlds = {} //holds data on all current worlds
let SOCKET_LIST = {}; //keeps tracks of connected clients

function createDefaultWorlds() {
    if (settings.defaultWorldsActive) {
        let defaultWorld = objConstructor.World();
        defaultWorld.worldId = settings.defaultWorldId;
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
            if (settings.deleteTrelloBoardWhenEmpty) {
                trelloApi.deleteBoard(worlds[world].accToken, worlds[world].accTokenSecret, worlds[world].trelloBoardId);
            }
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
        try {
            worlds[data.worldID].players[data.playerId].mousePos.x = data.x;
            worlds[data.worldID].players[data.playerId].mousePos.y = data.y;
        }
        catch(err) {
            console.log("Tried to update non-existing players' mouseposition: " + err);
        }
        
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

    //add connection to socket list
    SOCKET_LIST[socket.id] = socket;

    socket.emit("sendId", socket.id);

    let currentWorlds = listCurrentWorld();

    socket.emit("currentWorlds", currentWorlds)

    return objConstructor.Player(socket.id);
}

function hostServer(data, player, socket, tokenObj, trelloBoardId) {
    let world = objConstructor.World();

    world.accToken = tokenObj.accessToken;
    world.accTokenSecret = tokenObj.accessTokenSecret;
    world.trelloBoardId = trelloBoardId;

    player.color = data.color;
    player.name = data.name;
    player.myWorldId = world.worldId;
    player.viewIndicatorColor = determineIndicatorColor(data.color);
    //add world to worlds object
    worlds[world.worldId] = world;

    //add player to world
    worlds[world.worldId].players[socket.id] = player;

    //update world before updateing playerjoined
    sendServerData("worldUpdate", parseSensitiveWorldData(worlds[world.worldId]));

    sendWorldUpdate("newPlayerJoined", {}, world.worldId);



    //Send world id to client
    socket.emit("worldId", world.worldId);

    dataLogger.writeLog(`player: ${player.name} => created world: ${world.worldId}`);

    return world.worldId;
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
        sendWorldUpdate("worldUpdate",parseSensitiveWorldData(worlds[data.sessionId]), data.sessionId);

        sendWorldUpdate("newPlayerJoined", {}, data.sessionId);


        //Send world id to client
        socket.emit("worldId", data.sessionId);

        dataLogger.writeLog(`player: ${player.name} => joined world: ${data.sessionId}`);
    } else {
        socket.emit("error", "This world is closed please refresh and select a new world");
    }


}

function parseSensitiveWorldData(world) {
        //make clone of object so its not parsed by reference. 
        let parsedWorld = Object.assign({},world)

        parsedWorld.accTokenSecret = {};
        parsedWorld.accToken = {};
        parsedWorld.trelloBoardId = {};

        return parsedWorld;
}

function spawnElement(id, socket, title, description, w, playerId) {
    if (doesWorldExist(id, socket)) {
        let element = objConstructor.Entity(worlds[id].players[playerId].x, worlds[id].players[playerId].y);

        element.title = title;
        element.description = description;
        element.w = w;

        worlds[id].entities[element.id] = element;

        dataLogger.writeLog("an element was spawned with id of " + element.id);
    } else {
        socket.emit("error", "This world is closed please refresh and select a new world");
    }
}

function spawnList(id, socket, title, trelloListId) {
    if (worlds[id].listCount <= worlds[id].maxListCount) {
        if (doesWorldExist(id, socket)) {
            let list = objConstructor.List(50 + worlds[id].listCount * 300, 70, title, id);
            worlds[id].lists[list.id] = list;
            worlds[id].lists[list.id].trelloListId = trelloListId;
            dataLogger.writeLog("Spawned list with title: " + list.title);
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

async function SpawnListFromTemplate(id, trelloObject) {
    trelloObject.forEach(trelloList => {
        let listId = trelloList.id;
        let name = trelloList.name;
        let list = objConstructor.List(50 + worlds[id].listCount * 300, 70, name, id);
        worlds[id].lists[list.id] = list;
        worlds[id].lists[list.id].trelloListId = listId;
        dataLogger.writeLog("Spawned list with title: " + list.title);
        worlds[id].listCount++;
    });
}

function startGameLoop() {
    setInterval(() => {
        try {
            if (isEmpty(worlds) === false) {

                for (const world in worlds) {

                    for (const key in worlds[world].lists) {
                        detect_list_colision(worlds[world].lists[key]);
                    }

                    for (const key in worlds[world].players) {
                        detect_trashcan_colision(worlds[world].players[key]);

                        detect_player_colision(worlds[world].players[key]);
                        updatePosistion(worlds[world].players[key]);

                        for (let i in SOCKET_LIST) {
                            let socket = SOCKET_LIST[i];
                            if (isEmpty(worlds[world].players) === false && worlds[world].players[key].id === socket.id) {

                                yourWorld = worlds[world];
                                socket.emit('worldUpdate', parseSensitiveWorldData(yourWorld));


                            }
                        }

                    }
                }

            }
        } catch (err) {
            console.error(err);
        }
    }, 1000 / 60);
}


function detect_colision(x1, y1, w1, h1, x2, y2, w2, h2) {
    //af en eller anden grund er den her anderledes fra collision detection på lister. kan ikke få den til at virke ens plz investigate. 
    if ((x1 - w1 / 2) < x2 + w2 &&
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

    if (playerObj.isCollidingWithTrashcan === false && isEmpty(playerObj.connectedEntity) === false && playerObj.pickUpKeyPressed === true && playerObj.canPickUp === false) {
        connectToWorld(playerObj);

        setTimeout(() => {
            playerObj.canPickUp = true;
            playerObj.isColliding = false;
        }, 500)
    }

    if (!(isEmpty(playerObj.connectedEntity))) {
        playerObj.connectedEntity.x = (playerObj.x - playerObj.connectedEntity.w / 2);
        playerObj.connectedEntity.y = (playerObj.y - playerObj.connectedEntity.h / 2) - 110;
    }

}

function detect_player_colision(playerObj) {

    //Player detection for entities
    for (const key in worlds[playerObj.myWorldId].entities) {
        let object = worlds[playerObj.myWorldId].entities[key];

        if (detect_colision(playerObj.x, playerObj.y, playerObj.w, playerObj.h, object.x, object.y, object.w, object.h)) {
            

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

    //Player detection for lists
    for (const key in worlds[playerObj.myWorldId].lists) {
        let list = worlds[playerObj.myWorldId].lists[key];

        if (
            detect_colision(playerObj.x, playerObj.y, playerObj.w, playerObj.h, list.x, list.y, list.w, list.h)
        ) {
            playerObj.isCollidingWithList = true;


            if (
                playerObj.pickUpKeyPressed === true &&
                playerObj.canPickUp === true &&
                isEmpty(playerObj.connectedEntity)
            ) {
                let socket = SOCKET_LIST[playerObj.id];
                socket.emit("openList", list.id);
                setTimeout(() => {
                    playerObj.canPickUp = false;
                }, 500);
            }
        } else {
            setTimeout(() => {
                playerObj.isCollidingWithList = false;
            }, 200);

            setTimeout(() => {
                if (isEmpty(playerObj.connectedEntity) === true && playerObj.pickUpKeyPressed === false) {
                    playerObj.canPickUp = true;
                }
            }, 600);
        }
    }

}

function connectToWorld(playerObj) {
    worlds[playerObj.myWorldId].entities[playerObj.connectedEntity.id] = playerObj.connectedEntity;
    dataLogger.writeLog(`player: ${playerObj.id} placed an entity: ${playerObj.connectedEntity.id}`);
    playerObj.connectedEntity = {};
}

function connectToPlayer(playerObj, entity) {
    playerObj.connectedEntity = entity;
    dataLogger.writeLog(`player: ${playerObj.id} connected an entity: ${playerObj.connectedEntity.id}`);
    delete worlds[playerObj.myWorldId].entities[entity.id];
}

/*LIST LOGIC*/

function connectFromListToPlayer(idea, worldId, playerId, listId) {
    worlds[worldId].players[playerId].connectedEntity = idea;
    dataLogger.writeLog(
        `player: ${playerId} connected an entity: ${worlds[worldId].players[playerId].connectedEntity}`
    );
    deleteCard(idea, worldId, listId);
    setTimeout(() => {
        worlds[worldId].players[playerId].canPickUp = false;
    }, 500);
}

function deleteCard(idea, worldId, listId) {
    for (const key in worlds[worldId].lists[listId].containedIdeas) {
        if (worlds[worldId].lists[listId].containedIdeas[key].id === idea.id) {
            trelloApi.deleteCard(worlds[worldId].accToken, worlds[worldId].accTokenSecret, idea.trelloCardId)
            delete worlds[worldId].lists[listId].containedIdeas[idea.id];
        } else {
            dataLogger.writeLog("cant find element in list");
        }
    }




}

async function insertTrelloCardId(listObj, idea) {

    let trelloCardId = await trelloApi.createCard(worlds[listObj.myWorldId].accToken, worlds[listObj.myWorldId].accTokenSecret, listObj.trelloListId, idea.title, idea.description)
    idea.trelloCardId = await trelloCardId;
}


function connectToList(listObj, idea) {
    listObj.containedIdeas[idea.id] = idea;
    dataLogger.writeLog(
        `list: ${listObj.id} connected an idea: ${listObj.containedIdeas[idea.id].title}`
    );

    insertTrelloCardId(listObj, listObj.containedIdeas[idea.id]);

    delete worlds[listObj.myWorldId].entities[idea.id];
    sendWorldUpdate("updateIdeasInListSelector", parseSensitiveWorldData(worlds[listObj.myWorldId]), listObj.myWorldId);
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

function detect_trashcan_colision(player) {
    const trashcan_x = 800;
    const trashcan_y = 800;
    const trashcan_h = 100;
    const trashcan_w = 100;

    if (
        player.x < trashcan_x + trashcan_w &&
        player.x + player.w > trashcan_x &&
        player.y < trashcan_y + trashcan_h &&
        player.h + player.y > trashcan_y
    ) {
        player.isCollidingWithTrashcan = true;
        if (player.pickUpKeyPressed === true && player.canPickUp === false && isEmpty(player.connectedEntity) === false) {
            player.connectedEntity = {};
            player.canPickUp = true;
            player.isColliding = false;
        }

    } else {
        player.isCollidingWithTrashcan = false;
    }

};




module.exports = {
    worlds,
    SOCKET_LIST,
    startGameLoop,
    spawnList,
    spawnElement,
    initializeConnection,
    hostServer,
    joinServer,
    determineIndicatorColor,
    removePlayer,
    sendWorldUpdate,
    sendServerData,
    createDefaultWorlds,
    isEmpty,
    listCurrentWorld,
    deleteEmptyWorlds,
    doesWorldExist,
    updateKeyState,
    updateMousePos,
    deleteAllEntities,
    connectFromListToPlayer,
    SpawnListFromTemplate,
};