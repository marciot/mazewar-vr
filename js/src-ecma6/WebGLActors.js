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

var motionTracker;

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
    
    animate(dt) {
        for(var i = 0; i < this.actors.length; i++) {
            if(this.actors[i].representation) {
                this.actors[i].representation.animate(dt);
            } else {
                console.log("WARNING: Actor has no representation");
            }
        }
    }
}

// VisibleRepresentations have a visual representation, generally a THREE.Mesh
class VisibleRepresentation {
    constructor() {
        this._directionVector = new THREE.Vector3();
    }

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
        this.position.set(0,this.position.y,0)
            .addScaledVector(Directions.toUnitVector(Directions.SOUTH), z * MazeWalls.cellDimension)
            .addScaledVector(Directions.toUnitVector(Directions.EAST),  x * MazeWalls.cellDimension);
    }
    
    orientTowards(direction) {
        this.quaternion.setFromUnitVectors(
            Directions.toUnitVector(Directions.NORTH),
            Directions.toUnitVector(direction)
        );
    }

    get directionVector() {
        var u = this._directionVector.copy(Directions.toUnitVector(Directions.NORTH));
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
        this.animationFinishedCallback = null;
        this.animationDuration         = 0.33 / (speedUp || 1);
        this.tween = new Tween();
        this.tween.whenDone(this.animationFinished.bind(this));

        this.animationQuatFinal    = new THREE.Quaternion();
        this.animationDispStart    = new THREE.Vector3();
        this.animationDisplacement = new THREE.Vector3();

        this._animationDisplacementTween = function(t) {
            this.object.position.copy(this.animationDispStart);
            this.object.position.addScaledVector(this.animationDisplacement, t);
        }.bind(this);
        this._animationQuaternionTween = Tween.deltaT(
            (function(t, dt) {
                this.quaternion.slerp(this.animationQuatFinal, Math.min(1, dt/(1-t)));
            }).bind(this));
    }
    
    dispose() {
        super.dispose();
        this.animationFinishedCallback = null;
        this.tween = null;
    }

    walkTo(x, z, direction) {
        var u = this.animationDisplacement.copy(Directions.toUnitVector(direction));
        this.animateDisplacement(u.multiplyScalar(MazeWalls.cellDimension));
    }

    /* Animated turn until the Actor faces the direction indicated by the unit vector  */
    turnTowards(direction) {
        var quaternion = this.animationQuatFinal;
        quaternion.setFromUnitVectors(
            Directions.toUnitVector(Directions.NORTH),
            Directions.toUnitVector(direction)
        );
        this.animateRoll(quaternion);
    }

    animateDisplacement(displacement, easing, duration) {
        this.animationDispStart.copy(this.object.position);
        this.animationDisplacement.copy(displacement);
        this.tween.add(duration || this.animationDuration, easing,
            this._animationDisplacementTween
        );
    }

    animateRoll(finalQuaternion) {
        this.animationQuatFinal.copy(finalQuaternion);
        this.tween.add(this.animationDuration, null,
            this._animationQuaternionTween
        );
    }

    animateFall(isEnemy) {
        const spinVelocity = 2;
        const spinEasing   = tweenFunctions.linear;
        /* The use of separate easing functions for enemy vs self
         * allows us to see enemies when they fall with us */
        const fallEasing   = isEnemy ? tweenFunctions.easeInQuart : tweenFunctions.easeInSine;
        const fallDistance = 200;
        const fallDuration = 5;
        this.animateDisplacement(
            this.animationDisplacement.copy(Directions.toUnitVector(Directions.DOWN))
                .multiplyScalar(fallDistance),
            fallEasing,
            fallDuration
        );
        this.tween.add(fallDuration, spinEasing,
            Tween.deltaT(
                (t, dt) => this.object.rotation.z += dt * spinVelocity
            )
        );
    }

    stopAnimating() {
        this.tween.stop();
    }

    animate(dt) {
        this.tween.update(dt);
    }

    animationFinished() {
        if(this.isFalling) {
            this.isFalling = false;
            this.fallFinished();
        }
        if(this.animationFinishedCallback) {
            this.animationFinishedCallback();
        }
    }

    startFalling(isEnemy) {
        if(!this.isFalling) {
            this.isFalling = true;
            this.animateFall(isEnemy);
        }
    }
    
    get isStopped() {
        return !this.tween.isAnimating;
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
            staticGeometry.eye = new THREE.SphereBufferGeometry( eyeRadius, 32, 32 );
            staticGeometry.eye.rotateY(Math.PI);
        }
        var mesh = new THREE.Mesh(staticGeometry.eye, theme.eyeMaterial);

        this.sound = new ActorSounds();
        this.sound.startWalking();

        this.object = new THREE.Object3D();
        this.object.add(mesh);
        this.object.position.y = eyeHeight;
        this.object.add(this.sound.representation);

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
        this.sound.dispose();
        this.sound = null;
    }

    shotDead(respawnCallback) {
        this.stopAnimating();
        this.turnTowards(Directions.UP);
        this.startFalling(true);
        this.respawnCallback = respawnCallback;
        this.sound.scream();
    }

    fallFinished() {
        if(this.respawnCallback) {
            this.respawnCallback();
        }
    }

    respawn() {
        this.object.position.y = eyeHeight;
        this.sound.startWalking();
    }

    shoot() {
        this.sound.bang();
    }
}

