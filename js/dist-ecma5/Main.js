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

var mwDebug = true;

var vrDisplay, gpClicker;

var clock = new THREE.Clock();
var actors = new WebGLActors();

function setupVR(sceneCallback) {
    if (!navigator.getVRDisplays) {
        mwLog("WebVR is not supported");
        return;
    }

    try {
        // Get the VRDisplay and save it for later.
        vrDisplay = null;
        navigator.getVRDisplays().then(function (displays) {
            if (displays.length > 0) {
                vrDisplay = displays[0];
                sceneCallback();
            }
        });
    } catch (e) {
        mwLog("Query of VRDisplays failed");
    }
}

function init() {
    setupVR(setupScene);

    var vrEnabled = true;

    function modeSelected(mode) {
        console.log("Mode is", mode);
        switch (mode) {
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
        if (vrEnabled && vrDisplay.capabilities.canPresent && effect.requestPresent) {
            effect.requestPresent();
        }
        document.querySelector("about-box").setOverlayVisibility(false);
    }

    function endVr() {
        if (effect.endPresent) {
            effect.endPresent();
        }
        document.querySelector("about-box").setOverlayVisibility(true);
    }

    function startNetworkGame() {
        var name = prompt("Please enter your name");
        startVr();

        function stateChangedCallback(state, error) {
            switch (state) {
                case "joined":
                    break;
                case "error":
                    endVr();
                    document.querySelector("about-box").showNetworkError(error);
                    console.log("Error", error);
                    break;
            }
        }

        console.log("Starting network game");
        game.endGame();

        /* Choose random hostId. TODO: Implement check for conflicting ids */
        var ETHERNET_ADDR_MIN = 0x01;
        var ETHERNET_ADDR_MAX = 0xFF;
        var hostId = Math.floor(Math.random() * (ETHERNET_ADDR_MAX - ETHERNET_ADDR_MIN)) + ETHERNET_ADDR_MIN;

        game = new NetworkedGame(getWebGLPlayerFactory(camera));
        game.startGame(hostId, name, stateChangedCallback);
    }

    function startSoloGame() {
        startVr();
    }

    // WebComponents initialization
    function webComponentsReady() {
        mwLog("Web components ready");
        var about = document.querySelector("about-box");
        if (about) {
            about.addCallback("gfxModeSelected", modeSelected);
            about.addCallback("startSoloGame", startSoloGame);
            about.addCallback("startNetworkGame", startNetworkGame);
            if (FastClick) {
                FastClick.attach(about);
            }
        }
    }

    window.addEventListener('WebComponentsReady', webComponentsReady);
}

function resize() {
    var width = window.innerWidth;
    var height = window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    effect.setSize(width, height);
}

function update(dt) {
    resize();

    camera.updateProjectionMatrix();

    if (headsetDirector) {
        headsetDirector.update(dt);
        gpClicker.poll();
    }

    actors.animate();
    tween.update(dt);

    animateSkydome();
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