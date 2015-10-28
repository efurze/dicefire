$(function() {
    window.Country = function(starthex, owner) {
        this._hexes = [starthex];
        starthex.setCountry(this);
        this._owner = owner;
        this._overrideColor = null;
        this._numHexes = Math.floor(Math.random() * (Country.prototype.MAX_HEXES - Country.prototype.MIN_HEXES + 1)) + 
            Country.prototype.MIN_HEXES;

        this.growCountry();
        if (this._numHexes != this._hexes.length) {
            // Mark it as a lake still so we can make enough countries. If it's a small lake,
            // let it get absorbed into another country. If it's a big lake, it will remain
            // and be pruned (in actual gameplay, all isLake() countries are gone)
            this._isLake = true;
            if (this._hexes.length <= 5) {
                this.absorbLake();
                return;
            } 
        }

        Country._array.push(this);
    };

    Country.init = function() { Country._array = []; };
    Country.get = function(num) { return Country._array[num]; };
    Country.count = function() { return Country._array.length; };
    Country.array = function() { return Country._array; };

    // Removes lakes from the country list to simplify things.
    Country.pruneLakes = function() {
        Country._array = Country._array.filter(function(country) {
            if (!country.isLake()) {
                return true;
            } else {
                country.hexes().forEach(function(hex) {
                    hex.setCountry(null);
                    hex.setCountryEdgeDirections(null);
                });
                return false;
            }
        });

    };


    Country.prototype.MAX_HEXES = 100;
    Country.prototype.MIN_HEXES = 30;

    Country.prototype.owner = function() { return this._owner; };
    Country.prototype.hexes = function() { return this._hexes; };
    Country.prototype.isLake = function() { return this._isLake; };
    Country.prototype.adjacentCountries = function() { return this._adjacentCountries; };

    Country.prototype.color = function() { 
        if (this._overrideColor) {
            return this._overrideColor; 
        } else {
            return this._owner.color();
        }
    }

    Country.prototype.borderColor = function() {
        if (this == Game.selectedCountry()) {
            return "red";
        } else {
            return "black";
        }
    };


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




    // Once the map is setup, this function puts together the adjacency information the country
    // needs, both to paint itself and to know what is next door.
    // Marks hexes as internal or external. Also identifies which edges need border stroking for the hex.

    Country.prototype.setupEdges = function() {
        var self = this;

        this._adjacentCountries = [];
        var adjacentCountryHexes = {};  // Holds the first hex of adjacent countries, to avoid double-insertion.

        this._hexes.forEach(function(hex) {
            var countryEdges = [];
            for (var i = 0; i < Dir.array.length; i++) {
                var newHex = Dir.nextHex(hex, i);

                if (!newHex || newHex.country() != self) {
                    countryEdges.push(i);             
                }
                if (newHex && newHex.country() && newHex.country() != self && 
                    !adjacentCountryHexes[newHex.country().hexes()[0].num()]) {
                    adjacentCountryHexes[newHex.country().hexes()[0].num()] = true;
                    self._adjacentCountries.push(newHex.country());
                }

            }
            hex.setCountryEdgeDirections(countryEdges);
        });
    };


    Country.prototype.mouseEnter = function() {
        this._overrideColor = "black";
        this.paint();
    };


    Country.prototype.mouseLeave = function() {
        this._overrideColor = null;
        this.paint();
    };

    Country.prototype.click = function() {
        this.paint();
    };

    // Paints the country.
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
            Globals.context.strokeStyle = "black";
            Globals.context.lineWidth = 2;
            Globals.context.stroke(path);

            path = new Path2D();
            path.moveTo(ctr[0] - 4, ctr[1] + 4);
            path.lineTo(ctr[0] + 4, ctr[1] - 4);
            path.closePath();
            Globals.context.strokeStyle = "black";
            Globals.context.lineWidth = 2;
            Globals.context.stroke(path);
        }

        if (Globals.drawCountryConnections) {
            var ctr = this.center();
            this._adjacentCountries.forEach(function(country) {
                var otherCenter = country.center();
                var path = new Path2D();
                path.moveTo(ctr[0], ctr[1]);
                path.lineTo(otherCenter[0], otherCenter[1]);
                path.closePath();
                Globals.context.strokeStyle = "black";
                Globals.context.lineWidth = 1;
                Globals.context.stroke(path);
            });
        }
    };


});
