const settings = require('./settings.js')
const objConstructor = require('./objConstructors.js');


let worlds = {} //holds data on all current worlds

function createDefaultWorlds() {
    if (settings.defaultWorldsActive) {
        let defaultWorld = objConstructor.World();
        defaultWorld.name = "Default World";
        worlds[defaultWorld.worldId] = defaultWorld;
    }
}

function listCurrentWorld() {
    let list = { };

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

function isEmpty(obj) {
    return Object.keys(obj).length === 0;
}


module.exports = {worlds,createDefaultWorlds,isEmpty,listCurrentWorld,deleteEmptyWorlds};