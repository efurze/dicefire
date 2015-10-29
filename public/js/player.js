$(function() {

    window.Player = function(color) {
    	this._color = color;
    	this._countries = [];
    	this._storedDice = 0;
    };

    Player.init = function(count) {
    	if (count > Player.colors.length) {
    		count = Player.colors.length;
    	}

    	Player._array = [];
    	for (var i = 0; i < count; i++) {
    		Player._array.push(new Player(Player.colors[i]));
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


    Player.prototype.color = function() { return this._color; };

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


    // Take ownership of a country.
    Player.prototype.takeCountry = function(country) {
    	country.setOwner(this);
    	this._countries.push(country);
    };

    // Pick all the countries which have some space in them.
    Player.prototype.countriesWithSpace = function() {
    	return this._countries.filter(function(country) {
    		return country.numDice() < Globals.maxDice;
    	})
    };
});

