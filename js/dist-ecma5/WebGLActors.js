var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

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

var eyeRadius = 0.75;
var eyeHeight = 1.6;
var chestHeight = 1.3;
var distanceOfHeldObjectsFromChest = 0.2;

/* Having the enemy fall slightly slower than ourselves makes it so we can see
 * if we killed whomever shot us */
var selfFallAcceleration = 2;
var enemyFallAcceleration = 1.7;

var WebGLActors = function (_Actors) {
    _inherits(WebGLActors, _Actors);

    function WebGLActors() {
        _classCallCheck(this, WebGLActors);

        return _possibleConstructorReturn(this, (WebGLActors.__proto__ || Object.getPrototypeOf(WebGLActors)).apply(this, arguments));
    }

    _createClass(WebGLActors, [{
        key: "add",
        value: function add(actor) {
            _get(WebGLActors.prototype.__proto__ || Object.getPrototypeOf(WebGLActors.prototype), "add", this).call(this, actor);
            scene.add(actor.representation.representation);
            return actor;
        }
    }, {
        key: "remove",
        value: function remove(actor) {
            scene.remove(actor.representation.representation);
            _get(WebGLActors.prototype.__proto__ || Object.getPrototypeOf(WebGLActors.prototype), "remove", this).call(this, actor);
        }
    }, {
        key: "animate",
        value: function animate() {
            for (var i = 0; i < this.actors.length; i++) {
                if (this.actors[i].representation) {
                    this.actors[i].representation.animate(i);
                } else {
                    console.log("WARNING: Actor has no representation");
                }
            }
        }
    }]);

    return WebGLActors;
}(Actors);

// VisibleRepresentations have a visual representation, generally a THREE.Mesh


var VisibleRepresentation = function () {
    function VisibleRepresentation() {
        _classCallCheck(this, VisibleRepresentation);
    }

    _createClass(VisibleRepresentation, [{
        key: "dispose",
        value: function dispose() {}
    }, {
        key: "displace",
        value: function displace(displacement) {
            this.object.position.add(displacement);
        }
    }, {
        key: "assertPosition",
        value: function assertPosition(x, z) {
            var repX = this.object.position.x / MazeWalls.cellDimension;
            var repZ = this.object.position.z / MazeWalls.cellDimension;
            if (x !== Math.round(repX) || z !== Math.round(repZ)) {
                console.log("ASSERTION FAILED: Expected position: ", x, z, " Actual position: ", repX, repZ);
            }

            if (maze.getCell(x, z)) {
                console.log("ASSERTION FAILED: Position: ", x, z, " inside wall");
            }
        }
    }, {
        key: "hide",
        value: function hide() {
            this.object.visible = false;
        }
    }, {
        key: "show",
        value: function show() {
            this.object.visible = true;
        }
    }, {
        key: "setPosition",
        value: function setPosition(x, z) {
            var u = Directions.toUnitVector(Directions.SOUTH).multiplyScalar(z * MazeWalls.cellDimension);
            var v = Directions.toUnitVector(Directions.EAST).multiplyScalar(x * MazeWalls.cellDimension);
            this.position = u.add(v);
        }
    }, {
        key: "orientTowards",
        value: function orientTowards(direction) {
            this.quaternion.setFromUnitVectors(Directions.toUnitVector(Directions.NORTH), Directions.toUnitVector(direction));
        }
    }, {
        key: "representation",
        get: function () {
            return this.object;
        }
    }, {
        key: "rotation",
        get: function () {
            return this.object.rotation;
        }
    }, {
        key: "position",
        get: function () {
            return this.object.position;
        },
        set: function (v) {
            // Ignore change in y
            this.object.position.set(v.x, this.object.position.y, v.z);
        }
    }, {
        key: "quaternion",
        get: function () {
            return this.object.quaternion;
        },
        set: function (quaternion) {
            this.object.rotation.setFromQuaternion(quaternion);
        }
    }, {
        key: "directionVector",
        get: function () {
            var u = Directions.toUnitVector(Directions.NORTH);
            u.applyEuler(this.rotation);
            return u;
        }
    }, {
        key: "bearingInRadians",
        get: function () {
            var u = this.directionVector;
            return Math.atan2(u.x, -u.z);
        }
    }, {
        key: "bearingInDegrees",
        get: function () {
            return this.bearingInRadians / Math.PI * 180;
        }
    }, {
        key: "cardinalDirection",
        get: function () {
            var angle = this.bearingInDegrees;
            if (angle > -45 && angle <= 45) {
                return Directions.NORTH;
            } else if (angle > 45 && angle <= 135) {
                return Directions.EAST;
            } else if (angle > 135 || angle <= -135) {
                return Directions.SOUTH;
            }
            if (angle > -135 || angle <= -45) {
                return Directions.WEST;
            }
        }
    }]);

    return VisibleRepresentation;
}();

