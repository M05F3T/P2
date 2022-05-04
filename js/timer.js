const worldHandler = require("./worldHandler.js");

let timeInterval;
let timeWorlds = [];

timeInterval = setInterval(() => {
    if (worldHandler.doesWorldExist(worldHandler.worlds[worldId]))
        timeWorlds.forEach((worldId) => {
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
            } else if (worldHandler.worlds[worldId].timerObj.seconds === 0) {
                worldHandler.sendWorldUpdate("error", "Time's up", worldId);
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