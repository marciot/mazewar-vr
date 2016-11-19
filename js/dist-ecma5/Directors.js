var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

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

var Director = function Director(actor) {
    _classCallCheck(this, Director);

    this.actor = actor;

    // When the Actor which I am directing is
    // disposed, I should dispose myself too.
    var me = this;

    var DeathObserver = function () {
        function DeathObserver() {
            _classCallCheck(this, DeathObserver);
        }

        _createClass(DeathObserver, [{
            key: 'dispose',
            value: function dispose() {
                me.dispose();
            }
        }]);

        return DeathObserver;
    }();

    actor.addObserver(new DeathObserver());
};

var RoboticDirector = function (_Director) {
    _inherits(RoboticDirector, _Director);

    function RoboticDirector(actor) {
        _classCallCheck(this, RoboticDirector);

        var _this = _possibleConstructorReturn(this, (RoboticDirector.__proto__ || Object.getPrototypeOf(RoboticDirector)).call(this, actor));

        actor.orientTowards(actor.choosePassage());

        actor.representation.setAnimationFinishedCallback(_this.animationFinished.bind(_this));
        return _this;
    }

    _createClass(RoboticDirector, [{
        key: 'dispose',
        value: function dispose() {}

        // Chooses a direction by considering all possibilities and
        // giving a bias towards moving forwards.

    }, {
        key: 'chooseDirection',
        value: function chooseDirection() {
            function flipCoin() {
                return Math.floor(Math.random() * 2);
            }

            var canGoStraight = this.actor.canWalk(this.actor.facing);
            var canGoLeft = this.actor.canWalk(Directions.leftFrom(this.actor.facing));
            var canGoRight = this.actor.canWalk(Directions.rightFrom(this.actor.facing));

            // 1:1 odds of going straight if there is the possibility to turn.
            if (canGoStraight && (!(canGoLeft || canGoRight) || flipCoin())) {
                return this.actor.facing;
            }

            // 1:1 odds of going left or right, or about-face if no other choice.
            if (flipCoin()) {
                // Try to go right, then left, then reverse
                if (canGoRight) {
                    return Directions.rightFrom(this.actor.facing);
                } else if (canGoLeft) {
                    return Directions.leftFrom(this.actor.facing);
                } else {
                    return Directions.oppositeFrom(this.actor.facing);
                }
            } else {
                // Try to go left, then right, then reverse
                if (canGoLeft) {
                    return Directions.leftFrom(this.actor.facing);
                } else if (canGoRight) {
                    return Directions.rightFrom(this.actor.facing);
                } else {
                    return Directions.oppositeFrom(this.actor.facing);
                }
            }
        }
    }, {
        key: 'shootIfTargetInRange',
        value: function shootIfTargetInRange() {
            var target = this.actor.actorInFrontOfMe;
            if (target) {
                this.actor.shoot();
            }
        }
    }, {
        key: 'animationFinished',
        value: function animationFinished() {
            if (this.actor.isDead) {
                return;
            }

            if (typeof mwDebug !== "undefined") {
                // Check to make sure the WebGL representation
                // is kept in sync with the state of the actors.
                this.actor.representation.assertPosition(this.actor.x, this.actor.z);
            }

            var direction = this.chooseDirection();
            if (direction == this.actor.facing) {
                this.actor.walk(direction);
                this.shootIfTargetInRange();
            } else {
                this.actor.turnTowards(direction);
            }
        }
    }]);

    return RoboticDirector;
}(Director);

