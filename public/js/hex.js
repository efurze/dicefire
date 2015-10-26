$(function() {    
    window.Hex = function(num) {
        this._num = num;
        this._x = num % Hex.NUM_WIDE;
        this._y = Math.floor(num / Hex.NUM_WIDE);
        this._country = null;
        this._countryEdgeDirections = [];
    };


    Hex.BORDER_COLOR = "black";
    Hex.BORDER_THICKNESS = 3;
    Hex.EDGE_LENGTH = 8;
    Hex.HEIGHT = Hex.EDGE_LENGTH * Math.sqrt(3);
    Hex.TOP_LEFT_X = 10;
    Hex.TOP_LEFT_Y = 10;
    Hex.NUM_WIDE = 40;
    Hex.NUM_HIGH = 80;
    Hex.TOTAL_HEXES = Hex.NUM_WIDE * Hex.NUM_HIGH;
    // The fudge was selected to make it look nice :-)
    Hex.FUDGE = 0.5;


    Hex.init = function() {
        Hex._array = [];
        for (var i = 0; i < Hex.TOTAL_HEXES; i++) {
            Hex._array[i] = new Hex(i);
        }

    };

    Hex.get = function(num) {
        return Hex._array[num];
    };

    Hex.count = function() {
        return Hex._array.length;
    };

    // Finds all hexes which are alone and absorbs them into a nearby country. Do this because
    // they look kind of bad.
    Hex.absorbSingles = function() {
        Hex._array.forEach(function(hex) {
            if (!hex.country()) {
                for (var i = 0; i < Dir.array.length; i++) {
                    var nextHex = Dir.nextHex(hex, Dir.array[i]);
                    if (!nextHex || !nextHex.country() || nextHex.country().isLake()) {
                        return;
                    }
                }
                // If it got here, the hex is not on the edge and it has countries all around it.
                hex.moveToAdjacentCountry();
            } 
        });
    };


    // I think a smarter/simpler way to do this is to find the centers of the 4 hexes which are in
    // the "even" columns which are closest to this point. That's easy cuz it's just a grid. Then pick
    // the 3 "odd" ones in between. Then compute distances to each and go with the shortest.
    
    Hex.fromMousePos = function(x, y) {
        y -= Hex.TOP_LEFT_Y;
        var total_height = Hex.NUM_HIGH * Hex.HEIGHT;
        // Note that there are 2 rows per row, to allow distinguishing the upper and lower halves
        // of the hexes.
        var row = Math.floor((y / total_height) * (Hex.NUM_HIGH * 2));

        x -= Hex.TOP_LEFT_X;
        // This is a little tricky. It's because the width of the full thing is determined by
        // the edge length of a hex, not by the width of a full individual hex. If confused,
        // look at the drawing below.
        var total_width = Hex.NUM_WIDE * (Hex.EDGE_LENGTH * 3);
        var col = Math.floor((x / total_width) * (6 * Hex.NUM_WIDE));

        var num = null;

        // The columns alternate between angled and flat sections. If the cursor is in 
        // a flat column, stuff is pretty easy, since the hexes are just stacked rectangles.
        // It's still a little tricky because, depending on whether it's col [0,1] or [3,4], the
        // rectangles stack differently. For the other columns columns, it's harder because you 
        // have a rectangular section with a diagonal line down the middle. For those, first, figure
        // out which hex is on the left and which is on the right. Then, figure out which side
        // of the line the cursor is on.
        // 
        //      ----col----
        //   -1  0 1  2 3 4 5 6
        //      _____    
        //     /     \
        //    /  hex  \_____
        //    \   0   /     \
        //     \_____/  hex  \
        //     /     \   40  /
        //    /  hex  \_____/
        //    \   80  /
        //     \_____/


        // Note col can be -1, so we add 3 to catch that case.
        if ((col + 3) % 3 == 2) {  // Means it's an angled portion.
            return null;
            var left = null, right = null;
//            var xoffset = x - 
            if ((col - 1) % 4) {
                if (row % 2) {
                    col = Math.floor(col / 4);
                    row = Math.floor(row / 2);
                    left = col + (row * (Hex.NUM_WIDE * 2)) + Hex.NUM_WIDE;
                    right = left - Hex.NUM_WIDE + 1;
                    //bottom-right to top-left
                } else {
                    col = Math.floor(col / 4);
                    row = Math.floor(row / 2) - 1;
                    left = col + (row * (Hex.NUM_WIDE * 2)) + Hex.NUM_WIDE;
                    right = left + Hex.NUM_WIDE + 1;

                    //bottom-left to top right
                }

            } else {
                if (row % 2) {
                    col = Math.floor(col / 4);
                    row = Math.floor(row / 2);
                    left = col + (row * (Hex.NUM_WIDE * 2));
                    right = left + Hex.NUM_WIDE;

                    //bottom-left to top-right                
                } else {
                    col = Math.floor(col / 4);
                    row = Math.floor(row / 2) - 1;
                    left = col + (row * (Hex.NUM_WIDE * 2)) + 2 * Hex.NUM_WIDE;
                    right = left - Hex.NUM_WIDE;


                    //bottom-right to top-left
                }

            }


            return left !== null ? [left, right] : null;

            // [1,1] is between 0 and 40 with a bottom-left to top-right line
            // [3,1] is between 40 and 1 with a bottom-right to top-left line
            // [5,1] is between 1 and 41 with bottom-left to top-right
            // [1,2] is between 80 and 41 with top-left to bottom right
            // [3,2] is between 40 and 81 wtih bottom-left to top-right



        } else {    // Much easier: A flat portion.
            var pos = col % 6;
            if (pos == 0 || pos == 1) { // Upper hex.
                col = Math.floor(col / 6);
                row = Math.floor(row / 2);
                num = col + (row * Hex.NUM_WIDE * 2);
            } else { // Lower hex.
                col = Math.floor(col / 6);
                row = Math.floor((row + 1) / 2) - 1;
                num = col + (row * (Hex.NUM_WIDE * 2)) + Hex.NUM_WIDE;
            }

        }

        if (num !== null && num >= 0) {
            return Hex.get(num);
        }

        return null;
    };



    Hex.prototype.x = function() { return this._x; };
    Hex.prototype.y = function() { return this._y; };
    Hex.prototype.num = function() { return this._num; };

    Hex.prototype.setCountry = function(country) { this._country = country; };
    Hex.prototype.country = function() { return this._country; };

    // The directions which are boundaries between this cell and another country or the edge of the board.
    Hex.prototype.setCountryEdgeDirections = function(array) { this._countryEdgeDirections = array; };
    Hex.prototype.countryEdgeDirections = function() { return this._countryEdgeDirections; };


    Hex.prototype.isInterior = function() {
        return this._countryEdgeDirections.length === 0;
    };

    Hex.prototype.isExterior = function() {
        return this._countryEdgeDirections.length > 0;
    };



    // Move this hex into an adjacent country. Don't move into a lake if a lake is adjacent.
    // Only move if it's possible to do so.
    Hex.prototype.moveToAdjacentCountry = function() {
        for (var i = 0; i < Dir.array.length; i++) {
            var newHex = Dir.nextHex(this, i);
            if (newHex && newHex.country() && !newHex.country().isLake()) {
                var newCountry = newHex.country();
                this.setCountry(newCountry);
                newCountry._hexes.push(this);                
                return;
            }
        }
        Globals.debug("Can't find an adjacent country");

    };


    Hex.prototype.center = function() {
        var pos = this.upperLeft();
        pos[0] += Math.floor(Hex.EDGE_LENGTH / 2);
        pos[1] += Math.floor(Hex.HEIGHT / 2);
        return pos;
    }



    Hex.prototype.upperLeft = function() {
        var upperLeftX, upperLeftY;
        var y;

        if (this._y % 2) {
            y = Math.floor(this._y / 2);
            upperLeftX = Hex.TOP_LEFT_X + (Hex.EDGE_LENGTH * ((this._x + 0.5) * 3));
            upperLeftY = Hex.TOP_LEFT_Y + (y + 0.5) * Hex.HEIGHT;

        } else {
            y = this._y / 2;
            upperLeftX = Hex.TOP_LEFT_X + (Hex.EDGE_LENGTH * this._x * 3);
            upperLeftY = Hex.TOP_LEFT_Y + y * Hex.HEIGHT;
        }

        return [upperLeftX, upperLeftY];
    }




    Hex.prototype.paint = function() {
        var upperLeft = this.upperLeft();
        var upperLeftX = upperLeft[0], upperLeftY = upperLeft[1];
       


        var path = new Path2D();
        path.moveTo(upperLeftX - Hex.FUDGE, upperLeftY - Hex.FUDGE);
        path.lineTo(upperLeftX + Hex.EDGE_LENGTH + Hex.FUDGE, upperLeftY - Hex.FUDGE);
        path.lineTo(upperLeftX + Hex.EDGE_LENGTH + Hex.EDGE_LENGTH / 2, upperLeftY + Hex.HEIGHT / 2);
        path.lineTo(upperLeftX + Hex.EDGE_LENGTH + Hex.FUDGE, upperLeftY + Hex.HEIGHT + Hex.FUDGE);
        path.lineTo(upperLeftX - Hex.FUDGE, upperLeftY + Hex.HEIGHT + Hex.FUDGE);
        path.lineTo(upperLeftX - Hex.EDGE_LENGTH / 2, upperLeftY + Hex.HEIGHT / 2);
        path.lineTo(upperLeftX - Hex.FUDGE, upperLeftY - Hex.FUDGE);
        path.closePath();


        Globals.context.fillStyle = this._country ? this._country.color() : "white";
        if (this._color) {
            Globals.context.fillStyle = this._color;
        }
        Globals.context.fill(path);


        this._countryEdgeDirections.forEach(function(dir) {
            var edgePath = new Path2D();
            switch(dir) {
                case Dir.obj.NW: 
                case "NW":
                    edgePath.moveTo(upperLeftX, upperLeftY);
                    edgePath.lineTo(upperLeftX - Hex.EDGE_LENGTH / 2, upperLeftY + Hex.HEIGHT / 2);
                    break;

                case Dir.obj.N:
                case "N":
                    edgePath.moveTo(upperLeftX, upperLeftY);
                    edgePath.lineTo(upperLeftX + Hex.EDGE_LENGTH, upperLeftY);
                    break;

                case Dir.obj.NE:
                case "NE":
                    edgePath.moveTo(upperLeftX + Hex.EDGE_LENGTH, upperLeftY);
                    edgePath.lineTo(upperLeftX + Hex.EDGE_LENGTH + Hex.EDGE_LENGTH / 2, upperLeftY + Hex.HEIGHT / 2);
                    break;

                case Dir.obj.SE:
                case "SE":
                    edgePath.moveTo(upperLeftX + Hex.EDGE_LENGTH + Hex.EDGE_LENGTH / 2, upperLeftY + Hex.HEIGHT / 2);
                    edgePath.lineTo(upperLeftX + Hex.EDGE_LENGTH, upperLeftY + Hex.HEIGHT);
                    break;

                case Dir.obj.S:
                case "S":
                    edgePath.moveTo(upperLeftX + Hex.EDGE_LENGTH, upperLeftY + Hex.HEIGHT);
                    edgePath.lineTo(upperLeftX, upperLeftY + Hex.HEIGHT);
                    break;

                case Dir.obj.SW:
                case "SW":
                    edgePath.moveTo(upperLeftX, upperLeftY + Hex.HEIGHT);
                    edgePath.lineTo(upperLeftX - Hex.EDGE_LENGTH / 2, upperLeftY + Hex.HEIGHT / 2);
                    break;                    


            }
            edgePath.closePath();
            Globals.context.strokeColor = Hex.BORDER_COLOR;
            Globals.context.lineWidth = Hex.BORDER_THICKNESS;

            Globals.context.stroke(edgePath);

        });


        if (Globals.showNumbers) {
            Globals.context.lineWidth = 1;
            Globals.context.font = "11px sans-serif";
            Globals.context.strokeText(this._num, upperLeftX, upperLeftY + Hex.HEIGHT / 2);
        }

        if (Globals.markHexCenters) {
            var ctr = this.center();
            var path = new Path2D();
            path.moveTo(ctr[0] - 2, ctr[1] - 2);
            path.lineTo(ctr[0] + 2, ctr[1] + 2);
            path.closePath();
            Globals.context.strokeColor = "black";
            Globals.context.lineWidth = 1;
            Globals.context.stroke(path);

            path = new Path2D();
            path.moveTo(ctr[0] - 2, ctr[1] + 2);
            path.lineTo(ctr[0] + 2, ctr[1] - 2);
            path.closePath();
            Globals.context.strokeColor = "black";
            Globals.context.lineWidth = 1;
            Globals.context.stroke(path);
        }

    };
});