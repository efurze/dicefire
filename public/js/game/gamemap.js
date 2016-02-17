/*jslint browser: true*/
/*jslint node: true*/
if (typeof module !== 'undefined' && module.exports){
	var Globals = require('../globals.js');
	var Dir = require('./dir.js');
	var Hex = require('./hex.js');
	var Country = require('./country.js');
}

var GameMap = function() {
	this._hexArray = [];
	this._countryArray = [];
	this._adjacencyList = {}; // countryId: [neighborId, ...]
};

GameMap.prototype.clone = function() {
	var newCopy = new GameMap();
	newCopy._hexArray = this._hexArray.map(function(h){return h.clone();});
	newCopy._countryArray = this._hexArray.map(function(c){return c.clone();});
	newCopy._adjacencyList = JSON.parse(JSON.stringify(this._adjacencyList));
	return newCopy;
};


GameMap.prototype.getHex = function(id) {
	if (id < 0 || id >= this._hexArray.length) {
		return null;
	}
	if (this._hexArray[id] === null) {
		Globals.debug("Nonexistant hex requested", id, Globals.LEVEL.WARN, Globals.CHANNEL.MAP);
		return null;
	}
	
	return this._hexArray[id];
};

GameMap.prototype.countryHexes = function(countryId) {
	var country = this.getCountry(countryId);
	if (country) {
		return country.hexes();
	} else {
		return [];
	}
};

GameMap.prototype.getCountry = function(id) {
	if (id < 0 || id >= this._countryArray.length) {
		return null;
	}
	if (this._countryArray[id] === null) {
		Globals.debug("Nonexistant country requested", id, Globals.LEVEL.WARN, Globals.CHANNEL.MAP);
		return null;
	}
	
	return this._countryArray[id];
};

GameMap.prototype.countryCount = function() {
	return this._countryArray.length;
};

GameMap.prototype.adjacentCountries = function(countryId) {
	return this._adjacencyList[countryId];
};

GameMap.prototype.adjacencyList = function() {
	return this._adjacencyList;
};

GameMap.prototype.serializeHexes = function() {
	// only save hexes which are assigned to countries
	return JSON.stringify(this._hexArray.filter(function(hex){
		return (hex.countryId() >= 0);
	}));
};

GameMap.prototype.deserializeHexes = function(json) {
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
};

GameMap.prototype.getState = function() {
	var state = [];
	this._countryArray.forEach(function(country) {
		state.push(country.getState());
	});
	return state;
};

GameMap.prototype.setState = function(gamestate) {
	var self = this;
	gamestate.countryIds().forEach(function(countryId) {
		self._countryArray[countryId].setState(gamestate, countryId);
	});
};
	
GameMap.prototype.generateMap = function(players) {
	var self = this;
	for (var i=0; i < this._countryArray.length; i++) {
		this._countryArray[i]._hexIds = [];
		delete this._countryArray[i];
	}
	for (i=0; i < this._hexArray.length; i++) {
		delete this._hexArray[i];
	}
	this._adjacencyList = {};
	this._countryArray = [];
	this._hexArray = [];
	
    for (i = 0; i < Hex.TOTAL_HEXES; i++) {
        this._hexArray.push(new Hex(i));
    }
    Globals.debug("Created hexes ", JSON.stringify(this._hexArray), Globals.LEVEL.TRACE, Globals.CHANNEL.MAP);
	
    this.pruneEdges();

	var country = new Country(this._countryArray.length);
	this._countryArray.push(country);
	var startHex = null;
	while(!startHex || startHex._pruned) {
		startHex = this._hexArray[Math.floor(Math.random() * this._hexArray.length)];
	}
	this.landGrab(startHex, country);

	for (i = 0; i < Globals.numCountries - 1; i++) {
		var countryStart = Math.floor(Math.random() * this._countryArray.length);
		var adjacentHex;

		for (var j = 0; j < this._countryArray.length; j++) {
			country = this._countryArray[(j + countryStart) % this._countryArray.length];
			if (country.isLake()) {
				continue;
			}
			adjacentHex = self.findAdjacentHex(country);
			if (adjacentHex) {
				break;
			}
		}
		if (!adjacentHex) {
			Globals.debug("RAN OUT OF SPACE! ", i, "recursing", Globals.LEVEL.WARN, Globals.CHANNEL.MAP);
			// this happens pretty rarely. just try again.
			return self.generateMap(players);
		}
		var newCountry = new Country(this._countryArray.length);
		this._countryArray.push(newCountry);
		this.landGrab(adjacentHex, newCountry);
		if (newCountry.isLake()) {
			i--;
		}
	}

	Globals.debug("Created countries ", JSON.stringify(this._countryArray), Globals.LEVEL.TRACE, Globals.CHANNEL.MAP);		

	// Finds all hexes which are alone and absorbs them into a nearby country. Do this because
	// they look kind of bad.
	self._hexArray.forEach(function(hex) {
        if (!hex.hasCountry()) {
            for (var i = 0; i < Dir.array.length; i++) {
                var nextHex = Dir.nextHex(hex, Dir.array[i], self);
                if (!nextHex || !nextHex.hasCountry() || self.getCountry(nextHex.countryId()).isLake()) {
                    return;
                }
            }
            // If it got here, the hex is not on the edge and it has countries all around it.
            self.moveToAdjacentCountry(hex);
        } 
    });
	
	this.pruneLakes();
	//this.validate();
	Globals.debug("Map adjacency list: " + JSON.stringify(this._adjacencyList), Globals.LEVEL.TRACE, Globals.CHANNEL.MAP);
};



