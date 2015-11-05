Map = {

	_hexArray: [],
	
	getHex: function(id) {
		return this._hexArray[id];
	},
	
	generateMap: function() {
		
		this._hexArray = [];
	    for (var i = 0; i < Hex.TOTAL_HEXES; i++) {
	        this._hexArray.push(new Hex(i));
	    }
	    Globals.debug("Created hexes", Hex._array);
		
		var country = new Country(this._hexArray[Math.floor(Math.random() * this._hexArray.length)]);

		for (var i = 0; i < Globals.numCountries - 1; i++) {
			var countryStart = Math.floor(Math.random() * Country.count());
			var adjacentHex;

			for (var j = 0; j < Country.count(); j++) {
				var country = Country.get((j + countryStart) % Country.count());
				if (country.isLake()) {
					continue;
				}
				adjacentHex = country.findAdjacentHex(true);
				if (adjacentHex) {
					break;
				}
			}
			if (!adjacentHex) {
				Globals.debug("RAN OUT OF SPACE!", i);
				break;
			}
			var newCountry = new Country(adjacentHex);
			if (newCountry.isLake()) {
				i--;
			}
		}

		Globals.debug("Created countries", Country.array());

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
		
		Country.pruneLakes();
		
		return country;
	},

	moveToAdjacentCountry: function(hex) {
	    for (var i = 0; i < Dir.array.length; i++) {
	        var newHex = Dir.nextHex(hex, i);
	        if (newHex && newHex.country() && !newHex.country().isLake()) {
	            var newCountry = newHex.country();
	            hex.setCountry(newCountry);
	            newCountry._hexes.push(hex);                
	            return;
	        }
	    }
	    Globals.debug("Can't find an adjacent country");
	},
	
	fromMousePos: function(x, y) {
	    var oldX = x; oldY = y;
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