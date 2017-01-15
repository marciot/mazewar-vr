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

class NetworkTransmitter {
    constructor(network, networkedGame, myId) {
        this.network  = network;
        this.ratId    = myId;
        this.game     = networkedGame;
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

    shoot() {
        this.network.ratShoots(this.ratId);
    }

    wasHit(byWhom) {
        var killedBy = this.game.getActorRatId(byWhom);
        this.network.ratKilled(this.ratId, killedBy);
    }
}

class NetworkedGame {
    constructor(playerFactory) {
        this.factory  = playerFactory;

        this.players = [];
    }

    startGame(hostId, playerName, stateChangedCallback) {
        // Create the new players
        this.selfPlayer         = this.factory.newSelfPlayer();
        this.selfPlayer.name    = playerName;
        this.selfPlayer.setLocalPlayer(true);

        this.waitingForOpponent = true;
        this.stateChangedCallback = stateChangedCallback;

        // Start networking

        var initialPlayer = {
            name: this.selfPlayer.name,
            xLoc: this.selfPlayer.x,
            yLoc: this.selfPlayer.z,
            dir:  Directions.toAltoDir(this.selfPlayer.facing)
        };

        this.mazeService = new RetroWeb.PupMazeWarServices(initialPlayer, false);

        this.mazeService.addEventListener("newGame",   this.newGameCallback.bind(this));
        this.mazeService.addEventListener("ratUpdate", this.ratUpdateCallback.bind(this));
        this.mazeService.addEventListener("ratKill",   this.ratKillCallback.bind(this));
        this.mazeService.addEventListener("ratDead",   this.ratDeadCallback.bind(this));

        this.server = new RetroWeb.PupServer();
        this.server.addService(this.mazeService);
        this.server.startServices(hostId, 0, stateChangedCallback);
    }

    newGameCallback(myId, rat) {
        console.log("New game, my rat id is", myId);
        this.selfPlayer.addObserver(new NetworkTransmitter(this.mazeService, this, myId));
        this.selfPlayer.name = rat.name;

        if(this.players[myId]) {
            console.log("WARNING: This slot is already occupied");
        } else {
            this.players[myId] = this.selfPlayer;
        }
    }

    ratUpdateCallback(ratId, rat) {
        var actor = this.players[ratId];

        if(this.waitingForOpponent) {
            this.stateChangedCallback("opponentAvailable");
            this.waitingForOpponent = false;
        }

        if(!actor) {
            console.log("Creating player", ratId);
            actor = this.factory.newOtherPlayer();
            this.players[ratId] = actor;
            actor.name = rat.name;
        }

        actor.setPosition(rat.xLoc, rat.yLoc);
        actor.orientTowards(Directions.fromAltoDir(rat.dir));
    }

    ratKillCallback(ratId, rat) {
        var actor = this.players[ratId];
        actor.setPosition(rat.xLoc, rat.yLoc);
        actor.orientTowards(Directions.fromAltoDir(rat.dir));
        actor.shoot();
    }

    ratDeadCallback(ratId, killedBy) {
        var actor = this.players[ratId];
        actor.shotDead(this.players[killedBy]);
    }

    getActorRatId(actor) {
        for(var ratId = 0; ratId < this.players.length; ratId++) {
            if(this.players[ratId] === actor) {
                return ratId;
            }
        }
    }

    endGame() {
        actors.disposeAll();
    }
}

class SoloGame {
    constructor(playerFactory) {
        this.factory  = playerFactory;
    }

    startGame() {
        const numberOfRobots = 3;

        var self  = this.factory.newSelfPlayer();
        self.setLocalPlayer(true);

        for(var i = 0; i < numberOfRobots; i++) {
            var robot = this.factory.newRobotPlayer();
            robot.setLocalPlayer();
        }
    }

    endGame() {
        actors.disposeAll();
    }
}