// this is designed to make the map more interesting. The idea is to prune out big chunks of real estate
// before putting the countries down.
GameMap.prototype.pruneEdges = function() {
	var width = Hex.NUM_WIDE, height = Hex.NUM_HIGH;
	// top row
	this.makeBlob(Math.floor(width/4 + (Math.random() * width/2)), 0, 100 + Math.floor(Math.random() * 200));

	// bottom row
	this.makeBlob(Math.floor(width/4 + (Math.random() * width/2)), height-1, 100 + Math.floor(Math.random() * 200));

	// left
	this.makeBlob(0, Math.floor(Math.random() * height), 100 + Math.floor(Math.random() * 200));
	
	// right
	this.makeBlob(width-1, Math.floor(Math.random() * height), 100 + Math.floor(Math.random() * 200));
};

GameMap.prototype.findAdjacentUnpruned = function(hexes) {
	var self = this;
	var startIdx = Math.floor(Math.random() * hexes.length); 
    for (var i = 0; i < hexes.length; i++) {
        
        var hex = hexes[(startIdx + i) % hexes.length];

        //Iterate over directions from the hex again randomly to see if one works.
        var startDir = Math.floor(Math.random() * Dir.array.length);
        for ( var j = 0; j < Dir.array.length; j++) {
            var dir = Dir.array[(startDir + j) % Dir.array.length];
            var newHex = Dir.nextHex(hex, dir, self);
            if (newHex && !newHex._pruned) {
                return newHex;
            }
        }
    }

    return null;

};

GameMap.prototype.makeBlob = function(startX, startY, size) {
	var self = this;
	var hexes = [];
	var boundaryX = Hex.NUM_WIDE/2;
	var boundaryY = Hex.NUM_HIGH/2;
	var thisBlob = {};

	hexes.push(self._hexArray[(startY * Hex.NUM_WIDE) + startX]);
	hexes[0]._pruned = true;
	thisBlob[hexes[0].id()] = true;
	var count = 1, 
		tries=0; // this is just to make sure we don't get stuck in a corner or something

	while (count < size && tries < size*2) {
		tries++;
		var next = self.findAdjacentUnpruned(hexes);
		if (!next) { continue; }

		if (startY < boundaryY && next.y() >= boundaryY) {
			continue;
		} else if (startY >= boundaryY && next.y() <= boundaryY) {
			continue;
		} else if (startX < boundaryX && next.x() >= boundaryX) {
			continue;
		} else if (startX >= boundaryX && next.x() <= boundaryX) {
			continue;
		}

		var tooClose = false;
		for ( var j = 0; j < Dir.array.length; j++) {
            var neighbor = Dir.nextHex(next, Dir.array[j], self);
            if (neighbor && neighbor._pruned && !thisBlob[neighbor.id()]) {
            	tooClose = true;
            	break;
            }
		}

		if (!tooClose) {
			count ++;
			next._pruned = true;
			thisBlob[next.id()] = true;
			hexes.push(next);
		}
	}

};

