class NetworkObserver {
    constructor(network, myId) {
        this.network  = network;
        this.ratId    = myId;
    }

    walkTo(x, z, direction) {
        this.network.setRatPosition(this.ratId, x, z);
    }

    setPosition(x, z) {
        this.network.setRatPosition(this.ratId, x, z);
    }

    orientTowards(direction) {
        this.network.setRatDirection(this.ratId, Directions.toAltoDir(direction));
    }

    turnTowards(direction) {
        this.network.setRatDirection(this.ratId, Directions.toAltoDir(direction));
    }
}

class NetworkedGame {
    constructor(playerFactory) {
        this.factory  = playerFactory;

        this.players = [];
    }

    startGame(hostId, playerName, stateChangedCallback) {
        // Create the new players
        this.selfPlayer = this.factory.newSelfPlayer();
        this.selfPlayer.name = playerName;

        // Start networking

        var initialPlayer = {
            name: this.selfPlayer.name,
            xLoc: this.selfPlayer.x,
            yLoc: this.selfPlayer.z,
            dir:  Directions.toAltoDir(this.selfPlayer.facing)
        };

        this.mazeService = new RetroWeb.PupMazeWarServices(initialPlayer);

        this.mazeService.addEventListener("newGame",   this.newGameCallback.bind(this));
        this.mazeService.addEventListener("ratUpdate", this.ratUpdateCallback.bind(this));

        this.server = new RetroWeb.PupServer();
        this.server.addService(this.mazeService);
        this.server.startServices(hostId, 0, stateChangedCallback);
    }

    newGameCallback(myId, rat) {
        console.log("New game, my rat id is", myId);
        this.selfPlayer.addObserver(new NetworkObserver(this.mazeService, myId));

        if(this.players[myId]) {
            console.log("WARNING: This slot is already occupied");
        } else {
            this.players[myId] = this.selfPlayer;
        }
    }

    ratUpdateCallback(ratId, rat) {
        var actor = this.players[ratId];

        if(!actor) {
            console.log("Creating player", ratId);
            actor = this.factory.newOtherPlayer();
            this.players[ratId] = actor;
            actor.name = rat.name;
        }

        actor.setPosition(rat.xLoc, rat.yLoc);
        actor.orientTowards(Directions.fromAltoDir(rat.dir));
    }
}

class SoloGame {
    constructor(playerFactory) {
        this.factory  = playerFactory;
    }

    startGame() {
        var self  = this.factory.newSelfPlayer();
        var robot = this.factory.newRobotPlayer();
    }

    endGame() {
        actors.removeAll();
    }
}