window.onerror = function(error) {
    document.write(error);
    //style.remove();
};

var camera, scene, renderer;
var effect, controls;
var container;

var maze;

var clock = new THREE.Clock();

class ModernTheme {
    constructor(renderer) {
        // Attributes
        
        this.useGroundPlane = false;
        
        // Materials for the walls
        this.wallMaterial = new THREE.MeshBasicMaterial( {color: 0xffff55, side: THREE.DoubleSide} );
        
        // Materials for the eyes
        var texture = THREE.ImageUtils.loadTexture('textures/eye.png');
        texture.anisotropy = renderer.getMaxAnisotropy();

        this.eyeMaterial = new THREE.MeshPhongMaterial( { 
            color:     0xFFFFFF, 
            specular:  0x333333,
            shininess: 100,
            shading:   THREE.FlatShading,
            map:       texture
        } ) ;
        
        // Materials for the ground plane
        if(this.useGroundPlane) {
            var texture = THREE.ImageUtils.loadTexture('textures/ground.png');
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat = new THREE.Vector2(50, 50);
            texture.anisotropy = renderer.getMaxAnisotropy();

            this.groundMaterial = new THREE.MeshPhongMaterial({
                color: 0xffffff,
                specular: 0xffffff,
                shininess: 20,
                shading: THREE.FlatShading,
                map: texture
            });
        }
        
        // Materials for the missiles
        this.missileMaterial = new THREE.MeshBasicMaterial( {color: 0x00FF00} );

        // Sky color
        renderer.setClearColor(0x000000);
    }
    
    addLightingToScene(scene) {
        var light = new THREE.AmbientLight(0xFFFFFF);
        scene.add(light);
    }
}

class ClassicTheme {
    constructor(renderer) {
        // Materials for the walls
        this.wallMaterial = new THREE.MeshBasicMaterial( {color: 0xffffff, side: THREE.DoubleSide} );
        
        // Materials for the eyes
        var texture = THREE.ImageUtils.loadTexture('textures/eye.png');
        texture.anisotropy = renderer.getMaxAnisotropy();

        this.eyeMaterial = new THREE.MeshPhongMaterial( { 
            color:     0xFFFFFF, 
            specular:  0x333333,
            shininess: 100,
            shading:   THREE.FlatShading,
            map:       texture
        } ) ;
        
        // Materials for the ground plane

        this.groundMaterial = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            specular: 0xffffff,
            shininess: 20,
            shading: THREE.FlatShading
        });

        renderer.setClearColor(0xffffff);
    }
    
    addLightingToScene(scene) {
        var light = new THREE.AmbientLight(0xFFFFFF);
        scene.add(light);
    }
}

var theme;

var actors =  new Actors();

class MazeWalls extends Maze {
    constructor(a, b) {
        super(a, b);

        this.wallHeight = 2.5;
        //this.wallHeight = 0.1;
        this.geometry = new THREE.Geometry();

        this.forAll(this.addWalls);
        
        var walls = new THREE.Mesh(this.geometry, theme.wallMaterial);

        this.maze = new THREE.Object3D();
        this.maze.add(walls);

        var edges = new THREE.EdgesHelper(walls, 0x000000);
        edges.material.linewidth = 2;
        this.maze.add(edges);
    }

    addWalls(x,z) {
        if(this.getAdjacentCell(x,z, Directions.NORTH) != this.getCell(x,z)) {
            this.addWall(x, z, Directions.NORTH);
        }
        if(this.getAdjacentCell(x,z, Directions.EAST) != this.getCell(x,z)) {
            this.addWall(x, z, Directions.EAST);
        }
    }

    addWall(x, z, direction) {
        var geometry = new THREE.PlaneGeometry(MazeWalls.cellDimension, this.wallHeight);
        var plane = new THREE.Mesh(geometry, theme.wallMaterial);
        plane.position.y = this.wallHeight/2;
        switch(direction) {
            case 0x1: /* North */
                plane.position.z = MazeWalls.cellDimension/2;
                break;
            case 0x2: /* East */
                plane.rotation.y = Math.PI/2;
                plane.position.x = MazeWalls.cellDimension/2;
                break;
            case 0x4: /* South */
                plane.position.z = -MazeWalls.cellDimension/2;
                break;
            case 0x8: /* West */
                plane.rotation.y = Math.PI/2;
                plane.position.x = -MazeWalls.cellDimension/2;
                break;
        }
        plane.position.x += MazeWalls.cellDimension*x;
        plane.position.z += MazeWalls.cellDimension*z;
        plane.updateMatrix();
        this.geometry.merge(plane.geometry, plane.matrix);
    }

    get representation() {
        return this.maze;
    }

    static get cellDimension() {
        return 2;
    }
}

init();
animate();

function triggerHeld() {
    actors.first.setAutoWalk(true);
}

function triggerTap() {
    actors.first.shoot();
}

var pressDelay = 200;
var pressTimer = null;

function triggerPressed(e) {
    if(!pressTimer) {
        pressTimer = window.setTimeout(function() {pressTimer = null; triggerHeld();}, pressDelay);
    }
    e.preventDefault();
    e.stopPropagation();
}