GameMap.prototype.oldpruneEdges = function() {
	var self = this;

	// map borders are:
	// top row: hex.id < Hex.NUM_WIDE
	// left column: multiples of Hex.NUM_WIDE
	// right column: (multiples of Hex.NUM_WIDE) - 1
	// bottom row: (TOTAL_HEXES - NUM_WIDE) to TOTAL_HEXES

	var rows = {
		TOP: 0,
		RIGHT: 1,
		BOTTOM: 2,
		LEFT: 3
	};

	var numPruned = 0;
	while (numPruned < 1200) {
		// pick an edge
		var edge = rows.BOTTOM;//Math.round(Math.random() * 3);
		var x = 0, y = 0;
		var id = 0;
		if (edge == rows.TOP) {
			y = 0;
			x = Math.floor(Math.random() * Hex.NUM_WIDE);
			id = (y * Hex.NUM_WIDE) + x;
			while (self._hexArray[id]._pruned && y < Hex.NUM_HIGH/2) {
				y++;
				id = (y * Hex.NUM_WIDE) + x;
			}

			if (y < Hex.NUM_HIGH/2) {
				self._hexArray[id]._pruned = true;
				numPruned++;
			}

		} else if (edge == rows.RIGHT) {
			x = Hex.NUM_WIDE - 1;
			y = Math.floor(Math.random() * Hex.NUM_HIGH);
			id = (y * Hex.NUM_WIDE) + x;
			while (self._hexArray[id]._pruned && x > Hex.NUM_WIDE/2) {
				x--;
				id = (y * Hex.NUM_WIDE) + x;
			}

			if (x > Hex.NUM_WIDE/2) {
				self._hexArray[id]._pruned = true;
				numPruned++;
			}

		} else if (edge == rows.BOTTOM) {
			y = Hex.NUM_HIGH - 1;
			x = Math.floor(Math.random() * Hex.NUM_WIDE);
			id = (y * Hex.NUM_WIDE) + x;
			while (self._hexArray[id]._pruned && y > Hex.NUM_HIGH/2) {
				y--;
				id = (y * Hex.NUM_WIDE) + x;
			}

			if (y > Hex.NUM_HIGH/2) {
				self._hexArray[id]._pruned = true;
				numPruned++;
			}

		} else if (edge == rows.LEFT) {
			x = 0;
			y = Math.floor(Math.random() * Hex.NUM_HIGH);
			id = (y * Hex.NUM_WIDE) + x;
			while (self._hexArray[id]._pruned && x < Hex.NUM_WIDE/2) {
				x++;
				id = (y * Hex.NUM_WIDE) + x;
			}

			if (x < Hex.NUM_WIDE/2) {
				self._hexArray[id]._pruned = true;
				numPruned++;
			}
		}
	}
};

// makes sure that the countries and hexes agree about who owns what
GameMap.prototype.validate = function() {
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
		});
	});
};

GameMap.prototype.isConnected = function(countryId1, countryId2) {
    for (var i = 0; i < this._adjacencyList[countryId1].length; i++) {
        if (this._adjacencyList[countryId1][i] == countryId2) {
            return true;
        }
    }
    return false;
};

// Removes lakes from the country list to simplify things.
GameMap.prototype.pruneLakes = function() {
	var self = this;
    this._countryArray = this._countryArray.filter(function(country) {
        if (!country.isLake()) {
            return true;
        } else {
            country.hexes().forEach(function(hexId) {
				var hex = self.getHex(hexId);
                hex.setCountry(null);
                hex.setCountryEdgeDirections(null);
            });
            return false;
        }
    });
    // Redo country ids to eliminate holes
    this._countryArray = this._countryArray.map(function(elem, index) {
        self.setCountryId(index, elem);
        return elem;
    });
};

GameMap.prototype.assignCountries = function(players) {
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
};

// Once the map is setup, this function puts together the adjacency information the country
// needs, both to paint itself and to know what is next door.
// Marks hexes as internal or external. Also identifies which edges need border stroking for the hex.
GameMap.prototype.setupCountryEdges = function(country) {
	var self = this;
    var adjacentCountryHexes = {};  // Holds the first hex of adjacent countries, to avoid double-insertion.
	self._adjacencyList[country.id()] = [];
	
    country.hexes().forEach(function(hexId) {
		var hex = self.getHex(hexId);
        var countryEdges = [];
        for (var i = 0; i < Dir.array.length; i++) {
            var newHex = Dir.nextHex(hex, i, self);
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
};

GameMap.prototype.moveToAdjacentCountry = function(hex) {
	var self = this;
    for (var i = 0; i < Dir.array.length; i++) {
        var newHex = Dir.nextHex(hex, i, self);
        if (newHex && newHex.hasCountry() && !self.getCountry(newHex.countryId()).isLake()) {
            var newCountry = self.getCountry(newHex.countryId());
            hex.setCountry(newCountry);
			Globals.ASSERT(self.getCountry(newCountry.id()));
            newCountry.hexes().push(hex.id());                
            return;
        }
    }
    Globals.debug("Can't find an adjacent country", Globals.LEVEL.ERROR, Globals.CHANNEL.MAP);
};

GameMap.prototype.countryCenter = function(countryId) {
	var self = this;
    var center = [0, 0];
	var hexIds = this.countryHexes(countryId);
    hexIds.forEach(function(hexId) {
		var hex = self.getHex(hexId);
        var hexCenter = hex.center();
        center[0] += hexCenter[0];
        center[1] += hexCenter[1];            
    });

    center[0] /= hexIds.length;
    center[1] /= hexIds.length;

    return center;
};

GameMap.prototype.fromMousePos = function(x, y) {
	var self = this;
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
            var hex = self.getHex(hexId);
            var center = hex.center();
            var distanceSquared = Math.pow(center[0] - oldX, 2) + Math.pow(center[1] - oldY, 2);
            if (distanceSquared < closestDistanceSquared) {
                closestDistanceSquared = distanceSquared;
                closestHex = hex;
            }
        }
    });

    return closestHex;
};

