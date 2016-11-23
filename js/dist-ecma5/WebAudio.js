var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var AudioManager = function () {
    function AudioManager() {
        _classCallCheck(this, AudioManager);

        this.activeNodes = [];
        this.inactiveNodes = [];

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

        loadSound("walking", '../sounds/169762__nhaudio__steps-amped.mp3', true);
        loadSound("scream", '../sounds/13797__sweetneo85__wilhelm.mp3', false);
        loadSound("pow", '../sounds/183467__snapper4298__pow1.mp3', false);

        this.audioListener = new THREE.AudioListener();
    }

    _createClass(AudioManager, [{
        key: "getAudioNode",
        value: function getAudioNode() {
            if (this.inactiveNodes.length) {
                return this.inactiveNodes.pop();
            } else {
                var node = new THREE.PositionalAudio(this.audioListener);
                this.activeNodes.push(node);
                return node;
            }
        }
    }, {
        key: "releaseAudioNode",
        value: function releaseAudioNode(node) {
            node.stop();

            // Remove from the active node lists and
            // push into the inactive list
            var index = this.activeNodes.indexOf(node);
            if (index > -1) {
                this.activeNodes.splice(index, 1);
            }
            this.inactiveNodes.push(node);
        }
    }, {
        key: "attachBufferToNode",
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
        key: "isReady",
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

        this.walkSoundNode = audioManager.getAudioNode();
        this.fallSoundNode = audioManager.getAudioNode();
        this.bangSoundNode = audioManager.getAudioNode();
        this.setNodeParams(this.walkSoundNode);
        this.setNodeParams(this.fallSoundNode);
        this.setNodeParams(this.bangSoundNode);
        audioManager.attachBufferToNode("walking", this.walkSoundNode);
        audioManager.attachBufferToNode("scream", this.fallSoundNode);
        audioManager.attachBufferToNode("pow", this.bangSoundNode);

        this.representation = new THREE.Object3D();
        this.representation.add(this.walkSoundNode);
        this.representation.add(this.fallSoundNode);
        this.representation.add(this.bangSoundNode);
    }

    _createClass(ActorSounds, [{
        key: "setNodeParams",
        value: function setNodeParams(node) {
            var fadeDistance = MazeWalls.cellDimension * 1;
            var maxDistance = MazeWalls.cellDimension * 64;

            node.setRefDistance(fadeDistance);
            node.setMaxDistance(maxDistance);
            node.setRolloffFactor(15);
        }
    }, {
        key: "dispose",
        value: function dispose() {
            audioManager.releaseAudioNode(this.walkSoundNode);
            audioManager.releaseAudioNode(this.fallSoundNode);
            audioManager.releaseAudioNode(this.bangSoundNode);
        }
    }, {
        key: "startWalking",
        value: function startWalking() {
            if (audioManager.isReady) {
                this.walkSoundNode.play();
            }
        }
    }, {
        key: "scream",
        value: function scream() {
            if (audioManager.isReady) {
                this.walkSoundNode.stop();
                this.fallSoundNode.play();
            }
        }
    }, {
        key: "bang",
        value: function bang() {
            if (audioManager.isReady) {
                this.bangSoundNode.play();
            }
        }
    }]);

    return ActorSounds;
}();