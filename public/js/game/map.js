"use strict"

if (typeof module !== 'undefined' && module.exports){
	var Globals = require('../globals.js');
	var Hex = require('./hex.js');
	var Country = require('./country.js');
}

var Map = {

	_hexArray: [],
	_countryArray: [],
	_adjacencyList: {}, // countryId: [neighborId, ...]
	
	getHex: function(id) {
		if (id < 0 || id >= this._hexArray.length) {
			return null;
		}
		if (this._hexArray[id] === null) {
			Globals.debug("Nonexistant hex requested", id, Globals.LEVEL.WARN, Globals.CHANNEL.MAP);
			return null;
		}
		
		return this._hexArray[id];
	},
	
	countryHexes: function(countryId) {
		var country = this.getCountry(countryId);
		if (country) {
			return country.hexes();
		} else {
			return [];
		}
	},
	
	getCountry: function(id) {
		if (id < 0 || id >= this._countryArray.length) {
			return null;
		}
		if (this._countryArray[id] === null) {
			Globals.debug("Nonexistant country requested", id, Globals.LEVEL.WARN, Globals.CHANNEL.MAP);
			return null;
		}
		
		return this._countryArray[id];
	},
	
	countryCount: function() {
		return this._countryArray.length;
	},
	
	adjacentCountries: function(countryId) {
		return this._adjacencyList[countryId];
	},
	
	adjacencyList: function() {
		return this._adjacencyList;
	},
	
	serializeHexes: function() {
		return JSON.stringify(this._hexArray);
	},
	
	deserializeHexes: function(json) {
		var self = this;
		
		self._countryArray = [];
		self._hexArray = [];
		
		var temp = {};
		var hexes = JSON.parse(json);
		self._hexArray.length = hexes.length;
		hexes.forEach(function(h) {
			var hex = new Hex(h._id, h._x, h._y, h._countryId, h._countryEdgeDirections);
			self._hexArray[hex.id()] = hex;
			if (hex.countryId() >= 0) {
				if (!temp[hex.countryId()]) {
					temp[hex.countryId()] = new Country(hex.countryId());
				}
				temp[hex.countryId()].hexes().push(hex.id());
			}
		});
		
		self._countryArray.length = Object.keys(temp).length;
		Object.keys(temp).forEach(function(id) {
			self._countryArray[id] = temp[id];
		});
		
		self._countryArray.forEach(function(country) {
			self.setupCountryEdges(country);
		});
	},
	
	getState: function() {
		var state = [];
		this._countryArray.forEach(function(country) {
			state.push(country.getState());
		});
		return state;
	},
	
	setState: function(gamestate) {
		var self = this;
		gamestate.countryIds().forEach(function(countryId) {
			self._countryArray[countryId].setState(gamestate, countryId);
		});
	},
		
	generateMap: function() {
		for (var i=0; i < this._countryArray.length; i++) {
			this._countryArray[i]._hexIds = [];
			delete this._countryArray[i];
		}
		for (var i=0; i < this._hexArray.length; i++) {
			delete this._hexArray[i];
		}
		this._adjacencyList = {};
		this._countryArray = [];
		this._hexArray = [];
		
	    for (var i = 0; i < Hex.TOTAL_HEXES; i++) {
	        this._hexArray.push(new Hex(i));
	    }
	    Globals.debug("Created hexes ", Hex._array, Globals.LEVEL.INFO, Globals.CHANNEL.MAP);
		
		var country = new Country(this._countryArray.length);
		this._countryArray.push(country);
		country.landGrab(this._hexArray[Math.floor(Math.random() * this._hexArray.length)]);
		

		for (var i = 0; i < Globals.numCountries - 1; i++) {
			var countryStart = Math.floor(Math.random() * this._countryArray.length);
			var adjacentHex;

			for (var j = 0; j < this._countryArray.length; j++) {
				var country = this._countryArray[(j + countryStart) % this._countryArray.length];
				if (country.isLake()) {
					continue;
				}
				adjacentHex = country.findAdjacentHex(true);
				if (adjacentHex) {
					break;
				}
			}
			if (!adjacentHex) {
				Globals.debug("RAN OUT OF SPACE! ", i, Globals.LEVEL.ERROR, Globals.CHANNEL.MAP);
				break;
			}
			var newCountry = new Country(this._countryArray.length);
			this._countryArray.push(newCountry);
			newCountry.landGrab(adjacentHex);
			if (newCountry.isLake()) {
				i--;
			}
		}

		Globals.debug("Created countries ", this._countryArray, Globals.LEVEL.INFO, Globals.CHANNEL.MAP);

		// Finds all hexes which are alone and absorbs them into a nearby country. Do this because
		// they look kind of bad.
		this._hexArray.forEach(function(hex) {
	        if (!hex.country()) {
	            for (var i = 0; i < Dir.array.length; i++) {
	                var nextHex = Dir.nextHex(hex, Dir.array[i]);
	                if (!nextHex || !nextHex.country() || nextHex.country().isLake()) {
	                    return;
	                }
	            }
	            // If it got here, the hex is not on the edge and it has countries all around it.
	            Map.moveToAdjacentCountry(hex);
	        } 
	    });
		
		this.pruneLakes();
		
		this.assignCountries();
	},
	
	isConnected: function(countryId1, countryId2) {
	    for (var i = 0; i < this._adjacencyList[countryId1].length; i++) {
	        if (this._adjacencyList[countryId1][i] == countryId2) {
	            return true;
	        }
	    }
	    return false;
	},
	
	// Removes lakes from the country list to simplify things.
	pruneLakes: function() {
	    this._countryArray = this._countryArray.filter(function(country) {
	        if (!country.isLake()) {
	            return true;
	        } else {
	            country.hexes().forEach(function(hexId) {
					var hex = Map.getHex(hexId);
	                hex.setCountry(null);
	                hex.setCountryEdgeDirections(null);
	            });
	            return false;
	        }
	    });
	    // Redo country ids to eliminate holes
	    this._countryArray = this._countryArray.map(function(elem, index) {
	        elem.setId(index);
	        return elem;
	    });

	},
	
	assignCountries: function() {
		// Use a shuffled countries list to randomize who gets what.
		var self = this;
		var shuffledCountries = Globals.shuffleArray(this._countryArray);
		var currPlayer = 0;
		shuffledCountries.forEach(function(country) {
			Player.get(currPlayer).addCountry(country);
			self.setupCountryEdges(country);
			currPlayer++;
			if (currPlayer >= Player.count()) {
				currPlayer = 0;
			}
		});
	},
	
	// Once the map is setup, this function puts together the adjacency information the country
	// needs, both to paint itself and to know what is next door.
	// Marks hexes as internal or external. Also identifies which edges need border stroking for the hex.

	setupCountryEdges: function(country) {
		var self = this;
	    var adjacentCountryHexes = {};  // Holds the first hex of adjacent countries, to avoid double-insertion.
		this._adjacencyList[country.id()] = [];
		
	    country.hexes().forEach(function(hexId) {
			var hex = Map.getHex(hexId);
	        var countryEdges = [];
	        for (var i = 0; i < Dir.array.length; i++) {
	            var newHex = Dir.nextHex(hex, i);

	            if (!newHex || newHex.country() != country) {
	                countryEdges.push(i);             
	            }
	            if (newHex && newHex.country() && newHex.country() != country && 
	                !adjacentCountryHexes[newHex.country().id()]) {
	                adjacentCountryHexes[newHex.country().id()] = true;
	                self._adjacencyList[country.id()].push(newHex.country().id());
	            }

	        }
	        hex.setCountryEdgeDirections(countryEdges);
	    });
	},

	moveToAdjacentCountry: function(hex) {
	    for (var i = 0; i < Dir.array.length; i++) {
	        var newHex = Dir.nextHex(hex, i);
	        if (newHex && newHex.country() && !newHex.country().isLake()) {
	            var newCountry = newHex.country();
	            hex.setCountry(newCountry);
	            newCountry.hexes().push(hex.id());                
	            return;
	        }
	    }
	    Globals.debug("Can't find an adjacent country", Globals.LEVEL.ERROR, Globals.CHANNEL.MAP);
	},
	
	countryCenter: function(countryId) {
	    var center = [0, 0];
		var hexIds = this.countryHexes(countryId);
	    hexIds.forEach(function(hexId) {
			var hex = Map.getHex(hexId);
	        var hexCenter = hex.center();
	        center[0] += hexCenter[0];
	        center[1] += hexCenter[1];            
	    })

	    center[0] /= hexIds.length;
	    center[1] /= hexIds.length;

	    return center;
	},
	
	fromMousePos: function(x, y) {
	    var oldX = x; var oldY = y;
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

	    // If it's beyond the left edge, just bail.
	    if (x >= total_width) {
	        return null;
	    }

	    var col = Math.floor((x / total_width) * (6 * Hex.NUM_WIDE));

	    var newCol = Math.floor(((x - Hex.EDGE_LENGTH / 2) / total_width) * Hex.NUM_WIDE);
	    var newRow = Math.floor(((y - Hex.HEIGHT / 2) / total_height) * Hex.NUM_HIGH);

	    var topLeftHex = newRow * (Hex.NUM_WIDE * 2) + newCol;
	    var topRightHex = topLeftHex + 1;
	    var bottomLeftHex = topLeftHex + (Hex.NUM_WIDE * 2);
	    var bottomRightHex = bottomLeftHex + 1;    
	    var middleMiddleHex = topLeftHex + Hex.NUM_WIDE;
	    var topMiddleHex = middleMiddleHex - (Hex.NUM_WIDE * 2);
	    var bottomMiddleHex = middleMiddleHex + (Hex.NUM_WIDE * 2); 

	    var nearbyHexes = [topLeftHex, topRightHex, bottomLeftHex, bottomRightHex, middleMiddleHex, topMiddleHex, bottomMiddleHex];
	    var closestDistanceSquared = Infinity;
	    var closestHex = null;

	    nearbyHexes.forEach(function(hexId) {
	        if (hexId >= 0 && hexId < Hex.TOTAL_HEXES) {
	            var hex = Map.getHex(hexId);
	            var center = hex.center();
	            var distanceSquared = Math.pow(center[0] - oldX, 2) + Math.pow(center[1] - oldY, 2);
	            if (distanceSquared < closestDistanceSquared) {
	                closestDistanceSquared = distanceSquared;
	                closestHex = hex;
	            }
	        }
	    });

	    return closestHex;
	}
};

if (typeof module !== 'undefined' && module.exports){
	module.exports = Map;
}