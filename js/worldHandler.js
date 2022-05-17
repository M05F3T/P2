const settings = require('./settings.js');
const objConstructor = require('./objConstructors.js');
const trelloApi = require('./trelloApi.js');
const dataLogger = require('./dataLogger.js');


var tinycolor = require("tinycolor2");

let worlds = {} //holds data on all current worlds
let SOCKET_LIST = {}; //keeps tracks of connected clients

//creates defualt world if setting is set to true
function createDefaultWorlds() {
    if (settings.defaultWorldsActive) {
        let defaultWorld = objConstructor.World();
        defaultWorld.worldId = settings.defaultWorldId;
        defaultWorld.name = "Default World";
        worlds[defaultWorld.worldId] = defaultWorld;
    }
}

//returns list of all current active worlds
function listCurrentWorld() {
    let list = {};

    for (const world in worlds) {
        list[worlds[world].worldId] = worlds[world].worldId;
    }
    return list;
}

//deletes world if setting is set to true and if no players is active in world
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

//deletes all ideas/entities in world. not included ideas picked up or in list 
function deleteAllEntities(id, socket) {
    if (doesWorldExist(id, socket)) {
        for (const key in worlds[id].entities) {
            delete worlds[id].entities[key];
        }
    } else {
        socket.emit("error", "This world is closed please refresh and select a new world");
    }
}

//returns true if world with specified id exists
function doesWorldExist(worldId) {
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

//send specified emit and object to all clients connected to server.
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

//send specified emit to all clients connected to specified with specified object.
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

//find and delete player/client with the correct socket attached.
function removePlayer(socket) {
    //remove disconnected person
    delete SOCKET_LIST[socket.id];

    //delete player from world
    for (const world in worlds) {
        for (const key in worlds[world].players) {
            if (worlds[world].players[key].id === socket.id) {
                delete worlds[world].players[key];
            }
        }
    }
}

//update key state to being pressed or not for specific player
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

//stores and updates players mouseposistion
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

//returns true if object is empty
function isEmpty(obj) {
    return Object.keys(obj).length === 0;
}

//return correct indicator color determined by player color 
function determineIndicatorColor(colorHex) {
    var color1 = tinycolor(colorHex);
    if (color1.getBrightness() > 128) { //get brightness returns value between 0 - 255 with 0 being darkest
        return "#000" //return black
    }
    else {
        return "#fff"   //return white
    }
}

//return and create player obj after storing and sending necessary data to client
function initializeConnection(socket) {

    //add connection to socket list
    SOCKET_LIST[socket.id] = socket;

    socket.emit("sendId", socket.id);

    let currentWorlds = listCurrentWorld();

    socket.emit("currentWorlds", currentWorlds)

    return objConstructor.Player(socket.id);
}

//creates new world and adds hosting player to that world
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

    dataLogger.writeLog(`SERVER: player: ${player.name} => created world: ${world.worldId}`);

    return world.worldId;
}

//add player/client to specified world
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

        dataLogger.writeLog(`SERVER: player: ${player.name} => joined world: ${data.sessionId}`);
    } else {
        socket.emit("error", "This world is closed please refresh and select a new world");
    }
}

//removes sensitive trello Api data from world object before sending it to client
function parseSensitiveWorldData(world) {
        //make clone of object so its not parsed by reference. 
        let parsedWorld = Object.assign({},world)

        parsedWorld.accTokenSecret = {};
        parsedWorld.accToken = {};
        parsedWorld.trelloBoardId = {};

        return parsedWorld;
}

//creates and spawns new entitie to specified world
function spawnElement(id, socket, title, description, w, playerId) {
    if (doesWorldExist(id, socket)) {
        let element = objConstructor.Entity(worlds[id].players[playerId].x, worlds[id].players[playerId].y);

        element.title = title;
        element.description = description;
        console.log(title)
        socket.emit("updateIdeaWidth", {
            ideaTitle: title,
            playerId: playerId,
            entityId: element.id,
            worldId: id,
            isConnected: false
        });

        worlds[id].entities[element.id] = element;

        dataLogger.writeLog("WORLD: An element was spawned with id of " + element.id);
    } else {
        socket.emit("error", "This world is closed please refresh and select a new world");
    }
}

