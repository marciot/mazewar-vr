var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var AudioManager = function () {
    function AudioManager() {
        _classCallCheck(this, AudioManager);

        this.inactiveSoundSets = {
            playerSounds: []
        };

        this.sounds = {};
        this.pendingSounds = 0;

        var audioLoader = new THREE.AudioLoader();

        var me = this;
        function loadSound(label, url, loop) {
            me.pendingSounds++;
            var sound = {
                buffer: null,
                waiting: [],
                loop: loop
            };
            me.sounds[label] = sound;

            audioLoader.load(url, function (buffer) {
                sound.buffer = buffer;
                for (var i = 0; i < sound.waiting.length; i++) {
                    me.attachBufferToNode(label, sound.waiting[i]);
                }
                me.pendingSounds--;
            });
        }

        // https://github.com/Modernizr/Modernizr/blob/master/feature-detects/audio.js?source=cc */
        var elem = document.createElement('audio');
        var supportsOgg = elem.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/, '');
        var ext = supportsOgg ? ".ogg" : ".mp3";

        /* mp3 files don't work under Crosswalk Android. ogg does not work under iOS...
        /* https://crosswalk-project.org/jira/si/jira.issueviews:issue-html/XWALK-7307/XWALK-7307.html */
        loadSound("walking", 'sounds/169762__nhaudio__steps-amped' + ext, true);
        loadSound("scream", 'sounds/13797__sweetneo85__wilhelm' + ext, false);
        loadSound("pow", 'sounds/183467__snapper4298__pow1' + ext, false);

        this.listener = new THREE.AudioListener();
    }

    _createClass(AudioManager, [{
        key: 'saveSoundSet',
        value: function saveSoundSet(label, soundSet) {
            this.inactiveSoundSets[label].push(soundSet);
        }
    }, {
        key: 'reuseSoundSet',
        value: function reuseSoundSet(label) {
            if (this.inactiveSoundSets[label].length) {
                return this.inactiveSoundSets[label].pop();
            }
        }
    }, {
        key: 'attachBufferToNode',
        value: function attachBufferToNode(label, node) {
            var sound = this.sounds[label];
            if (!sound.buffer) {
                sound.waiting.push(node);
            } else {
                if (node.isPlaying) {
                    node.stop();
                }
                node.setBuffer(sound.buffer);
                if (sound.loop) {
                    node.setLoop(true);
                    node.play();
                }
            }
        }
    }, {
        key: 'isReady',
        get: function () {
            return this.pendingSounds == 0;
        }
    }]);

    return AudioManager;
}();

var audioManager = new AudioManager();

var ActorSounds = function () {
    function ActorSounds() {
        _classCallCheck(this, ActorSounds);

        var fadeDistance = MazeWalls.cellDimension * 2;
        var maxDistance = MazeWalls.cellDimension * 64;

        function getSoundNode(bufferLabel) {
            var node = new THREE.PositionalAudio(audioManager.listener);
            node.setRefDistance(fadeDistance);
            node.setMaxDistance(maxDistance);
            node.setRolloffFactor(15);
            audioManager.attachBufferToNode(bufferLabel, node);
            return node;
        }
        this.soundSet = audioManager.reuseSoundSet("playerSounds");
        if (!this.soundSet) {
            this.soundSet = {
                walk: getSoundNode("walking"),
                fall: getSoundNode("scream"),
                bang: getSoundNode("pow")
            };
        }
        this.representation = new THREE.Object3D();
        this.representation.add(this.soundSet.walk);
        this.representation.add(this.soundSet.fall);
        this.representation.add(this.soundSet.bang);
    }

    _createClass(ActorSounds, [{
        key: 'dispose',
        value: function dispose() {
            audioManager.saveSoundSet("playerSounds", this.soundSet);
            this.representation.children.length = 0;
        }
    }, {
        key: 'startWalking',
        value: function startWalking() {
            if (audioManager.isReady) {
                this.soundSet.walk.play();
            }
        }
    }, {
        key: 'scream',
        value: function scream() {
            if (audioManager.isReady) {
                this.soundSet.walk.stop();
                this.soundSet.fall.play();
            }
        }
    }, {
        key: 'bang',
        value: function bang() {
            if (audioManager.isReady) {
                this.soundSet.bang.play();
            }
        }
    }]);

    return ActorSounds;
}();