var KeyboardDirector = function (_Director2) {
    _inherits(KeyboardDirector, _Director2);

    function KeyboardDirector(actor) {
        _classCallCheck(this, KeyboardDirector);

        var _this2 = _possibleConstructorReturn(this, (KeyboardDirector.__proto__ || Object.getPrototypeOf(KeyboardDirector)).call(this, actor));

        _this2.listener = _this2.keypressEvent.bind(_this2);
        window.addEventListener('keypress', _this2.listener);
        return _this2;
    }

    _createClass(KeyboardDirector, [{
        key: 'dispose',
        value: function dispose() {
            window.removeEventListener('keypress', this.listener);
        }
    }, {
        key: 'keypressEvent',
        value: function keypressEvent(e) {
            switch (String.fromCharCode(e.charCode)) {
                case 'a':
                    this.actor.aboutFace();
                    break;
                case 's':
                    this.actor.turnLeft();
                    break;
                case 'd':
                    this.actor.walk();
                    break;
                case 'f':
                    this.actor.turnRight();
                    break;
                case 'c':
                    this.actor.walkBackwards();
                    break;
                case ' ':
                    this.actor.shoot();
                    break;
            }
        }
    }]);

    return KeyboardDirector;
}(Director);

var headsetDirector;

/* Pointer Lock API Support (very useful for games that rely on relative mouse positioning) */

function requestPointerLock(element) {
    element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
    // Ask the browser to lock the pointer
    if (element.requestPointerLock) {
        element.requestPointerLock();
    }
}

function isPointerLocked() {
    return document.pointerLockElement || document.mozPointerLockElement || document.webkitPointerLockElement;
}

var HeadsetDirector = function (_Director3) {
    _inherits(HeadsetDirector, _Director3);

    function HeadsetDirector(actor, container) {
        _classCallCheck(this, HeadsetDirector);

        var _this3 = _possibleConstructorReturn(this, (HeadsetDirector.__proto__ || Object.getPrototypeOf(HeadsetDirector)).call(this, actor));

        _this3.pressDelay = 200;
        _this3.pressTimer = null;

        var useTouch = false;
        var me = _this3;

        _this3.mousedownFunc = function (e) {
            if (!isPointerLocked()) {
                requestPointerLock(container);
            }
            if (!useTouch) me.triggerPressed(e);
        };
        _this3.mouseupFunc = function (e) {
            if (!useTouch) me.triggerReleased(e);
        };
        _this3.touchStartFunc = function (e) {
            useTouch = true;me.triggerPressed(e);
        };
        _this3.touchEndFunc = function (e) {
            useTouch = true;me.triggerReleased(e);
        };

        container.addEventListener('mousedown', _this3.mousedownFunc);
        container.addEventListener('mouseup', _this3.mouseupFunc);
        container.addEventListener('touchstart', _this3.touchStartFunc);
        container.addEventListener('touchend', _this3.touchEndFunc);

        _this3.autoWalk = false;
        actor.representation.setAnimationFinishedCallback(_this3.animationFinished.bind(_this3));

        headsetDirector = _this3;

        if (!gpClicker) {
            // Create an object for monitoring the gamepad controllers
            gpClicker = new GamePadClicker();
        }
        gpClicker.setCallbacks(_this3.triggerPressed.bind(_this3), _this3.triggerReleased.bind(_this3));
        return _this3;
    }

    _createClass(HeadsetDirector, [{
        key: 'dispose',
        value: function dispose() {
            container.removeEventListener('mousedown', this.mousedownFunc);
            container.removeEventListener('mouseup', this.mouseupFunc);
            container.removeEventListener('touchstart', this.touchStartFunc);
            container.removeEventListener('touchend', this.touchEndFunc);

            this.rigidBody = null;

            this.mousedownFunc = null;
            this.mouseupFunc = null;
            this.touchStartFunc = null;
            this.touchEndFunc = null;
            if (this.pressTimer) {
                window.clearTimeout(this.pressTimer);
            }
        }
    }, {
        key: 'triggerHeld',
        value: function triggerHeld() {
            this.setAutoWalk(true);
        }
    }, {
        key: 'triggerTap',
        value: function triggerTap() {
            this.actor.shoot();
        }
    }, {
        key: 'triggerPressed',
        value: function triggerPressed(e) {
            if (!this.pressTimer) {
                this.pressTimer = window.setTimeout(function () {
                    this.pressTimer = null;this.triggerHeld();
                }.bind(this), this.pressDelay);
            }
        }
    }, {
        key: 'triggerReleased',
        value: function triggerReleased(e) {
            if (this.pressTimer) {
                window.clearTimeout(this.pressTimer);
                this.triggerTap();
                this.pressTimer = null;
            } else {
                this.setAutoWalk(false);
            }
        }
    }, {
        key: 'animationFinished',
        value: function animationFinished() {
            if (this.autoWalk && !this.actor.isDead) {
                this.actor.walk(this.actor.representation.cardinalDirection);
            }
        }
    }, {
        key: 'setAutoWalk',
        value: function setAutoWalk(state) {
            this.autoWalk = state;
            if (this.actor.representation.isStopped) {
                this.actor.walk(this.actor.representation.cardinalDirection);
            }
        }
    }, {
        key: 'update',
        value: function update(dt) {
            var cardinalDirection = this.actor.representation.cardinalDirection;
            if (cardinalDirection !== this.lastDirection) {
                this.actor.orientTowards(cardinalDirection);
                this.lastDirection = cardinalDirection;

                if (this.autoWalk && this.actor.representation.isStopped) {
                    // Walk in new direction if trigger is being held
                    this.animationFinished();
                }
            }
        }
    }]);

    return HeadsetDirector;
}(Director);

