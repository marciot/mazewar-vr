class AudioManager {
    constructor() {
        this.activeNodes   = [];
        this.inactiveNodes = [];

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

        loadSound("walking", '../sounds/169762__nhaudio__steps-amped.mp3', true);
        loadSound("scream",  '../sounds/13797__sweetneo85__wilhelm.mp3',   false);
        loadSound("pow",     '../sounds/183467__snapper4298__pow1.mp3',   false);

        this.audioListener = new THREE.AudioListener();
    }

    get isReady() {
        return this.pendingSounds == 0;
    }

    getAudioNode() {
        if(this.inactiveNodes.length) {
            return this.inactiveNodes.pop();
        } else {
            var node = new THREE.PositionalAudio( this.audioListener );
            this.activeNodes.push(node);
            return node;
        }
    }

    releaseAudioNode(node) {
        node.stop();

        // Remove from the active node lists and
        // push into the inactive list
        var index = this.activeNodes.indexOf(node);
        if (index > -1) {
            this.activeNodes.splice(index, 1);
        }
        this.inactiveNodes.push(node);
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
        this.walkSoundNode = audioManager.getAudioNode();
        this.fallSoundNode = audioManager.getAudioNode();
        this.bangSoundNode = audioManager.getAudioNode();
        this.setNodeParams(this.walkSoundNode);
        this.setNodeParams(this.fallSoundNode);
        this.setNodeParams(this.bangSoundNode);
        audioManager.attachBufferToNode("walking", this.walkSoundNode);
        audioManager.attachBufferToNode("scream",  this.fallSoundNode);
        audioManager.attachBufferToNode("pow",     this.bangSoundNode);
        
        this.representation = new THREE.Object3D();
        this.representation.add(this.walkSoundNode);
        this.representation.add(this.fallSoundNode);
        this.representation.add(this.bangSoundNode);
    }

    setNodeParams(node) {
        const fadeDistance = MazeWalls.cellDimension * 1;
        const maxDistance  = MazeWalls.cellDimension * 64;
        
        node.setRefDistance( fadeDistance );
        node.setMaxDistance( maxDistance );
        node.setRolloffFactor(15);
    }

    dispose() {
        audioManager.releaseAudioNode(this.walkSoundNode);
        audioManager.releaseAudioNode(this.fallSoundNode);
        audioManager.releaseAudioNode(this.bangSoundNode);
    }

    startWalking() {
        if(audioManager.isReady) {
            this.walkSoundNode.play();
        }
    }

    scream() {
        if(audioManager.isReady) {
            this.walkSoundNode.stop();
            this.fallSoundNode.play();
        }
    }

    bang() {
        if(audioManager.isReady) {
            this.bangSoundNode.play();
        }
    }
}