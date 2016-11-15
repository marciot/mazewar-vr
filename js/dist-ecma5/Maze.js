var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

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

var altoMaze = [["████████████████████████████████", "█ █       █    █               █", "█ █ █ █ █ █ ██ █ ██ ███ ████ ███", "█   █ █ █ █ █  █ █   █   █   █ █", "█ █ █   █   ██     █   █   █ █ █", "█ █ ███ ██████ █████████ █████ █", "█ █                            █", "█ ████ ███ ███ █ ███████████ ███", "█      █       █     █         █", "█ ██ ███ █████ █ ███ █ ███████ █", "█ █      █   █ █     █         █", "█ █ ██ █ █ █ █ █████ ██████ ████", "█ █  █ █ █ █ █ █   █ █         █", "█ █ ██ █ █ █ █ █ █ █ █ ███████ █", "█      █         █             █", "████████████████████████████████"], [
// Maze as it existed in version 2.0 of Maze War for the Xerox Alto
"████████████████████████████████", "█             █                █", "█ █ █ ███ ██ ███ ████ ███ ████ █", "███ █     █         █ █    █   █", "█ █ ██ ████ █ ███ █ █ █ ██   ███", "█           ███ █ █      ███  ██", "█ █ ███████ █     ██████    █  █", "█ █       █ █ ███     ██ ██  ███", "█ ███ ███   █   █████ █   █ ██ █", "█   █   █ █ █ █ █   █ █ █ █    █", "███ █ █ █ █   █ █ █ █ █ █ ██ █ █", "█ █ █ ███ █ █ █ █ █ █ █ █    █ █", "█ █ █     █ █ █       █  █ █ █ █", "█ █ ███████ ██████ █████ █ ███ █", "█                              █", "████████████████████████████████"], [
// Tiny map for testing
"███████", "█     █", "█ ███ █", "█ █   █", "█ █ █ █", "█     █", "███████"]];

var Maze = function () {
    function Maze() {
        _classCallCheck(this, Maze);

        this.fromStringArray(altoMaze[1]);
    }

    _createClass(Maze, [{
        key: "fromStringArray",
        value: function fromStringArray(a) {
            var _this = this;

            this.mazeCols = a[0].length;
            this.mazeRows = a.length;
            this.cells = new Array(this.mazeCols * this.mazeRows);
            this.forAll(function (x, z) {
                return _this.setCell(x, z, a[z][x] !== ' ');
            });
        }
    }, {
        key: "getRandomPosition",
        value: function getRandomPosition() {
            var x, z;
            do {
                x = Math.floor(Math.random() * this.mazeCols);
                z = Math.floor(Math.random() * this.mazeRows);
            } while (this.getCell(x, z));
            return [x, z];
        }
    }, {
        key: "passageDirections",
        value: function passageDirections(x, z) {
            return (this.hasWall(x, z, Directions.NORTH) ? 0 : Directions.NORTH) | (this.hasWall(x, z, Directions.SOUTH) ? 0 : Directions.SOUTH) | (this.hasWall(x, z, Directions.WEST) ? 0 : Directions.WEST) | (this.hasWall(x, z, Directions.EAST) ? 0 : Directions.EAST);
        }
    }, {
        key: "canMoveFrom",
        value: function canMoveFrom(x, z, direction) {
            return direction & this.passageDirections(x, z);
        }
    }, {
        key: "hasWall",
        value: function hasWall(x, z, dir) {
            return this.getAdjacentCell(x, z, dir);
        }
    }, {
        key: "setCell",
        value: function setCell(x, z, val) {
            this.cells[x + z * this.mazeCols] = val;
        }
    }, {
        key: "getCell",
        value: function getCell(x, z) {
            if (x < 0 || z < 0 || x >= this.mazeCols || z >= this.mazeRows) {
                return true;
            }
            return this.cells[x + z * this.mazeCols];
        }
    }, {
        key: "getAdjacentCell",
        value: function getAdjacentCell(x, z, dir) {
            switch (dir) {
                case Directions.NORTH:
                    return this.getCell(x, z - 1);break;
                case Directions.SOUTH:
                    return this.getCell(x, z + 1);break;
                case Directions.WEST:
                    return this.getCell(x - 1, z);break;
                case Directions.EAST:
                    return this.getCell(x + 1, z);break;
            }
        }
    }, {
        key: "forAll",
        value: function forAll(func) {
            for (var y = 0; y < this.mazeRows; y++) {
                for (var x = 0; x < this.mazeCols; x++) {
                    func.call(this, x, y);
                }
            }
        }
    }, {
        key: "forSelfAndAdjacent",
        value: function forSelfAndAdjacent(x, z, func) {
            func.call(this, x, z);
            if (x > 0) func.call(this, x - 1, z);
            if (x < this.mazeCols - 1) func.call(this, x + 1, z);
            if (z > 0) func.call(this, x, z - 1);
            if (z < this.mazeRows - 1) func.call(this, x, z + 1);
        }
    }]);

    return Maze;
}();