class MissileRepresentation extends AnimatedRepresentation {
    constructor(material) {
        super(10);

        if(!staticGeometry.missile) {
            staticGeometry.missile = new THREE.TorusKnotBufferGeometry(0.1, 0.02, 18);
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
    }

    animate(dt) {
        super.animate(dt);
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
        
        this.object = this.body.getNeck();

        if(theme.useActorIllumination) {
            // Set the fade out distance just shy of the wall on a
            // neighboring corridor. This is important to keep light
            // from going through walls in a multi-player game.
            const fadeDistance = MazeWalls.cellDimension * 7;
            this.candle = new CandleLight(fadeDistance);
            this.body.carry(this.candle);
        }
    }

    get directionVector() {
        var u = this._directionVector.copy(Directions.toUnitVector(Directions.NORTH));
        u.applyEuler(this.body.getHead().rotation);
        return u;
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
    
    animate(dt) {
        super.animate(dt);
        if(this.isFalling) {
            return;
        }

        this.body.update();
        if(this.candle) {
            this.candle.flicker();
        }
    }

    turnTowards(direction) {
        var quaternion = new THREE.Quaternion();
        quaternion.setFromUnitVectors(
            this.directionVector,
            Directions.toUnitVector(direction)
        );
        this.animateRoll(quaternion);
    }

    shotDead(respawnCallback) {
        this.startFalling(false);
        this.body.lockControls();
        maze.setIsFalling(true);
        this.turnTowards(Directions.UP);
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
        this.neck           = new THREE.Object3D();
        this.body           = new THREE.Object3D();
        this.hands          = new THREE.Object3D();
        this.carriedObjects = new THREE.Object3D();
        this.combined       = new THREE.Object3D();

        this.neck.position.y  = eyeHeight;
        this.hands.position.y = chestHeight;
        this.hands.position.z = -distanceOfHeldObjectsFromChest;
        this.carriedObjects.rotation.x = -handsTilt / 180 * Math.PI;

        this.neck.add(this.head);
        this.body.add(this.hands);
        this.hands.add(this.carriedObjects);

        this.combined.add(this.body);
        this.combined.add(this.neck);

        function recenterCallback() {
            theme.showStatusMessage("Recentered view.");
        }
        this.motionTracker = new MotionTracker(this.updateBody.bind(this), recenterCallback);
        motionTracker = this.motionTracker;

        this.headsetOrientationVector = new THREE.Vector3();
    }

    getNeck() {
        return this.neck;
    }

    getHead() {
        return this.head;
    }

    get representation() {
        return this.combined;
    }

    reattachHead() {
        const tmp = new THREE.Object3D();
        // When the player dies, their head/eyeball falls into the
        // abyss. This reattaches the head so that play can continue.
        this.neck.position.y  = eyeHeight;
        this.neck.rotation.copy(tmp.rotation);
    }

    carry(object) {
        this.carriedObjects.add(object.representation);
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
        var u = this.headsetOrientationVector.copy(Directions.toUnitVector(Directions.NORTH));
        u.applyQuaternion(headsetOrientation);
        var projectionMagn   = Math.sqrt(u.x*u.x + u.z*u.z);
        var headsetBearing   = Math.atan2(u.x, -u.z);
        var headsetElevation = Math.atan2(u.y, projectionMagn);

        // The RigidBody's head orientation is updated to match
        // the orientation and pose of the VR headset
        this.head.rotation.setFromQuaternion(headsetOrientation);
        this.head.position.copy(headsetPose);

        // Keep the body underneath the neck and facing in the
        // same direction, except when the player is looking
        // straight up and the direction is indeterminate.
        if(!this.locked) {
            this.body.position.x = this.neck.position.x;
            this.body.position.z = this.neck.position.z;
            if(projectionMagn > 0.1) {
                this.body.rotation.y = -headsetBearing;
            }
        }
    }

    update() {
        /*if(this.locked) {
            // While the player dies and is falling through the
            // abbyss, stop updating the position from the
            // headset.
            return;
        }*/
        this.motionTracker.update();
    }
}

function getWebGLPlayerFactory() {
    var playerFactory = {
        newSelfPlayer: function() {
            var selfRepresentation = new SelfRepresentation(overlay.representation);
            var actor = new Player(selfRepresentation);
            new HeadsetDirector(actor, container);
            actors.placePlayer(actor);
            return actor;
        },
        newRobotPlayer: function() {
            var actor = new Player(new EyeRepresentation());
            new RoboticDirector(actor);
            actors.placePlayer(actor);
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