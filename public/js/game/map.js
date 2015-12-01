"use strict"

if (typeof module !== 'undefined' && module.exports){
	var Globals = require('../globals.js');
	var Dir = require('./dir.js');
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
		Globals.debug("adjacencyLst: " + JSON.stringify(this._adjacencyList), Globals.LEVEL.DEBUG, Globals.CHANNEL.MAP);
		return this._adjacencyList[countryId];
	},
	
	adjacencyList: function() {
		return this._adjacencyList;
	},
	
	serializeHexes: function() {
		// only save hexes which are assigned to countries
		return JSON.stringify(this._hexArray.filter(function(hex){
			return (hex.countryId() >= 0);
		}));
	},
	
	deserializeHexes: function(json) {
		var self = this;
		
		self._countryArray = [];
		self._hexArray = [];
		
		var temp = {};
		var hexes = JSON.parse(json);
		var hexMap = {};
		hexes.forEach(function(h) {
			if (h && h.hasOwnProperty('_id')) {
				hexMap[h._id] = h;
			}
		});
		
		for (var i = 0; i < Hex.TOTAL_HEXES; i++) {
			var hex;
			if (hexMap.hasOwnProperty(i)) {
				var h = hexMap[i];
				hex = new Hex(h._id, h._x, h._y, h._countryId, h._countryEdgeDirections);
			} else {
	        	hex = new Hex(i);
			}
			self._hexArray[i] = hex;
			
			if (hex.countryId() >= 0) {
				if (!temp[hex.countryId()]) {
					temp[hex.countryId()] = new Country(hex.countryId());
				}
				temp[hex.countryId()].hexes().push(hex.id());
			}
	    }
		
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
		
	generateMap: function(players) {
		var self = this;
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
	    Globals.debug("Created hexes ", JSON.stringify(this._hexArray), Globals.LEVEL.TRACE, Globals.CHANNEL.MAP);
		
		var country = new Country(this._countryArray.length);
		this._countryArray.push(country);
		Map.landGrab(this._hexArray[Math.floor(Math.random() * this._hexArray.length)], country);

		for (var i = 0; i < Globals.numCountries - 1; i++) {
			var countryStart = Math.floor(Math.random() * this._countryArray.length);
			var adjacentHex;

			for (var j = 0; j < this._countryArray.length; j++) {
				var country = this._countryArray[(j + countryStart) % this._countryArray.length];
				if (country.isLake()) {
					continue;
				}
				adjacentHex = Map.findAdjacentHex(country);
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
			Map.landGrab(adjacentHex, newCountry);
			if (newCountry.isLake()) {
				i--;
			}
		}

		Globals.debug("Created countries ", JSON.stringify(this._countryArray), Globals.LEVEL.INFO, Globals.CHANNEL.MAP);		

		// Finds all hexes which are alone and absorbs them into a nearby country. Do this because
		// they look kind of bad.
		self._hexArray.forEach(function(hex) {
	        if (!hex.hasCountry()) {
	            for (var i = 0; i < Dir.array.length; i++) {
	                var nextHex = Dir.nextHex(hex, Dir.array[i]);
	                if (!nextHex || !nextHex.hasCountry() || self.getCountry(nextHex.countryId()).isLake()) {
	                    return;
	                }
	            }
	            // If it got here, the hex is not on the edge and it has countries all around it.
	            Map.moveToAdjacentCountry(hex);
	        } 
	    });
		
		this.pruneLakes();
		//this.validate();
		Globals.debug("Map adjacency list: " + JSON.stringify(this._adjacencyList), Globals.LEVEL.DEBUG, Globals.CHANNEL.MAP)
	},
	
	// makes sure that the countries and hexes agree about who owns what
	validate: function() {
		var self = this;
		self._countryArray.forEach(function(country, idx) {
			Globals.ASSERT(country.id() == idx);
			var hexes = country.hexes();
			Globals.ASSERT(hexes.length);
			hexes.forEach(function(hexId) {
				Globals.ASSERT(self._hexArray[hexId]);
				if (self._hexArray[hexId].countryId() !== country.id()) {
					console.log("HexId " + hexId + " assigned to country " + self._hexArray[hexId].countryId() + 
							" should be assigned to " + country.id());
				}
			})
		});
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
	        Map.setCountryId(index, elem);
	        return elem;
	    });

	},
	
	assignCountries: function(players) {
		// Use a shuffled countries list to randomize who gets what.
		var self = this;
		var shuffledCountries = Globals.shuffleArray(this._countryArray);
		var currPlayer = 0;
		shuffledCountries.forEach(function(country) {
			players[currPlayer].addCountry(country);
			self.setupCountryEdges(country);
			currPlayer++;
			if (currPlayer >= players.length) {
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
		self._adjacencyList[country.id()] = [];
		
	    country.hexes().forEach(function(hexId) {
			var hex = Map.getHex(hexId);
	        var countryEdges = [];
	        for (var i = 0; i < Dir.array.length; i++) {
	            var newHex = Dir.nextHex(hex, i);
	            if (!newHex || newHex.countryId() != country.id()) {
	                countryEdges.push(i);             
	            }
	            if (newHex && newHex.countryId() >= 0 && newHex.countryId() != country.id() && 
	                !adjacentCountryHexes[newHex.countryId()]) {
					Globals.ASSERT(newHex.countryId() >= 0);
	                adjacentCountryHexes[newHex.countryId()] = true;
	                self._adjacencyList[country.id()].push(newHex.countryId());
	            } 
	        }
	        hex.setCountryEdgeDirections(countryEdges);
	    });
	},

	moveToAdjacentCountry: function(hex) {
		var self = this;
	    for (var i = 0; i < Dir.array.length; i++) {
	        var newHex = Dir.nextHex(hex, i);
	        if (newHex && newHex.hasCountry() && !Map.getCountry(newHex.countryId()).isLake()) {
	            var newCountry = Map.getCountry(newHex.countryId());
	            hex.setCountry(newCountry);
				Globals.ASSERT(self.getCountry(newCountry.id()));
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
	},
	
	// Find a hex that is adjacent to this country but is not occupied by this country.
	// This can be used to grow this country or to find a new place to start a country.
	findAdjacentHex: function(country) {

	    // Pick a starting hex randomly. Then iterate through until one is hopefully found.
	    // var startingHexPos = Math.floor(Math.random() * this._hexIds.length);
	    for (var i = 0; i < country._hexIds.length; i++) {
	        // Try to find a neighboring spot that works.
	        var hex = Math.floor(Math.random() * country._hexIds.length);

	        //Iterate over directions from the hex again randomly to see if one works.
	        for ( var j = 0; j < Dir.array.length; j++) {
	            var dir = Dir.array[Math.floor(Math.random() * Dir.array.length)];
	            var newHex = Dir.nextHex(Map.getHex(country._hexIds[hex]), dir);
	            if (newHex && newHex.countryId() == -1) {
	                return newHex;
	            }

	        }
	    }

	    return null;

	},
	
	growCountry: function(country) {
		var self = this;
	    if (country._hexIds.length >= country._numHexes) {
	        return;
	    }

	    var hex = Map.findAdjacentHex(country);

	    if (!hex) {
	        Globals.debug("Couldn't find a new spot for a hex!", Globals.LEVEL.TRACE, Globals.CHANNEL.COUNTRY);        
	        return;
	    }

	    hex.setCountry(country);
		Globals.ASSERT(self.getCountry(country.id()));
	    country._hexIds.push(hex.id());

		Globals.debug("growCountry", country, hex, Globals.LEVEL.TRACE, Globals.CHANNEL.COUNTRY);        

	    // Tail recursion to get the right number.
	    Map.growCountry(country);

	},
	
	landGrab: function(starthex, country) {
		var self = this;
		country._hexIds = [starthex.id()];
	    starthex.setCountry(country);
		Globals.ASSERT(self.getCountry(country.id()));
		country._numHexes = Math.floor(Math.random() * (Country.MAX_HEXES - Country.MIN_HEXES + 1)) + 
	        Country.MIN_HEXES;

		Map.growCountry(country);
		if (country._numHexes != country._hexIds.length) {
			// Mark it as a lake still so we can make enough countries. If it's a small lake,
			// let it get absorbed into another country. If it's a big lake, it will remain
			// and be pruned (in actual gameplay, all isLake() countries are gone)
			country._isLake = true;
			if (country._hexIds.length <= 5) {
				Map.absorbLake(country);
					return;
				} 
			}
	},
	
	
	// Absorbs a lake into an adjacent country.
	absorbLake: function(country) {
	    var newCountry = null;
	    country._hexIds.forEach(function(hexId) {
	        Map.moveToAdjacentCountry(Map.getHex(hexId));
	    })
	    country._hexIds = [];
	},
	
	setCountryId: function(id, country) {
		Globals.debug("Changine country id from "+ country._id + " to " + id, country, Globals.LEVEL.TRACE, Globals.CHANNEL.COUNTRY);
		country._id = id;
		if (Map.getCountry(id) != country) {
			Globals.debug("Country id set to value which doesn't match Map array", country, Globals.LEVEL.WARN, Globals.CHANNEL.COUNTRY);
		}
		country._hexIds.forEach(function(hexId) {
			Map.getHex(hexId).setCountry(country);
			Globals.ASSERT(Map.getCountry(country.id()));
		});
	}
};





if (typeof module !== 'undefined' && module.exports){
	module.exports = Map;
}