//creates and spawns new list to specified world
function spawnList(id, socket, title, trelloListId) {
    if (worlds[id].listCount <= worlds[id].maxListCount) {
        if (doesWorldExist(id, socket)) {
            let list = objConstructor.List(50 + worlds[id].listCount * 300, 70, title, id);
            worlds[id].lists[list.id] = list;
            worlds[id].lists[list.id].trelloListId = trelloListId;
            dataLogger.writeLog("WORLD: Spawned list with title: " + list.title);
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

//asynchronously waits for trello data and spawns all lists in a template
async function SpawnListFromTemplate(id, trelloObject) {
    trelloObject.forEach(trelloList => {
        let listId = trelloList.id;
        let name = trelloList.name;
        let list = objConstructor.List(50 + worlds[id].listCount * 300, 70, name, id);
        worlds[id].lists[list.id] = list;
        worlds[id].lists[list.id].trelloListId = listId;
        dataLogger.writeLog("WORLD: Spawned list with title: " + list.title);
        worlds[id].listCount++;
    });
}

//updates world and object properties and send updated world to correct clients 60 times a second
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
            dataLogger.writeError("WORLD: Error while executing startGameLoop: " + err);
        }
    }, 1000 / 60);
}

/*PLAYER LOGIC */

//updates player posistion determined by key state properties
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

    //places idea/entitie on the ground if expression is met.
    if (playerObj.isCollidingWithTrashcan === false && isEmpty(playerObj.connectedEntity) === false && playerObj.pickUpKeyPressed === true && playerObj.canPickUp === false) {
        connectToWorld(playerObj,findSocketFromPlayerObj(playerObj.id));

        //clear current idea field

        setTimeout(() => {
            playerObj.canPickUp = true;
            playerObj.isColliding = false;
        }, 500)
    }

    //if player has entitie update its posistion in relation to players posistion
    if (!(isEmpty(playerObj.connectedEntity))) {
        playerObj.connectedEntity.x = (playerObj.x - playerObj.connectedEntity.w / 2);
        playerObj.connectedEntity.y = (playerObj.y - playerObj.connectedEntity.h / 2) - 110;
    }

}

