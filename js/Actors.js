/*
MazeWars VR
Copyright (C) 2016 Marcio Teixeira

This program is free software; you can redistribute it and/or
modify it under the terms of the GNU General Public License
as published by the Free Software Foundation; either version 2
of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
*/

// Keeps track of the various actors
class Actors {
    constructor() {
        this.actors = [];
    }
    
    add(actor) {
        this.actors.push(actor);
        return actor;
    }
    
    remove(actor) {
        var index = this.actors.indexOf(actor);
        if (index > -1) {
            this.actors.splice(index, 1);
        }
    }
    
    get first() {
        return this.actors[0];
    }
    
    isOccupied(x, z, except) {
        for(var i = 0; i < this.actors.length; i++) {
            if((this.actors[i] !== except) && (this.actors[i].x) === x && (this.actors[i].z === z)) {
                return this.actors[i];
            }
        }
    }

    placePlayer(player) {
        player.setPosition(maze.getRandomPosition());
        player.orientTowardsPassage();
        player.startAnimation();
        this.add(player);
    }
};

// Actors are anything that has a position within the maze.
class Actor {
    constructor(representation) {
        this.x = 1;
        this.z = 1;
        this.facing = Directions.NORTH;
        this.representation = representation;
        if(this.representation) {
            this.representation.setPosition(this.x, this.z);
        }
    }

    setPosition(x, z) {
        if(Array.isArray(x)) {
            this.setPosition(x[0],x[1]);
            return;
        }
        this.x = x;
        this.z = z;
        if(this.representation) {
            this.representation.setPosition(x, z);
        }
    }

    choosePassage() {
        var dir = Directions.fromInteger(Math.floor(Math.random() * 4));
        while(!this.canWalk(dir)) {
            dir = Directions.rightFrom(dir);
        }
        return dir;
    }

    canWalk(direction) {
        return (direction & maze.passageDirections(this.x, this.z));
    }

    /* Movement in the indicated direction */
    walk(direction) {
        direction = direction || this.facing;

        if(!this.canWalk(direction)) {
            return false;
        }

        switch(direction) {
            case Directions.NORTH: this.z--; break;
            case Directions.EAST:  this.x++; break;
            case Directions.SOUTH: this.z++; break;
            case Directions.WEST:  this.x--; break;
        }
        if(this.representation) {
            if(this.representation.walk) {
                this.representation.walk(direction);
            } else {
                this.representation.setPosition(this.x, this.z, direction);
            }
        }
        return true;
    }

    orientTowards(direction) {
        this.facing = direction;
        if(this.representation) {
            this.representation.orientTowards(direction);
        }
    }

    orientTowardsPassage() {
        this.orientTowards(this.choosePassage());
    }

    turnTowards(direction) {
        this.facing = direction;
        if(this.representation) {
            this.representation.turnTowards(direction);
        }
    }

    startAnimation() {
        if(this.representation) {
            this.representation.startAnimation();
        }
    }

    turnRight() {
        this.turnTowards(Directions.rightFrom(this.facing));
    }

    turnLeft() {
        this.turnTowards(Directions.leftFrom(this.facing));
    }

    aboutFace() {
        this.turnTowards(Directions.oppositeFrom(this.facing));
    }

    walkBackwards() {
        this.walk(Directions.oppositeFrom(this.facing));
    }
};

class RobotPlayer extends Actor {
    constructor(representation) {
        super(representation);
        this.orientTowards(this.choosePassage());
        this.isDead   = false;

        representation.setAnimationFinishedCallback(this.animationFinished.bind(this));
    }
    
    // Chooses a direction by considering all possibilities and
    // giving a bias towards moving forwards. 
    chooseDirection() {
        function flipCoin() {
            return Math.floor(Math.random()*2);
        }
        
        var canGoStraight = this.canWalk(this.facing);
        var canGoLeft     = this.canWalk(Directions.leftFrom(this.facing));
        var canGoRight    = this.canWalk(Directions.rightFrom(this.facing));
        
        // 1:1 odds of going straight if there is the possibility to turn.
        if(canGoStraight && (!(canGoLeft || canGoRight) || flipCoin())) {
            return this.facing;
        }
        
        // 1:1 odds of going left or right, or about-face if no other choice.
        if(flipCoin()) {
            // Try to go right, then left, then reverse
            if(canGoRight) {
                return Directions.rightFrom(this.facing);
            } else if(canGoLeft) {
                return Directions.leftFrom(this.facing);
            } else {
                return Directions.oppositeFrom(this.facing);
            }
        } else {
            // Try to go left, then right, then reverse
            if(canGoLeft) {
                return Directions.leftFrom(this.facing);
            } else if(canGoRight) {
                return Directions.rightFrom(this.facing);
            } else {
                return Directions.oppositeFrom(this.facing);
            }
        }
    }

    turn(direction) {
        if(direction > 0) {
            this.facing = Directions.fromInteger(Directions.toInteger(this.facing) + 1);
        } else {
            this.facing = Directions.fromInteger(Directions.toInteger(this.facing) + 3);
        }
    }

    wasShot() {
        this.isDead = true;
        this.representation.wasShot();
    }

    respawn() {
        this.isDead = false;
        this.setPosition(maze.getRandomPosition());
        this.orientTowardsPassage();
    }

    animationFinished() {
        if(!this.isDead) {
            var direction = this.chooseDirection();
            if(direction == this.facing) {
                this.walk(direction);
            } else {
                this.turnTowards(direction);
            }
        }
    }
}

class SelfPlayer extends Actor {
    constructor(representation) {
        super(representation);
        this.isDead   = false;
        this.autoWalk = false;

        representation.setAnimationFinishedCallback(this.animationFinished.bind(this));
    }

    shoot() {
        this.representation.shoot(this).startAnimation();
    }

    wasShot() {
        this.isDead = true;
        this.representation.wasShot();
    }

    respawn() {
        this.isDead = false;
        this.setPosition(maze.getRandomPosition());
        this.orientTowardsPassage();
    }

    animationFinished() {
        if(!this.isDead) {
            if(this.autoWalk) {
                this.walk();
            }
        }
    }

    walk(direction) {
        super.walk(direction || this.representation.cardinalDirection);
        if(this.representation.map) {
            this.representation.map.whereAmI(this.x, this.z);
        }
    }

    setAutoWalk(state) {
        this.autoWalk = state;
        if(this.representation.isStopped) {
            this.walk();
        }
    }
}

class MissileActor extends Actor {
    constructor(representation, fromPlayer) {
        super(representation)
        this.x      = fromPlayer.x;
        this.z      = fromPlayer.z;
        this.facing = fromPlayer.representation.cardinalDirection;

        this.ricochet = true;

        super.setPosition(this.x, this.z);
        this.orientTowards(this.facing);

        representation.setAnimationFinishedCallback(this.animationFinished.bind(this));
    }

    animationFinished() {
        if(this.canWalk(this.facing)) {
            this.walk(this.facing);
        } else {
            if(this.ricochet) {
                this.ricochet = false;
                this.facing = Directions.oppositeFrom(this.facing);
                this.orientTowards(this.facing);
                this.walk(this.facing);
            } else {
                this.destroy();
            }
        }

        var hit = actors.isOccupied(this.x, this.z, this);
        if(hit && hit.wasShot) {
            hit.wasShot();
            this.destroy();
        }
    }

    wasShot() {
        this.destroy();
    }

    destroy() {
        this.representation.destroy(this);
    }
}