$(function() {    
    window.Hex = function(num) {
        this._num = num;
        this._x = num % Hex.prototype.NUM_WIDE;
        this._y = Math.floor(num / Hex.prototype.NUM_WIDE);
        this._country = null;
        this._countryEdgeDirections = [];
    };

    Hex.init = function() {
        Hex._array = [];
        for (var i = 0; i < Hex.prototype.TOTAL_HEXES; i++) {
            Hex._array[i] = new Hex(i);
        }

    };

    Hex.get = function(num) {
        return Hex._array[num];
    };

    Hex.count = function() {
        return Hex._array.length;
    };

    Hex.fromMousePos = function(x, y) {
        y -= Hex.prototype.TOP_LEFT_Y;
        var total_height = Hex.prototype.NUM_HIGH * Hex.prototype.HEIGHT;
        var row = Math.floor((y / total_height) * (Hex.prototype.NUM_HIGH * 2));

        x -= Hex.prototype.TOP_LEFT_X;
        var total_width = Hex.prototype.NUM_WIDE * Hex.prototype.WIDTH;
        var col = Math.floor((x / total_width) * (Hex.prototype.NUM_WIDE / 1.5) * 2);

        var num = null;

        // Note col can be -1!
        if (col % 2) {  // Odd means it's an angled portion.
            var left = null, right = null;
            if ((col - 1) % 4) {
                if (row % 2) {
                    col = Math.floor(col / 4);
                    row = Math.floor(row / 2);
                    left = col + (row * (Hex.prototype.NUM_WIDE * 2)) + Hex.prototype.NUM_WIDE;
                    right = left - Hex.prototype.NUM_WIDE + 1;
                    //bottom-right to top-left
                } else {
                    col = Math.floor(col / 4);
                    row = Math.floor(row / 2) - 1;
                    left = col + (row * (Hex.prototype.NUM_WIDE * 2)) + Hex.prototype.NUM_WIDE;
                    right = left + Hex.prototype.NUM_WIDE + 1;

                    //bottom-left to top right
                }

            } else {
                if (row % 2) {
                    col = Math.floor(col / 4);
                    row = Math.floor(row / 2);
                    left = col + (row * (Hex.prototype.NUM_WIDE * 2));
                    right = left + Hex.prototype.NUM_WIDE;

                    //bottom-left to top-right                
                } else {
                    col = Math.floor(col / 4);
                    row = Math.floor(row / 2) - 1;
                    left = col + (row * (Hex.prototype.NUM_WIDE * 2)) + 2 * Hex.prototype.NUM_WIDE;
                    right = left - Hex.prototype.NUM_WIDE;


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

            col /= 2;
            if (col % 2) { // Odd means it's a lower hex.
                col = Math.floor(col / 2);
                row = Math.floor(row / 2) - 1;
                num = col + (row * (Hex.prototype.NUM_WIDE * 2)) + Hex.prototype.NUM_WIDE;
            } else { // Even means its an upper hex.
                col /= 2;
                row = Math.floor(row / 2);
                num = col + (row * Hex.prototype.NUM_WIDE * 2);
            }
        }
        return null;
    /*
        if (num !== null && num >= 0) {
            return Hex.get(num);
        }

        return null;
        */
    };


    Hex.prototype.BORDER_COLOR = "black";
    Hex.prototype.BORDER_THICKNESS = 3;
    Hex.prototype.HEIGHT = 14;
    Hex.prototype.WIDTH = Hex.prototype.HEIGHT / Math.sqrt(3);
    Hex.prototype.TOP_LEFT_X = 10;
    Hex.prototype.TOP_LEFT_Y = 10;
    Hex.prototype.NUM_WIDE = 40;
    Hex.prototype.NUM_HIGH = 80;
    Hex.prototype.TOTAL_HEXES = Hex.prototype.NUM_WIDE * Hex.prototype.NUM_HIGH;

    Hex.prototype.x = function() { return this._x; };
    Hex.prototype.y = function() { return this._y; };
    Hex.prototype.num = function() { return this._num; };


    Hex.prototype.isInterior = function() {
        return this._countryEdgeDirections.length === 0;
    };

    Hex.prototype.isExterior = function() {
        return this._countryEdgeDirections.length > 0;
    };


    Hex.prototype.setCountry = function(country) {
        this._country = country;
    };


    // The directions which are boundaries between this cell and another country or the edge of the board.
    Hex.prototype.setCountryEdgeDirections = function(array) {
        this._countryEdgeDirections = array;
    };

    Hex.prototype.country = function() {
        return this._country;
    };

    Hex.prototype.paint = function() {
        var self = this;

        var upperLeftX;
        var upperLeftY;
        var y;
        if (this._y % 2) {
            y = Math.floor(this._y / 2);
            upperLeftX = this.TOP_LEFT_X + (this.WIDTH * ((this._x * 3) + 1.5));
            upperLeftY = this.TOP_LEFT_Y + (y + 0.5) * this.HEIGHT;

        } else {
            y = this._y / 2;
            upperLeftX = this.TOP_LEFT_X + (this.WIDTH * this._x * 3);
            upperLeftY = this.TOP_LEFT_Y + y * this.HEIGHT;
        }

        var FUDGE = 0.5;
        var path = new Path2D();
        path.moveTo(upperLeftX - FUDGE, upperLeftY - FUDGE);
        path.lineTo(upperLeftX + this.WIDTH + FUDGE, upperLeftY - FUDGE);
        path.lineTo(upperLeftX + this.WIDTH + this.WIDTH / 2, upperLeftY + this.HEIGHT / 2);
        path.lineTo(upperLeftX + this.WIDTH + FUDGE, upperLeftY + this.HEIGHT + FUDGE);
        path.lineTo(upperLeftX - FUDGE, upperLeftY + this.HEIGHT + FUDGE);
        path.lineTo(upperLeftX - this.WIDTH / 2, upperLeftY + this.HEIGHT / 2);
        path.lineTo(upperLeftX - FUDGE, upperLeftY - FUDGE);
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
                    edgePath.lineTo(upperLeftX - self.WIDTH / 2, upperLeftY + self.HEIGHT / 2);
                    break;

                case Dir.obj.N:
                case "N":
                    edgePath.moveTo(upperLeftX, upperLeftY);
                    edgePath.lineTo(upperLeftX + self.WIDTH, upperLeftY);
                    break;

                case Dir.obj.NE:
                case "NE":
                    edgePath.moveTo(upperLeftX + self.WIDTH, upperLeftY);
                    edgePath.lineTo(upperLeftX + self.WIDTH + self.WIDTH / 2, upperLeftY + self.HEIGHT / 2);
                    break;

                case Dir.obj.SE:
                case "SE":
                    edgePath.moveTo(upperLeftX + self.WIDTH + self.WIDTH / 2, upperLeftY + self.HEIGHT / 2);
                    edgePath.lineTo(upperLeftX + self.WIDTH, upperLeftY + self.HEIGHT);
                    break;

                case Dir.obj.S:
                case "S":
                    edgePath.moveTo(upperLeftX + self.WIDTH, upperLeftY + self.HEIGHT);
                    edgePath.lineTo(upperLeftX, upperLeftY + self.HEIGHT);
                    break;

                case Dir.obj.SW:
                case "SW":
                    edgePath.moveTo(upperLeftX, upperLeftY + self.HEIGHT);
                    edgePath.lineTo(upperLeftX - self.WIDTH / 2, upperLeftY + self.HEIGHT / 2);
                    break;                    


            }
            edgePath.closePath();
            Globals.context.strokeColor = self.BORDER_COLOR;
            Globals.context.lineWidth = self.BORDER_THICKNESS;

            Globals.context.stroke(edgePath);

        });

        if (Globals.showNumbers) {
            Globals.context.lineWidth = 1;
            Globals.context.font = "11px sans-serif";
            Globals.context.strokeText(this._num, upperLeftX, upperLeftY + this.HEIGHT / 2);
        }

    };
});