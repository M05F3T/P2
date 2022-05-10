const worldHandler = require("./worldHandler.js");
const dataLogger = require("./dataLogger.js");

let timeInterval;
let timeWorlds = [];

timeInterval = setInterval(() => {
    timeWorlds.forEach((worldId) => {
        try {
            if (
                worldHandler.worlds[worldId].timerObj.seconds > 0 &&
                worldHandler.worlds[worldId].timerObj.timerOn === true
            ) {
                worldHandler.worlds[worldId].timerObj.seconds--;
                worldHandler.sendWorldUpdate(
                    "updateTimer",
                    worldHandler.worlds[worldId].timerObj.seconds,
                    worldId
                );
            } else if (
                worldHandler.worlds[worldId].timerObj.timerOn === false
            ) {
                worldHandler.sendWorldUpdate(
                    "updateTimer",
                    worldHandler.worlds[worldId].timerObj.seconds,
                    worldId
                );
            } else if (
                worldHandler.worlds[worldId].timerObj.seconds === 0
            ) {
                worldHandler.worlds[worldId].timerObj.seconds = -1;
                worldHandler.sendWorldUpdate(
                    "timesUp",
                    "Time's up",
                    worldId
                );
            }
        } catch (err) {
            dataLogger.writeLog(
                "WORLD: Removed world" + worldId + " from timeWorlds"
            );
            timeWorlds = timeWorlds.filter((world) => world !== worldId);
        }
    }); 
}, 1000);

function startTimer(worldId) {
    worldHandler.worlds[worldId].timerObj.timerOn = true;
    if (!timeWorlds.includes(worldId))
        timeWorlds.push(worldId);
}

function setTimer(worldId, selectedTimer) {
    worldHandler.worlds[worldId].timerObj.timerOn = false;
    worldHandler.worlds[worldId].timerObj.seconds = selectedTimer * 60;
    worldHandler.sendWorldUpdate("updateTimer", worldHandler.worlds[worldId].timerObj.seconds, worldId);
}

function pauseTimer(worldId) {
    worldHandler.worlds[worldId].timerObj.timerOn = false;
}

function resetTimer(worldId, selectedTimer) {
    worldHandler.worlds[worldId].timerObj.seconds = selectedTimer * 60;
    worldHandler.sendWorldUpdate("updateTimer", worldHandler.worlds[worldId].timerObj.seconds, worldId);
}

module.exports = {
    startTimer,
    setTimer,
    pauseTimer,
    resetTimer,
}