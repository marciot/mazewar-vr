var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/*
MazeWars VR
Copyright (C) 2016 Marcio Teixeira

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

// Keeps track of the various actors
var Actors = function () {
    function Actors() {
        _classCallCheck(this, Actors);

        this.actors = [];
    }

    _createClass(Actors, [{
        key: "add",
        value: function add(actor) {
            this.actors.push(actor);
            return actor;
        }
    }, {
        key: "remove",
        value: function remove(actor) {
            var index = this.actors.indexOf(actor);
            if (index > -1) {
                this.actors.splice(index, 1);
            }
        }
    }, {
        key: "removeAll",
        value: function removeAll(dispose) {
            while (this.actors.length) {
                var actor = this.actors[this.actors.length - 1];
                this.remove(actor);
                if (dispose) {
                    actor.dispose();
                }
            }
        }
    }, {
        key: "disposeAll",
        value: function disposeAll() {
            this.removeAll(true);
        }
    }, {
        key: "isOccupied",
        value: function isOccupied(x, z, except) {
            for (var i = 0; i < this.actors.length; i++) {
                if (this.actors[i] !== except && this.actors[i].x === x && this.actors[i].z === z) {
                    return this.actors[i];
                }
            }
        }
    }, {
        key: "placePlayer",
        value: function placePlayer(player) {
            player.setPosition(maze.getRandomPosition());
            player.orientTowardsPassage();
            player.startAnimation();
            this.add(player);
        }
    }]);

    return Actors;
}();

;

// Actors are anything that has a position within the maze.

var Actor = function () {
    function Actor(representation) {
        _classCallCheck(this, Actor);

        this.x = 1;
        this.z = 1;
        this.facing = Directions.NORTH;
        this.observers = [];
        this.representation = representation;

        this.addObserver(representation);
    }

    _createClass(Actor, [{
        key: "dispose",
        value: function dispose() {
            this.notifyObservers("dispose");
            this.observers.length = 0;
            this.representation = null;
        }
    }, {
        key: "addObserver",
        value: function addObserver(observer) {
            this.observers.push(observer);
        }
    }, {
        key: "notifyObservers",
        value: function notifyObservers(method) {
            for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                args[_key - 1] = arguments[_key];
            }

            for (var i = 0; i < this.observers.length; i++) {
                if (this.observers[i][method]) {
                    this.observers[i][method].apply(this.observers[i], args);
                }
            }
        }
    }, {
        key: "setPosition",
        value: function setPosition(x, z) {
            if (Array.isArray(x)) {
                this.setPosition(x[0], x[1]);
                return;
            }
            this.x = x;
            this.z = z;
            this.notifyObservers("setPosition", x, z);
        }
    }, {
        key: "choosePassage",
        value: function choosePassage() {
            var dir = Directions.fromInteger(Math.floor(Math.random() * 4));
            while (!this.canWalk(dir)) {
                dir = Directions.rightFrom(dir);
            }
            return dir;
        }
    }, {
        key: "canWalk",
        value: function canWalk(direction) {
            return maze.canMoveFrom(this.x, this.z, direction);
        }

        /* Movement in the indicated direction */

    }, {
        key: "walk",
        value: function walk(direction) {
            direction = direction || this.facing;

            if (!this.canWalk(direction)) {
                return false;
            }
            Directions.updateCoordinates(this, direction);
            this.notifyObservers("walkTo", this.x, this.z, direction);
            return true;
        }
    }, {
        key: "orientTowards",
        value: function orientTowards(direction) {
            this.facing = direction;
            this.notifyObservers("orientTowards", direction);
        }
    }, {
        key: "orientTowardsPassage",
        value: function orientTowardsPassage() {
            this.orientTowards(this.choosePassage());
        }
    }, {
        key: "turnTowards",
        value: function turnTowards(direction) {
            this.facing = direction;
            this.notifyObservers("turnTowards", direction);
        }
    }, {
        key: "startAnimation",
        value: function startAnimation() {
            this.notifyObservers("startAnimation");
        }
    }, {
        key: "turnRight",
        value: function turnRight() {
            this.turnTowards(Directions.rightFrom(this.facing));
        }
    }, {
        key: "turnLeft",
        value: function turnLeft() {
            this.turnTowards(Directions.leftFrom(this.facing));
        }
    }, {
        key: "aboutFace",
        value: function aboutFace() {
            this.turnTowards(Directions.oppositeFrom(this.facing));
        }
    }, {
        key: "walkBackwards",
        value: function walkBackwards() {
            this.walk(Directions.oppositeFrom(this.facing));
        }
    }, {
        key: "actorInFrontOfMe",
        get: function () {
            var pos = { x: this.x, z: this.z };
            while (maze.canMoveFrom(pos.x, pos.z, this.facing)) {
                Directions.updateCoordinates(pos, this.facing);
                var which = actors.isOccupied(pos.x, pos.z, this);
                if (which) {
                    return which;
                }
            }
            return null;
        }
    }]);

    return Actor;
}();

;

