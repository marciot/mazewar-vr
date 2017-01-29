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

const mwDebug = true;

var vrDisplay;

var clock  = new THREE.Clock();
var actors = new WebGLActors();

/* Decode the query variable
 */
function parseQuery(url) {
	var vars = (url || window.location.search).substring(1).split("&");
	var query = {};
	for (var i=0;i<vars.length;i++) {
		var pair = vars[i].split("=");
		query[pair[0]] = pair[1];
	}
	return query;
}

function setupVR(sceneCallback) {
    if(!navigator.getVRDisplays) {
        mwLog("WebVR is not supported");
        return;
    }

    try {
        // Get the VRDisplay and save it for later.
        vrDisplay = null;
        navigator.getVRDisplays().then(
            function(displays) {
                for(var i = 0; i < displays.length; i++) {
                    if(displays[i].capabilities.hasOrientation) {
                        console.log("Using VR display", i+1, "of", displays.length);
                        vrDisplay = displays[0];
                        sceneCallback();
                        return;
                    }
                }
                mwLog("WebVR is supported, but no VR displays found");
            }
        );
    } catch(e) {
        mwLog("Query of VRDisplays failed");
    }
}

function init() {
    setupVR(setupScene);

    var vrEnabled = true;

    function modeSelected(mode) {
        console.log("Mode is", mode);
        switch(mode) {
            case "headset":
                vrEnabled = true;
                effect = new THREE.VREffect(renderer);
                break;
            case "monitor":
                vrEnabled = false;
                effect = new THREE.VREffect(renderer);
                break;
            case "anaglyph":
                vrEnabled = false;
                effect = new THREE.AnaglyphEffect(renderer);
                break;
        }
    }

    function vrPresentationChange() {
        document.querySelector("about-box").setOverlayVisibility(!vrDisplay.isPresenting);
    }
    window.addEventListener('vrdisplaypresentchange', vrPresentationChange);

    function startVr() {
        if(vrEnabled && vrDisplay && vrDisplay.capabilities.canPresent && effect.requestPresent) {
            effect.requestPresent();
        }
        document.querySelector("about-box").showPage("page1");
        document.querySelector("about-box").setOverlayVisibility(false);
    }

    function endVr() {
        if(effect.endPresent) {
            effect.endPresent();
        }
    }

    function onBeforeUnload(event) {
        game.endGame();
    }
    window.addEventListener("beforeunload", onBeforeUnload, false);

    function onVisibilityChange(event) {
        var hidden = document.visibilityState === "hidden";
        if (hidden) {
            endVr();
            document.querySelector("about-box").setOverlayVisibility(true);
            game.endGame();
            this.startNetworkGameOnReturn = document.querySelector("about-box").getCurrentPage() === "pageNetWaiting";
        } else {
            if(this.startNetworkGameOnReturn) {
                this.startNetworkGameOnReturn = false;
                joinNetworkGame();
            }
        }
    }

    document.addEventListener("webkitvisibilitychange", onVisibilityChange, false);
    document.addEventListener("visibilitychange",       onVisibilityChange, false);

    function enterGameInProgress() {
        startVr();
        theme.fadeEffect();
        gpClicker.gameStarting();
    }

    function startSoloGame() {
        game.endGame();
        game = new SoloGame(getWebGLPlayerFactory());
        game.startGame();
        enterGameInProgress();
    }

    function joinNetworkGame() {
        const name = "Hunter";

        var me = this;
        function stateChangedCallback(state, error) {
            switch(state) {
                case "joined":
                    break;
                case "error":
                    endVr();
                    document.querySelector("about-box").showNetworkError(error);
                    console.log("Error", error);
                    break;
                case "opponentAvailable":
                    console.log("Opponent found");
                    document.querySelector("about-box").showPage("pageNetReady");
                    break;
            }
        }

        console.log("Starting network game");
        game.endGame();

        /* Choose random hostId. TODO: Implement check for conflicting ids */
        const ETHERNET_ADDR_MIN       = 0x01;
        const ETHERNET_ADDR_MAX       = 0xFF;
        const hostId = Math.floor(Math.random() * (ETHERNET_ADDR_MAX - ETHERNET_ADDR_MIN)) + ETHERNET_ADDR_MIN;

        game = new NetworkedGame(getWebGLPlayerFactory());
        game.startGame(hostId, name, stateChangedCallback);

        // Goto the waiting page
        document.querySelector("about-box").showPage("pageNetWaiting");
    }

    // WebComponents initialization
    function webComponentsReady() {
        mwLog("Web components ready");
        var about = document.querySelector("about-box");
        if(about) {
            about.addCallback("gfxModeSelected",  modeSelected);
            about.addCallback("startSoloGame",    startSoloGame);
            about.addCallback("startNetworkGame", joinNetworkGame);
            about.addCallback("enterNetworkGame", enterGameInProgress);
            if(FastClick) {
                FastClick.attach(about);
            }
        }
    }

    if(typeof HTMLImports !== "undefined") {
        window.addEventListener('WebComponentsReady', webComponentsReady);
    } else {
        // It appears as if the polyfill is not loaded.
        webComponentsReady();
    }
}

function resize() {
    var width  = window.innerWidth;
    var height = window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    effect.setSize(width, height);
}

function update(dt) {
    resize();

    camera.updateProjectionMatrix();

    if(headsetDirector) {
        headsetDirector.update(dt);
    }
    
    actors.animate(dt);
    tween.update(dt);

    theme.animate();
}

function render(dt) {
    effect.render(scene, camera);
}

function animate() {
    vrDisplay.requestAnimationFrame(animate);

    var delta = clock.getDelta();
    update(delta);
    render(delta);
}

init();