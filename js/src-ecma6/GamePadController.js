class GamePadController {
    constructor(pressedCallback, releasedCallback, statusCallback) {
        this.buttonCaptured  = false;
        this.lastButtonState = false;

        if(this.gamepads) {
            console.log("Gamepads identified:", this.gamepads.length);
        }
            
        this.pressedCallback  = pressedCallback;
        this.releasedCallback = releasedCallback;
        this.statusCallback   = statusCallback;
    }
    
    static get NO_GAMEPADS()     {return -1};
    static get NO_BUTTONS_DOWN() {return  0};
    static get BUTTON_CAPTURED() {return  1};
    
    get gamepads() {
        return navigator.getGamepads ?
            navigator.getGamepads() :
            (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : []);
    }
    
    searchForButton() {
        var gamepads = this.gamepads;
        if(gamepads && gamepads.length) {
            for(var gpIndex = 0; gpIndex < gamepads.length; gpIndex++) {
                var gp = gamepads[gpIndex];
                if(gp && gp.connected) {
                    for(var btnIndex = 0; btnIndex < gp.buttons.length; btnIndex++) {
                        if(gp.buttons[btnIndex].pressed) {
                            return {
                                gamepadIndex: gpIndex,
                                buttonIndex:  btnIndex
                            }
                        }
                    }
                }
            }
        }
    }
    
    captureInteractionButton() {
        var btn = this.searchForButton();
        if(btn) {
            console.log("Button", btn.buttonIndex, "on controller", btn.gamepadIndex, "bound to clicks");
            this.buttonCaptured = true;
            this.gpIndex        = btn.gamepadIndex;
            this.btnIndex       = btn.buttonIndex;
            return GamePadController.BUTTON_CAPTURED;
        }
        return GamePadController.NO_BUTTONS_DOWN;
    }

    poll() {
        if(this.buttonCaptured) {
            var gamepads = this.gamepads;          
            var gp = gamepads[this.gpIndex];
            if(gp.buttons[this.btnIndex].pressed) {
                if(this.lastButtonState === false) {
                    this.lastButtonState = true;
                    if(this.pressedCallback) {
                        this.pressedCallback();
                    }
                }
            } else {
                if(this.lastButtonState === true) {
                    this.lastButtonState = false;
                    if(this.releasedCallback) {
                        this.releasedCallback();
                    }
                }
            }
        }
        else if(this.scanForBtns) {
            var status = this.captureInteractionButton();
            if(status === GamePadController.BUTTON_CAPTURED) {
                this.scanForBtns = false; 
                this.dispatchStatusEvent(status);
            }
        }
    }
    
    dispatchStatusEvent(eventCode) {
        if(this.statusCallback) {
            this.statusCallback(eventCode);
        }
    }
    
    startScan() {
        this.scanForBtns         = true;
        this.buttonCaptured      = false;
    }
}

class GamePadControllerWithTimer extends GamePadController {
    constructor(pressedCallback, releasedCallback, statusCallback) {
        super(pressedCallback, releasedCallback, statusCallback);
        this.statusDom = null;
    }
    
    beginTimedCapture(timeout, statusDom) {
        console.log("Scanning for game pad buttons");
        this.statusDom = statusDom;
        if(this.statusDom) {
            this.statusDom.innerHTML = "Press and hold down a button";
        }
        this.startScan();
        setTimeout(this.captureTimeout.bind(this), timeout);
    }
    
    captureTimeout() {
        this.scanForBtns = false;
        if(!this.buttonCaptured) {
            if(this.statusDom) {
                this.statusDom.innerHTML = "Not buttons detected (click to try again)";
                this.statusDom = null;
            }
            console.log("Gave up searching for gamepad buttons");
        }
    }
    
    dispatchStatusEvent(eventCode) {
        super.dispatchStatusEvent(eventCode);
        if(eventCode == GamePadController.BUTTON_CAPTURED) {
            if(this.statusDom) {
                this.statusDom.innerHTML = "Button set! (click again to reset)";
            }
            console.log("Game pad button captured");
        }
    }
    
    /* When the game starts, if a controller button has not yet
     * been configured then scan for it for two minutes. */
    gameStarting() {
        if(!this.buttonCaptured) {
            this.beginTimedCapture(120000);
        }
    }
}