var MissileActor = function (_Actor) {
    _inherits(MissileActor, _Actor);

    function MissileActor(representation, owner) {
        _classCallCheck(this, MissileActor);

        var _this = _possibleConstructorReturn(this, (MissileActor.__proto__ || Object.getPrototypeOf(MissileActor)).call(this, representation));

        _this.owner = owner;
        _this.ricochet = false;

        representation.setAnimationFinishedCallback(_this.animationFinished.bind(_this));
        return _this;
    }

    _createClass(MissileActor, [{
        key: "launch",
        value: function launch(data) {
            this.x = this.owner.x;
            this.z = this.owner.z;
            this.facing = this.owner.representation.cardinalDirection;
            this.data = data;

            this.setPosition(this.x, this.z);
            this.orientTowards(this.facing);
        }
    }, {
        key: "dispose",
        value: function dispose() {
            _get(MissileActor.prototype.__proto__ || Object.getPrototypeOf(MissileActor.prototype), "dispose", this).call(this);

            this.owner = null;
            this.data = null;
        }
    }, {
        key: "explode",
        value: function explode() {
            actors.remove(this);
            this.owner.recycleMissile(this);
        }
    }, {
        key: "animationFinished",
        value: function animationFinished() {
            if (this.canWalk(this.facing)) {
                // Keep moving the missle along until it hits a wall
                this.walk(this.facing);

                // Did I collide with something?
                var hit = actors.isOccupied(this.x, this.z, this);
                if (hit && hit.wasHit && !hit.isDead) {
                    hit.wasHit(this.data);
                    this.explode();
                }
            } else {
                if (this.ricochet) {
                    this.ricochet = false;
                    this.facing = Directions.oppositeFrom(this.facing);
                    this.orientTowards(this.facing);
                    this.walk(this.facing);
                } else {
                    this.explode();
                }
            }
        }
    }, {
        key: "wasHit",
        value: function wasHit() {
            this.explode();
        }
    }]);

    return MissileActor;
}(Actor);

var Player = function (_Actor2) {
    _inherits(Player, _Actor2);

    function Player(representation) {
        _classCallCheck(this, Player);

        var _this2 = _possibleConstructorReturn(this, (Player.__proto__ || Object.getPrototypeOf(Player)).call(this, representation));

        _this2.isDead = false;
        _this2.myName = "no name";
        _this2.localPlayer = false;

        // The player always sees enemy missiles as yellow-red.
        // The player always sees its own missiles as green.
        _this2.enemyMissileColor = 0xFF0000 + (Math.floor(Math.random() * 256) << 8);
        _this2.selfMissileColor = 0x00FF00;
        _this2.recycledMissiles = [];
        return _this2;
    }

    _createClass(Player, [{
        key: "dispose",
        value: function dispose() {
            _get(Player.prototype.__proto__ || Object.getPrototypeOf(Player.prototype), "dispose", this).call(this);
            for (var i = 0; i < this.recycledMissiles.length; i++) {
                this.recycledMissiles[i].dispose();
                this.recycledMissiles[i] = null;
            }
            this.recycledMissiles = null;
        }
    }, {
        key: "makeMissile",
        value: function makeMissile() {
            if (this.recycledMissiles.length) {
                return this.recycledMissiles.pop();
            } else {
                var missileRep = this.representation.getMissileRepresentation(this.missileColor);
                var missile = new MissileActor(missileRep, this);
                return missile;
            }
        }
    }, {
        key: "recycleMissile",
        value: function recycleMissile(missile) {
            if (this.recycledMissiles) {
                this.recycledMissiles.push(missile);
            }
        }
    }, {
        key: "shoot",
        value: function shoot() {
            this.notifyObservers("shoot");

            var missile = this.makeMissile();
            missile.launch({ shotBy: this });
            actors.add(missile);
            missile.startAnimation();
            return missile;
        }
    }, {
        key: "wasHit",
        value: function wasHit(data) {
            if (this.isDead || theme && theme.isFading) {
                return;
            }
            this.notifyObservers("wasHit", data.shotBy);
            if (this.localPlayer) {
                // When localPlayer is true, the player will shotDead when
                // it is hit. Remote players are shot only upon receipt of
                // a ratDead packet.
                this.shotDead(data.shotBy);
            }
        }
    }, {
        key: "shotDead",
        value: function shotDead(killedBy) {
            var _this3 = this;

            this.isDead = true;
            this.notifyObservers("shotDead", function () {
                _this3.respawn();
            });
        }
    }, {
        key: "respawn",
        value: function respawn() {
            if (this.localPlayer) {
                // Only the local player has the responsibility of
                // choosing a new position when respawning
                this.setPosition(maze.getRandomPosition());
                this.orientTowardsPassage();
            }
            this.isDead = false;
            this.notifyObservers("respawn");
        }
    }, {
        key: "setLocalPlayer",
        value: function setLocalPlayer(isSelf) {
            this.localPlayer = true;
            this.isSelf = isSelf;
        }
    }, {
        key: "missileColor",
        get: function () {
            return this.isSelf ? this.selfMissileColor : this.enemyMissileColor;
        }
    }, {
        key: "name",
        set: function (name) {
            this.representation.name = name;
            this.myName = name;
        },
        get: function () {
            return this.myName;
        }
    }]);

    return Player;
}(Actor);