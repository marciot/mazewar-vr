const fadeDuration = 5;

var overlay, camera, scene, renderer, effect, game;
var maze, theme;
var loader = new THREE.TextureLoader();
var tween = new Tween();

function setupScene() {
    mwLog("Setting up scene");

    renderer  = new THREE.WebGLRenderer();
    
    effect    = new THREE.VREffect(renderer);
    effect.setVRDisplay(vrDisplay);
    
    camera    = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.001, 700 );
    overlay   = new OverlayText(camera);

    var soundManager = new AudioManager();
    camera.add( soundManager.listener );

    window.addEventListener('resize', resize, false);
    
    document.body.insertBefore(renderer.domElement, document.body.firstChild);
    
    container = renderer.domElement;

    query = parseQuery();
    switch(query.theme) {
        case "night":
            theme = new NightTheme(renderer);
            break;
        default:
            theme = new DayTheme(renderer);
            break;
    }
    scene     = new THREE.Scene();
    theme.addLightingToScene(scene);
    theme.addSky(scene, renderer);

    // Maze walls
    
    maze = new MazeWalls();
    scene.add(maze.representation);
    
    // Start a game so we can have something interesting
    // going on in the background
    game = new SoloGame(getWebGLPlayerFactory());
    game.startGame();
    
    // Kick off the render loop.
    if(vrDisplay) {
        vrDisplay.requestAnimationFrame(animate);
    }
}

class MazeWalls extends Maze {
    constructor(a, b) {
        super(a, b);

        this.wallHeight   = 2.5;

        this.geometry = this.buildMazeBufferGeometry();
        var walls = new THREE.Mesh(this.geometry, theme.wallMaterial);

        this.maze = new THREE.Object3D();
        this.maze.add(walls);

        if(theme.strokeMazeEdges) {
            var edgeGeometry = new THREE.EdgesGeometry(this.geometry, 45);
            var edgeMaterial = new THREE.LineBasicMaterial({color: 0x000000, linewidth: 2});
            var edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
            this.maze.add(edges);
        }
    }

    buildMazeBufferGeometry() {
        var me = this;

        function addWall(x, z, direction) {
            var plane = new THREE.Mesh(wallGeometry, theme.wallMaterial);
            plane.position.y = me.wallHeight/2;
            switch(direction) {
                case 0x1: /* North */
                    plane.position.z = -MazeWalls.cellDimension/2;
                    break;
                case 0x2: /* East */
                    plane.rotation.y = -Math.PI/2;
                    plane.position.x = MazeWalls.cellDimension/2;
                    break;
                case 0x4: /* South */
                    plane.position.z = MazeWalls.cellDimension/2;
                    plane.rotation.y = Math.PI;
                    break;
                case 0x8: /* West */
                    plane.rotation.y = Math.PI/2;
                    plane.position.x = -MazeWalls.cellDimension/2;
                    break;
            }
            plane.position.x += MazeWalls.cellDimension*x;
            plane.position.z += MazeWalls.cellDimension*z;
            plane.updateMatrix();
            mazeGeometry.mergeMesh(plane);
        }

        function addWalls(x,z) {
            if(!me.getCell(x,z)) {
                if(me.getAdjacentCell(x,z, Directions.NORTH)) {
                    addWall(x, z, Directions.NORTH);
                }
                if(me.getAdjacentCell(x,z, Directions.SOUTH)) {
                    addWall(x, z, Directions.SOUTH);
                }
                if(me.getAdjacentCell(x,z, Directions.EAST)) {
                    addWall(x, z, Directions.EAST);
                }
                if(me.getAdjacentCell(x,z, Directions.WEST)) {
                    addWall(x, z, Directions.WEST);
                }
            }
        }

        /* We build the maze geometry by positioning and merging wallGeometry (a plane) into
         * a larger mazeGeometry. We then convert the Geometry into BufferGeometry to save
         * memory.
         */

        const wallGeometry = new THREE.PlaneGeometry(MazeWalls.cellDimension, this.wallHeight);
        const mazeGeometry = new THREE.Geometry();
        this.forAll(addWalls);
        mazeGeometry.mergeVertices();

        const bufferGeometry = new THREE.BufferGeometry();
        bufferGeometry.fromGeometry(mazeGeometry);

        /* Delete the temporary geometry */
        wallGeometry.dispose();
        mazeGeometry.dispose();

        return bufferGeometry;
    }

    get representation() {
        return this.maze;
    }

    static get cellDimension() {
        return 2;
    }

    setIsFalling(isFalling) {
        // When the character is falling, it will see the maze
        // from below. Hence, it is necessary to render the
        // front and backs of walls. When inside the maze,
        // only the front faces need to be drawn.
        if(isFalling) {
            theme.wallMaterial.side = THREE.DoubleSide;
        } else {
            theme.wallMaterial.side = THREE.FrontSide;
        }
    }
}

class Theme {
    constructor() {
        this.isFading = false;
    }

    addSkydome(scene, renderer, texture, symmetric) {
        /* Reference: http://www.ianww.com/blog/2014/02/17/making-a-skydome-in-three-dot-js/ */

        var texture = loader.load(texture);
        texture.anisotropy = renderer.getMaxAnisotropy();

        var geometry = new THREE.SphereBufferGeometry(500, 60, 40);

        var uniforms = {
            texture: { type: 't', value: texture }
        };

        var material = new THREE.ShaderMaterial( {
            uniforms:       uniforms,
            vertexShader:   document.getElementById('sky-vertex').textContent,
            fragmentShader: document.getElementById(symmetric ? 'sky-fragment-symmetric' : 'sky-fragment').textContent
        });

        this.skyBox = new THREE.Mesh(geometry, material);
        this.skyBox.scale.set(-1, 1, 1);
        this.skyBox.rotation.order = 'XZY';
        this.skyBox.renderDepth = 1000.0;
        scene.add(this.skyBox);
    }

