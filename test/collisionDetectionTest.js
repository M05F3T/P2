const assert = require('assert');
const worldHandler = require('./../js/worldHandler');

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
