![alt text][logo]

Maze War _VR_
=============

_Maze War VR_ is a remake of Maze War, a game originally written by Steve Colley, Greg Thompson
and Howard Palmer in 1973 at the NASA Ames Research Center in California. That game allowed
players to hunt down opponents in a three-dimensional maze, making it the grandfather of
first person shooter games.

_Maze War VR_  recreates the game in virtual reality. This remake is made for smartphones
using inexpensive VR headsets such as the [Mattel ViewMaster VR] or [Homido VR], but can also be played on
a PC using the latest version of Chrome or Firefox.

## Official game trailer on YouTube:

[![Maze War VR Trailer](https://github.com/marciot/mazewar-vr/raw/master/artwork/mazewar-youtube1.png)](https://www.youtube.com/watch?v=MyrLqLo-6qA)

## Play it now (beta):

The game is currently playable as a beta. You can try the
[online game](http://marciot.com/mazewar-vr) or get the [Android app] from the Google Play store.

## Compatibility:

My goal is to maintain broad compatibility provided you follow these recommendations:

* __Desktop PCs or Mac__: Should work with the latest version of Chrome or Firefox.
* __Android__: Supported via the [Android app], or via the latest version of Google Chrome
* __iOS__: Single player mode works via Safari, but multi-player is not currently functional; multi-player capability is planned via an app.
* __Samsung Gear VR__: Should be supported using the [Samsung Internet Browser for Gear VR] from the Oculus store.
* __Oculus Rift__: Works, but requires special [WebVR] builds of [Chrome] and [Firefox].
* __HTC Vive__: Untested, but should work using special [WebVR] builds of [Chrome] and [Firefox].

See the project [wiki page] for compatibility notes for specific devices that have been tested.

### Compatibility with the Xerox Alto version

_Maze War VR_ is modeled after version 2.0 of the Xerox Alto remake of Maze War that was developed
at the Xerox's Palo Alto Research Center in 1977. _Maze War VR_ implements the same [PUP protocol]
as that version, allowing _Maze War VR_ to be compatible with Maze War running on an
[Xerox Alto Emulator], as shown in this technical demonstration:

[![Alto Maze War Side-By-Side](https://github.com/marciot/mazewar-vr/raw/master/artwork/mazewar-youtube2.png)](https://www.youtube.com/watch?v=XXOH0z3Aki8)

## Technologies Used:

Aside from being fun (I hope), this game is a technology demo in its own right, pulling together
[ECMAScript 2015] (6th Edition) and the latest and emerging browser technologies such as
[WebComponents], [WebGL], [WebVR], [WebAudio], [WebRTC] and the [Gamepad API]. Polyfills and
[Babel] are use to maintain compatibility with the widest range of devices.

## Licensing:

I am a strong believer in open source. As such, I intend to release most of the source code for Maze War VR
under the Affero GPL license. This includes all code as you see it in the playable website demo above.

The portions of the code written by me and required MIT licensed libraries will also be made available in
binary form in the Apple app store under a non-free license (see this link for an explanation on why
[iOS apps are incompatible with the GPL]). This will be done to fund further development of this project and to
add support for Apple devices, which otherwise would be unplayable due to lack of WebRTC in the browser.

## How can you help this project?

You may purchase VR headsets using the in-app links, or visit my [itch.io page] to make a donation or subscribe via my [Patreon page]!

### Contributing source code:

Code contributions or fixes to <cite>Maze War VR</cite> are welcome, although for the licensing reasons
stated above I will not be able to incorporate it into the main-line distribution unless you dual license
your code or assign the copyright of your enhancements to me.

## Credits &amp; Sponsors:

This project makes use of [THREE.js], [peerjs] and [WebComponents] and relies on [mesh networking
code] developed for my [RetroWeb Vintage Computer Museum] project. Assistance in reconstructing the
Maze War protocol was provided by the developer of the [Contralto] emulator from
[Living Computers: Museum+Labs].

Testing service provided by:

[![BrowserStack](https://github.com/marciot/mazewar-vr/raw/master/artwork/browserstack.png)](http://www.browserstack.com)
[logo]: https://github.com/marciot/mazewar-vr/raw/master/artwork/fb-share.jpg "A screenshot from MazeWar VR"
[Patreon page]: https://www.patreon.com/marciot
[itch.io page]: https://marciot.itch.io/maze-war-vr
[Android app]: https://play.google.com/store/apps/details?id=com.marciot.mazewar_vr_free
[Homido VR]: https://www.amazon.com/gp/product/B01LZWDNX6/ref=as_li_tl?ie=UTF8&camp=1789&creative=9325&creativeASIN=B01LZWDNX6&linkCode=as2&tag=marciot-20&linkId=d1dc4fe1c00bf166bf2fd7eaf2ddc08d
[Mattel ViewMaster VR]: https://www.amazon.com/gp/product/B01CNSO79Q/ref=as_li_tl?ie=UTF8&camp=1789&creative=9325&creativeASIN=B01CNSO79Q&linkCode=as2&tag=marciot-20&linkId=4cbc30bb928aa42d2d028106a56cb072
[Xerox Alto Emulator]: https://github.com/sethm/ContrAltoJS
[THREE.js]: https://threejs.org
[peerjs]: http://peerjs.com
[ECMAScript 2015]: http://www.ecma-international.org/ecma-262/6.0
[WebComponents]: http://webcomponents.org
[WebGL]: https://www.khronos.org/webgl
[WebVR]: https://webvr.info
[WebAudio]: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
[WebRTC]: https://webrtc.org
[PUP protocol]: https://en.wikipedia.org/wiki/PARC_Universal_Packet
[Gamepad API]: https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API/Using_the_Gamepad_API
[Babel]: https://babeljs.io/
[mesh networking code]: https://github.com/marciot/retroweb-networking
[RetroWeb Vintage Computer Museum]: http://retroweb.maclab.org
[Living Computers: Museum+Labs]: http://www.livingcomputers.org
[Contralto]: https://github.com/livingcomputermuseum/ContrAlto
[Samsung Internet Browser for Gear VR]: https://www.oculus.com/experiences/gear-vr/849609821813454/
[Chrome]:https://webvr.info/get-chrome/
[Firefox]:https://mozvr.com/
[wiki page]: https://github.com/marciot/mazewar-vr/wiki
[iOS apps are incompatible with the GPL]: https://www.fsf.org/blogs/licensing/more-about-the-app-store-gpl-enforcement
