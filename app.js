const settings = require('./js/settings.js');
const worldHandler = require('./js/worldHandler.js');
const trelloApi = require('./js/trelloApi.js');
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

function startExpress(filePath, directoryPath) {
    // in case user tries to get "http://www.hostwebsite.com/" we send index.html
    app.get('/', function (req, res) {
        res.sendFile(__dirname + filePath);
    });

    //User can accses all files in /client (ex: http://www.hostwebsite.com/client/img.jpg)
    app.use('/client', express.static(__dirname + directoryPath));

    //trello login
    app.get("/login", function (req, res) {
        trelloApi.login(req, res);
    });

    server.listen(settings.PORT);
    console.log("Server started.. " + settings.PORT);

}



async function joinAndHostServer(data, socket, player) {
    if (data.host === true) {
        let tokenObj = await trelloApi.trelloLoginCallback(data.href);
        let TrelloBoardId = await trelloApi.createBoard(tokenObj.accessToken, trelloApi.accessTokenSecret);
        worldHandler.hostServer(data, player, socket, await tokenObj, await TrelloBoardId);
    } else if (data.host === false) {
        worldHandler.joinServer(data, player, socket);
    }
}

async function spawnList(dataObj,socket) {
    let trelloListId = await trelloApi.createList(worldHandler.worlds[dataObj.worldId].accToken, worldHandler.worlds[dataObj.worldId].accTokenSecret, worldHandler.worlds[dataObj.worldId].trelloBoardId, dataObj.listName);
    worldHandler.spawnList(dataObj.worldId, socket, dataObj.listName, await trelloListId);
}

function startClientUpdates() {
    const io = require('socket.io')(server, {});

    io.sockets.on('connection', (socket) => {

        let player = worldHandler.initializeConnection(socket);


        socket.on('join', (data) => {

            joinAndHostServer(data, socket, player);


        });

        socket.on('clear', (id) => {
            worldHandler.deleteAllEntities(id, socket);
        });

        socket.on('spawnElement', (dataObj) => {
            worldHandler.spawnElement(dataObj.worldId, socket, dataObj.ideaName, dataObj.ideaDescription, dataObj.width);
        });

        socket.on("spawnList", (dataObj) => {
            spawnList(dataObj, socket).then(()=>{
                worldHandler.sendWorldUpdate(
                    "updateLists",
                    worldHandler.worlds[dataObj.worldId],
                    dataObj.worldId
                );
            });
        });

        socket.on("removeSelectedList", (id, listId) => {
            console.log("trying to remove list with id:" + listId);
            console.log(listId);

            let tempListCount = 0;
            trelloApi.archiveList(worldHandler.worlds[id].accToken,worldHandler.worlds[id].accTokenSecret,worldHandler.worlds[id].lists[listId].trelloListId);
            delete worldHandler.worlds[id].lists[listId];
            console.log("Removed list with id: " + listId);

            for (const key in worldHandler.worlds[id].lists) {
                worldHandler.worlds[id].lists[key].x = 50 + tempListCount * 300;
                tempListCount++;
            }

            --worldHandler.worlds[id].listCount;
            worldHandler.sendWorldUpdate("updateLists", worldHandler.worlds[id], id);
            //socket.emit("updateLists", worldHandler.worlds[id]);
        });

        socket.on("playerMousePos", (data) => {
            worldHandler.updateMousePos(data, socket);
        });

        socket.on('keyPress', (data) => {
            worldHandler.updateKeyState(data, socket, player);
        });

        socket.on("takeIdeaFromList", (idea, worldId, playerId, listId) => {
            console.log(worldId);
            worldHandler.connectFromListToPlayer(idea, worldId, playerId, listId);
        });

        socket.on('disconnect', () => {

            worldHandler.removePlayer(socket);

            //check if no players is present and delete world if empty
            worldHandler.deleteEmptyWorlds();


            console.log("Player disconnected " + socket.id);
        });
    });
}
















