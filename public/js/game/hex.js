/*jslint browser: true*/
/*jslint node: true*/

if (typeof module !== 'undefined' && module.exports){
	var Globals = require('../globals.js');
}


var Hex = function(id, x, y, countryId, edgeDirections) {    
		this._id = id;
        this._x = this._id % Hex.NUM_WIDE;
        this._y = Math.floor(this._id / Hex.NUM_WIDE);
        this._countryId = -1;
        this._pruned = false;
        this._countryEdgeDirections = [];
		if (typeof x !== 'undefined') {
			this._x = x;
		}
		if (typeof y !== 'undefined') {
			this._y = y;
		}
		if (typeof countryId !== 'undefined') {
			this._countryId = countryId;
		}
		if (typeof edgeDirections !== 'undefined') {
			this._countryEdgeDirections = edgeDirections;
		}
		Globals.debug("Constructed hex", this, Globals.LEVEL.TRACE, Globals.CHANNEL.HEX);
    };


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


Hex.prototype.clone = function() { 
	var newCopy = new Hex(this._id, this._x, this._y, JSON.parse(JSON.stringify(this._countryEdgeDirections)));
	newCopy._countryId = this._countryId;
	return newCopy;
};
Hex.prototype.id = function() { return this._id; };
Hex.prototype.x = function() { return this._x; };
Hex.prototype.y = function() { return this._y; };
Hex.prototype.hasCountry = function() { return (this._countryId != -1); };

Hex.prototype.setCountry = function(country) { 
	Globals.debug("Set country for hex", this, country, Globals.LEVEL.TRACE, Globals.CHANNEL.HEX);
	this._countryId = country ? country._id : -1;
};

Hex.prototype.countryId = function() {return this._countryId;};

// The directions which are boundaries between this cell and another country or the edge of the board.
Hex.prototype.setCountryEdgeDirections = function(array) { 
	Globals.debug("Set countryEdgeDirections", this, array, Globals.LEVEL.TRACE, Globals.CHANNEL.HEX);
	this._countryEdgeDirections = array; 
};
Hex.prototype.countryEdgeDirections = function() { return this._countryEdgeDirections; };


Hex.prototype.isInterior = function() {
    return this._countryEdgeDirections.length === 0;
};

Hex.prototype.isExterior = function() {
    return this._countryEdgeDirections.length > 0;
};




Hex.prototype.center = function() {
    var pos = this.upperLeft();
    pos[0] += Math.floor(Hex.EDGE_LENGTH / 2);
    pos[1] += Math.floor(Hex.HEIGHT / 2);
    return pos;
};



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
};

if (typeof module !== 'undefined' && module.exports){
	module.exports = Hex;
}