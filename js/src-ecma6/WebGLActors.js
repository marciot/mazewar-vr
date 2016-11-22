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

const eyeRadius                      = 0.75;
const eyeHeight                      = 1.6;
const chestHeight                    = 1.3;
const distanceOfHeldObjectsFromChest = 0.2;

/* Having the enemy fall slightly slower than ourselves makes it so we can see
 * if we killed whomever shot us */
const selfFallAcceleration           = 2;
const enemyFallAcceleration          = 1.7;

var staticGeometry = {};

class WebGLActors extends Actors {
    add(actor) {
        super.add(actor);
        scene.add(actor.representation.representation);
        return actor;
    }
    
    remove(actor) {
        scene.remove(actor.representation.representation);
        super.remove(actor);
    }
    
    animate() {
        for(var i = 0; i < this.actors.length; i++) {
            if(this.actors[i].representation) {
                this.actors[i].representation.animate(i);
            } else {
                console.log("WARNING: Actor has no representation");
            }
        }
    }
}

// VisibleRepresentations have a visual representation, generally a THREE.Mesh
class VisibleRepresentation {
    dispose() {
    }

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
        // Ignore change in y
        this.object.position.set(v.x, this.object.position.y, v.z);
    }

    displace(displacement) {
        this.object.position.add(displacement);
    }

    assertPosition(x, z) {
        var repX = this.object.position.x / MazeWalls.cellDimension;
        var repZ = this.object.position.z / MazeWalls.cellDimension;
        if((x !== Math.round(repX)) || (z !== Math.round(repZ))) {
            console.log("ASSERTION FAILED: Expected position: ", x, z, " Actual position: ", repX, repZ)
        }

        if(maze.getCell(x,z)) {
            console.log("ASSERTION FAILED: Position: ", x, z, " inside wall");
        }
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

/* The follow function keeps a global cache of missile materials
   indexed by color. This allows new missiles to be instantiated
   without duplicating materials. */
function getMissileMaterial(missileColor) {
    var material, key = missileColor.toString();
    if(!this.missileMaterials) {
        this.missileMaterials = {};
    }
    if(this.missileMaterials.hasOwnProperty(key)) {
        material = this.missileMaterials[key];
    } else {
        material = MissileRepresentation.getMissileMaterial(missileColor);
        this.missileMaterials[key] = material;
    }
    return material;
}

class AnimatedRepresentation extends VisibleRepresentation {
    constructor(speedUp) {
        super();
        this.animationFrames = 0;        
        this.fallSpeed = 0;
        this.animationFinishedCallback = null;
        this.animationStep = 0.05 * (speedUp ? speedUp : 1);
    }
    
    dispose() {
        super.dispose();
        this.animationFinishedCallback = null;
    }

    walkTo(x, z, direction) {
        var u = Directions.toUnitVector(direction);
        this.doAnimation(u.multiplyScalar(MazeWalls.cellDimension));
    }
    
    /* Animated turn until the Actor faces the direction indicated by the unit vector  */
    turnTowards(direction) {
        this.doAnimation(null, Directions.toUnitVector(direction));
    }

    doAnimation(displacement, direction) {
        this.animationTween = 0;
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
            if(this.fallSpeed < 30) {
                this.doAnimation(
                    new THREE.Vector3(0, -this.fallSpeed, 0)
                );
            } else {
                this.fallSpeed        = 0;
                this.fallAcceleration = 0;
                this.fallFinished();
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

    getMissileRepresentation(missileColor) {
        return new MissileRepresentation(getMissileMaterial(missileColor));
    }
}

class EyeRepresentation extends AnimatedRepresentation {
    constructor() {
        super();

        if(!staticGeometry.eye) {
            staticGeometry.eye = new THREE.SphereGeometry( eyeRadius, 32, 32 );
            staticGeometry.eye.rotateY(Math.PI);
        }
        var mesh = new THREE.Mesh(staticGeometry.eye, theme.eyeMaterial);

        this.object = new THREE.Object3D();
        this.object.add(mesh);
        this.object.position.y = eyeHeight;

        if(theme.useActorIllumination) {
            // Set the fade out distance just shy of the wall on a
            // neighboring corridor. This is important to keep light
            // from going through walls in a multi-player game.
            var fadeDistance = MazeWalls.cellDimension * 2;
            this.headLight = new THREE.PointLight(0xFFFFFF, 0.25, fadeDistance);
            this.object.add(this.headLight);
        }
    }

    dispose() {
        super.dispose();
        this.geometry.dispose();
    }

    shotDead(respawnCallback) {
        this.turnTowards(Directions.UP);
        this.startFalling(enemyFallAcceleration);
        this.respawnCallback = respawnCallback;
    }

    fallFinished() {
        if(this.respawnCallback) {
            this.respawnCallback();
        }
    }

    respawn() {
        this.object.position.y = eyeHeight;
    }
}

class MissileRepresentation extends AnimatedRepresentation {
    constructor(material) {
        super(10);

        if(!staticGeometry.missile) {
            staticGeometry.missile = new THREE.TorusKnotGeometry(0.1, 0.02, 18);
            staticGeometry.missile.rotateZ(-Math.PI/2);
        }
        var mesh  = new THREE.Mesh(staticGeometry.missile, material);

        this.object = new THREE.Object3D();
        this.object.add(mesh);
        this.object.position.y = 1.5;

        if(theme.useActorIllumination) {
            // Set the fade out distance just shy of the wall on a
            // neighboring corridor. This is important to keep light
            // from going through walls in a multi-player game.
            var fadeDistance = MazeWalls.cellDimension * 2.45;
            var light = new THREE.PointLight( material.color, 0.5, fadeDistance);
            this.object.add(light);
        }
    }

    static getMissileMaterial(missileColor) {
        return new THREE.MeshBasicMaterial( {color: missileColor} );
    }

    dispose() {
        super.dispose();
        this.material.dispose();
        this.object.geometry.dispose();
    }

    animate() {
        super.animate();
        this.object.rotation.x += 0.1;
    }
};

// A Map displays a map of the maze. It is carried by the SelfPlayer.
class MapRepresentation extends VisibleRepresentation {
    constructor() {
        super();
        
        this.cellSize    = 8;
        this.scoreHeight = 16;
        
        const maxRats    = 8;

        const mazePixelWidth    = maze.mazeCols * this.cellSize;
        this.mazePixelHeight   = maze.mazeRows * this.cellSize;
        const listPixelHeight   = maxRats * this.scoreHeight;
        const bothPixelHeight   = this.mazePixelHeight + listPixelHeight;
        
        this.mapCanvas = document.createElement("canvas");
        this.mapCanvas.width  = mazePixelWidth;
        this.mapCanvas.height = bothPixelHeight;

        const mapGlHeight      = bothPixelHeight/this.mazePixelHeight * 0.1;
        const mapGlWidth       = 0.2;
        
        this.mapTexture    = new THREE.Texture(this.mapCanvas);
        
        this.drawMap();
        //this.drawScores();
        
        this.mapMaterial   = new THREE.MeshBasicMaterial({
            color:     0xffffff,
            shading:   THREE.FlatShading,
            map:       this.mapTexture,
            side:      THREE.FrontSide,
            transparent: true,
            opacity: 0.5
        });
        
        var geometry = new THREE.PlaneGeometry(mapGlWidth, mapGlHeight);
        var plane    = new THREE.Mesh(geometry, this.mapMaterial);
        
        this.object = plane;
    }

    dispose() {
        super.dispose();
        this.object.geometry.dispose();
        this.mapTexture.dispose();
        this.mapMaterial.dispose();
    }

    drawCell(ctx, x, z) {
        ctx.fillRect(x*this.cellSize, z*this.cellSize, this.cellSize, this.cellSize);
    }
    
    clearCell(ctx, x, z) {
        ctx.clearRect(x*this.cellSize, z*this.cellSize, this.cellSize, this.cellSize);
    }

    drawMap() {
        var ctx = this.mapCanvas.getContext('2d');
        ctx.clearRect(0, 0, this.mapCanvas.width, this.mapCanvas.height);
        ctx.fillStyle = "green";
        var me = this;
        maze.forAll(function(x,z) {
            if(maze.getCell(x, z)) {
                me.drawCell(ctx, x, z);
            }
        });
        this.mapTexture.needsUpdate = true;
    }

    drawScores() {
        const maxRats = 8;
        for(var n = 0; n < maxRats; n++) {
            this.drawScore(n);
        }
    }

    drawScore(n) {
        var ctx = this.mapCanvas.getContext('2d');
        ctx.fillStyle = "white";
        ctx.font = "italic bold " + this.scoreHeight + "px 'Lucida Grande'";
        ctx.fillText("BOB AND ALICE", 10, (n+1) * this.scoreHeight + this.mazePixelHeight);
    }

    // Paints a red dot representing the location of the character.
    whereAmI(x, z) {        
        var ctx = this.mapCanvas.getContext('2d');
        if(this.oldX) {
            this.clearCell(ctx, this.oldX, this.oldZ);
        }
        ctx.fillStyle = "red";
        this.drawCell(ctx, x, z);
        this.oldX = x;
        this.oldZ = z;
        this.mapTexture.needsUpdate = true;
    }
};

class CandleLight {
    constructor(fadeDistance) {
        this.light = new THREE.PointLight(0xFFAA00, 0.25, fadeDistance, 2);
        this.nextFlickerTime = 0;
    }

    get representation() {
        return this.light;
    }

    flicker() {
        const smoothingFactor = 0.25;
        const flickerInterval = 100;
        const minIntensity    = 0.3;
        const maxIntensity    = 0.5;

        if(Date.now() > this.nextFlickerTime) {
            this.targetIntensity = minIntensity + Math.random() * (maxIntensity - minIntensity);
            this.nextFlickerTime = Date.now()   + Math.random() * flickerInterval;
        } else {
            this.light.intensity =
                this.light.intensity * (1 - smoothingFactor) +
                this.targetIntensity * (    smoothingFactor);
        }
    }
}

// The player's own character. It carries the camera and a map around
class SelfRepresentation extends AnimatedRepresentation {
    constructor(camera) {
        super();
        this.map = new MapRepresentation();

        this.body = new SelfBody(camera);
        this.body.carry(this.map);
        
        this.object = this.body.getHead();

        if(theme.useActorIllumination) {
            // Set the fade out distance just shy of the wall on a
            // neighboring corridor. This is important to keep light
            // from going through walls in a multi-player game.
            const fadeDistance = MazeWalls.cellDimension * 7;
            this.candle = new CandleLight(fadeDistance);
            this.body.carry(this.candle);
        }
    }

    get representation() {
        return this.body.representation;
    }

    dispose() {
        super.dispose();
        this.map.dispose();
    }

    setPosition(x, z) {
        super.setPosition(x, z);
        this.map.whereAmI(x, z);
    }

    walkTo(x, z, direction) {
        super.walkTo(x, z, direction)
        this.map.whereAmI(x, z);
    }

    orientTowards(direction) {
        // Ignore, orientation is controlled by the VR headset
        // via the SelfBody object
    }
    
    animate() {
        super.animate();
        if(this.isFalling()) {
            this.object.rotation.z += 0.01;
        } else {
            this.body.update();
        }
        if(this.candle) {
            this.candle.flicker();
        }
    }

    shotDead(respawnCallback) {
        this.turnTowards(Directions.UP);
        this.startFalling(selfFallAcceleration);
        this.body.lockControls();
        maze.setIsFalling(true);
        
        this.map.hide();
        this.respawnCallback = respawnCallback;
    }

    fallFinished() {
        if(this.respawnCallback) {
            this.respawnCallback();
        }
    }
    
    respawn() {
        theme.fadeEffect();
        this.body.reattachHead();
        this.body.unlockControls();
        maze.setIsFalling(false);
        this.map.show();
    }
};

/* In Maze War, players are represented by floating eyeballs.
 * But since in Maze War VR the eyeballs carry a map, it is
 * convenient to imagine the eyeballs as heads on a body and
 * the map as being carried by hands.
 *
 * When the player's head looks left or right, the virtual
 * body rotates underneath it. There is no concept in this
 * game of facing in one direction while looking in another
 * direction.
 */
class SelfBody {
    constructor(camera) {
        const handsTilt = 45;

        this.head           = camera;
        this.body           = new THREE.Object3D();
        this.hands          = new THREE.Object3D();
        this.carriedObjects = new THREE.Object3D();
        this.combined       = new THREE.Object3D();

        this.head.position.y  = eyeHeight;
        this.hands.position.y = chestHeight;
        this.hands.position.z = -distanceOfHeldObjectsFromChest;
        this.carriedObjects.rotation.x = -handsTilt / 180 * Math.PI;

        this.body.add(this.hands);
        this.hands.add(this.carriedObjects);

        this.combined.add(this.body);
        this.combined.add(this.head);

        if('VRFrameData' in window) {
            this.frameData = new VRFrameData();
        }
    }

    getHead() {
        return this.head;
    }

    get representation() {
        return this.combined;
    }

    reattachHead() {
        // When the player dies, their head/eyeball falls into the
        // abbyss. This reattaches the head so that play can continue.
        this.head.position.y  = eyeHeight;
    }

    carry(object) {
        this.carriedObjects.add(object.representation);
    }

    getHead() {
        return this.head;
    }

    lockControls() {
        this.locked = true;
    }

    unlockControls() {
        this.locked = false;
    }

    updateBody(headsetPose, headsetOrientation) {
        /* Compute the bearing and azimuth of the headset.
         * The bearing is used to set the direction of the
         * body, the azimuth is ignored for now.
         */
        var u = Directions.toUnitVector(Directions.NORTH);
        u.applyQuaternion(headsetOrientation);
        var projectionMagn = Math.sqrt(u.x*u.x + u.z*u.z);
        var headsetBearing = Math.atan2(u.x, -u.z);
        var headsetAzimuth = Math.atan2(u.y, projectionMagn);

        // The RigidBody's head orientation is updated to match
        // the orientation of the VR headset
        this.head.rotation.setFromQuaternion(headsetOrientation);

        // Keep the body underneath the head and facing in the
        // same direction, except when the player is looking
        // straight up and the direction is indeterminate.
        this.body.position.x = this.head.position.x;
        this.body.position.z = this.head.position.z;
        if(projectionMagn > 0.1) {
            this.body.rotation.y = -headsetBearing;
        }
    }

    update() {
        if(this.locked) {
            // While the player dies and is falling through the
            // abbyss, stop updating the position from the
            // headset.
            return;
        }

        // Get the headset position and orientation.
        var headsetPose        = new THREE.Vector3();
        var headsetOrientation = new THREE.Quaternion();

        var pose;
        if (vrDisplay.getFrameData) {
            vrDisplay.getFrameData(this.frameData);
            pose = this.frameData.pose;
        } else if (vrDisplay.getPose) {
            pose = vrDisplay.getPose();
        }
        if (pose.position !== null) {
            headsetPose.fromArray(pose.position);
        }
        if (pose.orientation !== null ) {
            headsetOrientation.fromArray(pose.orientation);
        }

        // Update body representation
        this.updateBody(headsetPose, headsetOrientation);
    }
}

function getWebGLPlayerFactory() {
    var playerFactory = {
        newSelfPlayer: function() {
            var selfRepresentation = new SelfRepresentation(overlay.representation);
            var actor = new Player(selfRepresentation);
            actors.placePlayer(actor);
            new HeadsetDirector(actor, container);
            return actor;
        },
        newRobotPlayer: function() {
            var actor = new Player(new EyeRepresentation());
            actors.placePlayer(actor);
            new RoboticDirector(actor);
            return actor;
        },
        newOtherPlayer: function() {
            var actor = new Player(new EyeRepresentation());
            actors.placePlayer(actor);
            return actor;
        }
    };
    return playerFactory;
}