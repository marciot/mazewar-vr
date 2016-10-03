/**
 * @author qiao / https://github.com/qiao
 * @author mrdoob / http://mrdoob.com
 * @author alteredq / http://alteredqualia.com/
 * @author WestLangley / http://github.com/WestLangley
 * @author erich666 / http://erichaines.com
 * @author marciot / https://github.com/marciot
 */

/* This is a set of controls modified from THREE.OrbitControls that allows
 * a first person view where the mouse is used to look around.
 */

THREE.LookAroundControls = function ( object, domElement ) {

	this.object = object;

	this.domElement = ( domElement !== undefined ) ? domElement : document;

	// Set to false to disable this control
	this.enabled = true;

	// How far you can orbit vertically, upper and lower limits.
	// Range is 0 to Math.PI radians.
	this.minPolarAngle = 0; // radians
	this.maxPolarAngle = Math.PI; // radians

	// How far you can orbit horizontally, upper and lower limits.
	// If set, must be a sub-interval of the interval [ - Math.PI, Math.PI ].
	this.minAzimuthAngle = - Infinity; // radians
	this.maxAzimuthAngle = Infinity; // radians

	// Set to false to disable rotating
	this.rotateSpeed = 1.0;

	var lookAt = new THREE.Vector3( 0, 0, -1 );
	lookAt.applyEuler(object.rotation);
	this.gazeDirection0 = new THREE.Vector3().copy(lookAt);
	this.gazeDirection  = new THREE.Vector3().copy(lookAt);
    
	// public methods

	this.getPolarAngle = function () {
		return spherical.phi;
	};

	this.getAzimuthalAngle = function () {
		return spherical.theta;
	};

	this.reset = function () {
		scope.gazeDirection.copy( scope.gazeDirection0 );

		scope.object.updateProjectionMatrix();

		scope.update();
	};

	// this method is exposed, but perhaps it would be better if we can make it private...
	this.update = function() {
		var offset = new THREE.Vector3();

		// so camera.up is the orbit axis
		var quat = new THREE.Quaternion().setFromUnitVectors( object.up, new THREE.Vector3( 0, 1, 0 ) );
		var quatInverse = quat.clone().inverse();

		return function update () {
			if ( scope.enabled === false ) return;

			offset.copy(scope.gazeDirection);

			// rotate offset to "y-axis-is-up" space
			scope.gazeDirection.applyQuaternion( quat );

			// angle from z-axis around y-axis
			spherical.setFromVector3( scope.gazeDirection );

			spherical.theta += sphericalDelta.theta;
			spherical.phi   -= sphericalDelta.phi;

			// restrict theta to be between desired limits
			spherical.theta = Math.max( scope.minAzimuthAngle, Math.min( scope.maxAzimuthAngle, spherical.theta ) );

			// restrict phi to be between desired limits
			spherical.phi = Math.max( scope.minPolarAngle, Math.min( scope.maxPolarAngle, spherical.phi ) );

			spherical.makeSafe();

			scope.gazeDirection.setFromSpherical( spherical );

			// rotate offset back to "camera-up-vector-is-up" space
			scope.gazeDirection.applyQuaternion( quatInverse );
            
            var lookAt = new THREE.Vector3();
            lookAt.copy(scope.object.position).add(scope.gazeDirection);
            scope.object.lookAt(lookAt);

			sphericalDelta.set( 0, 0, 0 );

			return false;

		};

	}();

	this.dispose = function() {
		scope.domElement.removeEventListener( 'contextmenu', onContextMenu, false );
		document.removeEventListener( 'mousemove', onMouseMove, false );
	};

	//
	// internals
	//

	var scope = this;

	// current position in spherical coordinates
	var spherical = new THREE.Spherical();
	var sphericalDelta = new THREE.Spherical();

	function rotateLeft( angle ) {
		sphericalDelta.theta -= angle;
	}

	function rotateUp( angle ) {
		sphericalDelta.phi -= angle;
	}

	function onMouseDown(event) {
		scope.domElement.requestPointerLock = scope.domElement.requestPointerLock ||
		                                      scope.domElement.mozRequestPointerLock;
		if(scope.domElement.requestPointerLock) {
			scope.domElement.requestPointerLock();
		}
	}

	function onMouseMove( event ) {
		if ( scope.enabled === false ) return;
		event.preventDefault();
		var movementX = event.movementX ||
		                event.mozMovementX ||
		                event.webkitMovementX ||
		                0;
 
		var movementY = event.movementY ||
		                event.mozMovementY ||
		                event.webkitMovementY ||
		                0;

		var element = scope.domElement === document ? scope.domElement.body : scope.domElement;

		// rotating across whole screen goes 360 degrees around
		rotateLeft( 2 * Math.PI * movementX / element.clientWidth * scope.rotateSpeed );

		// rotating up and down along whole screen attempts to go 360, but limited to 180
		rotateUp( 2 * Math.PI * movementY / element.clientHeight * scope.rotateSpeed );

		scope.update();
	}

	function onContextMenu( event ) {
		event.preventDefault();
	}

	function lockChangeAlert() {
		if((document.pointerLockElement || document.mozPointerLockElement) === scope) {
			scope.domElement.removeEventListener( 'mousedown', onMouseDown, false );
		} else {
			scope.domElement.addEventListener( 'mousedown', onMouseDown, false );
		}
	}

	scope.domElement.addEventListener( 'contextmenu', onContextMenu, false );
	scope.domElement.addEventListener( 'mousemove', onMouseMove, false );
	scope.domElement.addEventListener( 'mousedown', onMouseDown, false );
	if ("onpointerlockchange" in document) {
		document.addEventListener('pointerlockchange', lockChangeAlert, false);
	} else if ("onmozpointerlockchange" in document) {
		document.addEventListener('mozpointerlockchange', lockChangeAlert, false);
	}

	// force an update at start

	this.update();
};

THREE.LookAroundControls.prototype = Object.create( THREE.EventDispatcher.prototype );
THREE.LookAroundControls.prototype.constructor = THREE.LookAroundControls;

Object.defineProperties( THREE.LookAroundControls.prototype, {

	center: {

		get: function () {

			console.warn( 'THREE.LookAroundControls: .center has been renamed to .target' );
			return this.target;

		}

	}
} );
