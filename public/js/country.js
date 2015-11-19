"use strict"

var Country = function(id) {
        this._id = id; 
        this._hexIds = [];
        this._ownerId = -1;
        
        this._numDice = 1;

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
	self._hexIds.forEach(function(hexId) {
		Map.getHex(hexId).setCountry(self);
	});
}

Country.prototype.getState = function() {
	var state = {
		id : this._id,
		owner: this._ownerId,
		numDice: this.numDice()
	};
	
	return state;
};

Country.prototype.setState = function(gamestate, id) {
	this._ownerId = gamestate.countryOwner(id);
	this.setNumDice(gamestate.countryDice(id));
};


Country.prototype.landGrab = function(starthex) {
	this._hexIds = [starthex.id()];
    starthex.setCountry(this);
	this._numHexes = Math.floor(Math.random() * (Country.MAX_HEXES - Country.MIN_HEXES + 1)) + 
        Country.MIN_HEXES;

	this.growCountry();
	if (this._numHexes != this._hexIds.length) {
		// Mark it as a lake still so we can make enough countries. If it's a small lake,
		// let it get absorbed into another country. If it's a big lake, it will remain
		// and be pruned (in actual gameplay, all isLake() countries are gone)
		this._isLake = true;
		if (this._hexIds.length <= 5) {
			this.absorbLake();
				return;
			} 
		}
};


Country.prototype.setOwner = function(ownerId) { 
	Globals.ASSERT(typeof ownerId !== 'object');
	this._ownerId = ownerId;
};
Country.prototype.setNumDice = function(num) { 
	Globals.ASSERT(num > 0 && num <= 8);
	this._numDice = num;
};

Country.prototype.id = function() { return this._id; };
Country.prototype.ownerId = function() { return this._ownerId; };
Country.prototype.hexes = function() { return this._hexIds; };
Country.prototype.isLake = function() { return this._isLake; };
Country.prototype.numDice = function() { return this._numDice; };


// Adds a die to the country.
Country.prototype.addDie = function() {
	if (this._numDice < 8) {
    	this._numDice++;
	}
}





// Find a hex that is adjacent to this country but is not occupied by this country.
// This can be used to grow this country or to find a new place to start a country.
Country.prototype.findAdjacentHex = function() {
    var self = this;

    // Pick a starting hex randomly. Then iterate through until one is hopefully found.
    // var startingHexPos = Math.floor(Math.random() * this._hexIds.length);
    for (var i = 0; i < this._hexIds.length; i++) {
        // Try to find a neighboring spot that works.
        var hex = Math.floor(Math.random() * this._hexIds.length);

        //Iterate over directions from the hex again randomly to see if one works.
        for ( var j = 0; j < Dir.array.length; j++) {
            var dir = Dir.array[Math.floor(Math.random() * Dir.array.length)];
            var newHex = Dir.nextHex(Map.getHex(this._hexIds[hex]), dir);
            if (newHex && !newHex.country()) {
                return newHex;
            }

        }
    }

    return null;

};

Country.prototype.growCountry = function() {
    if (this._hexIds.length >= this._numHexes) {
        return;
    }

    var hex = this.findAdjacentHex();

    if (!hex) {
        Globals.debug("Couldn't find a new spot for a hex!", Globals.LEVEL.TRACE, Globals.CHANNEL.COUNTRY);        
        return;
    }

    hex.setCountry(this);
    this._hexIds.push(hex.id());

	Globals.debug("growCountry", this, hex, Globals.LEVEL.TRACE, Globals.CHANNEL.COUNTRY);        

    // Tail recursion to get the right number.
    this.growCountry();

};



// Absorbs a lake into an adjacent country.
Country.prototype.absorbLake = function() {
    var newCountry = null;
    this._hexIds.forEach(function(hexId) {
        Map.moveToAdjacentCountry(Map.getHex(hexId));
    })
    this._hexIds = [];
};



