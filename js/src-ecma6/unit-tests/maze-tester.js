const sprites = {
    NORTH: "&#11014;",
    EAST:  "&#10145;",
    SOUTH: "&#11015;",
    WEST:  "&#11013;",
    DEAD:   "&#10006;"
};

class MazeRepresentation {
    constructor(tableEl, maze) {
        tableEl.innerHTML = "";
        for(var y = 0; y < maze.mazeRows; y++) {
            var rowEl = document.createElement("tr");
            for(var x = 0; x < maze.mazeCols; x++) {
                var cellEl = document.createElement("td");
                cellEl.id = this.cellId(x,y);
                if(maze.getCell(x,y)) {
                    cellEl.className = "filled";
                }
                rowEl.appendChild(cellEl);
            }
            tableEl.appendChild(rowEl);
        }
    }

    cellId(x,y) {
        return "cell" + x + "_" + y;
    }

    moveSpriteToCell(x, y, dom) {
        var cellEl = document.getElementById(this.cellId(x,y));
        if(cellEl) {
            cellEl.appendChild(dom);
        } else {
            console.log("Invalid sprite location", x, y);
        }
    }
}

class PlayerRepresentation {
    constructor(type) {
        this.dir = Directions.NORTH;
        this.callback = null;

        this.dom = document.createElement("div");
        this.dom.className = "sprite " + type;
        this.type = type;
    }

    setSpriteToArrow() {
        var text = "";
        switch(this.dir) {
            case Directions.NORTH: text=sprites.NORTH; break;
            case Directions.EAST:  text=sprites.EAST; break;
            case Directions.SOUTH: text=sprites.SOUTH; break;
            case Directions.WEST:  text=sprites.WEST; break;
        }
        this.dom.innerHTML = text;
    }

    setAnimationFinishedCallback(callback) {
        this.callback = callback;
    }

    shotDead(respawnCallback) {
        this.dom.innerHTML = sprites.DEAD;
        setTimeout(respawnCallback, 1000);
    }

    respawn() {
        this.setSpriteToArrow();
    }

    setPosition(x, z) {
        mazeRep.moveSpriteToCell(x, z, this.dom);
    }

    walkTo(x, z, direction) {
        mazeRep.moveSpriteToCell(x, z, this.dom);
        this.scheduleCallback();
    }

    orientTowards(direction) {
        this.turnTowards(direction);
    }

    turnTowards(direction) {
        this.dir = direction;
        this.setSpriteToArrow();
        this.scheduleCallback();
    }

    timerCallback() {
        this.timer = null;
        if(this.callback) {
            this.callback();
        }
    }

    scheduleCallback() {
        if(!this.timer) {
            var interval = (this.type === "missile") ? 100 : 1000;
            this.timer = setTimeout(this.timerCallback.bind(this), interval);
        }
    }

    startAnimation() {
        this.scheduleCallback();
    }

    dispose() {
        this.dom.remove();
        this.callback = null;
    }

    getMissileRepresentation() {
        return new PlayerRepresentation("missile");
    }

    get cardinalDirection() {
        return this.dir;
    }

    set name(name) {
        this.dom.title = name;
    }
};


var self;
var playerNameField, hostIdField;
var actors, maze, mazeRep, gameMaster;

var playerFactory = {
    newSelfPlayer: function() {
        var actor = new Player(new PlayerRepresentation("selfPlayer"));
        actors.placePlayer(actor);
        new KeyboardDirector(actor);
        self = actor;
        return actor;
    },
    newRobotPlayer: function() {
        var actor = new Player(new PlayerRepresentation("robotPlayer"));
        actors.placePlayer(actor);
        new RoboticDirector(actor);
        return actor;
    },
    newOtherPlayer: function() {
        var actor = new Player(new PlayerRepresentation("netPlayer"));
        actors.placePlayer(actor);
        return actor;
    }
};

function startGame() {
    var startGameButton = document.getElementById("startGameButton");
    if(!playerNameField.value) {
        return;
    }

    hostIdField.disabled     = true;
    playerNameField.disabled = true;
    startGameButton.disabled = true;

    gameMaster.endGame();
    gameMaster = new NetworkedGame(playerFactory);

    gameMaster.startGame(
        parseInt(hostIdField.value),
        playerNameField.value,
        function stateChangedCallback(state) {
            startGameButton.innerText = state;
        }
    );

    window.focus();
}

function initMazeTester() {
    actors  = new Actors();
    maze    = new Maze();
    mazeRep = new MazeRepresentation(document.querySelector("#maze"), maze);
    
    gameMaster = new SoloGame(playerFactory);
    gameMaster.startGame();

    /* Suggest a random hostId */
    const ETHERNET_ADDR_MIN       = 0x01;
    const ETHERNET_ADDR_MAX       = 0xFF;

    playerNameField = document.getElementById("playerName");
    hostIdField = document.getElementById("hostId");
    hostIdField.value = Math.floor(Math.random() * (ETHERNET_ADDR_MAX - ETHERNET_ADDR_MIN)) + ETHERNET_ADDR_MIN;

    document.getElementById("touchLeft").addEventListener("click", function(e) {self.turnLeft();});
    document.getElementById("touchRight").addEventListener("click", function(e) {self.turnRight();});
    document.getElementById("touchForward").addEventListener("click", function(e) {self.walk();});
    document.getElementById("touchBackward").addEventListener("click", function(e) {self.walkBackwards();});
    document.getElementById("touchUTurn").addEventListener("click", function(e) {self.aboutFace();});
}
