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
    app.get("/login", function (req,res){
        trelloApi.login(req,res);
    });

    server.listen(settings.PORT);
    console.log("Server started.. " + settings.PORT);

}



async function joinAndHostServer(data, socket,player) {
    if (data.host === true) {
        let tokenObj = await trelloApi.trelloLoginCallback(data.href);
        worldHandler.hostServer(data, player, socket, await tokenObj);
     } else if (data.host === false) {
        worldHandler.joinServer(data, player, socket);
     }
}

function startClientUpdates() {
    const io = require('socket.io')(server, {});

    io.sockets.on('connection', (socket) => {

        let player = worldHandler.initializeConnection(socket);

        socket.on("hostWorld", (href) => {
           
        });

        socket.on('join', (data) => {

            joinAndHostServer(data,socket,player);

            
        });

        socket.on('clear', (id) => {
           worldHandler.deleteAllEntities(id, socket);
        });

        socket.on('spawnElement', (dataObj) => {
            worldHandler.spawnElement(dataObj.worldId, socket,dataObj.ideaName,dataObj.ideaDescription,dataObj.width);
        });

        socket.on("spawnList", (dataObj) => {
            worldHandler.spawnList(dataObj.worldId, socket, dataObj.listName);
            worldHandler.sendWorldUpdate("updateLists",worldHandler.worlds[dataObj.worldId],dataObj.worldId);
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
            worldHandler.sendWorldUpdate("updateLists",worldHandler.worlds[id],id);
            //socket.emit("updateLists", worldHandler.worlds[id]);
        });

        socket.on("playerMousePos", (data) => {
           worldHandler.updateMousePos(data, socket);
        });

        socket.on('keyPress', (data) => {
            worldHandler.updateKeyState(data, socket, player);
        });

        socket.on('disconnect', () => {

            worldHandler.removePlayer(socket);

            //check if no players is present and delete world if empty
            worldHandler.deleteEmptyWorlds();


            console.log("Player disconnected " + socket.id);
        });
    });
}
















