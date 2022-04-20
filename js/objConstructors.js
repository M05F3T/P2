const worldHandler = require('./worldHandler.js');

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
        canPickUp: true,
        pickUpKeyPressed: false,
        connectedEntity: {},
        pressingRight: false,
        pressingLeft: false,
        pressingUp: false,
        pressingDown: false,
        maxSpd: 10,
    }
    self.updatePosistion = () => {
        //move oneway


        if (self.pressingRight && !self.pressingLeft && !self.pressingUp && !self.pressingDown) {
            self.x += self.maxSpd;
        }
        if (self.pressingLeft && !self.pressingRight && !self.pressingUp && !self.pressingDown) {
            self.x -= self.maxSpd;
        }
        if (self.pressingUp && !self.pressingRight && !self.pressingLeft && !self.pressingDown) {
            self.y -= self.maxSpd;
        }
        if (self.pressingDown && !self.pressingRight && !self.pressingUp && !self.pressingLeft) {
            self.y += self.maxSpd;
        }

        //move sideways
        if (self.pressingRight && self.pressingUp) {
            self.y -= self.maxSpd * 0.75; //up
            self.x += self.maxSpd * 0.75; //right
        }
        if (self.pressingRight && self.pressingDown) {
            self.x += self.maxSpd * 0.75; // right
            self.y += self.maxSpd * 0.75; //down
        }
        if (self.pressingDown && self.pressingLeft) {
            self.x -= self.maxSpd * 0.75; //left
            self.y += self.maxSpd * 0.75; //down
        }
        if (self.pressingLeft && self.pressingUp) {
            self.x -= self.maxSpd * 0.75; //left
            self.y -= self.maxSpd * 0.75; //up
        }

        if (worldHandler.isEmpty(self.connectedEntity) === false && self.pickUpKeyPressed === true && self.canPickUp === false) {
            self.connectToWorld();

            setTimeout(() => {
                self.canPickUp = true;
            }, 500)


        }

        if (!(worldHandler.isEmpty(self.connectedEntity))) {
            self.connectedEntity.x = (self.x - self.connectedEntity.w / 2);
            self.connectedEntity.y = (self.y - self.connectedEntity.h / 2) - 110;
        }

    }
    self.detect_colision = () => {
        for (const key in worldHandler.worlds[self.myWorldId].entities) {
            let object = worldHandler.worlds[self.myWorldId].entities[key];
            if ((self.x - self.w / 2) < object.x + object.w &&
                (self.x - self.w / 2) + self.w > object.x &&
                (self.y - self.h / 2) < object.y + object.h &&
                self.h + (self.y - self.h / 2) > object.y) {


                //console.log(`COLISSION: player: ${self.id} and ${object.id}`)

                self.isColliding = true;


                //pick up element
                if (self.pickUpKeyPressed === true && self.canPickUp === true && worldHandler.isEmpty(self.connectedEntity)) {

                    self.connectToPlayer(object);
                    setTimeout(() => {
                        self.canPickUp = false;
                    }, 500)

                }


            } else {
                setTimeout(() => {
                    self.isColliding = false;
                }, 200);

            }
        }
    }
    self.connectToWorld = () => {
        worldHandler.worlds[self.myWorldId].entities[self.connectedEntity.id] = self.connectedEntity;
        console.log(`player: ${self.id} placed an entity: ${self.connectedEntity.id}`);
        self.connectedEntity = {};
    }
    self.connectToPlayer = (entity) => {
        self.connectedEntity = entity;
        console.log(`player: ${self.id} connected an entity: ${self.connectedEntity.id}`);
        delete worldHandler.worlds[self.myWorldId].entities[entity.id];
    }
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
        title: title,
        containedIdeas: {}
    };
    self.detect_colision = () => {
        for (const key in worldHandler.worlds[self.myWorldId].entities) {
            let object = worldHandler.worlds[self.myWorldId].entities[key];
            if (
                self.x  < object.x + object.w &&
                self.x + self.w  > object.x &&
                self.y < object.y + object.h &&
                self.h + self.y > object.y
            ) {
                self.connectToList(object);
            } 
        }
    };
    self.connectToList = (idea) => {
        self.containedIdeas[idea.id] = idea;
        console.log(
            `list: ${self.id} connected an idea: ${self.containedIdeas[idea.id]}`
        );
        delete worldHandler.worlds[self.myWorldId].entities[idea.id];
    };
    return self;
};

let World = () => {
    let self = {
        worldId: nanoid(6),
        name: "This is the world name",
        listCount: 0,
        maxListCount: 5 - 1,
        players: {

        },
        entities: {

        },
        lists: {

        },
    }

    return self;
}


module.exports = {Player,Entity,List,World};