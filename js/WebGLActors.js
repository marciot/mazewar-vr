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

class WebGLActors extends Actors {
    add(actor) {
        super.add(actor);
        scene.add(actor.representation.representation);
        return actor;
    }
    
    remove(actor) {
        super.remove(actor);
        scene.remove(actor.representation.representation);
    }
    
    animate() {
        for(var i = 0; i < this.actors.length; i++) {
            this.actors[i].representation.animate(i);
        }
    }
}

// VisibleRepresentations have a visual representation, generally a THREE.Mesh
class VisibleRepresentation {
    get representation() {
        return this.object;
    }
    
    get rotation() {
        return this.object.rotation;
    }
    
    get position() {
        return this.object.position;
    }
    
    set position(v) {
        v.y = this.object.position.y; // Ignore changes in y
        this.object.position.set(v.x, v.y, v.z);
    }

    displace(displacement) {
        this.object.position.add(displacement);
    }

    get quaternion() {
        return this.object.quaternion;
    }

    set quaternion(quaternion) {
        this.object.rotation.setFromQuaternion(quaternion);
    }
    
    hide() {
        this.object.visible = false;
    }
    
    show() {
        this.object.visible = true;
    }
    
    setPosition(x, z) {
        var u = Directions.toUnitVector(Directions.SOUTH).multiplyScalar(z * MazeWalls.cellDimension);
        var v = Directions.toUnitVector(Directions.EAST ).multiplyScalar(x * MazeWalls.cellDimension);
        this.position = u.add(v);
    }
    
    orientTowards(direction) {
        this.quaternion.setFromUnitVectors(
            Directions.toUnitVector(Directions.NORTH),
            Directions.toUnitVector(direction)
        );
    }
    
    get directionVector() {
        var u = Directions.toUnitVector(Directions.NORTH);
        u.applyEuler(this.rotation);
        return u;
    }
    
    get bearingInRadians() {
        var u = this.directionVector;
        return Math.atan2(u.x, -u.z);
    }
    
    get bearingInDegrees() {
        return this.bearingInRadians/Math.PI*180;
    }
    
    get cardinalDirection() {
        var angle = this.bearingInDegrees;
        if(angle > -45 && angle <= 45) {
            return Directions.NORTH;
        }
        else if(angle > 45 && angle <= 135) {
            return Directions.EAST;
        }
        else if(angle > 135 || angle <= -135) {
            return Directions.SOUTH;
        }
        if(angle > -135 || angle <= -45) {
            return Directions.WEST;
        }
    }
}

class AnimatedRepresentation extends VisibleRepresentation {
    constructor() {
        super();
        this.animationFrames = 0;        
        this.fallSpeed = 0;
        this.animationFinishedCallback = null;
    }
    
    walk(direction) {
        var u = Directions.toUnitVector(direction);
        this.doAnimation(u.multiplyScalar(MazeWalls.cellDimension));
    }
    
    /* Animated turn until the Actor faces the direction indicated by the unit vector  */
    turnTowards(direction) {
        this.doAnimation(null, Directions.toUnitVector(direction));
    }

    doAnimation(displacement, direction) {
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
                this.doAnimation(
                    new THREE.Vector3(0, -this.fallSpeed, 0)
                );
            } else {
                this.fallSpeed        = 0;
                this.fallAcceleration = 0;
                this.respawn();
            }
        }
        if(this.animationFinishedCallback) {
            this.animationFinishedCallback();
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
    
    get isStopped() {
        return this.animationTween === null;
    }
    
    setAnimationFinishedCallback(callback) {
        this.animationFinishedCallback = callback;
    }
    
    startAnimation() {
        this.animationFinished();
    }
}

class EyeRepresentation extends AnimatedRepresentation {
    constructor() {
        super();

        var geometry = new THREE.SphereGeometry( eyeRadius, 64, 64 );
        geometry.rotateY(Math.PI);
        
        this.object = new THREE.Mesh(geometry, theme.eyeMaterial);
        this.object.castShadow = true;

        this.object.position.y = eyeHeight;
    }
    
