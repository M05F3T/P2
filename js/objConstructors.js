const { v4: idGenerator } = require("uuid");
var { nanoid } = require("nanoid");

//specifies player object with its many properties
let Player = (id, color, name) => {
    let self = {
        x: 250,
        y: 250,
        w: 50,
        h: 50,
        id: id,
        mousePos: { x: 0, y: 0 },
        playerCanvasWidth: 0,
        playerCanvasHeight: 0,
        color: color,
        viewIndicatorColor: "#000000", //black by default
        name: name,
        myWorldId: 0,
        isColliding: false,
        isCollidingWithList: false,
        isCollidingWithTrashcan: false,
        canPickUp: true,
        pickUpKeyPressed: false,
        connectedEntity: {},
        pressingRight: false,
        pressingLeft: false,
        pressingUp: false,
        pressingDown: false,
        maxSpd: 10,
    };
    return self;
}

//specifies idea/entity objects with its properties
let Entity = (posX, posY, id) => {
    let self = {
        x: posX,
        y: posY,
        h: 65,
        w: 0,
        id: idGenerator(),
        title: "",
        description: "",
        color: "white"
    }
    return self;
}

//specifies list object with is properties and nested ideas/entities
let List = (posX, posY, title, myWorldId) => {
    let self = {
        x: posX,
        y: posY,
        w: 300,
        h: 600,
        id: idGenerator(),
        myWorldId: myWorldId,
        color: "white",
        trelloListId: "",
        title: title,
        containedIdeas: {}
    };
    return self;
};

//specifies world objects and its nested objects.
let World = () => {
    let self = {
        worldId: '#' + nanoid(6),
        name: "This is the world name",
        listCount: 0,
        maxListCount: 100 - 1,
        accToken: "",
        accTokenSecret: "",
        trelloBoardId: "",
        timerObj: {
            timerOn: false,
            seconds: 0,
        },
        players: {

        },
        entities: {

        },
        lists: {

        },
    }

    return self;
}



module.exports = { Player, Entity, World, List };