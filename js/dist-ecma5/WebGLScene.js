var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var fogNear = 0.1;
var fogFar = 50;
var fogDuration = 3;

var camera, scene, renderer, effect, game;
var maze, theme;
var loader = new THREE.TextureLoader();
var tween = new Tween();
var lights = [];

function setupScene() {
    renderer = new THREE.WebGLRenderer();

    effect = new THREE.VREffect(renderer);
    effect.setVRDisplay(vrDisplay);

    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.001, 700);
    window.addEventListener('resize', resize, false);

    document.body.insertBefore(renderer.domElement, document.body.firstChild);

    container = renderer.domElement;

    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x000000, fogNear, fogFar);
    theme = new RetroTheme(renderer);
    theme.addLightingToScene(scene);

    // Ground plane
    if (theme.useGroundPlane) {
        var geometry = new THREE.PlaneGeometry(1000, 1000);

        var mesh = new THREE.Mesh(geometry, theme.groundMaterial);
        mesh.rotation.x = -Math.PI / 2;
        scene.add(mesh);
    }

    // Maze walls

    maze = new MazeWalls();
    scene.add(maze.representation);

    addSkydome(scene, renderer);

    // Start a game so we can have something interesting
    // going on in the background
    game = new SoloGame(getWebGLPlayerFactory(camera));
    game.startGame();

    // Kick off the render loop.
    vrDisplay.requestAnimationFrame(animate);
}

function addSkydome(scene, renderer) {
    /* Reference: http://www.ianww.com/blog/2014/02/17/making-a-skydome-in-three-dot-js/ */

    var texture = loader.load('textures/sky.jpg');
    texture.anisotropy = renderer.getMaxAnisotropy();

    var geometry = new THREE.SphereGeometry(500, 60, 40);
    geometry.rotateZ(-Math.PI / 2);
    var uniforms = {
        texture: { type: 't', value: texture }
    };

    var material = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: document.getElementById('sky-vertex').textContent,
        fragmentShader: document.getElementById('sky-fragment').textContent
    });

    skyBox = new THREE.Mesh(geometry, material);
    skyBox.scale.set(-1, 1, 1);
    skyBox.rotation.order = 'XZY';
    skyBox.renderDepth = 1000.0;
    scene.add(skyBox);
}

function animateSkydome() {
    skyBox.rotation.x += 0.0002;
    skyBox.rotation.z += 0.0001;
}

function liftFog() {
    tween.add(fogDuration, tweenFunctions.easeInQuint, function (t) {
        return scene.fog.far = t;
    }, fogNear + 0.01, fogFar);

    var _loop = function () {
        light = lights[i];

        function getDimmerFunc(light) {
            return function (t) {
                return light.intensity = t;
            };
        }
        tween.add(fogDuration, tweenFunctions.easeInCubic, getDimmerFunc(light), 0, light.intensity);
    };

    for (var i = 0; i < lights.length; i++) {
        var light;

        _loop();
    }
}

var MazeWalls = function (_Maze) {
    _inherits(MazeWalls, _Maze);

    function MazeWalls(a, b) {
        _classCallCheck(this, MazeWalls);

        var _this = _possibleConstructorReturn(this, (MazeWalls.__proto__ || Object.getPrototypeOf(MazeWalls)).call(this, a, b));

        _this.wallHeight = 2.5;
        _this.geometry = new THREE.Geometry();

        _this.forAll(_this.addWalls);

        var walls = new THREE.Mesh(_this.geometry, theme.wallMaterial);

        _this.maze = new THREE.Object3D();
        _this.maze.add(walls);

        var edgeGeometry = new THREE.EdgesGeometry(_this.geometry, 45);
        var edgeMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
        var edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
        _this.maze.add(edges);
        return _this;
    }

    _createClass(MazeWalls, [{
        key: 'addWalls',
        value: function addWalls(x, z) {
            if (this.getAdjacentCell(x, z, Directions.NORTH) != this.getCell(x, z)) {
                this.addWall(x, z, Directions.NORTH);
            }
            if (this.getAdjacentCell(x, z, Directions.EAST) != this.getCell(x, z)) {
                this.addWall(x, z, Directions.EAST);
            }
        }
    }, {
        key: 'addWall',
        value: function addWall(x, z, direction) {
            var geometry = new THREE.PlaneGeometry(MazeWalls.cellDimension, this.wallHeight);
            var plane = new THREE.Mesh(geometry, theme.wallMaterial);
            plane.position.y = this.wallHeight / 2;
            switch (direction) {
                case 0x1:
                    /* North */
                    plane.position.z = -MazeWalls.cellDimension / 2;
                    break;
                case 0x2:
                    /* East */
                    plane.rotation.y = Math.PI / 2;
                    plane.position.x = MazeWalls.cellDimension / 2;
                    break;
                case 0x4:
                    /* South */
                    plane.position.z = MazeWalls.cellDimension / 2;
                    break;
                case 0x8:
                    /* West */
                    plane.rotation.y = Math.PI / 2;
                    plane.position.x = -MazeWalls.cellDimension / 2;
                    break;
            }
            plane.position.x += MazeWalls.cellDimension * x;
            plane.position.z += MazeWalls.cellDimension * z;
            plane.updateMatrix();
            this.geometry.merge(plane.geometry, plane.matrix);
        }
    }, {
        key: 'representation',
        get: function () {
            return this.maze;
        }
    }], [{
        key: 'cellDimension',
        get: function () {
            return 2;
        }
    }]);

    return MazeWalls;
}(Maze);

var RetroTheme = function () {
    function RetroTheme(renderer) {
        _classCallCheck(this, RetroTheme);

        // Attributes

        this.useGroundPlane = false;

        // Materials for the walls
        this.wallMaterial = new THREE.MeshPhongMaterial({ color: 0xffff55, side: THREE.DoubleSide });

        // Materials for the eyes
        var texture = loader.load('textures/eye.png');
        texture.anisotropy = renderer.getMaxAnisotropy();

        this.eyeMaterial = new THREE.MeshPhongMaterial({
            color: 0xFFFFFF,
            specular: 0x333333,
            shininess: 20,
            emissive: 0xFFFFFF,
            emissiveIntensity: 1,
            emissiveMap: texture,
            map: texture
        });

        // Materials for the ground plane
        if (this.useGroundPlane) {
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

        // Sky color
        renderer.setClearColor(0x000000);
    }

    _createClass(RetroTheme, [{
        key: 'addLightingToScene',
        value: function addLightingToScene(scene) {
            var light = new THREE.AmbientLight(0xFFFFFF, 0.07);
            lights.push(light);
            scene.add(light);

            var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.20);
            directionalLight.position.set(.25, 1, 0.15);
            lights.push(directionalLight);
            scene.add(directionalLight);
        }
    }]);

    return RetroTheme;
}();