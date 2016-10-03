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

const eyeHeight = 1.6;
const eyeRadius = 0.75;

// Keeps track of the various actors
class Actors {
    constructor() {
        this.actors = [];
    }
    
    add(actor) {
        this.actors.push(actor);
        scene.add(actor.representation);
    }
    
    remove(actor) {
        var index = this.actors.indexOf(actor);
        if (index > -1) {
            this.actors.splice(index, 1);
        }
        scene.remove(actor.representation);
    }
    
    animate() {
        for(var i = 0; i < this.actors.length; i++) {
            this.actors[i].animate(i);
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
};

// Actors are anything that has a position within the maze.
class Actor {
    constructor() {
        this.animationFrames = 0;
        this.x = 1;
        this.z = 1;
        
        this.fallSpeed = 0;
    }

    setPosition(x, z) {
        if(Array.isArray(x)) {
            this.setPosition(x[0],x[1]);
            return;
        }
        
        this.x = x;
        this.z = z;
        
        var u = Directions.toUnitVector(Directions.NORTH);
        var v = Directions.toUnitVector(Directions.EAST);
        this.setPositionFromVector(u.multiplyScalar(MazeWalls.cellDimension*this.z).add(
                               v.multiplyScalar(MazeWalls.cellDimension*this.x)));
    }
    
    orientTowardsPassage() {
        this.orientTowards(this.choosePassage());
    }

    choosePassage() {
        var dir = Directions.fromInteger(Math.floor(Math.random() * 4));
        while(!this.canWalk(dir)) {
            dir = Directions.rightFrom(dir);
        }
        return dir;
    }

    startAnimation(displacement, direction) {
        this.animationTween = 0;
        this.animationStep  = 0.05;
        if(displacement) {
            this.animationDisplacement = displacement;
        }
        if(direction) {
            this.animationQuaternionStart = new THREE.Quaternion().copy(this.quaternion);
            this.animationQuaternionEnd   = new THREE.Quaternion();
            this.animationQuaternionEnd.setFromUnitVectors(
                Directions.toUnitVector(Directions.NORTH),
                direction
            );
        }
    }

    animate() {
        if(this.animationTween !== null) {
            if(this.animationTween < 1.0) {
                this.animationTween += this.animationStep;
                if(this.animationDisplacement) {
                    var displacement = new THREE.Vector3().copy(this.animationDisplacement);
                    displacement.multiplyScalar(this.animationStep);
                    this.displace(displacement);
                }
                if(this.animationQuaternionEnd) {
                    var q = new THREE.Quaternion();
                    q.copy(this.animationQuaternionStart);
                    q.slerp(this.animationQuaternionEnd,this.animationTween);
                    this.quaternion = q;
                }
            } else {
                this.animationTween = null;
                this.animationDisplacement = null;
                this.animationQuaternionEnd = null;
                this.animationFinished();
            }
        }
    }

    animationFinished() {
        if(this.fallAcceleration) {
            this.fallSpeed += this.fallAcceleration;
            if(this.fallSpeed < 80) {
                this.startAnimation(
                    new THREE.Vector3(0, -this.fallSpeed, 0)
                );
            } else {
                this.fallSpeed        = 0;
                this.fallAcceleration = 0;
                this.respawn();
            }
        }
    }
    
    startFalling(acceleration) {
        if(!this.fallAcceleration) {
            this.fallSpeed = 0;
            this.fallAcceleration = acceleration;
            this.animationFinished();
        }
    }
    
    isFalling() {
        return this.fallAcceleration;
    }

    canWalk(direction) {
        return (direction & maze.passageDirections(this.x, this.z));
    }

    /* Animated turn until the Actor faces the direction indicated by the unit vector  */
    turnTowards(direction) {
        this.startAnimation(null, Directions.toUnitVector(direction));
    }

    /* Immediately orients the Actor to face the direction indicated by the unit vector */
    orientTowards(direction) {
        this.quaternion.setFromUnitVectors(
                Directions.toUnitVector(Directions.NORTH),
                Directions.toUnitVector(direction)
        );
    }

    /* Animated movement in the indicated direction */
    walk(direction) {
        var direction = direction || this.cardinalDirection;

        if(!this.canWalk(direction)) {
            return false;
        }

        switch(direction) {
            case Directions.NORTH: this.z++; break;
            case Directions.EAST:  this.x++; break;
            case Directions.SOUTH: this.z--; break;
            case Directions.WEST:  this.x--; break;
        }
        var u = Directions.toUnitVector(direction);
        this.startAnimation(u.multiplyScalar(MazeWalls.cellDimension));
    }

    get cardinalDirection() {
        var direction = this.directionVector;
        var angle = Math.atan2(direction.z, direction.x)/Math.PI*180;
        
        if(angle > -45 && angle <= 45) {
            return Directions.EAST;
        }
        else if(angle > 45 && angle <= 135) {
            return Directions.NORTH;
        }
        else if(angle > 135 || angle <= -135) {
            return Directions.WEST;
        }
        if(angle > -135 || angle <= -45) {
            return Directions.SOUTH;
        }
    }

    get isStopped() {
        return this.animationTween === null;
    }
};

// VisibleActors have a visual representation, generally a THREE.Mesh
class VisibleActor extends Actor {
    get directionVector() {
        var u = new THREE.Vector3( 0, 0, -1 );
        u.applyEuler(this.mesh.rotation);
        return u;
    }

    displace(displacement) {
        this.mesh.position.add(displacement);
    }

    setPositionFromVector(v) {
        v.y = this.mesh.position.y;
        this.mesh.position.set(v.x, v.y, v.z);
    }

    get quaternion() {
        return this.mesh.quaternion;
    }

    set quaternion(quaternion) {
        this.mesh.rotation.setFromQuaternion(quaternion);
    }

    get representation() {
        return this.mesh;
    }
}

// OtherPlayers are rendered as eyeballs
class OtherPlayer extends VisibleActor {
    constructor() {
        super();

        var geometry = new THREE.SphereGeometry( eyeRadius, 64, 64 );

        this.mesh = new THREE.Mesh(geometry, theme.eyeMaterial);
        this.mesh.castShadow = true;

        this.mesh.position.y = eyeHeight;

        super.setPosition(this.x, this.z);
    }
}

class Missile extends VisibleActor {
    constructor(fromPlayer) {
        super();

        //var geometry = new THREE.ConeGeometry( 0.1, 0.3, 32 );
        var geometry = new THREE.TorusKnotGeometry(0.1, 0.02, 18);
        geometry.rotateZ(-Math.PI/2);

        this.mesh = new THREE.Mesh(geometry, theme.missileMaterial);
        this.mesh.castShadow = true;
        this.mesh.position.y = 1.5;

        this.x      = fromPlayer.x;
        this.z      = fromPlayer.z;
        this.facing = fromPlayer.cardinalDirection;
        
        this.ricochet = true;
        
        super.setPosition(this.x, this.z);
        this.orientTowards(this.facing);
    }
    
    animate() {
        super.animate();
        this.mesh.rotation.x += 0.1;
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
                actors.remove(this);
            }
        }
        
        var hit = actors.isOccupied(this.x, this.z, this);
        if(hit && hit.wasShot) {
            hit.wasShot();
            actors.remove(this);
        }
    }
    
