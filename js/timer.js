const worldHandler = require("./worldHandler.js");

function startTimer(worldId) {
    let timeInterval = setInterval(() => {
        if (worldHandler.worlds[worldId].timerObj.seconds > 0) {
            worldHandler.worlds[worldId].timerObj.seconds--;
            worldHandler.sendWorldUpdate("updateTimer", worldHandler.worlds[worldId].timerObj, worldId);
        } else {
            worldHandler.sendWorldUpdate("error", "Time's up", worldId);
            clearInterval(timeInterval);
        }
    }, 1000);
}

function setTimer(worldId, selectedTimer) {
    worldHandler.worlds[worldId].timerObj.seconds = selectedTimer * 60;
    worldHandler.sendWorldUpdate("updateTimer", worldHandler.worlds[worldId].timerObj, worldId);
}

module.exports = {
    startTimer,
    setTimer,
}