// Find a hex that is adjacent to this country but is not occupied by this country.
// This can be used to grow this country or to find a new place to start a country.
GameMap.prototype.findAdjacentHex = function(country) {
	var self = this;
    // Pick a starting hex randomly. Then iterate through until one is hopefully found.
    // var startingHexPos = Math.floor(Math.random() * this._hexIds.length);
    for (var i = 0; i < country._hexIds.length; i++) {
        // Try to find a neighboring spot that works.
        var hex = Math.floor(Math.random() * country._hexIds.length);

        //Iterate over directions from the hex again randomly to see if one works.
        for ( var j = 0; j < Dir.array.length; j++) {
            var dir = Dir.array[Math.floor(Math.random() * Dir.array.length)];
            var newHex = Dir.nextHex(self.getHex(country._hexIds[hex]), dir, self);
            if (newHex && newHex.countryId() == -1 && !newHex._pruned) {
                return newHex;
            }

        }
    }

    return null;

};

GameMap.prototype.growCountry = function(country) {
	var self = this;
    if (country._hexIds.length >= country._numHexes) {
        return;
    }

    var hex = self.findAdjacentHex(country);

    if (!hex) {
        Globals.debug("Couldn't find a new spot for a hex!", Globals.LEVEL.TRACE, Globals.CHANNEL.COUNTRY);        
        return;
    }

    hex.setCountry(country);
	Globals.ASSERT(self.getCountry(country.id()));
    country._hexIds.push(hex.id());

	Globals.debug("growCountry", country, hex, Globals.LEVEL.TRACE, Globals.CHANNEL.COUNTRY);        

    // Tail recursion to get the right number.
    self.growCountry(country);

};

GameMap.prototype.landGrab = function(starthex, country) {
	var self = this;
	country._hexIds = [starthex.id()];
    starthex.setCountry(country);
	Globals.ASSERT(self.getCountry(country.id()));
	country._numHexes = Math.floor(Math.random() * (Country.MAX_HEXES - Country.MIN_HEXES + 1)) + 
        Country.MIN_HEXES;

	self.growCountry(country);
	if (country._numHexes != country._hexIds.length) {
		// Mark it as a lake still so we can make enough countries. If it's a small lake,
		// let it get absorbed into another country. If it's a big lake, it will remain
		// and be pruned (in actual gameplay, all isLake() countries are gone)
		country._isLake = true;
		if (country._hexIds.length <= 5) {
			self.absorbLake(country);
				return;
			} 
		}
};


// Absorbs a lake into an adjacent country.
GameMap.prototype.absorbLake = function(country) {
	var self = this;
    var newCountry = null;
    country._hexIds.forEach(function(hexId) {
        self.moveToAdjacentCountry(self.getHex(hexId));
    });
    country._hexIds = [];
};

GameMap.prototype.setCountryId = function(id, country) {
	Globals.debug("Changine country id from "+ country._id + " to " + id, country, Globals.LEVEL.TRACE, Globals.CHANNEL.COUNTRY);
	var self = this;
	country._id = id;
	if (self.getCountry(id) != country) {
		Globals.debug("Country id set to value which doesn't match Map array", country, Globals.LEVEL.WARN, Globals.CHANNEL.COUNTRY);
	}
	country._hexIds.forEach(function(hexId) {
		self.getHex(hexId).setCountry(country);
		Globals.ASSERT(self.getCountry(country.id()));
	});
};





if (typeof module !== 'undefined' && module.exports){
	module.exports = Map;
}