var AnimatedRepresentation = function (_VisibleRepresentatio) {
    _inherits(AnimatedRepresentation, _VisibleRepresentatio);

    function AnimatedRepresentation(speedUp) {
        _classCallCheck(this, AnimatedRepresentation);

        var _this2 = _possibleConstructorReturn(this, (AnimatedRepresentation.__proto__ || Object.getPrototypeOf(AnimatedRepresentation)).call(this));

        _this2.animationFrames = 0;
        _this2.fallSpeed = 0;
        _this2.animationFinishedCallback = null;
        _this2.animationStep = 0.05 * (speedUp ? speedUp : 1);
        return _this2;
    }

    _createClass(AnimatedRepresentation, [{
        key: "dispose",
        value: function dispose() {
            _get(AnimatedRepresentation.prototype.__proto__ || Object.getPrototypeOf(AnimatedRepresentation.prototype), "dispose", this).call(this);
            this.animationFinishedCallback = null;
        }
    }, {
        key: "walkTo",
        value: function walkTo(x, z, direction) {
            var u = Directions.toUnitVector(direction);
            this.doAnimation(u.multiplyScalar(MazeWalls.cellDimension));
        }

        /* Animated turn until the Actor faces the direction indicated by the unit vector  */

    }, {
        key: "turnTowards",
        value: function turnTowards(direction) {
            this.doAnimation(null, Directions.toUnitVector(direction));
        }
    }, {
        key: "doAnimation",
        value: function doAnimation(displacement, direction) {
            this.animationTween = 0;
            if (displacement) {
                this.animationDisplacement = displacement;
            }
            if (direction) {
                this.animationQuaternionStart = new THREE.Quaternion().copy(this.quaternion);
                this.animationQuaternionEnd = new THREE.Quaternion();
                this.animationQuaternionEnd.setFromUnitVectors(Directions.toUnitVector(Directions.NORTH), direction);
            }
        }
    }, {
        key: "animate",
        value: function animate() {
            if (this.animationTween !== null) {
                if (this.animationTween < 1.0) {
                    this.animationTween += this.animationStep;
                    if (this.animationDisplacement) {
                        var displacement = new THREE.Vector3().copy(this.animationDisplacement);
                        displacement.multiplyScalar(this.animationStep);
                        this.displace(displacement);
                    }
                    if (this.animationQuaternionEnd) {
                        var q = new THREE.Quaternion();
                        q.copy(this.animationQuaternionStart);
                        q.slerp(this.animationQuaternionEnd, this.animationTween);
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
    }, {
        key: "animationFinished",
        value: function animationFinished() {
            if (this.fallAcceleration) {
                this.fallSpeed += this.fallAcceleration;
                if (this.fallSpeed < 30) {
                    this.doAnimation(new THREE.Vector3(0, -this.fallSpeed, 0));
                } else {
                    this.fallSpeed = 0;
                    this.fallAcceleration = 0;
                    this.fallFinished();
                }
            }
            if (this.animationFinishedCallback) {
                this.animationFinishedCallback();
            }
        }
    }, {
        key: "startFalling",
        value: function startFalling(acceleration) {
            if (!this.fallAcceleration) {
                this.fallSpeed = 0;
                this.fallAcceleration = acceleration;
                this.animationFinished();
            }
        }
    }, {
        key: "isFalling",
        value: function isFalling() {
            return this.fallAcceleration;
        }
    }, {
        key: "setAnimationFinishedCallback",
        value: function setAnimationFinishedCallback(callback) {
            this.animationFinishedCallback = callback;
        }
    }, {
        key: "startAnimation",
        value: function startAnimation() {
            this.animationFinished();
        }
    }, {
        key: "getMissileRepresentation",
        value: function getMissileRepresentation(missileColor) {
            return new MissileRepresentation(missileColor);
        }
    }, {
        key: "isStopped",
        get: function () {
            return this.animationTween === null;
        }
    }]);

    return AnimatedRepresentation;
}(VisibleRepresentation);

var EyeRepresentation = function (_AnimatedRepresentati) {
    _inherits(EyeRepresentation, _AnimatedRepresentati);

    function EyeRepresentation() {
        _classCallCheck(this, EyeRepresentation);

        var _this3 = _possibleConstructorReturn(this, (EyeRepresentation.__proto__ || Object.getPrototypeOf(EyeRepresentation)).call(this));

        _this3.geometry = new THREE.SphereGeometry(eyeRadius, 64, 64);
        _this3.geometry.rotateY(Math.PI);
        var mesh = new THREE.Mesh(_this3.geometry, theme.eyeMaterial);

        // Set the fade out distance just shy of the wall on a
        // neighboring corridor. This is important to keep light
        // from going through walls in a multi-player game.
        var fadeDistance = MazeWalls.cellDimension * 2;
        _this3.headLight = new THREE.PointLight(0xFFFFFF, 0.25, fadeDistance);

        _this3.object = new THREE.Object3D();
        _this3.object.add(mesh);
        _this3.object.add(_this3.headLight);
        _this3.object.position.y = eyeHeight;
        return _this3;
    }

    _createClass(EyeRepresentation, [{
        key: "dispose",
        value: function dispose() {
            _get(EyeRepresentation.prototype.__proto__ || Object.getPrototypeOf(EyeRepresentation.prototype), "dispose", this).call(this);
            this.geometry.dispose();
        }
    }, {
        key: "shotDead",
        value: function shotDead(respawnCallback) {
            this.turnTowards(Directions.UP);
            this.startFalling(enemyFallAcceleration);
            this.respawnCallback = respawnCallback;
        }
    }, {
        key: "fallFinished",
        value: function fallFinished() {
            if (this.respawnCallback) {
                this.respawnCallback();
            }
        }
    }, {
        key: "respawn",
        value: function respawn() {
            this.object.position.y = eyeHeight;
        }
    }]);

    return EyeRepresentation;
}(AnimatedRepresentation);

var MissileRepresentation = function (_AnimatedRepresentati2) {
    _inherits(MissileRepresentation, _AnimatedRepresentati2);

    function MissileRepresentation(missileColor) {
        _classCallCheck(this, MissileRepresentation);

        var _this4 = _possibleConstructorReturn(this, (MissileRepresentation.__proto__ || Object.getPrototypeOf(MissileRepresentation)).call(this, 10));

        var geometry = new THREE.TorusKnotGeometry(0.1, 0.02, 18);
        geometry.rotateZ(-Math.PI / 2);

        // Materials for the missiles
        _this4.material = new THREE.MeshBasicMaterial({ color: missileColor });

        // Set the fade out distance just shy of the wall on a
        // neighboring corridor. This is important to keep light
        // from going through walls in a multi-player game.
        var fadeDistance = MazeWalls.cellDimension * 2.45;
        var mesh = new THREE.Mesh(geometry, _this4.material);
        var light = new THREE.PointLight(missileColor, 0.5, fadeDistance);

        _this4.object = new THREE.Object3D();
        _this4.object.add(light);
        _this4.object.add(mesh);
        _this4.object.position.y = 1.5;
        return _this4;
    }

    _createClass(MissileRepresentation, [{
        key: "dispose",
        value: function dispose() {
            _get(MissileRepresentation.prototype.__proto__ || Object.getPrototypeOf(MissileRepresentation.prototype), "dispose", this).call(this);
            this.material.dispose();
            this.object.geometry.dispose();
        }
    }, {
        key: "animate",
        value: function animate() {
            _get(MissileRepresentation.prototype.__proto__ || Object.getPrototypeOf(MissileRepresentation.prototype), "animate", this).call(this);
            this.object.rotation.x += 0.1;
        }
    }]);

    return MissileRepresentation;
}(AnimatedRepresentation);

;

// A Map displays a map of the maze. It is carried by the SelfPlayer.

var MapRepresentation = function (_VisibleRepresentatio2) {
    _inherits(MapRepresentation, _VisibleRepresentatio2);

    function MapRepresentation() {
        _classCallCheck(this, MapRepresentation);

        var _this5 = _possibleConstructorReturn(this, (MapRepresentation.__proto__ || Object.getPrototypeOf(MapRepresentation)).call(this));

        _this5.cellSize = 8;
        _this5.scoreHeight = 16;

        var maxRats = 8;

        var mazePixelWidth = maze.mazeCols * _this5.cellSize;
        _this5.mazePixelHeight = maze.mazeRows * _this5.cellSize;
        var listPixelHeight = maxRats * _this5.scoreHeight;
        var bothPixelHeight = _this5.mazePixelHeight + listPixelHeight;

        _this5.mapCanvas = document.createElement("canvas");
        _this5.mapCanvas.width = mazePixelWidth;
        _this5.mapCanvas.height = bothPixelHeight;

        var mapGlHeight = bothPixelHeight / _this5.mazePixelHeight * 0.1;
        var mapGlWidth = 0.2;

        _this5.mapTexture = new THREE.Texture(_this5.mapCanvas);

        _this5.drawMap();
        //this.drawScores();

        _this5.mapMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            shading: THREE.FlatShading,
            map: _this5.mapTexture,
            side: THREE.FrontSide,
            transparent: true,
            opacity: 0.5
        });

        var geometry = new THREE.PlaneGeometry(mapGlWidth, mapGlHeight);
        var plane = new THREE.Mesh(geometry, _this5.mapMaterial);

        _this5.object = plane;
        return _this5;
    }

    _createClass(MapRepresentation, [{
        key: "dispose",
        value: function dispose() {
            _get(MapRepresentation.prototype.__proto__ || Object.getPrototypeOf(MapRepresentation.prototype), "dispose", this).call(this);
            this.object.geometry.dispose();
            this.mapTexture.dispose();
            this.mapMaterial.dispose();
        }
    }, {
        key: "drawCell",
        value: function drawCell(ctx, x, z) {
            ctx.fillRect(x * this.cellSize, z * this.cellSize, this.cellSize, this.cellSize);
        }
    }, {
        key: "clearCell",
        value: function clearCell(ctx, x, z) {
            ctx.clearRect(x * this.cellSize, z * this.cellSize, this.cellSize, this.cellSize);
        }
    }, {
        key: "drawMap",
        value: function drawMap() {
            var ctx = this.mapCanvas.getContext('2d');
            ctx.clearRect(0, 0, this.mapCanvas.width, this.mapCanvas.height);
            ctx.fillStyle = "green";
            var me = this;
            maze.forAll(function (x, z) {
                if (maze.getCell(x, z)) {
                    me.drawCell(ctx, x, z);
                }
            });
            this.mapTexture.needsUpdate = true;
        }
    }, {
        key: "drawScores",
        value: function drawScores() {
            var maxRats = 8;
            for (var n = 0; n < maxRats; n++) {
                this.drawScore(n);
            }
        }
    }, {
        key: "drawScore",
        value: function drawScore(n) {
            var ctx = this.mapCanvas.getContext('2d');
            ctx.fillStyle = "white";
            ctx.font = "italic bold " + this.scoreHeight + "px 'Lucida Grande'";
            ctx.fillText("BOB AND ALICE", 10, (n + 1) * this.scoreHeight + this.mazePixelHeight);
        }

        // Paints a red dot representing the location of the character.

    }, {
        key: "whereAmI",
        value: function whereAmI(x, z) {
            var ctx = this.mapCanvas.getContext('2d');
            if (this.oldX) {
                this.clearCell(ctx, this.oldX, this.oldZ);
            }
            ctx.fillStyle = "red";
            this.drawCell(ctx, x, z);
            this.oldX = x;
            this.oldZ = z;
            this.mapTexture.needsUpdate = true;
        }
    }]);

    return MapRepresentation;
}(VisibleRepresentation);

;

// The player's own character. It carries the camera and a map around

var SelfRepresentation = function (_AnimatedRepresentati3) {
    _inherits(SelfRepresentation, _AnimatedRepresentati3);

    function SelfRepresentation(camera) {
        _classCallCheck(this, SelfRepresentation);

        var _this6 = _possibleConstructorReturn(this, (SelfRepresentation.__proto__ || Object.getPrototypeOf(SelfRepresentation)).call(this));

        _this6.map = new MapRepresentation();

        _this6.body = new SelfBody(camera);
        _this6.body.carry(_this6.map);

        _this6.object = _this6.body.getHead();
        return _this6;
    }

    _createClass(SelfRepresentation, [{
        key: "dispose",
        value: function dispose() {
            _get(SelfRepresentation.prototype.__proto__ || Object.getPrototypeOf(SelfRepresentation.prototype), "dispose", this).call(this);
            this.map.dispose();
        }
    }, {
        key: "setPosition",
        value: function setPosition(x, z) {
            _get(SelfRepresentation.prototype.__proto__ || Object.getPrototypeOf(SelfRepresentation.prototype), "setPosition", this).call(this, x, z);
            this.map.whereAmI(x, z);
        }
    }, {
        key: "walkTo",
        value: function walkTo(x, z, direction) {
            _get(SelfRepresentation.prototype.__proto__ || Object.getPrototypeOf(SelfRepresentation.prototype), "walkTo", this).call(this, x, z, direction);
            this.map.whereAmI(x, z);
        }
    }, {
        key: "orientTowards",
        value: function orientTowards(direction) {
            // Ignore, orientation is controlled by the VR headset
            // via the SelfBody object
        }
    }, {
        key: "animate",
        value: function animate() {
            _get(SelfRepresentation.prototype.__proto__ || Object.getPrototypeOf(SelfRepresentation.prototype), "animate", this).call(this);
            if (this.isFalling()) {
                this.object.rotation.z += 0.01;
            } else {
                this.body.update();
            }
        }
    }, {
        key: "shotDead",
        value: function shotDead(respawnCallback) {
            this.turnTowards(Directions.UP);
            this.startFalling(selfFallAcceleration);
            this.body.lockControls();

            this.map.hide();
            this.respawnCallback = respawnCallback;
        }
    }, {
        key: "fallFinished",
        value: function fallFinished() {
            if (this.respawnCallback) {
                this.respawnCallback();
            }
        }
    }, {
        key: "respawn",
        value: function respawn() {
            liftFog();
            this.body.reattachHead();
            this.body.unlockControls();
            this.map.show();
        }
    }, {
        key: "representation",
        get: function () {
            return this.body.representation;
        }
    }]);

    return SelfRepresentation;
}(AnimatedRepresentation);

;

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

var SelfBody = function () {
    function SelfBody(head) {
        _classCallCheck(this, SelfBody);

        var handsTilt = 45;

        this.head = head;
        this.body = new THREE.Object3D();
        this.hands = new THREE.Object3D();
        this.carriedObjects = new THREE.Object3D();
        this.combined = new THREE.Object3D();

        this.head.position.y = eyeHeight;
        this.hands.position.y = chestHeight;
        this.hands.position.z = -distanceOfHeldObjectsFromChest;
        this.carriedObjects.rotation.x = -handsTilt / 180 * Math.PI;

        this.body.add(this.hands);
        this.hands.add(this.carriedObjects);

        this.combined.add(this.body);
        this.combined.add(this.head);

        if ('VRFrameData' in window) {
            this.frameData = new VRFrameData();
        }
    }

    _createClass(SelfBody, [{
        key: "getHead",
        value: function getHead() {
            return this.head;
        }
    }, {
        key: "reattachHead",
        value: function reattachHead() {
            // When the player dies, their head/eyeball falls into the
            // abbyss. This reattaches the head so that play can continue.
            this.head.position.y = eyeHeight;
        }
    }, {
        key: "carry",
        value: function carry(object) {
            this.carriedObjects.add(object.representation);
        }
    }, {
        key: "getHead",
        value: function getHead() {
            return this.head;
        }
    }, {
        key: "lockControls",
        value: function lockControls() {
            this.locked = true;
        }
    }, {
        key: "unlockControls",
        value: function unlockControls() {
            this.locked = false;
        }
    }, {
        key: "updateBody",
        value: function updateBody(headsetPose, headsetOrientation) {
            /* Compute the bearing and azimuth of the headset.
             * The bearing is used to set the direction of the
             * body, the azimuth is ignored for now.
             */
            var u = Directions.toUnitVector(Directions.NORTH);
            u.applyQuaternion(headsetOrientation);
            var projectionMagn = Math.sqrt(u.x * u.x + u.z * u.z);
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
            if (projectionMagn > 0.1) {
                this.body.rotation.y = -headsetBearing;
            }
        }
    }, {
        key: "update",
        value: function update() {
            if (this.locked) {
                // While the player dies and is falling through the
                // abbyss, stop updating the position from the
                // headset.
                return;
            }

            // Get the headset position and orientation.
            var headsetPose = new THREE.Vector3();
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
            if (pose.orientation !== null) {
                headsetOrientation.fromArray(pose.orientation);
            }

            // Update body representation
            this.updateBody(headsetPose, headsetOrientation);
        }
    }, {
        key: "representation",
        get: function () {
            return this.combined;
        }
    }]);

    return SelfBody;
}();

function getWebGLPlayerFactory(camera) {
    var playerFactory = {
        newSelfPlayer: function () {
            var selfRepresentation = new SelfRepresentation(camera);
            var actor = new Player(selfRepresentation);
            actors.placePlayer(actor);
            new HeadsetDirector(actor, container);
            return actor;
        },
        newRobotPlayer: function () {
            var actor = new Player(new EyeRepresentation());
            actors.placePlayer(actor);
            new RoboticDirector(actor);
            return actor;
        },
        newOtherPlayer: function () {
            var actor = new Player(new EyeRepresentation());
            actors.placePlayer(actor);
            return actor;
        }
    };
    return playerFactory;
}