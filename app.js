const settings = require('./js/settings.js');
const timer = require("./js/timer.js");
const worldHandler = require('./js/worldHandler.js');
const trelloApi = require('./js/trelloApi.js');
const dataLogger = require('./js/dataLogger.js');
const express = require('express');
const { url } = require('inspector');
const app = express();
const server = require('http').Server(app);


runServer();

function runServer() {

    worldHandler.createDefaultWorlds();

    startExpress(settings.servThisFile, settings.allowAccessTo);

    startClientUpdates();

    worldHandler.startGameLoop();
}

//handles express setup for sending correct directorys for the specified endpoints
function startExpress(filePath, directoryPath) {
    // in case user tries to get "http://www.hostwebsite.com/" we send index.html
    app.get('/', function (req, res) {
        res.sendFile(__dirname + filePath);
    });

    //User can accses all files in /client (ex: http://www.hostwebsite.com/client/img.jpg)
    app.use('/client', express.static(__dirname + directoryPath));

    //When user try to go to /login endpoint run login function
    app.get("/login", function (req, res) {
        trelloApi.login(req, res);
    });

    //listen to port specified in settings.
    server.listen(settings.PORT);
    dataLogger.writeLog("SERVER: server started on Port: " + settings.PORT);

}

//handles socket communication with clients and runs correct functions determined by socket emits.
function startClientUpdates() {
    const io = require('socket.io')(server, {}); //start socket io server.

    //when user connects assign them a socket
    io.sockets.on('connection', (socket) => {

        let player = worldHandler.initializeConnection(socket);

        dataLogger.writeLog(`WORLD: Player connected to server with id: ${socket.id}`);

        //when "join" emit recived determine if connected client wants to host or join session
        socket.on('join', (sessionSetupData) => {
            joinAndHostServer(sessionSetupData, socket, player, sessionSetupData.template);
        });

        socket.on('clear', (worldId) => {
            worldHandler.deleteAllEntities(worldId, socket);
        });

        socket.on('spawnElement', (dataObj) => {
            worldHandler.spawnElement(dataObj.worldId, socket, dataObj.ideaName, dataObj.ideaDescription, dataObj.width, dataObj.playerId);

        });

        socket.on("denial", (data) => {
            checkPlayerDenial(data, socket)
        });

        socket.on("spawnList", (dataObj) => {
            spawnList(dataObj, socket).then(() => {
                worldHandler.sendWorldUpdate(
                    "updateLists",
                    worldHandler.worlds[dataObj.worldId],
                    dataObj.worldId
                );
            });
        });

        socket.on("removeSelectedList", (id, listId) => {
            dataLogger.writeLog("WORLD: trying to remove list with id:" + listId);

            let tempListCount = 0;
            trelloApi.archiveList(worldHandler.worlds[id].accToken, worldHandler.worlds[id].accTokenSecret, worldHandler.worlds[id].lists[listId].trelloListId);
            delete worldHandler.worlds[id].lists[listId];
            dataLogger.writeLog("WORLD: Removed list with id: " + listId);

            for (const key in worldHandler.worlds[id].lists) {
                worldHandler.worlds[id].lists[key].x = tempListCount * 450;
                tempListCount++;
            }

            --worldHandler.worlds[id].listCount;
            worldHandler.sendWorldUpdate("updateLists", worldHandler.worlds[id], id);
        });

        //store the new window size when resized
        socket.on("windowResized", (canvasData) => {
            worldHandler.worlds[canvasData.worldId].players[canvasData.playerId].playerCanvasWidth = canvasData.canvasWidth;
            worldHandler.worlds[canvasData.worldId].players[canvasData.playerId].playerCanvasHeight = canvasData.canvasHeight;
        });

        //stores new mouse position
        socket.on("playerMousePos", (data) => {
            worldHandler.updateMousePos(data, socket);
        });

        socket.on('keyPress', (data) => {
            worldHandler.updateKeyState(data, socket, player);
        });

        socket.on("takeIdeaFromList", (idea, worldId, playerId, listId) => {
            worldHandler.connectFromListToPlayer(idea, worldId, playerId, listId);
        });

        socket.on("updateIdeaWidth", (ideaObj, w) => {
            try {
                if (ideaObj.isConnected === true) {
                    worldHandler.worlds[ideaObj.worldId].players[ideaObj.playerId].connectedEntity.w = w;
                } else {
                    worldHandler.worlds[ideaObj.worldId].entities[ideaObj.entityId].w = w;
                }
            }catch {
                dataLogger.writeError("ERROR: Couldn't update width of entity");
            }

           

        })

        socket.on("updateIdea", (entityId, ideaTitle, ideaDescription, worldId, playerId) => {

            let updatedIdea = worldHandler.worlds[worldId].players[playerId].connectedEntity;

            updatedIdea.title = ideaTitle;
            updatedIdea.description = ideaDescription;

            socket.emit("updateIdeaWidth", {
                ideaTitle: ideaTitle,
                playerId: playerId,
                entityId: entityId,
                worldId: worldId,
                isConnected: true
            });
        })

        socket.on("startTimer", (worldId) => {
            timer.startTimer(worldId);
        })

        socket.on("setTimer", (worldId, selectedTimer) => {
            timer.setTimer(worldId, selectedTimer);
        })

        socket.on("pauseTimer", (worldId) => {
            timer.pauseTimer(worldId);
        })

        socket.on("resetTimer", (worldId, selectedTimer) => {
            timer.resetTimer(worldId, selectedTimer);
        });

        //runs when client disconnects from server
        socket.on('disconnect', () => {

            worldHandler.removePlayer(socket);

            //check if no players is present and delete world if empty
            worldHandler.deleteEmptyWorlds();

            dataLogger.writeLog("WORLD: Player disconnected " + socket.id);
        });
    });
}

