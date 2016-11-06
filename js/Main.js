/*
MazeWars VR
Copyright (C) 2016 Marcio Teixeira

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

var camera, scene, renderer, effect
var container, maze;

var clock = new THREE.Clock();
var loader = new THREE.TextureLoader();

const fogNear = 0.1;
const fogFar  = 50;

class Tween {
    constructor() {
        this.tasks = [];
    }

    add(duration, easing, task, min, max) {
        this.tasks.push({
            duration: duration,
            task: task,
            value: 0,
            easing: easing ? easing : t => t,
            min: min || 0,
            max: max || 1
        });
        update(0);
    }

    update(dt) {
        for(var i = 0; i < this.tasks.length; i++) {
            var t = this.tasks[i];

            t.value += dt / t.duration;
            if(t.value > 1) {
                this.tasks.splice(i,1);
            } else {
                var t0 = t.easing(t.value, 0, 1, 1);
                t.task((t.max - t.min)*t0 + t.min);
            }
        }
    }
};

function liftFog(t) {
    tween.add(5, tweenFunctions.easeInQuint, t => scene.fog.far   = t, fogNear+0.01, fogFar);
    tween.add(5, tweenFunctions.easeInCubic, t => light.intensity = t);
}

var tween = new Tween();
var light;

class ModernTheme {
    constructor(renderer) {
        // Attributes
        
        this.useGroundPlane = false;
        
        // Materials for the walls
        this.wallMaterial = new THREE.MeshLambertMaterial( {color: 0xffff55, side: THREE.DoubleSide} );
        
        // Materials for the eyes
        var texture = loader.load('textures/eye.png');
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
            var texture = loader.load('textures/ground.png');
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
        light = new THREE.AmbientLight(0xFFFFFF);
        scene.add(light);
    }
}

class ClassicTheme {
    constructor(renderer) {
        // Materials for the walls
        this.wallMaterial = new THREE.MeshBasicMaterial( {color: 0xffffff, side: THREE.DoubleSide} );
        
        // Materials for the eyes
        var texture = loader.load('textures/eye.png');
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
        light = new THREE.AmbientLight(0xFFFFFF);
        scene.add(light);
    }
}

var theme;

var actors =  new WebGLActors();

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
                plane.position.z = -MazeWalls.cellDimension/2;
                break;
            case 0x2: /* East */
                plane.rotation.y = Math.PI/2;
                plane.position.x = MazeWalls.cellDimension/2;
                break;
            case 0x4: /* South */
                plane.position.z = MazeWalls.cellDimension/2;
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

function addSkydome(scene, renderer) {
    /* Reference: http://www.ianww.com/blog/2014/02/17/making-a-skydome-in-three-dot-js/ */
    
    var texture = loader.load('textures/sky.jpg');
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

    //effect = new THREE.StereoEffect(renderer);
    effect = renderer;

    scene = new THREE.Scene();

    scene.fog = new THREE.Fog(0x000000, fogNear, fogFar);

    theme = new ModernTheme(renderer);

    theme.addLightingToScene(scene);
    
    camera = new THREE.PerspectiveCamera(70, 1, 0.001, 700);

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

    var game = new SoloGame(getWebGLPlayerFactory(camera, element));
    game.startGame();

    addSkydome(scene, renderer);

    window.addEventListener('resize', resize, false);
    setTimeout(resize, 1);

    function modeSelected(mode) {
        console.log("Mode is", mode);
        switch(mode) {
            case "headset":
                effect = new THREE.StereoEffect(renderer);
                break;
            case "monitor":
                effect = renderer;
                break;
            case "anaglyph":
                effect = new THREE.AnaglyphEffect(renderer);
                break;
        }
    }

    function startNetworkGame() {
        console.log("Starting network game");
        game.endGame();

        /* Choose random hostId. TODO: Implement check for conflicting ids */
        const ETHERNET_ADDR_MIN       = 0x01;
        const ETHERNET_ADDR_MAX       = 0xFF;
        const hostId = Math.floor(Math.random() * (ETHERNET_ADDR_MAX - ETHERNET_ADDR_MIN)) + ETHERNET_ADDR_MIN;

        var name = prompt("Please enter your name");

        game = new NetworkedGame(getWebGLPlayerFactory(camera, element));
        game.startGame(hostId, name, function(state) {console.log(state);});
    }

    // WebComponents initialization
    function webComponentsReady() {
        var about = document.querySelector("about-box");
        if(about) {
            about.addCallback("gfxModeSelected", modeSelected);
            about.addCallback("startNetworkGame", startNetworkGame);
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

    if(headsetDirector) {
        headsetDirector.update(dt);
    }
    
    actors.animate();
    tween.update(dt);

    animateSkydome();
}

function render(dt) {
    effect.render(scene, camera);
}

function animate(t) {
    requestAnimationFrame(animate);

    var delta = clock.getDelta();
    update(delta);
    render(delta);
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

init();
animate();