    wasShot() {
        actors.remove(this);
    }
};

// A RobotPlayer moves around the maze on its own volition
class RobotPlayer extends OtherPlayer {
    constructor() {
        super();
        this.orientTowards(this.choosePassage());
        this.isDead   = false;
    }
    
    orientTowards(direction) {
        super.orientTowards(direction);
        this.facing = direction;
    }
    
    startMoving() {
        this.animationFinished();
    }

    animate() {
        super.animate();
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

    animationFinished() {
        super.animationFinished();
        if(!this.isDead) {
            var direction = this.chooseDirection();
            if(direction == this.facing) {
                this.walk(direction);
            } else {
                this.turnTowards(direction);
            }
        } else {
            this.startFalling(1);
        }
    }

    turnTowards(direction) {
        this.facing = direction;
        super.turnTowards(direction);
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
        // Roll up
        this.turnTowards(Directions.UP);
    }
    
    respawn() {
        this.mesh.position.y = eyeHeight;
        this.isDead = false;
        
        this.setPosition(maze.getRandomPosition());
        this.orientTowardsPassage();
        this.animationFinished();
    }
};

// A Map displays a map of the maze. It is carried by the SelfPlayer.
class Map extends VisibleActor {
    constructor() {
        super();
        
        const mapHeight      = 0.1;
        const mapWidth       = 0.2;
        const mapDistance    = 0.3;
        const mapDeclination = 50;

        var obj = new THREE.Object3D();
        
        this.cellSize = 6;
        
        this.mapCanvas = document.createElement("canvas");
        this.mapCanvas.width  = maze.mazeCols * this.cellSize;
        this.mapCanvas.height = maze.mazeRows * this.cellSize;
        
        this.mapTexture    = new THREE.Texture(this.mapCanvas);
        
        this.update();
        
        this.mapMaterial   = new THREE.MeshPhongMaterial({
            color:     0xffffff,
            specular:  0xffffff,
            shininess: 20,
            shading:   THREE.FlatShading,
            map:       this.mapTexture
        });
        
        var geometry = new THREE.PlaneGeometry(mapWidth, mapHeight);
        var plane    = new THREE.Mesh(geometry, this.mapMaterial);
        
        plane.rotation.y = Math.PI;
        plane.position.z = mapDistance;
        obj.add(plane);
        
        this.mesh = obj;
        this.mesh.position.y = eyeHeight;
        this.mesh.rotation.order = 'YXZ';
        this.mesh.rotation.x = Math.PI/ 180 * mapDeclination;
        
        super.setPosition(this.x, this.z);
    }
    
