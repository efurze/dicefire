Player = function(id) {
	this._id = id;
	this._countries = [];
	this._storedDice = 0;
	this._numContiguousCountries = 0;		
};

Player.init = function(count) {

	if (count > Player.colors.length) {
		count = Player.colors.length;
	}

	Player._array = [];
	for (var i = 0; i < count; i++) {
		Player._array.push(new Player(i));
	}
	Globals.debug("Created players", Player._array);
};


Player.prototype.serialize = function() {
	var state = {
		id : this._id,
		countries : this._countries,
		storedDice : this._storedDice,
		numContiguousCountries : this._numContiguousCountries
	};
	
	return state;
};

Player.prototype.deserialize = function(state) {
	var player = new Player();
	player._id = state.id;
	player._countries = state.countries;
	player._storedDice = state.storedDice;
	player._numContiguousCountries = state.numContiguousCountries;
	
	return player;
}


Player.array = function() { return Player._array; };
Player.count = function() { return Player._array.length; };
Player.get = function(id) { return Player._array[id]; };

Player.randomPlayer = function() {
	return Player._array[Math.floor(Math.random() * Player._array.length)];
};

Player.rollDie = function() {
	return Math.floor(Math.random() * 6) + 1;
}

Player.rollDice = function(num) {
	var array = [];
	for (var i = 0; i < num; i++) {
		array.push(Player.rollDie());
	}
	return array;
}


//             var colorsel = ["red", "blue", "lightgreen", "forestgreen", "purple", "pink", "orange", "yellow"];

Player.colors = [
	"red",
	"blue",
	"green",
	"yellow",
	"orange",
	"purple",
	"brown",
	"tan"
];


Player.prototype.id = function() { return this._id; };
Player.prototype.color = function() { return Player.colors[this._id]; };
Player.prototype.hasLost = function() { return this._countries.length == 0; };
Player.prototype.storedDice = function() { return this._storedDice; };
Player.prototype.numContiguousCountries = function() { return this._numContiguousCountries; };




// Take ownership of a country.
Player.prototype.takeCountry = function(country) {
	var oldOwner = country.owner();
	if (oldOwner) {
 		oldOwner.loseCountry(country);
 	}
	country.setOwner(this);
	this._countries.push(country);
};

// Take away the country from this player.
Player.prototype.loseCountry = function(country) {
	this._countries = this._countries.filter(function(elem) {
		return elem != country;
	})
};

// Pick all the countries which have some space in them.
Player.prototype.countriesWithSpace = function() {
	return this._countries.filter(function(country) {
		return country.numDice() < Globals.maxDice;
	});
};

// Can the player attack this country from the country that's selected?
Player.prototype.canAttack = function(selectedCountry, country) {
	return selectedCountry.isConnected(country) && country.owner() != this;
};


// Update the information for this player.
Player.prototype.updateStatus = function() {
	var self = this;

	// Did this player lose?
	if (this.hasLost()) {
 		return;
	}


	var alreadySeen = {};
	var maxIslandSize = 0;

	var traverse = function(country) {
		if (alreadySeen[country.id()]) {
			return 0;
		}
		alreadySeen[country.id()] = true;
	
		return 1 + 
				country.adjacentCountries().reduce(function(total, adjacentCountry) {
					if (adjacentCountry.owner() == self) {
						total += traverse(adjacentCountry);
					}
					return total;
				}, 0);
	};

	this._countries.forEach(function(country) {
		islandSize = traverse(country);

		if (islandSize > maxIslandSize) {
			maxIslandSize = islandSize;
		}
	});

	this._numContiguousCountries = maxIslandSize;
};



