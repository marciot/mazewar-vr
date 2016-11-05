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
    },
    toAltoDir: function(dir) {
        switch(dir) {
            case Directions.NORTH: return RetroWeb.PupMazeWarDirections.NORTH;
            case Directions.EAST:  return RetroWeb.PupMazeWarDirections.EAST;
            case Directions.SOUTH: return RetroWeb.PupMazeWarDirections.SOUTH;
            case Directions.WEST:  return RetroWeb.PupMazeWarDirections.WEST;
        }
    },
    fromAltoDir: function(dir) {
        switch(dir) {
            case RetroWeb.PupMazeWarDirections.NORTH: return Directions.NORTH;
            case RetroWeb.PupMazeWarDirections.EAST:  return Directions.EAST;
            case RetroWeb.PupMazeWarDirections.SOUTH: return Directions.SOUTH;
            case RetroWeb.PupMazeWarDirections.WEST:  return Directions.WEST;
        }
    }
});