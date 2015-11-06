Country = function(id) {
        this._id = id; 
        this._hexes = [];
        this._adjacentCountries = [];        
        this._owner = null;
        
        this._numDice = 1;
        this._isAttacking = false;

		Globals.debug("Constructed country", this, Globals.LEVEL.DEBUG, Globals.CHANNEL.COUNTRY);        
    };

Country.MAX_HEXES = 100;
Country.MIN_HEXES = 30;


Country.prototype.setId = function(id) {
	Globals.debug("Changine country id from "+ this._id + " to " + id, this, Globals.LEVEL.TRACE, Globals.CHANNEL.COUNTRY);
	var self = this;
	self._id = id;
	if (Map.getCountry(id) != self) {
		Globals.debug("Country id set to value which doesn't match Map array", this, Globals.LEVEL.WARN, Globals.CHANNEL.COUNTRY);
	}
	self._hexes.forEach(function(hex) {
		hex.setCountry(self);
	});
}

Country.prototype.serialize = function() {
	var state = {
		id : this._id,
		owner: this._owner,
		numDice: this._numDice
	};
	
	return state;
};

Country.deserialize = function(state) {
	var country = Map.getCountry(state.id);
	country._owner = state.owner;
	country._numDice = state.numDice;
	return country;
};

Country.prototype.landGrab = function(starthex) {
	this._hexes = [starthex];
    starthex.setCountry(this);
	this._numHexes = Math.floor(Math.random() * (Country.MAX_HEXES - Country.MIN_HEXES + 1)) + 
        Country.MIN_HEXES;

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
};

Country.prototype.addAdjacentCountry = function(country) {
	if (!country) {
		Globals.debug("tried to add NULL adjacent country", this, Globals.LEVEL.WARN, Globals.CHANNEL.COUNTRY);        
	} else {
		Globals.debug("adding adjacent country", this, country, Globals.LEVEL.DEBUG, Globals.CHANNEL.COUNTRY);        
	}
	this._adjacentCountries.push(country);
}

Country.prototype.setOwner = function(owner) { this._owner = owner;};
Country.prototype.setNumDice = function(num) { this._numDice = num;};
Country.prototype.setIsAttacking = function(isAttacking) { this._isAttacking = isAttacking;};

Country.prototype.id = function() { return this._id; };
Country.prototype.owner = function() { return this._owner; };
Country.prototype.hexes = function() { return this._hexes; };
Country.prototype.isLake = function() { return this._isLake; };
Country.prototype.adjacentCountries = function() { return this._adjacentCountries; };
Country.prototype.numDice = function() { return this._numDice; };


// Adds a die to the country.
Country.prototype.addDie = function() {
    this._numDice++;
}


Country.prototype.borderColor = function() {
    return this._isAttacking ? "red" : "black";
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
};


Country.prototype.isConnected = function(otherCountry) {
    for (var i = 0; i < this._adjacentCountries.length; i++) {
        if (this._adjacentCountries[i] == otherCountry) {
            return true;
        }
    }

    return false;
};


// Find a hex that is adjacent to this country but is not occupied by this country.
// This can be used to grow this country or to find a new place to start a country.
Country.prototype.findAdjacentHex = function() {
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
            if (newHex && !newHex.country()) {
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

    var hex = this.findAdjacentHex();

    if (!hex) {
        Globals.debug("Couldn't find a new spot for a hex!", Globals.LEVEL.TRACE, Globals.CHANNEL.COUNTRY);        
        return;
    }

    hex.setCountry(this);
    this._hexes.push(hex);

	Globals.debug("growCountry", this, hex, Globals.LEVEL.TRACE, Globals.CHANNEL.COUNTRY);        

    // Tail recursion to get the right number.
    this.growCountry();

};



// Absorbs a lake into an adjacent country.
Country.prototype.absorbLake = function() {
    var newCountry = null;
    this._hexes.forEach(function(hex) {
        Map.moveToAdjacentCountry(hex);
    })
    this._hexes = [];
};