function triggerRelease(e) {
    if(pressTimer) {
        window.clearTimeout(pressTimer);
        triggerTap();
        pressTimer = null;
    } else {
        actors.first.setAutoWalk(false);
    }
    e.preventDefault();
    e.stopPropagation();
}

function addSkydome(scene, renderer) {
    /* Reference: http://www.ianww.com/blog/2014/02/17/making-a-skydome-in-three-dot-js/ */
    
    var texture = THREE.ImageUtils.loadTexture('textures/sky.jpg');
    texture.anisotropy = renderer.getMaxAnisotropy();

    var geometry = new THREE.SphereGeometry(500, 60, 40);
    geometry.rotateZ(-Math.PI/2);
    var uniforms = {  
        texture: { type: 't', value: texture }
    };

    var material = new THREE.ShaderMaterial( {
        uniforms:       uniforms,
        vertexShader:   document.getElementById('sky-vertex').textContent,
        fragmentShader: document.getElementById('sky-fragment').textContent
    });

    skyBox = new THREE.Mesh(geometry, material);  
    skyBox.scale.set(-1, 1, 1);
    skyBox.rotation.order = 'XZY';
    skyBox.renderDepth = 1000.0;
    scene.add(skyBox);
}

function animateSkydome() {
    skyBox.rotation.x += 0.0002
    skyBox.rotation.z += 0.0001;
}

function init() {
    renderer = new THREE.WebGLRenderer();
    
    var element = renderer.domElement;
    container = document.getElementById('container');
    container.appendChild(element);

    effect = new THREE.StereoEffect(renderer);

    scene = new THREE.Scene();

    theme = new ModernTheme(renderer);

    theme.addLightingToScene(scene);
    
    camera = new THREE.PerspectiveCamera(70, 1, 0.001, 700);
    camera.position.set(0, eyeHeight, 0);
    scene.add(camera);

    // Ground plane
    if(theme.useGroundPlane) {
        var geometry = new THREE.PlaneGeometry(1000, 1000);

        var mesh = new THREE.Mesh(geometry, theme.groundMaterial);
        mesh.rotation.x = -Math.PI / 2;
        scene.add(mesh);
    }

    // Maze walls
    
    maze = new MazeWalls();
    scene.add(maze.representation);
    
    function placePlayer(player) {
        player.setPosition(maze.getRandomPosition());
        player.orientTowardsPassage();
        if(player.startMoving) {
            player.startMoving();
        }
        actors.add(player);
    }
    
    placePlayer(new SelfPlayer(camera));
    placePlayer(new RobotPlayer());

    addSkydome(scene, renderer);

    window.addEventListener('resize', resize, false);
    setTimeout(resize, 1);

    var useTouch = false;
    container.addEventListener('mousedown',  function(e) {if(!useTouch)  triggerPressed(e);}, false);
    container.addEventListener('mouseup',    function(e) {if(!useTouch)  triggerRelease(e);}, false);
    container.addEventListener('touchstart', function(e) {useTouch=true; triggerPressed(e);}, false);
    container.addEventListener('touchend',   function(e) {useTouch=true; triggerRelease(e);}, false);
    
    /* Mouse controls (disabled if orientation based controls are available) */
    controls = new THREE.LookAroundControls(camera, element);

    function setOrientationControls(e) {
        if (!e.alpha) {
            return;
        }
        
        // Disable the mouse controls when operating on mobile.
        controls.enabled = false;
        controls.dispose();

        controls = new THREE.DeviceOrientationControls(camera, true);
        controls.connect();
        controls.update();

        element.addEventListener('click', fullscreen, false);

        window.removeEventListener('deviceorientation', setOrientationControls, true);
    }
    window.addEventListener('deviceorientation', setOrientationControls, true);

    function modeSelected(mode) {
        console.log("Mode is", mode);
        switch(mode) {
            case "headset":
                break;
            case "monitor":
                effect = renderer;
                break;
            case "anaglyph":
                effect = new THREE.AnaglyphEffect(renderer);
                break;
        }
    }

    function webComponentsReady() {
        var about = document.querySelector("about-box");
        if(about) {
            about.setModeCallback(modeSelected);
        }
    }

    window.addEventListener('WebComponentsReady', webComponentsReady);
}

function resize() {
    var width = container.offsetWidth;
    var height = container.offsetHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
    effect.setSize(width, height);
}

function update(dt) {
    resize();

    camera.updateProjectionMatrix();

    controls.update(dt);
    
    actors.animate();

    animateSkydome();
}

function render(dt) {
    effect.render(scene, camera);
}

function animate(t) {
    requestAnimationFrame(animate);

    update(clock.getDelta());
    render(clock.getDelta());
}

function fullscreen() {
    if (container.requestFullscreen) {
        container.requestFullscreen();
    } else if (container.msRequestFullscreen) {
        container.msRequestFullscreen();
    } else if (container.mozRequestFullScreen) {
        container.mozRequestFullScreen();
    } else if (container.webkitRequestFullscreen) {
        container.webkitRequestFullscreen();
    }
}