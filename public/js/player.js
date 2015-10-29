$(function() {

    window.Player = function(num) {
    	this._num = num;
    	this._countries = [];
    	this._storedDice = 0;
    	this._numContiguousCountries = 0;

    	$('#players').append(
    		"<div id='player" + num + "'><div id='colorblock" + num + "'></div>" + 
    		"<div id='dice" + num + "'>1</div>" +
    		"<div id='stored" + num + "'>0</div></div>"
    	);
    	
    	$('#player' + num).css(
    		{
    			'font-family': 'sans-serif',
    			'display': 'inline-block',
    			'margin': '10px',
    			'padding': '10px',
    			'width': '80px',
    			'height': '20px',
    			'border': '1px solid black'

    		}
    	);
    	
    	$('#colorblock' + num).css( 
	    	{
	    		'display': 'inline-block',
	    		'width': '20px',
	    		'height': '20px',
	    		'background-color': Player.colors[num]
	    	}
    	);

    	$('#dice' + num).css(
	    	{
				'display': 'inline-block',
				'margin-left': '12px',
				'margin-top': '2px',
				'vertical-align': 'top',
				'text-align': 'center'
	    	}
    	);

		$('#stored' + num).css(
	    	{
				'display': 'inline-block',
				'margin-left': '12px',
				'margin-top': '2px',
				'vertical-align': 'top',
				'text-align': 'center',
				'color': Player.colors[num]
	    	}
    	);    	

    };

    Player.init = function(count) {
    	$('#players').html('');

    	if (count > Player.colors.length) {
    		count = Player.colors.length;
    	}

    	Player._array = [];
    	for (var i = 0; i < count; i++) {
    		Player._array.push(new Player(i));
    	}
    };

    Player.array = function() { return Player._array; };

    Player.count = function() {
    	return Player._array.length;
    }

    Player.get = function(num) {
    	return Player._array[num];
    }

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


    Player.prototype.color = function() { return Player.colors[this._num]; };
    Player.prototype.hasLost = function() { return this._countries.length == 0; };

    // Give dice to this player. In all cases, the dice go to random
    // countries
    Player.prototype.addDice = function(num) {

    	// Make stored dice available for distribution.
    	num += this._storedDice;
    	this._storedDice = 0;

    	var countriesWithSpace;
    	for (var i = 0; i < num; i++) {
    		// Have to do this again and again because countries may fill up.
	    	countriesWithSpace = this.countriesWithSpace();
	    	if (countriesWithSpace.length == 0) {
	    		this._storedDice += num - i;
	    		if (this._storedDice > Globals.maxStoredDice) {
	    			this._storedDice = Globals.maxStoredDice;
	    		}
	    		break;
	    	}
	    	var country = countriesWithSpace[Math.floor(Math.random() * countriesWithSpace.length)];
    		country.addDie();
    		country.paint();
    	}
    };


    Player.prototype.startTurn = function() {
			$('#player' + this._num).css(
    		{
    			'border': '3px double'
    		}
    	);
    };

    Player.prototype.endTurn = function() {
    	if (!this.hasLost()) {
			$('#player' + this._num).css(
	    		{
	    			'border': '1px solid'
	    		}
	    	);
			this.addDice(this._numContiguousCountries);
			this.updateDisplay();
		}
    };

    // Do an attack.
    Player.prototype.attack = function(fromCountry, toCountry) {
    	if (fromCountry.owner() != this || toCountry.owner() == this) {
    		Globals.debug("Illegal attack");
    		return;    		
    	}

    	var fromNumDice = fromCountry.numDice();
    	var toNumDice = toCountry.numDice();
    	var fromRollArray = Player.rollDice(fromNumDice);
    	var toRollArray = Player.rollDice(toNumDice);

    	var fromRoll = fromRollArray.reduce(function(total, die) { return total + die; });
    	var toRoll = toRollArray.reduce(function(total, die) { return total + die; });

    	$('#roll').css({
			"display": "inline-block"
    	});

    	for (var i = 0; i < Globals.maxDice; i++) {
			$('#leftdie' + i).css({
				'display': (i < fromNumDice ? 'inline-block' : 'none'),
				'background-color': fromCountry.owner().color()
			});

			if (i < fromNumDice) {
				$('#leftdie' + i).html(fromRollArray[i]);
			}

			$('#rightdie' + i).css({
				'display': (i < toNumDice ? 'inline-block' : 'none'),
				'background-color': toCountry.owner().color()				
			});

			if (i < fromNumDice) {
				$('#rightdie' + i).html(toRollArray[i]);
			}

    	}


    	$('#lefttotal').html(fromRoll);
    	$('#righttotal').html(toRoll);

    	// Note that ties go to the toCountry. And, no matter what happens, the fromCountry
    	// goes down to 1 die.
    	fromCountry.setNumDice(1);
    	if (fromRoll > toRoll) {
    		var oldOwner = toCountry.owner();
    		toCountry.setNumDice(fromNumDice - 1);
    		this.takeCountry(toCountry);
    		oldOwner.updateDisplay();
    	}

    	this.updateDisplay();
    }


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
    Player.prototype.updateDisplay = function() {
    	var self = this;

    	// Did this player lose?
    	if (this.hasLost()) {
    		$('#player' + this._num).css(
	    		{
	    			'display': 'none'
	    		}
	    	);
	    	return;
    	}


    	var alreadySeen = {};
    	var maxIslandSize = 0;

		var traverse = function(country) {
			if (alreadySeen[country.hexes()[0].num()]) {
				return 0;
			}
			alreadySeen[country.hexes()[0].num()] = true;
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
    	$('#dice' + this._num).html(maxIslandSize);
    	$('#stored' + this._num).html(this._storedDice);
    };

});

