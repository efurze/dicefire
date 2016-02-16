/*jslint node: true */
/*jslint browser: true */

if (typeof module !== 'undefined' && module.exports) {
	var Globals = require('../globals.js');
	var Hex = require('./hex.js');
}

var Country = function(id) {
        this._id = id; 
        this._hexIds = [];
        this._ownerId = -1;
        
        this._numDice = 1;

		Globals.debug("Constructed country", this, Globals.LEVEL.TRACE, Globals.CHANNEL.COUNTRY);        
    };

Country.MAX_HEXES = 100;
Country.MIN_HEXES = 30;

Country.prototype.clone = function() {
	var newCopy = new Country(this._id);
	newCopy._hexIds = JSON.parse(JSON.stringify(this._hexIds));
	newCopy._ownerId = this._ownerId;
	newCopy._numDice = this._numDice;
	return newCopy;
};

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
};

Country.prototype.removeDie = function() {
	if (this._numDice > 1) {
    	this._numDice--;
	}
};




if (typeof module !== 'undefined' && module.exports){
	module.exports = Country;
}

