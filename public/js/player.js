$(function() {

    window.Player = function(num) {
    	this._num = num;
    	this._countries = [];
    	this._storedDice = 0;
    	this._numContinguousCountries = 0;

    	$('#players').append(
    		"<div id='player" + num + "'><div id='colorblock" + num + "'></div>" + 
    		"<div id='dice" + num + "'>1</div></div>"
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
				'margin-left': '25px',
				'margin-top': '2px',
				'vertical-align': 'top'
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
    	var total = 0;
    	for (var i = 0; i < num; i++) {
    		total += Player.rollDie();
    	}
    	return total;
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

    // Give dice to this player. If num is set, then that is the number. Otherwise, give them 
    // based on number of adjacent countries each player has. In all cases, the dice go to random
    // countries
    Player.prototype.addDice = function(num) {
    	if (!num) {
    		// num = GET THE NUMBER OF ADJACENT COUNTRIES THIS GUY HAS
    	}

    	// Make stored dice available for distribution.
    	num += this._storedDice;
    	this._storedDice = 0;

    	var countriesWithSpace;
    	for (var i = 0; i < num; i++) {
    		// Have to do this again and again because countries may fill up.
	    	countriesWithSpace = this.countriesWithSpace();
	    	if (countriesWithSpace.length == 0) {
	    		this._storedDice += num - i;
	    		break;
	    	}
    		countriesWithSpace[Math.floor(Math.random() * countriesWithSpace.length)].addDie();
    	}
    };


    // Do an attack.
    Player.prototype.attack = function(fromCountry, toCountry) {
    	if (fromCountry.owner() != this || toCountry.owner() == this) {
    		Globals.debug("Illegal attack");
    		return;    		
    	}

    	var fromNumDice = fromCountry.numDice();
    	var fromRoll = Player.rollDice(fromNumDice);
    	var toRoll = Player.rollDice(toCountry.numDice());

    	$('#roll').html(fromRoll + ' - ' + toRoll);

    	// Note that ties go to the toCountry. And, no matter what happens, the fromCountry
    	// goes down to 1 die.
    	fromCountry.setNumDice(1);
    	if (fromRoll > toRoll) {
    		toCountry.setNumDice(fromNumDice - 1);
    		this.takeCountry(toCountry);
    	}

    	this.updateDisplay();
    }


    // Take ownership of a country.
    Player.prototype.takeCountry = function(country) {
    	country.setOwner(this);
    	this._countries.push(country);
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

    	$('#dice' + this._num).html(maxIslandSize);
    };

});

