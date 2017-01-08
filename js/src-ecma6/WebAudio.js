class AudioManager {
    constructor() {
        this.inactiveSoundSets = {
            playerSounds: []
        }

        this.sounds = {};
        this.pendingSounds = 0;

        var audioLoader = new THREE.AudioLoader();

        var me = this;
        function loadSound(label, url, loop) {
            me.pendingSounds++;
            var sound = {
                buffer:  null,
                waiting: [],
                loop:    loop
            };
            me.sounds[label] = sound;

            audioLoader.load(url, buffer => {
                sound.buffer = buffer;
                for(var i = 0; i < sound.waiting.length; i++) {
                    me.attachBufferToNode(label, sound.waiting[i]);
                }
                me.pendingSounds--;
            });
        }

        loadSound("walking", 'sounds/169762__nhaudio__steps-amped.mp3', true);
        loadSound("scream",  'sounds/13797__sweetneo85__wilhelm.mp3',   false);
        loadSound("pow",     'sounds/183467__snapper4298__pow1.mp3',    false);

        this.listener = new THREE.AudioListener();
    }

    get isReady() {
        return this.pendingSounds == 0;
    }

    saveSoundSet(label, soundSet) {
        this.inactiveSoundSets[label].push(soundSet);
    }

    reuseSoundSet(label) {
        if(this.inactiveSoundSets[label].length) {
            return this.inactiveSoundSets[label].pop();
        }
    }

    attachBufferToNode(label, node) {
        var sound = this.sounds[label];
        if(!sound.buffer) {
            sound.waiting.push(node);
        } else {
            if(node.isPlaying) {
                node.stop();
            }
            node.setBuffer(sound.buffer);
            if(sound.loop) {
                node.setLoop(true);
                node.play();
            }
        }
    }
}

var audioManager = new AudioManager();

class ActorSounds {
    constructor() {
        const fadeDistance = MazeWalls.cellDimension * 1;
        const maxDistance  = MazeWalls.cellDimension * 64;

        function getSoundNode(bufferLabel) {
            var node = new THREE.PositionalAudio(audioManager.listener)
            node.setRefDistance( fadeDistance );
            node.setMaxDistance( maxDistance );
            node.setRolloffFactor(15);
            audioManager.attachBufferToNode(bufferLabel, node);
            return node;
        }
        this.soundSet = audioManager.reuseSoundSet("playerSounds");
        if(!this.soundSet) {
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

    dispose() {
        audioManager.saveSoundSet("playerSounds", this.soundSet);
        this.representation.children.length = 0;
    }

    startWalking() {
        if(audioManager.isReady) {
            this.soundSet.walk.play();
        }
    }

    scream() {
        if(audioManager.isReady) {
            this.soundSet.walk.stop();
            this.soundSet.fall.play();
        }
    }

    bang() {
        if(audioManager.isReady) {
            this.soundSet.bang.play();
        }
    }
}