// Maze as it existed in version 2.0 of Maze War for the Xerox Alto
const altoMaze = [
    "█████████████████████████████████",
    "█ █       █    █                █",
    "█ █ █ █ █ █ ██ █ ███ ███ ████ ███",
    "█   █ █ █ █ █  █ █    █   █   █ █",
    "█ █ █   █   ██      █   █   █ █ █",
    "█ █ ███ ██████ ██████████ █████ █",
    "█ █                             █",
    "█ ████ ███ ███ █ ████████████ ███",
    "█      █       █     █          █",
    "█ ██ ███ █████ █ ███ █ ████████ █",
    "█ █      █   █ █     █          █",
    "█ █ ██ █ █ █ █ █████ ███████ ████",
    "█ █  █ █ █ █ █ █   █ █          █",
    "█ █ ██ █ █ █ █ █ █ █ █ ████████ █",
    "█      █         █              █",
    "█████████████████████████████████"
];

class Maze {
    constructor() {
        this.fromStringArray(altoMaze);
    }

    fromStringArray(a) {
        this.mazeCols = a[0].length;
        this.mazeRows = a.length;
        this.cells = new Array(this.mazeCols * this.mazeRows);
        this.forAll( (x,z) => this.setCell(x,z,a[z][x] !== ' ') );
    }

    getRandomPosition() {
        var x, z;
        do {
            x = Math.floor(Math.random() * this.mazeCols);
            z = Math.floor(Math.random() * this.mazeRows);
        } while(this.getCell(x,z));
        return [x,z];
    }

    passageDirections(x,z) {
        return (this.hasWall(x,z, Directions.NORTH) ? 0 : Directions.NORTH ) |
               (this.hasWall(x,z, Directions.SOUTH) ? 0 : Directions.SOUTH ) |
               (this.hasWall(x,z, Directions.WEST)  ? 0 : Directions.WEST  ) |
               (this.hasWall(x,z, Directions.EAST)  ? 0 : Directions.EAST  );
    }

    hasWall(x, z, dir) {
        return this.getAdjacentCell(x, z, dir);
    }

    setCell(x,z,val) {
        this.cells[x+z*this.mazeCols]=val;
    }

    getCell(x,z) {
        if(x < 0 || z < 0 || x >= this.mazeCols || z >= this.mazeRows) {
            return true;
        }
        return this.cells[x+z*this.mazeCols];
    }

    getAdjacentCell(x, z, dir) {
        switch(dir) {
            case Directions.NORTH: return this.getCell(x,   z-1); break;
            case Directions.SOUTH: return this.getCell(x,   z+1); break;
            case Directions.WEST:  return this.getCell(x-1, z  ); break;
            case Directions.EAST:  return this.getCell(x+1, z  ); break;
        }
    }

    forAll(func) {
        for(var y = 0; y < this.mazeRows; y++) {
            for(var x = 0; x < this.mazeCols; x++) {
                func.call(this, x, y);
            }
        }
    }

    forSelfAndAdjacent(x, z, func) {
        func.call(this, x,   z);
        if(x > 0)                 func.call(this, x-1, z);
        if(x < (this.mazeCols-1)) func.call(this, x+1, z);
        if(z > 0)                 func.call(this, x,   z-1);
        if(z < (this.mazeRows-1)) func.call(this, x,   z+1);
    }
}