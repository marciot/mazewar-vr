![alt text][logo]

Maze War _VR_
=============

_Maze War VR_ is a remake of Maze War, a game originally written by Steve Colley, Greg Thompson
and Howard Palmer in 1973 at the NASA Ames Research Center in California. That game allowed
players to hunt down opponents in a three-dimensional maze, making it the grandfather of
first person shooter games.

_Maze War VR_  recreates the game in virtual reality. This remake is made for smartphones
using inexpensive VR headsets such as the [Mattel ViewMaster VR], but can also be played on
a PC using the latest version of Chrome.

_Maze War VR_ is modeled after version 2.0 of the Xerox Alto remake of Maze War that came about
at the Xerox's Palo Alto Research Center in 1977. This version speaks a superset of that version's
Ethernet protocol, allowing for game play with players playing the Xerox Alto game on an online
[Xerox Alto Emulator].

## What technologies does this game use?

_Maze War VR_ is built using modern web technologies such as HTML, CSS and WebGL, allowing for
compatibility with a number of modern devices. Multiplayer mode is enabled by tunneling Xerox Alto
data packets through WebRTC data channels for browser-to-browser communication.

## Credits:

This project makes use of [THREE.js], [peerjs] and [WebComponents] and relies on [mesh networking
code] developed for my [RetroWeb Vintage Computer Museum] project. Assistance in reconstructing the
Maze War protocol was provided by the developer of the [Contralto] emulator from the
[Living Computers: Museum+Labs].

## Play it now (beta):

The game is currently playable as a beta. You can try the
[online demo](http://marciot.com/mazewar-vr).

## Compatibility:

My goals are to maintain compatibility with the most devices possible, provided you download the latest versions of a compatible web browser for that platform.

* __Desktop PCs__: Should work with the latest version of Google Chrome
* __Android__: Should work with the latest version of Google Chrome.
* __iOS__: Single player mode is supported, but multi-player requires WebRTC which is not supported
under Safari; future compatibility is planned via an app.
* __Samsung Gear VR, Oculus Rift, HTC Vive__: Not currently supported, but expected to be supported
in Chrome once the game has been updated to use the [WebVR API].

### Tested Devices:

In order to attempt to maintain compatibility with a wide range of devices, I will regularly test
on the following devices which are available to me:

| Device              | OS Version         | Browser             | Last Tested | Solo | Multi | Notes                    |
| ------------------- | ------------------ | ------------------- | ----------- | ---- | ----- | ------------------------ |
| Laptop Computer     | Window 10 ver 1607 | Chrome 54.0.2840.71 | 10/28/2016  | Yes  | Yes   |                          |
| Laptop Computer     | Window 10 ver 1607 | Firefox 49.0.2      | 10/28/2016  | Yes  | No    | peerjs fails             |
| Kindle Fire HDX 8.9 | Fire OS 4.5.5.2    | Chrome 54.0.2840.68 | 10/28/2016  | Yes  | Yes   | Install Chrome [via APK] |
| iPhone 6S           | iOS 10.1           | Safari              | 10/28/2016  | Yes  | No    | No WebRTC support        |

[logo]: https://github.com/marciot/mazewar-vr/raw/master/artwork/fb-share.jpg "A screenshot from MazeWar VR"
[Mattel ViewMaster VR]: https://www.amazon.com/gp/product/B01CNSO79Q/ref=as_li_tl?ie=UTF8&camp=1789&creative=9325&creativeASIN=B01CNSO79Q&linkCode=as2&tag=marciot-20&linkId=4cbc30bb928aa42d2d028106a56cb072
[Xerox Alto Emulator]: https://github.com/sethm/ContrAltoJS
[THREE.js]: https://threejs.org
[peerjs]: http://peerjs.com
[WebComponents]: http://webcomponents.org
[mesh networking code]: https://github.com/marciot/retroweb-networking
[RetroWeb Vintage Computer Museum]: http://retroweb.maclab.org
[Living Computers: Museum+Labs]: http://www.livingcomputers.org
[Contralto]: https://github.com/livingcomputermuseum/ContrAlto
[WebVR API]: https://webvr.info
[via APK]: http://www.technipages.com/kindle-fire-how-to-install-google-chrome-via-apk-file