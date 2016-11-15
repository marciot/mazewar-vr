// Cordova initialization
window.isCordova = !/^http/.test(location.protocol);

function onDeviceReady() {
    window.isCordovaIOS = window.device && window.device.platform === 'iOS';

    if (window.isCordovaIOS) {
        cordova.plugins.iosrtc.registerGlobals();
    }
    if (peerJsInit) {
        peerJsInit();
    }
}

if (window.isCordova) {
    document.addEventListener("deviceready", onDeviceReady, false);
} else {
    onDeviceReady();
}