//checks if player is colliding with an entitie/idea present in the world
function detect_player_colision(playerObj) {

    //Player detection for entities
    for (const key in worlds[playerObj.myWorldId].entities) {
        let object = worlds[playerObj.myWorldId].entities[key];

        if (detect_colision(playerObj.x, playerObj.y, playerObj.w, playerObj.h, object.x, object.y, object.w, object.h)) {
            

            playerObj.isColliding = true;

            //pick up/attach idea/entitie to player if expression is met
            if (playerObj.pickUpKeyPressed === true && playerObj.canPickUp === true && isEmpty(playerObj.connectedEntity)) {

                connectToPlayer(playerObj, object, findSocketFromPlayerObj(playerObj.id));

                //insert current idea fields

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

//connects a connected entity to world object (places idea/entity on the ground)
function connectToWorld(playerObj,socket) {
    worlds[playerObj.myWorldId].entities[playerObj.connectedEntity.id] = playerObj.connectedEntity;
    socket.emit("clearCurrentIdeaTab",{});
    dataLogger.writeLog(`WORLD: player: ${playerObj.id} placed an entity: ${playerObj.connectedEntity.id}`);
    playerObj.connectedEntity = {};
}

//connects a world entity/idea to the player (pick up idea)
function connectToPlayer(playerObj, entity,socket) {
    playerObj.connectedEntity = entity;
    socket.emit("updateCurrentIdeaTab",entity);
    dataLogger.writeLog(`WORLD: player: ${playerObj.id} connected an entity: ${playerObj.connectedEntity.id}`);
    delete worlds[playerObj.myWorldId].entities[entity.id];
}

/*LIST LOGIC*/

//find correct socket object from a playerId
function findSocketFromPlayerObj(playerId) {
    let socket;

    for(const currentSocket in SOCKET_LIST) {
        if(SOCKET_LIST[currentSocket].id === playerId) {
           return SOCKET_LIST[currentSocket]
        }
        else {
            dataLogger.writeError("WORLD: couldn't find socket from playobj");
        }
    }
}

//connects idea/entite from a list to a player (pick up idea)
function connectFromListToPlayer(idea, worldId, playerId, listId) {
    worlds[worldId].players[playerId].connectedEntity = idea;
    dataLogger.writeLog(
        `WORLD: player: ${playerId} connected an entity: ${worlds[worldId].players[playerId].connectedEntity}`
    );
    deleteCard(idea, worldId, listId);
    setTimeout(() => {
        worlds[worldId].players[playerId].canPickUp = false;
    }, 500);
}

//deletes list from world
function deleteCard(idea, worldId, listId) {
    for (const key in worlds[worldId].lists[listId].containedIdeas) {
        if (worlds[worldId].lists[listId].containedIdeas[key].id === idea.id) {
            trelloApi.deleteCard(worlds[worldId].accToken, worlds[worldId].accTokenSecret, idea.trelloCardId)
            delete worlds[worldId].lists[listId].containedIdeas[idea.id];
        } else {
            dataLogger.writeLog("WORLD: cant find element in list");
        }
    }
}


//asynchronously waits for trello card data and stores them in variables.
async function insertTrelloCardId(listObj, idea) {
    let trelloCardId = await trelloApi.createCard(worlds[listObj.myWorldId].accToken, worlds[listObj.myWorldId].accTokenSecret, listObj.trelloListId, idea.title, idea.description)
    idea.trelloCardId = await trelloCardId;
}

//connects an idea/entitie to a list
function connectToList(listObj, idea) {
    listObj.containedIdeas[idea.id] = idea;
    dataLogger.writeLog(
        `WORLD: list: ${listObj.id} connected an idea: ${listObj.containedIdeas[idea.id].title}`
    );

    insertTrelloCardId(listObj, listObj.containedIdeas[idea.id]);

    delete worlds[listObj.myWorldId].entities[idea.id];
    sendWorldUpdate("updateIdeasInListSelector", parseSensitiveWorldData(worlds[listObj.myWorldId]), listObj.myWorldId);
};

//detect collision between square and circle.
function detect_colision(x1, y1, w1, h1, x2, y2, w2, h2) {
    if (
        x1 - w1 / 2 < x2 + w2 &&
        x1 - w1 / 2 + w1 > x2 &&
        y1 - h1 / 2 < y2 + h2 &&
        h1 + (y1 - h1 / 2) > y2
    ) {
        return true;
    } else {
        return false;
    }
}

//connect idea/entitie to list when idea/entitie collided with list
function detect_list_colision(listObj) {
    for (const key in worlds[listObj.myWorldId].entities) {
        let object = worlds[listObj.myWorldId].entities[key];
        if (detect_rec_and_rec_collision(listObj.x, listObj.y, listObj.w, listObj.h, object.x, object.y, object.w, object.h)) {
            connectToList(listObj, object);
        }
    }
};

//detect collision between two rectangles.
function detect_rec_and_rec_collision(x1, y1, w1, h1, x2, y2, w2, h2) {
    return (
        x1 < x2 + w2 &&
        x1 + w1 > x2 &&
        y1 < y2 + h2 &&
        h1 + y1 > y2
    );
}

//if idea/entitie collides with trash can delete it from world
function detect_trashcan_colision(player) {
    const trashcan_x = 800;
    const trashcan_y = 800;
    const trashcan_h = 100;
    const trashcan_w = 100;

    if (detect_colision(player.x, player.y, player.w, player.h, trashcan_x, trashcan_y, trashcan_w, trashcan_h)) {
        player.isCollidingWithTrashcan = true;
        if (player.pickUpKeyPressed === true && player.canPickUp === false && isEmpty(player.connectedEntity) === false) {
            player.connectedEntity = {};
            player.canPickUp = true;
            player.isColliding = false;

            let socket =findSocketFromPlayerObj(player.id);

            socket.emit("clearCurrentIdeaTab");

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
    detect_colision,
    detect_rec_and_rec_collision,
    detect_trashcan_colision,
    connectToWorld,
    connectToPlayer
};