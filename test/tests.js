const assert = require('assert');
const worldHandler = require('../js/worldHandler');
const objConstructor = require("../js/objConstructors");

describe("Collision detection", function () {
    describe("detect_colision()", function () {
        it("should return true when a player (circle) and a rectangular object (e.g. list or idea) are colliding", function () {
            assert.equal(worldHandler.detect_colision(100, 70, 50, 50, 25, 20, 150, 100), true);
        });
        it("should return false when a player (circle) and a rectangular object (e.g. list or idea) are NOT colliding", function () {
            assert.equal(worldHandler.detect_colision(100, 170, 50, 50, 25, 20, 150, 100), false);
        });
    });
    describe("detect_rec_and_rec_collision()", function () {
        it("should return true when two rectangular objects collide (e.g. a list and an idea)", function () {
            assert.equal(
                worldHandler.detect_rec_and_rec_collision(25, 20, 150, 100, 50, 50, 150, 100), true);
        });
        it("should return false when two rectangular objects DOESN'T collide (e.g. a list and an idea)", function () {
            assert.equal(
                worldHandler.detect_rec_and_rec_collision(25, 20, 150, 100, 50, 130, 150, 100), false);
        });
    });
});

describe("Connecting ideas to players from worlds and from worlds to players", function () {
    describe("connectToWorld()", function () {
        it("playerObj's connectedEntity should be an empty object after dropping an idea onto the world", function () {
            let playerObj = objConstructor.Player(123, "green", "testPlayer");
            let worldObject = objConstructor.World();
            playerObj.myWorldId = worldObject.worldId;
            worldHandler.worlds[worldObject.worldId] = worldObject;
            playerObj.connectedEntity = {
                id: "testEntity Id",
                title: "hello",
            }
            worldHandler.connectToWorld(playerObj);
            assert.equal(Object.keys(playerObj.connectedEntity).length, 0);
        });
    });
    describe("connectToPlayer()", function () {
        it("playerObj's connectedEntity should be a specific idea object after picking up an idea from the world", function () {
            let playerObj = objConstructor.Player(123, "green", "testPlayer");
            let worldObject = objConstructor.World();
            let idea = objConstructor.Entity(0, 0, "testEntity Id");
            idea.title = "Test idea title";
            playerObj.myWorldId = worldObject.worldId;
            worldHandler.worlds[worldObject.worldId] = worldObject;
            worldHandler.worlds[worldObject.worldId].entities[idea.id] = idea;
            worldHandler.connectToPlayer(playerObj, idea);
            assert.equal(playerObj.connectedEntity, idea);
        });
    });
});