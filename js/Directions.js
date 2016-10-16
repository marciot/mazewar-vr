Directions = Object.freeze({
    "NORTH" : 0x1,
    "EAST"  : 0x2,
    "SOUTH" : 0x4,
    "WEST"  : 0x8,
    "UP"    : 0x10,
    "DOWN"  : 0x20,
    fromInteger: function(i) {
        switch(i%4) {
            case 0: return Directions.NORTH;
            case 1: return Directions.EAST;
            case 2: return Directions.SOUTH;
            case 3: return Directions.WEST;
        }
    },
    toInteger: function(d) {
        switch(d) {
            case Directions.NORTH: return 0;
            case Directions.EAST:  return 1;
            case Directions.SOUTH: return 2;
            case Directions.WEST:  return 3;
        }
    },
    toUnitVector: function(d) {
        switch(d) {
            case Directions.NORTH: return new THREE.Vector3(0, 0, -1);
            case Directions.EAST:  return new THREE.Vector3(1, 0,  0);
            case Directions.SOUTH: return new THREE.Vector3(0, 0,  1);
            case Directions.WEST:  return new THREE.Vector3(-1, 0, 0);
            case Directions.UP:    return new THREE.Vector3(0, 1,  0);
            case Directions.DOWN:  return new THREE.Vector3(0, -1, 0);
        }
    },
    rightFrom: function(d) {
        return Directions.fromInteger(Directions.toInteger(d)+1);
    },
    leftFrom: function(d) {
        return Directions.fromInteger(Directions.toInteger(d)+3);
    },
    oppositeFrom: function(d) {
        return Directions.fromInteger(Directions.toInteger(d)+2);
    }
});