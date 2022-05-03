const { v4: idGenerator } = require("uuid");
var { nanoid } = require("nanoid");


let Player = (id, color, name) => {
    let self = {
        x: 250,
        y: 250,
        w: 50,
        h: 50,
        id: id,
        mousePos: { x: 0, y: 0 },
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

let Entity = (posX, posY, id) => {
    let self = {
        x: posX,
        y: posY,
        h: 65,
        w: 0,
        id: idGenerator(),
        title: "",
        description: "",
        color: "gray"
    }
    return self;
}

let List = (posX, posY, title, myWorldId) => {
    let self = {
        x: posX,
        y: posY,
        w: 200,
        h: 300,
        id: idGenerator(),
        myWorldId: myWorldId,
        color: "gray",
        trelloListId: "",
        title: title,
        containedIdeas: {}
    };
    return self;
};

let World = () => {
    let self = {
        worldId: '#' + nanoid(6),
        name: "This is the world name",
        listCount: 0,
        maxListCount: 5 - 1,
        accToken: "",
        accTokenSecret: "",
        trelloBoardId: "",
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