    wasShot() {
        this.turnTowards(Directions.UP);
        this.startFalling(1);
    }
    
    respawn() {
        this.object.position.y = eyeHeight;
        this.animationFinished();
    }
}

class MissileRepresentation extends AnimatedRepresentation {
    constructor() {
        super();

        //var geometry = new THREE.ConeGeometry( 0.1, 0.3, 32 );
        var geometry = new THREE.TorusKnotGeometry(0.1, 0.02, 18);
        geometry.rotateZ(-Math.PI/2);

        this.object = new THREE.Mesh(geometry, theme.missileMaterial);
        this.object.castShadow = true;
        this.object.position.y = 1.5;
    }
    
    animate() {
        super.animate();
        this.object.rotation.x += 0.1;
    }

    destroy(actor) {
        actors.remove(actor);
    }
};

// A Map displays a map of the maze. It is carried by the SelfPlayer.
class MapRepresentation extends VisibleRepresentation {
    constructor() {
        super();
        
        const mapHeight      = 0.1;
        const mapWidth       = 0.2;
        const mapDistance    = 0.3;
        const mapDeclination = 50;
        
        this.cellSize = 4;
        
        this.mapCanvas = document.createElement("canvas");
        this.mapCanvas.width  = maze.mazeCols * this.cellSize;
        this.mapCanvas.height = maze.mazeRows * this.cellSize;
        
        this.mapTexture    = new THREE.Texture(this.mapCanvas);
        
        this.drawMap();
        
        this.mapMaterial   = new THREE.MeshPhongMaterial({
            color:     0xffffff,
            specular:  0xffffff,
            shininess: 20,
            shading:   THREE.FlatShading,
            map:       this.mapTexture,
            side:      THREE.FrontSide
        });
        
        var geometry = new THREE.PlaneGeometry(mapWidth, mapHeight);
        var plane    = new THREE.Mesh(geometry, this.mapMaterial);
        plane.position.copy(
            Directions.toUnitVector(Directions.NORTH).multiplyScalar(mapDistance)
        );
        
        this.object = new THREE.Object3D();
        this.object.add(plane);
        this.object.position.y = eyeHeight;
        this.object.rotation.order = 'YXZ';
        this.object.rotation.x = -Math.PI/ 180 * mapDeclination;
    }
    
    drawCell(ctx, x, z) {
        ctx.fillRect(x*this.cellSize, z*this.cellSize, this.cellSize, this.cellSize);
    }
    
    drawMap() {
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
    carriedBy(representation) {
        this.object.rotation.y = -representation.bearingInRadians;
        this.object.position.copy(representation.position);
    }
};

// The player's own character. It carries the camera and a map around
class SelfRepresentation extends AnimatedRepresentation {
    constructor(camera) {
        super();
        
        this.object = camera;
        this.object.position.y = eyeHeight;
        
        this.map = new MapRepresentation();
        
        this.combined = new THREE.Object3D();
        this.combined.add(this.map.representation);
        this.combined.add(camera);
    }
    
    get cameraProxy() {
        return this.object;
    }

    get representation() {
        return this.combined;
    }
    
    animate() {
        super.animate();
        this.map.carriedBy(this);
        if(this.isFalling()) {
            this.object.rotation.z += 0.01;
        }
    }

    wasShot() {
        this.turnTowards(Directions.UP);
        this.startFalling(2);
        controls.enabled = false;
        
        this.map.hide();
    }
    
    respawn() {
        liftFog();
        this.object.position.y = eyeHeight;

        controls.enabled = true;
        this.map.show();
    }

    shoot(fromPlayer) {
        var missile = new MissileActor(new MissileRepresentation(), fromPlayer);
        return actors.add(missile);
    }
};