    animate() {
    }

    static getOpacityFunc(material) {
        const alwaysTransparent = material.hasOwnProperty("map");
        material.transparent = true;
        material.opacity     = 0;
        material.visible     = false;

        return t => {
            if(t < 0.05) {
                material.transparent = false || alwaysTransparent;
                material.visible     = false;
                material.opacity     = 1;
            } else if(t > 0.95) {
                material.transparent = false || alwaysTransparent;
                material.visible     = true;
                material.opacity     = 1;
            } else {
                material.transparent = true  || alwaysTransparent;
                material.visible     = true;
                material.opacity     = t;
            }
        }
    }

    fadeEffect(callback) {
        this.isFading = true;
        tween.add(fadeDuration, tweenFunctions.easeInCubic, Theme.getOpacityFunc(overlay.textMaterial), 0, 1, 0.0, 0.2);
        tween.add(fadeDuration, tweenFunctions.easeInCubic, Theme.getOpacityFunc(theme.eyeMaterial),  0, 1, 0.2, 0.6);
        tween.add(fadeDuration, tweenFunctions.easeInCubic, Theme.getOpacityFunc(theme.wallMaterial), 0, 1, 0.6, 1.0);
        tween.add(fadeDuration, tweenFunctions.easeInCubic, Theme.getOpacityFunc(overlay.textMaterial), 1, 0, 0.8, 1.0);
        tween.whenDone(() => {
            overlay.chooseText();
            this.isFading = false;
        });
    }

    showStatusMessage(str) {
        overlay.setText(str);
        tween.add(fadeDuration, tweenFunctions.easeInCubic, Theme.getOpacityFunc(overlay.textMaterial), 0, 1, 0.0, 0.2);
        tween.add(fadeDuration, tweenFunctions.easeInCubic, Theme.getOpacityFunc(ovarlay.textMaterial), 1, 0, 0.8, 1.0);
        tween.whenDone(() => {
            overlay.chooseText();
        });
    }
}

class NightTheme extends Theme {
    constructor(renderer) {
        super(renderer);

        // Attributes
        this.useActorIllumination = true;
        this.strokeMazeEdges      = false;

        // Materials for the walls
        var specularMap = loader.load('textures/brick-texture-8-by-agf81/Brick_D2_Specular.jpg');
        specularMap.anisotropy = renderer.getMaxAnisotropy();

        var normalTexture = loader.load('textures/brick-texture-8-by-agf81/Brick_D3_Normal.jpg');
        normalTexture.anisotropy = renderer.getMaxAnisotropy();

        this.wallMaterial = new THREE.MeshPhongMaterial( {
            color:       0xffff55,
            normalMap:   normalTexture,
            normalScale: new THREE.Vector2(3, -3),
            specularMap: specularMap
        } );

        // Materials for the eyes
        var texture = loader.load('textures/eye.png');
        texture.anisotropy = renderer.getMaxAnisotropy();

        this.eyeMaterial = new THREE.MeshPhongMaterial( { 
            color:     0xFFFFFF, 
            specular:  0x333333,
            shininess: 20,
            emissive:  0xFFFFFF,
            emissiveIntensity: 1,
            emissiveMap: texture,
            map:         texture
        } ) ;

        // Sky color
        renderer.setClearColor(0x000000);

        // Material for text overlay
        this.textMaterial = new THREE.MeshBasicMaterial({color: 0xFFFFFF, visible: false});
    }

    addLightingToScene(scene) {
        // The player carries his own lighting in this theme
    }

    addSky(scene, renderer) {
        super.addSkydome(scene, renderer, 'textures/sky-night.jpg');
    }

    animate() {
        this.skyBox.rotation.x += 0.0002;
        this.skyBox.rotation.z += 0.0001;
    }
}

class DayTheme extends Theme {
    constructor(renderer) {
        super(renderer);

        // Attributes
        this.useActorIllumination = false;
        this.strokeMazeEdges      = false;

        // Materials for the walls
        var texture = loader.load('textures/brick-texture-8-by-agf81/Brick_D1_Diffuse.jpg');
        texture.anisotropy = renderer.getMaxAnisotropy();
        this.wallMaterial = new THREE.MeshLambertMaterial( {
            color:      0xffff55,
            map:        texture
        } );

        // Materials for the eyes
        var texture = loader.load('textures/eye.png');
        texture.anisotropy = renderer.getMaxAnisotropy();

        this.eyeMaterial = new THREE.MeshPhongMaterial( {
            color:     0xFFFFFF,
            specular:  0x333333,
            shininess: 20,
            emissive:  0xFFFFFF,
            emissiveIntensity: 1,
            emissiveMap: texture,
            map:         texture
        } ) ;

        // Sky color
        renderer.setClearColor(0xADD8E6);

        // Material for text overlay
        this.textMaterial = new THREE.MeshBasicMaterial({color: 0x000000, visible: false});
    }

    addLightingToScene(scene) {
        var light = new THREE.AmbientLight(0xFFFFFF, 0.47);
        scene.add(light);

        var directionalLight = new THREE.DirectionalLight(0xFFFFFF,0.85);
        directionalLight.position.set(0.25, 1, 0.15);
        scene.add(directionalLight);
    }

    addSky(scene, renderer) {
        super.addSkydome(scene, renderer, 'textures/sky-day.jpg', true);
    }

    animate() {
        this.skyBox.rotation.y += 0.00025;
    }
}