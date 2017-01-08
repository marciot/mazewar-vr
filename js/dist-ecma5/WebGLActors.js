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

var motionTracker;

var staticGeometry = {};

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
        value: function animate(dt) {
            for (var i = 0; i < this.actors.length; i++) {
                if (this.actors[i].representation) {
                    this.actors[i].representation.animate(dt);
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

/* The follow function keeps a global cache of missile materials
   indexed by color. This allows new missiles to be instantiated
   without duplicating materials. */


function getMissileMaterial(missileColor) {
    var material,
        key = missileColor.toString();
    if (!this.missileMaterials) {
        this.missileMaterials = {};
    }
    if (this.missileMaterials.hasOwnProperty(key)) {
        material = this.missileMaterials[key];
    } else {
        material = MissileRepresentation.getMissileMaterial(missileColor);
        this.missileMaterials[key] = material;
    }
    return material;
}

var AnimatedRepresentation = function (_VisibleRepresentatio) {
    _inherits(AnimatedRepresentation, _VisibleRepresentatio);

    function AnimatedRepresentation(speedUp) {
        _classCallCheck(this, AnimatedRepresentation);

        var _this2 = _possibleConstructorReturn(this, (AnimatedRepresentation.__proto__ || Object.getPrototypeOf(AnimatedRepresentation)).call(this));

        _this2.animationFinishedCallback = null;
        _this2.animationDuration = 0.33 / (speedUp || 1);
        _this2.tween = new Tween();
        _this2.tween.whenDone(_this2.animationFinished.bind(_this2));
        return _this2;
    }

    _createClass(AnimatedRepresentation, [{
        key: "dispose",
        value: function dispose() {
            _get(AnimatedRepresentation.prototype.__proto__ || Object.getPrototypeOf(AnimatedRepresentation.prototype), "dispose", this).call(this);
            this.animationFinishedCallback = null;
            this.tween = null;
        }
    }, {
        key: "walkTo",
        value: function walkTo(x, z, direction) {
            var u = Directions.toUnitVector(direction);
            this.animateDisplacement(u.multiplyScalar(MazeWalls.cellDimension));
        }

        /* Animated turn until the Actor faces the direction indicated by the unit vector  */

    }, {
        key: "turnTowards",
        value: function turnTowards(direction) {
            var quaternion = new THREE.Quaternion();
            quaternion.setFromUnitVectors(Directions.toUnitVector(Directions.NORTH), Directions.toUnitVector(direction));
            this.animateRoll(quaternion);
        }
    }, {
        key: "animateDisplacement",
        value: function animateDisplacement(displacement, easing, duration) {
            var _this3 = this;

            var startPosition = new THREE.Vector3().copy(this.object.position);
            this.tween.add(duration || this.animationDuration, easing, function (t) {
                _this3.object.position.copy(startPosition);
                _this3.object.position.addScaledVector(displacement, t);
            });
        }
    }, {
        key: "animateRoll",
        value: function animateRoll(finalQuaternion) {
            var _this4 = this;

            this.tween.add(this.animationDuration, null, Tween.deltaT(function (t, dt) {
                _this4.quaternion.slerp(finalQuaternion, Math.min(1, dt / (1 - t)));
            }));
        }
    }, {
        key: "animateFall",
        value: function animateFall(isEnemy) {
            var _this5 = this;

            var spinVelocity = 2;
            var spinEasing = tweenFunctions.linear;
            /* The use of separate easing functions for enemy vs self
             * allows us to see enemies when they fall with us */
            var fallEasing = isEnemy ? tweenFunctions.easeInQuart : tweenFunctions.easeInSine;
            var fallDistance = 200;
            var fallDuration = 5;
            this.animateDisplacement(Directions.toUnitVector(Directions.DOWN).multiplyScalar(fallDistance), fallEasing, fallDuration);
            this.tween.add(fallDuration, spinEasing, Tween.deltaT(function (t, dt) {
                return _this5.object.rotation.z += dt * spinVelocity;
            }));
        }
    }, {
        key: "stopAnimating",
        value: function stopAnimating() {
            this.tween.stop();
        }
    }, {
        key: "animate",
        value: function animate(dt) {
            this.tween.update(dt);
        }
    }, {
        key: "animationFinished",
        value: function animationFinished() {
            if (this.isFalling) {
                this.isFalling = false;
                this.fallFinished();
            }
            if (this.animationFinishedCallback) {
                this.animationFinishedCallback();
            }
        }
    }, {
        key: "startFalling",
        value: function startFalling(isEnemy) {
            if (!this.isFalling) {
                this.isFalling = true;
                this.animateFall(isEnemy);
            }
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
            return new MissileRepresentation(getMissileMaterial(missileColor));
        }
    }, {
        key: "isStopped",
        get: function () {
            return !this.tween.isAnimating;
        }
    }]);

    return AnimatedRepresentation;
}(VisibleRepresentation);

var EyeRepresentation = function (_AnimatedRepresentati) {
    _inherits(EyeRepresentation, _AnimatedRepresentati);

    function EyeRepresentation() {
        _classCallCheck(this, EyeRepresentation);

        var _this6 = _possibleConstructorReturn(this, (EyeRepresentation.__proto__ || Object.getPrototypeOf(EyeRepresentation)).call(this));

        if (!staticGeometry.eye) {
            staticGeometry.eye = new THREE.SphereGeometry(eyeRadius, 32, 32);
            staticGeometry.eye.rotateY(Math.PI);
        }
        var mesh = new THREE.Mesh(staticGeometry.eye, theme.eyeMaterial);

        _this6.sound = new ActorSounds();
        _this6.sound.startWalking();

        _this6.object = new THREE.Object3D();
        _this6.object.add(mesh);
        _this6.object.position.y = eyeHeight;
        _this6.object.add(_this6.sound.representation);

        if (theme.useActorIllumination) {
            // Set the fade out distance just shy of the wall on a
            // neighboring corridor. This is important to keep light
            // from going through walls in a multi-player game.
            var fadeDistance = MazeWalls.cellDimension * 2;
            _this6.headLight = new THREE.PointLight(0xFFFFFF, 0.25, fadeDistance);
            _this6.object.add(_this6.headLight);
        }
        return _this6;
    }

    _createClass(EyeRepresentation, [{
        key: "dispose",
        value: function dispose() {
            _get(EyeRepresentation.prototype.__proto__ || Object.getPrototypeOf(EyeRepresentation.prototype), "dispose", this).call(this);
            this.sound.dispose();
            this.sound = null;
        }
    }, {
        key: "shotDead",
        value: function shotDead(respawnCallback) {
            this.stopAnimating();
            this.turnTowards(Directions.UP);
            this.startFalling(true);
            this.respawnCallback = respawnCallback;
            this.sound.scream();
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
            this.sound.startWalking();
        }
    }, {
        key: "shoot",
        value: function shoot() {
            this.sound.bang();
        }
    }]);

    return EyeRepresentation;
}(AnimatedRepresentation);

var MissileRepresentation = function (_AnimatedRepresentati2) {
    _inherits(MissileRepresentation, _AnimatedRepresentati2);

    function MissileRepresentation(material) {
        _classCallCheck(this, MissileRepresentation);

        var _this7 = _possibleConstructorReturn(this, (MissileRepresentation.__proto__ || Object.getPrototypeOf(MissileRepresentation)).call(this, 10));

        if (!staticGeometry.missile) {
            staticGeometry.missile = new THREE.TorusKnotGeometry(0.1, 0.02, 18);
            staticGeometry.missile.rotateZ(-Math.PI / 2);
        }
        var mesh = new THREE.Mesh(staticGeometry.missile, material);

        _this7.object = new THREE.Object3D();
        _this7.object.add(mesh);
        _this7.object.position.y = 1.5;

        if (theme.useActorIllumination) {
            // Set the fade out distance just shy of the wall on a
            // neighboring corridor. This is important to keep light
            // from going through walls in a multi-player game.
            var fadeDistance = MazeWalls.cellDimension * 2.45;
            var light = new THREE.PointLight(material.color, 0.5, fadeDistance);
            _this7.object.add(light);
        }
        return _this7;
    }

    _createClass(MissileRepresentation, [{
        key: "dispose",
        value: function dispose() {
            _get(MissileRepresentation.prototype.__proto__ || Object.getPrototypeOf(MissileRepresentation.prototype), "dispose", this).call(this);
            this.object.geometry.dispose();
        }
    }, {
        key: "animate",
        value: function animate(dt) {
            _get(MissileRepresentation.prototype.__proto__ || Object.getPrototypeOf(MissileRepresentation.prototype), "animate", this).call(this, dt);
            this.object.rotation.x += 0.1;
        }
    }], [{
        key: "getMissileMaterial",
        value: function getMissileMaterial(missileColor) {
            return new THREE.MeshBasicMaterial({ color: missileColor });
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

        var _this8 = _possibleConstructorReturn(this, (MapRepresentation.__proto__ || Object.getPrototypeOf(MapRepresentation)).call(this));

        _this8.cellSize = 8;
        _this8.scoreHeight = 16;

        var maxRats = 8;

        var mazePixelWidth = maze.mazeCols * _this8.cellSize;
        _this8.mazePixelHeight = maze.mazeRows * _this8.cellSize;
        var listPixelHeight = maxRats * _this8.scoreHeight;
        var bothPixelHeight = _this8.mazePixelHeight + listPixelHeight;

        _this8.mapCanvas = document.createElement("canvas");
        _this8.mapCanvas.width = mazePixelWidth;
        _this8.mapCanvas.height = bothPixelHeight;

        var mapGlHeight = bothPixelHeight / _this8.mazePixelHeight * 0.1;
        var mapGlWidth = 0.2;

        _this8.mapTexture = new THREE.Texture(_this8.mapCanvas);

        _this8.drawMap();
        //this.drawScores();

        _this8.mapMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            shading: THREE.FlatShading,
            map: _this8.mapTexture,
            side: THREE.FrontSide,
            transparent: true,
            opacity: 0.5
        });

        var geometry = new THREE.PlaneGeometry(mapGlWidth, mapGlHeight);
        var plane = new THREE.Mesh(geometry, _this8.mapMaterial);

        _this8.object = plane;
        return _this8;
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

var CandleLight = function () {
    function CandleLight(fadeDistance) {
        _classCallCheck(this, CandleLight);

        this.light = new THREE.PointLight(0xFFAA00, 0.25, fadeDistance, 2);
        this.nextFlickerTime = 0;
    }

    _createClass(CandleLight, [{
        key: "flicker",
        value: function flicker() {
            var smoothingFactor = 0.25;
            var flickerInterval = 100;
            var minIntensity = 0.3;
            var maxIntensity = 0.5;

            if (Date.now() > this.nextFlickerTime) {
                this.targetIntensity = minIntensity + Math.random() * (maxIntensity - minIntensity);
                this.nextFlickerTime = Date.now() + Math.random() * flickerInterval;
            } else {
                this.light.intensity = this.light.intensity * (1 - smoothingFactor) + this.targetIntensity * smoothingFactor;
            }
        }
    }, {
        key: "representation",
        get: function () {
            return this.light;
        }
    }]);

    return CandleLight;
}();

// The player's own character. It carries the camera and a map around


var SelfRepresentation = function (_AnimatedRepresentati3) {
    _inherits(SelfRepresentation, _AnimatedRepresentati3);

    function SelfRepresentation(camera) {
        _classCallCheck(this, SelfRepresentation);

        var _this9 = _possibleConstructorReturn(this, (SelfRepresentation.__proto__ || Object.getPrototypeOf(SelfRepresentation)).call(this));

        _this9.map = new MapRepresentation();

        _this9.body = new SelfBody(camera);
        _this9.body.carry(_this9.map);

        _this9.object = _this9.body.getNeck();

        if (theme.useActorIllumination) {
            // Set the fade out distance just shy of the wall on a
            // neighboring corridor. This is important to keep light
            // from going through walls in a multi-player game.
            var fadeDistance = MazeWalls.cellDimension * 7;
            _this9.candle = new CandleLight(fadeDistance);
            _this9.body.carry(_this9.candle);
        }
        return _this9;
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
        value: function animate(dt) {
            _get(SelfRepresentation.prototype.__proto__ || Object.getPrototypeOf(SelfRepresentation.prototype), "animate", this).call(this, dt);
            if (this.isFalling) {
                return;
            }

            this.body.update();
            if (this.candle) {
                this.candle.flicker();
            }
        }
    }, {
        key: "shotDead",
        value: function shotDead(respawnCallback) {
            this.turnTowards(Directions.UP);
            this.startFalling(false);
            //this.body.lockControls();
            maze.setIsFalling(true);

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
            theme.fadeEffect();
            this.body.reattachHead();
            //this.body.unlockControls();
            maze.setIsFalling(false);
            this.map.show();
        }
    }, {
        key: "directionVector",
        get: function () {
            var u = Directions.toUnitVector(Directions.NORTH);
            u.applyEuler(this.body.getHead().rotation);
            return u;
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
    function SelfBody(camera) {
        _classCallCheck(this, SelfBody);

        var handsTilt = 45;

        this.head = camera;
        this.neck = new THREE.Object3D();
        this.body = new THREE.Object3D();
        this.hands = new THREE.Object3D();
        this.carriedObjects = new THREE.Object3D();
        this.combined = new THREE.Object3D();

        this.neck.position.y = eyeHeight;
        this.hands.position.y = chestHeight;
        this.hands.position.z = -distanceOfHeldObjectsFromChest;
        this.carriedObjects.rotation.x = -handsTilt / 180 * Math.PI;

        this.neck.add(this.head);
        this.body.add(this.hands);
        this.hands.add(this.carriedObjects);

        this.combined.add(this.body);
        this.combined.add(this.neck);

        this.motionTracker = new MotionTracker(this.updateBody.bind(this));
        motionTracker = this.motionTracker;
    }

    _createClass(SelfBody, [{
        key: "getNeck",
        value: function getNeck() {
            return this.neck;
        }
    }, {
        key: "getHead",
        value: function getHead() {
            return this.head;
        }
    }, {
        key: "reattachHead",
        value: function reattachHead() {
            var tmp = new THREE.Object3D();
            // When the player dies, their head/eyeball falls into the
            // abyss. This reattaches the head so that play can continue.
            this.neck.position.y = eyeHeight;
            this.neck.rotation.copy(tmp.rotation);
        }
    }, {
        key: "carry",
        value: function carry(object) {
            this.carriedObjects.add(object.representation);
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
            var headsetElevation = Math.atan2(u.y, projectionMagn);

            // The RigidBody's head orientation is updated to match
            // the orientation and pose of the VR headset
            this.head.rotation.setFromQuaternion(headsetOrientation);
            this.head.position.copy(headsetPose);

            // Keep the body underneath the neck and facing in the
            // same direction, except when the player is looking
            // straight up and the direction is indeterminate.
            this.body.position.x = this.neck.position.x;
            this.body.position.z = this.neck.position.z;
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
            this.motionTracker.update();
        }
    }, {
        key: "representation",
        get: function () {
            return this.combined;
        }
    }]);

    return SelfBody;
}();

function getWebGLPlayerFactory() {
    var playerFactory = {
        newSelfPlayer: function () {
            var selfRepresentation = new SelfRepresentation(overlay.representation);
            var actor = new Player(selfRepresentation);
            new HeadsetDirector(actor, container);
            actors.placePlayer(actor);
            return actor;
        },
        newRobotPlayer: function () {
            var actor = new Player(new EyeRepresentation());
            new RoboticDirector(actor);
            actors.placePlayer(actor);
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