var GamePadClicker = function () {
    function GamePadClicker() {
        _classCallCheck(this, GamePadClicker);

        this.buttonCaptured = false;
        this.lastButtonState = false;
        this.captureTries = 0;
    }

    _createClass(GamePadClicker, [{
        key: 'waitForButton',
        value: function waitForButton() {
            var gamepads = navigator.getGamepads ? navigator.getGamepads() : navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : [];
            if (gamepads && gamepads.length) {
                for (var gpIndex = 0; gpIndex < gamepads.length; gpIndex++) {
                    var gp = gamepads[gpIndex];
                    if (gp && gp.connected) {
                        for (var btnIndex = 0; btnIndex < gp.buttons.length; btnIndex++) {
                            if (gp.buttons[btnIndex].pressed) {
                                console.log("Button", btnIndex, "on controller", gpIndex, "pressed");
                                this.buttonCaptured = true;
                                this.gpIndex = gpIndex;
                                this.btnIndex = btnIndex;
                                this.statusDom.innerHTML = "Button set! (click again to reset)";
                                return;
                            }
                        }
                    }
                }
            } else {
                this.statusDom.innerHTML = "Cannot find gamepads";
                return;
            }

            var captureTime = 10000;
            if (this.captureTries < captureTime / 250) {
                this.captureTries++;
                setTimeout(this.waitForButton.bind(this), 250);
            } else {
                this.statusDom.innerHTML = "Not buttons detected (click to try again)";
            }
        }
    }, {
        key: 'setCallbacks',
        value: function setCallbacks(pressedCallback, releasedCallback) {
            this.pressedCallback = pressedCallback;
            this.releasedCallback = releasedCallback;
        }
    }, {
        key: 'captureButton',
        value: function captureButton(statusDom) {
            this.tries = 0;
            this.statusDom = statusDom;
            this.statusDom.innerHTML = "Press and hold down a button";
            this.waitForButton();
        }
    }, {
        key: 'poll',
        value: function poll() {
            if (this.buttonCaptured) {
                var gamepads = navigator.getGamepads ? navigator.getGamepads() : navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : [];
                var gp = gamepads[this.gpIndex];
                if (gp.buttons[this.btnIndex].pressed) {
                    if (this.lastButtonState === false) {
                        this.lastButtonState = true;
                        if (this.pressedCallback) {
                            this.pressedCallback();
                        }
                    }
                } else {
                    if (this.lastButtonState === true) {
                        this.lastButtonState = false;
                        if (this.releasedCallback) {
                            this.releasedCallback();
                        }
                    }
                }
            }
        }
    }]);

    return GamePadClicker;
}();