//asynchronously waits for trello api board data and creates/joins world determined by sessionSetupData obj
async function joinAndHostServer(sessionSetupData, socket, player, template) {
    let doesWorldExist = false;
    if (sessionSetupData.host === true && template === "none") {
        try {
            let tokenObj = await trelloApi.trelloLoginCallback(sessionSetupData.href, socket);
            let trelloBoardId = await trelloApi.createBoard(tokenObj.accessToken, trelloApi.accessTokenSecret)
            worldHandler.hostServer(sessionSetupData, player, socket, await tokenObj, await trelloBoardId);
        } catch (err) {
            hostingErrorRedirect(err, socket);
            return;
        }
    }
    else if (sessionSetupData.host === true && template !== "none") {
        try {
            let worldTemplateId;
            let tokenObj = await trelloApi.trelloLoginCallback(sessionSetupData.href);
            let trelloBoardId = await trelloApi.createBoardFromTemplate(tokenObj.accessToken, trelloApi.accessTokenSecret, template);
            worldTemplateId = worldHandler.hostServer(sessionSetupData, player, socket, await tokenObj, await trelloBoardId);
            let trelloObject = await trelloApi.GetListsFromBoard(tokenObj.accessToken, tokenObj.accTokenSecret, await trelloBoardId);
            worldHandler.SpawnListFromTemplate(worldTemplateId, await trelloObject);
        } catch (err) {
            hostingErrorRedirect(err, socket);
            return;
        }
    }
    else if (!worldHandler.worlds[sessionSetupData.sessionId] && sessionSetupData.host === false) {
        doesWorldExist = false;
        socket.emit('join', doesWorldExist);
    }
    else {
        doesWorldExist = true;
        socket.emit('join', doesWorldExist);
        worldHandler.joinServer(sessionSetupData, player, socket);
    }
}

function hostingErrorRedirect(err, socket) {
    dataLogger.writeError("SERVER: Error while hosting server: " + err);
    let destination = "/";
    console.log("Caught error");
    socket.emit("redirect", destination);
}

//if player denies trello login authentication when trying to host, redirect them to start page
function checkPlayerDenial(href, socket) {
    const query = trelloApi.url.parse(href, true).query;
    const token = query.oauth_token;
    const verifier = query.oauth_verifier;
    if (!token && !verifier) {
        socket.emit("denial", true);
    }

}

//asynchronously wait for trello api list data and spawn list.
async function spawnList(dataObj, socket) {
    let trelloListId = await trelloApi.createList(worldHandler.worlds[dataObj.worldId].accToken, worldHandler.worlds[dataObj.worldId].accTokenSecret, worldHandler.worlds[dataObj.worldId].trelloBoardId, dataObj.listName);
    worldHandler.spawnList(dataObj.worldId, socket, dataObj.listName, await trelloListId);
}
