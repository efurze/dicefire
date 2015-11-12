google.setOnLoadCallback(drawChart);

// USAGE: odds[attacking-1, defending-1] gives the odds that the attacker wins
var odds = [
	[ 0.4098, 0.0603, 0.0047, 0, 0, 0, 0, 0 ], // 1 dice attacking
	[ 0.8643, 0.4368, 0.1184, 0.0182, 0.0024, 0.0002, 0, 0 ], // 2 dice attacking
	[ 0.9874, 0.8094, 0.4479, 0.1604, 0.0345, 0.007, 0.0005, 0.0004 ], // 3 dice attacking
	[ 0.9995, 0.9612, 0.7708, 0.4578, 0.1941, 0.0575, 0.0128, 0.0024 ], // 4 attacking
	[ 1, 0.9944, 0.9395, 0.7359, 0.4591, 0.2107, 0.0714, 0.0212 ], // 5 attacking
	[ 1, 0.9997, 0.9877, 0.9129, 0.7275, 0.4626, 0.233, 0.0923 ], // 6 attacking
	[ 1, 1, 0.9987, 0.9772, 0.8913, 0.7131, 0.4652, 0.2514 ], // 7 attacking
	[ 1, 1, 0.9998, 0.9967, 0.9681, 0.8787, 0.6909, 0.466 ] // 8 attacking
];

var Player = function(countryCount, density, reserves) {
	this.countries = [];
	this.countries.length = countryCount;
	//this.countries.map(function(){return density;});
	for (var i=0; i < countryCount; i++) {
		this.countries[i] = density;
	}
	this.reserves = reserves;
};

Player.prototype.endTurn = function() {
	this.reserves += this.countries.length;
	this.reserves = Math.min(this.reserves, 64);
	
	while (this.reserves > 0 && !this.isMaxed()) {
		for (var i=0; i < this.countries.length; i++) {
			if (this.countries[i] < 8) {
				this.reserves --;
				this.countries[i]++;
			}
		}
	}
};

Player.prototype.isMaxed = function() {
	var total = this.countries.reduce(function(total, count) { return total + count; });
	return (total == (this.countries.length * 8));
};

Player.prototype.win = function() {
	this.countries.unshift(this.countries[0] - 1);
	this.countries[1] = 1;
};

Player.prototype.lose = function(isAttacker) {
	if (isAttacker) {
		this.countries[0] = 1;
	} else {
		this.countries.shift();
	}
};

var INITIAL_DENSITY = 8; // 8 dice per territory
var MAX_RESERVES = 64;

var calculateOdds = function(p1InitialTerritories, p2InitialTerritories, initialDensity1, initialDensity2) {
	
	//console.log("beginning simulation for", p1InitialTerritories, p2InitialTerritories, initialDensity);
	
	var p1Wins = 0;
	var trials = 500;
	
	for (var i=0; i < trials; i++) {
		if (simulateBattle(p1InitialTerritories, p2InitialTerritories, initialDensity1, initialDensity2)) {
			p1Wins ++;
		}
	}
	
	var percentage = (p1Wins / trials);
	
	//console.log("Win probability:", percentage);
	
	return percentage;
};

// returns true if player1 wins. Player1 attacks first
var simulateBattle = function(p1InitialTerritories, p2InitialTerritories, initialDensity1, initialDensity2) {
	
	var p1 = new Player(p1InitialTerritories, initialDensity1, 0);
	var p2 = new Player(p2InitialTerritories, initialDensity2, 0);;
	
	while (p1.countries.length && p2.countries.length) {
		//console.log("p1 attacks p2");
		var result = doOneAttack(p1, p2);
		p1 = result[0]; p2 = result[1];
		
		if (p2.countries.length) {
			//console.log("p2 attacks p1");
			doOneAttack(p2, p1);
			p1 = result[0]; p2 = result[1];
		}
		
	}
	
	
	
	if (p1.countries.length > 0) {
		//console.log("p1 wins");
		return true;
	} else {
		//console.log("p2 wins");
		return false;
	}
};

var doOneAttack = function(p1, p2) {
	
	//console.log(p1, p2);
	
	var rand = Math.random();
	
	if (rand < (odds[(p1.countries[0]-1)][(p2.countries[0]-1)])) {
		// attacker wins
		//console.log("attacker wins");
		p1.win();
		p2.lose(false);
	} else {
		// defender wins
		//console.log("defender wins");
		p1.lose(true);
	}
	
	p1.endTurn();
	
	return [p1, p2];
};

//console.log(typeof odds[0][0]);
//calculateOdds(2, 2, 8, 8);

var equalDensityTable = function(from, to) {
	var results = [];
	results.push(["Defending"]);
	
	for (var attacker = from; attacker <= to; attacker++) {
		results[0].push(attacker.toString() + " attacking");
		var row = [attacker];
		for (var defender = from; defender <= to; defender++) {
			row.push(calculateOdds(attacker, defender, 8, 8));
		}
		results.push(row);
	}
	
	return results;
};


function equalDiceTotalsDifferentDensities(total) {
	var minCountries = Math.ceil(total/8);
	var maxCountries = minCountries * 2;
	
	var result = [];
	result.push(['Odds', "Attacking with 7 per territory"]);
	
	for (var i=minCountries; i <= maxCountries; i++) {
	}
};

function drawChart() {
    var data = google.visualization.arrayToDataTable(equalDensityTable(1, 8));

/*
	var data = google.visualization.arrayToDataTable([
      ['Year', 'Sales', 'Expenses'],
      ['2004',  1000,      400],
      ['2005',  1170,      460],
      ['2006',  660,       1120],
      ['2007',  1030,      540]
    ]);
*/

    var options = {
      title: 'Odds of Defending By Relative Country Count',
      //curveType: 'function',
      legend: { position: 'bottom', text: "foo" }
    };

    var chart = new google.visualization.LineChart(document.getElementById('curve_chart'));

    chart.draw(data, options);
}