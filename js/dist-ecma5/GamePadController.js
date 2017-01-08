var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var GamePadController = function () {
    function GamePadController(pressedCallback, releasedCallback, statusCallback) {
        _classCallCheck(this, GamePadController);

        this.buttonCaptured = false;
        this.lastButtonState = false;

        if (this.gamepads) {
            console.log("Gamepads identified:", this.gamepads.length);
        }

        this.pressedCallback = pressedCallback;
        this.releasedCallback = releasedCallback;
        this.statusCallback = statusCallback;
    }

    _createClass(GamePadController, [{
        key: "searchForButton",
        value: function searchForButton() {
            var gamepads = this.gamepads;
            if (gamepads && gamepads.length) {
                for (var gpIndex = 0; gpIndex < gamepads.length; gpIndex++) {
                    var gp = gamepads[gpIndex];
                    if (gp && gp.connected) {
                        for (var btnIndex = 0; btnIndex < gp.buttons.length; btnIndex++) {
                            if (gp.buttons[btnIndex].pressed) {
                                return {
                                    gamepadIndex: gpIndex,
                                    buttonIndex: btnIndex
                                };
                            }
                        }
                    }
                }
            }
        }
    }, {
        key: "captureInteractionButton",
        value: function captureInteractionButton() {
            var btn = this.searchForButton();
            if (btn) {
                console.log("Button", btn.buttonIndex, "on controller", btn.gamepadIndex, "bound to clicks");
                this.buttonCaptured = true;
                this.gpIndex = btn.gamepadIndex;
                this.btnIndex = btn.buttonIndex;
                return GamePadController.BUTTON_CAPTURED;
            }
            return GamePadController.NO_BUTTONS_DOWN;
        }
    }, {
        key: "poll",
        value: function poll() {
            if (this.buttonCaptured) {
                var gamepads = this.gamepads;
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
            } else if (this.scanForBtns) {
                var status = this.captureInteractionButton();
                if (status === GamePadController.BUTTON_CAPTURED) {
                    this.scanForBtns = false;
                    this.dispatchStatusEvent(status);
                }
            }
        }
    }, {
        key: "dispatchStatusEvent",
        value: function dispatchStatusEvent(eventCode) {
            if (this.statusCallback) {
                this.statusCallback(eventCode);
            }
        }
    }, {
        key: "startScan",
        value: function startScan() {
            this.scanForBtns = true;
            this.buttonCaptured = false;
        }
    }, {
        key: "gamepads",
        get: function () {
            return navigator.getGamepads ? navigator.getGamepads() : navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : [];
        }
    }], [{
        key: "NO_GAMEPADS",
        get: function () {
            return -1;
        }
    }, {
        key: "NO_BUTTONS_DOWN",
        get: function () {
            return 0;
        }
    }, {
        key: "BUTTON_CAPTURED",
        get: function () {
            return 1;
        }
    }]);

    return GamePadController;
}();

var GamePadControllerWithTimer = function (_GamePadController) {
    _inherits(GamePadControllerWithTimer, _GamePadController);

    function GamePadControllerWithTimer(pressedCallback, releasedCallback, statusCallback) {
        _classCallCheck(this, GamePadControllerWithTimer);

        var _this = _possibleConstructorReturn(this, (GamePadControllerWithTimer.__proto__ || Object.getPrototypeOf(GamePadControllerWithTimer)).call(this, pressedCallback, releasedCallback, statusCallback));

        _this.statusDom = null;
        return _this;
    }

    _createClass(GamePadControllerWithTimer, [{
        key: "beginTimedCapture",
        value: function beginTimedCapture(timeout, statusDom) {
            console.log("Scanning for game pad buttons");
            this.statusDom = statusDom;
            if (this.statusDom) {
                this.statusDom.innerHTML = "Press and hold down a button";
            }
            this.startScan();
            setTimeout(this.captureTimeout.bind(this), timeout);
        }
    }, {
        key: "captureTimeout",
        value: function captureTimeout() {
            this.scanForBtns = false;
            if (!this.buttonCaptured) {
                if (this.statusDom) {
                    this.statusDom.innerHTML = "Not buttons detected (click to try again)";
                    this.statusDom = null;
                }
                console.log("Gave up searching for gamepad buttons");
            }
        }
    }, {
        key: "dispatchStatusEvent",
        value: function dispatchStatusEvent(eventCode) {
            _get(GamePadControllerWithTimer.prototype.__proto__ || Object.getPrototypeOf(GamePadControllerWithTimer.prototype), "dispatchStatusEvent", this).call(this, eventCode);
            if (eventCode == GamePadController.BUTTON_CAPTURED) {
                if (this.statusDom) {
                    this.statusDom.innerHTML = "Button set! (click again to reset)";
                }
                console.log("Game pad button captured");
            }
        }

        /* When the game starts, if a controller button has not yet
         * been configured then scan for it for two minutes. */

    }, {
        key: "gameStarting",
        value: function gameStarting() {
            if (!this.buttonCaptured) {
                this.beginTimedCapture(120000);
            }
        }
    }]);

    return GamePadControllerWithTimer;
}(GamePadController);