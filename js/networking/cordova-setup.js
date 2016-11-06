// Cordova initialization
window.isCordova    = (! /^http/.test(location.protocol));
window.isCordovaIOS = (window.device && window.device.platform === 'iOS');

function onDeviceReady() {
    if (window.isCordovaIOS) {
        cordova.plugins.iosrtc.registerGlobals();
    }
    if(peerJsInit) {
        peerJsInit();
    }
}

if(window.isCordova) {
    document.addEventListener("deviceready", onDeviceReady, false);
} else {
    onDeviceReady();
}