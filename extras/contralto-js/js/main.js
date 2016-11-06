/*
 JsAlto Xerox Alto Emulator
 Copyright (C) 2016  Seth J. Morabito

 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU Affero General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU Affero General Public License for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this program.  If not, see
 <http://www.gnu.org/licenses/>.
*/

// The general strategy here is to allow the back end of the processor
// to progress for 1/60th of a second worth of steps for each frame of
// animation we draw. At 170ns per step, that equals 98039 clock
// cycles per frame drawn.

var animFrame = window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame   ||
        window.mozRequestAnimationFrame      ||
        window.oRequestAnimationFrame        ||
        window.msRequestAnimationFrame       ||
        null;

var frameId = 0;
var system;

var STEPS_PER_FRAME = 98000;

function initAlto(display, textarea) {
    system = new altoSystem();
    
    function mouseMove(e) {
        // Use absolute mouse positioning otherwise

        var rect = display.getBoundingClientRect();

        mouse.mouseMove(Math.ceil((e.clientX - rect.left) / (rect.right - rect.left) * display.width),
                        Math.ceil((e.clientY - rect.top) / (rect.bottom - rect.top) * display.height));
        return false;
    }

    function mouseDown(e) {
        mouse.mouseDown(e);
        textarea.focus();
    }
    
    /* Use a text area to capture keyboard for iOS */
    textarea.addEventListener("keydown", keyboard.keyDown, false);
    textarea.addEventListener("keyup", keyboard.keyUp, false);
    textarea.focus();

    display.addEventListener("mousemove", mouseMove, false);
    display.addEventListener("mousedown", mouseDown, false);
    display.addEventListener("mouseup", mouse.mouseUp, false);
    display.oncontextmenu = function() {
        return false;
    };
    
    return system;
}

// Main loop
function runMainLoop() {
    if (system.profiling) {
        /* Running through the JavaScript profiler I learned that Date.now() is
         * actually a rather slow function. Replacing it with performance.now()
         * gave some improvement, but the best gains came from not calling timing
         * functions at all (unless system.profiling is enabled) */
        var startTime = performance.now();

        system.run(STEPS_PER_FRAME);
        altoDisplay.render();

        var endTime = performance.now();
        var clockNS = Math.ceil(((endTime - startTime) / STEPS_PER_FRAME) * conversion.msecToNsec);
        console.log("Avg Step = " + clockNS + " ns. (" + Math.ceil((170 / clockNS) * 100) + "% a real Alto)");
    } else {
        system.run(STEPS_PER_FRAME);
        altoDisplay.render();
    }
    frameId = animFrame(runMainLoop);
}

function stopRunning() {
    cancelAnimationFrame(frameId);
}

function resetSimulator() {
    this.stopRunning();
    system.reset();
}

function startRunning() {
    runMainLoop();
}