    drawCell(ctx, x, z) {
        ctx.fillRect(x*this.cellSize, z*this.cellSize, this.cellSize, this.cellSize);
    }
    
    update() {
        var ctx = this.mapCanvas.getContext('2d');
        
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, this.mapCanvas.width, this.mapCanvas.height);
        
        ctx.fillStyle = "green";
        
        var me = this;
        maze.forAll(function(x,z) {
            if(maze.getCell(x, z)) {
                me.drawCell(ctx, x, z);
            }
        });
        
        this.mapTexture.needsUpdate = true;
    }
    
    // Paints a red dot representing the location of the character.
    whereAmI(x, z) {        
        var ctx = this.mapCanvas.getContext('2d');
        if(this.oldX) {
            ctx.fillStyle = "white";
            this.drawCell(ctx, this.oldX, this.oldZ);
        }
        ctx.fillStyle = "red";
        this.drawCell(ctx, x, z);
        this.oldX = x;
        this.oldZ = z;
        this.mapTexture.needsUpdate = true;
    }
    
    // Translates and rotates the map to the location of another object
    carriedBy(object) {
        var u = new THREE.Vector3( 0, 0, -1 );
        u.applyEuler(object.rotation);
        
        var turnTowards = new THREE.Vector3();
        var angle = Math.atan2(u.x, u.z);
        this.mesh.rotation.y = angle;
        this.mesh.position.copy(object.position);
    }
    
    hide() {
        this.mesh.visible = false;
    }
    
    show() {
        this.mesh.visible = true;
    }
};

// The player's own character. It carries the camera and a map around
class SelfPlayer extends Actor {
    constructor(camera) {
        super();

        this.camera = camera;
        this.autoWalk = false;
        
        this.setPosition(this.x, this.z);
        
        this.map = new Map();
        
        this.isDead   = false;
    }

    get representation() {
        return this.map.representation;
    }

    displace(displacement) {
        this.camera.position.add(displacement);
    }
    
    setPositionFromVector(v) {
        v.y = this.camera.position.y;
        
        this.camera.position.set(v.x, v.y, v.z);
    }

    get directionVector() {
        var u = new THREE.Vector3( 0, 0, -1 );
        u.applyEuler(this.camera.rotation);
        return u;
    }
    
    walk(direction) {
        super.walk(direction);
        this.map.whereAmI(this.x, this.z);
        
    }
    animate() {
        super.animate();
        this.map.carriedBy(this.camera);
        if(this.isFalling()) {
            this.camera.rotation.z += 0.01;
        }
    }

    animationFinished() {
        super.animationFinished();
        if(!this.isDead) {
            if(this.autoWalk) {
                this.walk();
            }
        }
    }

    setAutoWalk(state) {
        this.autoWalk = state;
        if(this.isStopped) {
            this.walk();
        }
    }
    
    get quaternion() {
        return this.camera.quaternion;
    }
    
    set quaternion(quaternion) {
        console.log("Setting camera quaternion");
        this.camera.rotation.setFromQuaternion(quaternion);
    }
    
    shoot() {
        var missile = new Missile(this);
        actors.add(missile);
    }
    
    wasShot() {
        this.isDead = true;
        this.turnTowards(Directions.DOWN); // Why is this reversed?
        this.startFalling(2);
        controls.enabled = false;
        
        this.map.hide();
    }
    
    respawn() {
        this.camera.position.y = eyeHeight;
        this.isDead = false;
        controls.enabled = true;
        this.map.show();
        
        this.setPosition(maze.getRandomPosition());
        this.orientTowardsPassage();
    }
};