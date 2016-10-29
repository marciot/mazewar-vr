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

## Play it now (beta):

The game is currently playable as a beta. You can try the
[online demo](http://marciot.com/mazewar-vr).

## Compatibility:

My goal is to maintain compatibility with the most modern devices, provided you download the latest versions of
the recommended web browser for that platform:

* __Desktop PCs__: Should work with the latest version of Google Chrome
* __Android__: Should work with the latest version of Google Chrome.
* __iOS__: Single player mode is supported, but multi-player is not currently supported under Safari; future compatibility is planned via an app.
* __Samsung Gear VR, Oculus Rift, HTC Vive__: Not currently supported, but expected to be supported
in Chrome once the game has been updated to use the [WebVR API].

See the project [wiki page] for compatibility notes for specific devices that have been tested.

## Credits:

This project makes use of [THREE.js], [peerjs] and [WebComponents] and relies on [mesh networking
code] developed for my [RetroWeb Vintage Computer Museum] project. Assistance in reconstructing the
Maze War protocol was provided by the developer of the [Contralto] emulator from the
[Living Computers: Museum+Labs].

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
[wiki page]: https://github.com/marciot/mazewar-vr/wiki
