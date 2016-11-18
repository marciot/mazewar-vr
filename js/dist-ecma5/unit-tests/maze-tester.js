var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var sprites = {
    NORTH: "&#11014;",
    EAST: "&#10145;",
    SOUTH: "&#11015;",
    WEST: "&#11013;",
    DEAD: "&#10006;"
};

var MazeRepresentation = function () {
    function MazeRepresentation(tableEl, maze) {
        _classCallCheck(this, MazeRepresentation);

        tableEl.innerHTML = "";
        for (var y = 0; y < maze.mazeRows; y++) {
            var rowEl = document.createElement("tr");
            for (var x = 0; x < maze.mazeCols; x++) {
                var cellEl = document.createElement("td");
                cellEl.id = this.cellId(x, y);
                if (maze.getCell(x, y)) {
                    cellEl.className = "filled";
                }
                rowEl.appendChild(cellEl);
            }
            tableEl.appendChild(rowEl);
        }
    }

    _createClass(MazeRepresentation, [{
        key: "cellId",
        value: function cellId(x, y) {
            return "cell" + x + "_" + y;
        }
    }, {
        key: "moveSpriteToCell",
        value: function moveSpriteToCell(x, y, dom) {
            var cellEl = document.getElementById(this.cellId(x, y));
            if (cellEl) {
                cellEl.appendChild(dom);
            } else {
                console.log("Invalid sprite location", x, y);
            }
        }
    }]);

    return MazeRepresentation;
}();

var PlayerRepresentation = function () {
    function PlayerRepresentation(type) {
        _classCallCheck(this, PlayerRepresentation);

        this.dir = Directions.NORTH;
        this.callback = null;

        this.dom = document.createElement("div");
        this.dom.className = "sprite " + type;
        this.type = type;
    }

    _createClass(PlayerRepresentation, [{
        key: "setSpriteToArrow",
        value: function setSpriteToArrow() {
            var text = "";
            switch (this.dir) {
                case Directions.NORTH:
                    text = sprites.NORTH;break;
                case Directions.EAST:
                    text = sprites.EAST;break;
                case Directions.SOUTH:
                    text = sprites.SOUTH;break;
                case Directions.WEST:
                    text = sprites.WEST;break;
            }
            this.dom.innerHTML = text;
        }
    }, {
        key: "setAnimationFinishedCallback",
        value: function setAnimationFinishedCallback(callback) {
            this.callback = callback;
        }
    }, {
        key: "shotDead",
        value: function shotDead(respawnCallback) {
            this.dom.innerHTML = sprites.DEAD;
            setTimeout(respawnCallback, 1000);
        }
    }, {
        key: "respawn",
        value: function respawn() {
            this.setSpriteToArrow();
        }
    }, {
        key: "setPosition",
        value: function setPosition(x, z) {
            mazeRep.moveSpriteToCell(x, z, this.dom);
        }
    }, {
        key: "walkTo",
        value: function walkTo(x, z, direction) {
            mazeRep.moveSpriteToCell(x, z, this.dom);
            this.scheduleCallback();
        }
    }, {
        key: "orientTowards",
        value: function orientTowards(direction) {
            this.turnTowards(direction);
        }
    }, {
        key: "turnTowards",
        value: function turnTowards(direction) {
            this.dir = direction;
            this.setSpriteToArrow();
            this.scheduleCallback();
        }
    }, {
        key: "timerCallback",
        value: function timerCallback() {
            this.timer = null;
            if (this.callback) {
                this.callback();
            }
        }
    }, {
        key: "scheduleCallback",
        value: function scheduleCallback() {
            if (!this.timer) {
                var interval = this.type === "missile" ? 100 : 1000;
                this.timer = setTimeout(this.timerCallback.bind(this), interval);
            }
        }
    }, {
        key: "startAnimation",
        value: function startAnimation() {
            this.scheduleCallback();
        }
    }, {
        key: "dispose",
        value: function dispose() {
            this.dom.remove();
            this.callback = null;
        }
    }, {
        key: "getMissileRepresentation",
        value: function getMissileRepresentation() {
            return new PlayerRepresentation("missile");
        }
    }, {
        key: "cardinalDirection",
        get: function () {
            return this.dir;
        }
    }, {
        key: "name",
        set: function (name) {
            this.dom.title = name;
        }
    }]);

    return PlayerRepresentation;
}();

;

var self;
var playerNameField, hostIdField;

var actors = new Actors();
var maze = new Maze();
var mazeRep = new MazeRepresentation(document.querySelector("#maze"), maze);

var playerFactory = {
    newSelfPlayer: function () {
        var actor = new Player(new PlayerRepresentation("selfPlayer"));
        actors.placePlayer(actor);
        new KeyboardDirector(actor);
        self = actor;
        return actor;
    },
    newRobotPlayer: function () {
        var actor = new Player(new PlayerRepresentation("robotPlayer"));
        actors.placePlayer(actor);
        new RoboticDirector(actor);
        return actor;
    },
    newOtherPlayer: function () {
        var actor = new Player(new PlayerRepresentation("netPlayer"));
        actors.placePlayer(actor);
        return actor;
    }
};

var gameMaster = new SoloGame(playerFactory);
gameMaster.startGame();

function startGame() {
    var startGameButton = document.getElementById("startGameButton");
    if (!playerNameField.value) {
        return;
    }

    hostIdField.disabled = true;
    playerNameField.disabled = true;
    startGameButton.disabled = true;

    gameMaster.endGame();
    gameMaster = new NetworkedGame(playerFactory);

    gameMaster.startGame(parseInt(hostIdField.value), playerNameField.value, function stateChangedCallback(state) {
        startGameButton.innerText = state;
    });

    window.focus();
}

function initMazeTester() {
    /* Suggest a random hostId */
    var ETHERNET_ADDR_MIN = 0x01;
    var ETHERNET_ADDR_MAX = 0xFF;

    playerNameField = document.getElementById("playerName");
    hostIdField = document.getElementById("hostId");
    hostIdField.value = Math.floor(Math.random() * (ETHERNET_ADDR_MAX - ETHERNET_ADDR_MIN)) + ETHERNET_ADDR_MIN;

    document.getElementById("touchLeft").addEventListener("click", function (e) {
        self.turnLeft();
    });
    document.getElementById("touchRight").addEventListener("click", function (e) {
        self.turnRight();
    });
    document.getElementById("touchForward").addEventListener("click", function (e) {
        self.walk();
    });
    document.getElementById("touchBackward").addEventListener("click", function (e) {
        self.walkBackwards();
    });
    document.getElementById("touchUTurn").addEventListener("click", function (e) {
        self.aboutFace();
    });
}