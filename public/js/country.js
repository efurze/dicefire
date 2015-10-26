$(function() {
    window.Country = function(starthex, color) {
        this._hexes = [starthex];
        starthex.setCountry(this);
        this._color = color;
        this._numHexes = Math.floor(Math.random() * (Country.prototype.MAX_HEXES - Country.prototype.MIN_HEXES + 1)) + 
            Country.prototype.MIN_HEXES;

        this.growCountry();
        if (this._numHexes != this._hexes.length) {
            // Mark it as a lake still so we can make enough countries.
            this._isLake = true;
            if (this._hexes.length <= 5) {
                this.absorbLake();
                return;
            } else {
                // Lake absorbed which prevents it being added to the master country list.
                this._color = this.LAKE_COLOR;  
            }
        }

        Country._array.push(this);
    };

    Country.init = function() {
        Country._array = [];
    };

    Country.get = function(num) {
        return Country._array[num];
    };

    Country.count = function() {
        return Country._array.length;
    };


    Country.array = function() {
        return Country._array;
    };


    Country.prototype.MAX_HEXES = 100;
    Country.prototype.MIN_HEXES = 30;

    Country.prototype.LAKE_COLOR = "white";

    Country.prototype.color = function() { return this._color; };
    Country.prototype.hexes = function() { return this._hexes; };
    Country.prototype.isLake = function() { return this._isLake; };

    Country.prototype.center = function() {
        var center = [0, 0];
        this._hexes.forEach(function(hex) {
            var hexCenter = hex.center();
            center[0] += hexCenter[0];
            center[1] += hexCenter[1];            
        })

        center[0] /= this._hexes.length;
        center[1] /= this._hexes.length;

        return center;
    }


    // Find a hex that is adjacent to this country but is not occupied by this country.
    // This can be used to grow this country, to find a new place to start a country,
    // or to figure out whom to attack.
    Country.prototype.findAdjacentHex = function(mustBeEmpty) {
        var self = this;

        // Pick a starting hex randomly. Then iterate through until one is hopefully found.
        // var startingHexPos = Math.floor(Math.random() * this._hexes.length);
        for (var i = 0; i < this._hexes.length; i++) {
            // Try to find a neighboring spot that works.
            var hex = Math.floor(Math.random() * this._hexes.length);

            //Iterate over directions from the hex again randomly to see if one works.
            for ( var j = 0; j < Dir.array.length; j++) {
                var dir = Dir.array[Math.floor(Math.random() * Dir.array.length)];
                var newHex = Dir.nextHex(this._hexes[hex], dir);
                if (newHex && (mustBeEmpty ? newHex.country() === null : newHex.country() != self)) {
                    return newHex;
                }

            }
        }

        return null;

    };

    Country.prototype.growCountry = function() {
        if (this._hexes.length >= this._numHexes) {
            return;
        }

        var hex = this.findAdjacentHex(true);

        if (!hex) {
//            Globals.debug("Couldn't find a new spot for a hex!");        
            return;
        }

        hex.setCountry(this);
        this._hexes.push(hex);

        // Tail recursion to get the right number.
        this.growCountry();

    };



    // Absorbs a lake into an adjacent country.
    Country.prototype.absorbLake = function() {
        var newCountry = null;
        this._hexes.forEach(function(hex) {
            hex.moveToAdjacentCountry();
        })
        this._hexes = [];
    };

    // Marks hexes as internal or external. Also identifies which edges need border stroking for the hex.
    Country.prototype.markHexes = function() {
        var self = this;
        this._hexes.forEach(function(hex) {
            var countryEdges = [];
            for (var i = 0; i < Dir.array.length; i++) {
                var newHex = Dir.nextHex(hex, i);
                // Lakes have somewhat different rules.
                if (self.isLake()) {
                    if (newHex && newHex.country() && !newHex.country().isLake()) {
                        countryEdges.push(i);
                    }
                } else if (!newHex || newHex.country() != self) {
                    countryEdges.push(i);                
                }
            }
            hex.setCountryEdgeDirections(countryEdges);
        });
    };


    Country.prototype.paint = function() {
        this._hexes.forEach(function(elem) {
            elem.paint();
        });

        if (Globals.markCountryCenters) {
            var ctr = this.center();
            var path = new Path2D();
            path.moveTo(ctr[0] - 4, ctr[1] - 4);
            path.lineTo(ctr[0] + 4, ctr[1] + 4);
            path.closePath();
            Globals.context.strokeColor = "black";
            Globals.context.lineWidth = 2;
            Globals.context.stroke(path);

            path = new Path2D();
            path.moveTo(ctr[0] - 4, ctr[1] + 4);
            path.lineTo(ctr[0] + 4, ctr[1] - 4);
            path.closePath();
            Globals.context.strokeColor = "black";
            Globals.context.lineWidth = 2;
            Globals.context.stroke(path);
        }
    };
});
