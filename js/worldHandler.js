const settings = require('./settings.js')

let worlds = {} //holds data on all current worlds

function createDefaultWorlds() {
    if (settings.defaultWorldsActive) {
        let defaultWorld = World();
        defaultWorld.name = "Default World";
        worldHandler.worlds[defaultWorld.worldId] = defaultWorld;
    }
}

function isEmpty(obj) {
    return Object.keys(obj).length === 0;
}


module.exports = {worlds,createDefaultWorlds,isEmpty};