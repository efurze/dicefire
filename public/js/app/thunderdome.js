"use strict"

//--------------------------------------------------------------------------------------
//	GameRunner
//--------------------------------------------------------------------------------------


var GameRunner = function(AIs) {
	this._engine = new Engine();
	this._players = AIs.map(function(p){return p;});
	this._callback = null;
	
	if (this._players.length < 2) {
		debug("Not enough players: " + self.players);
	}
};

// @gameOver_cb = function(){}
GameRunner.prototype.start = function(gameOver_cb) {
	var self = this;
	if (this._players.length > 1) {
		this._callback = gameOver_cb;
		
		// create the PlayerWrappers
		var pws = this._players.map(function(player, idx) {
			return new AIWrapper(player.hash, self._engine, idx, false, player.name);
		});
		
		this._engine.init(pws);
		this._engine.setEnforceTime(true);
		this._engine.registerGameCallback(this.gameDone.bind(this));
		this._engine.registerStateCallback(this.engineUpdate.bind(this));
		this._engine.setup();
		
		
		this._gameId = uuid.v1();
		this._uploader = new Uploader();
		this._uploader.uploadMap(this._gameId, this._engine.serializeMap());
	
		debug("Beginning game " + this._gameId + ": " + pws.map(function(p) {return p.getName();}));
		this._engine.startTurn(0);
	} else {
		debug("Not enough players to play: " + JSON.stringify(this._players));
		this._callback = null;
		this._gameId = "";
		this._engine = null;
		this._players = null;
		this._uploader = null;
		if (gameOver_cb) {
			gameOver_cb();
		}
	}
};

GameRunner.prototype.stop = function() {
	if (this._engine) {
		this._engine.registerStateCallback(null);
		delete this._engine;
		this._engine = null;
	}
};

GameRunner.prototype.engineUpdate = function(gamestate, stateId) {
	var self = this;
	self._uploader.uploadState(self._gameId, stateId, gamestate.toString());


	var html = "Move number: " + gamestate.stateId() + "<br><br>Scores:<br>";
	var count = self._engine.playerCount();
	for (var i=0; i < count; i++) {
		var player = self._engine.getPlayer(i);
		if (player) {
			html += "Player " + i + ": " + player.countryCount() + ", " + player.timePerTurn() + "ms <br>";
		}
	}
	$('#score').html(html);

	if (gamestate.attack()) {
		window.setTimeout(function() {
			self._engine.finishAttack(gamestate.attack());
		}, 0);
	}
};

GameRunner.prototype.makeTable = function (table, data) {
    $.each(data, function(rowIndex, r) {
        var row = $("<tr/>");
        $.each(r, function(colIndex, c) { 
			if (rowIndex == 0) {
				row.append($("<th/>").text(c));
			} else {
				row.append($("<td id='" + (rowIndex) + (colIndex) + "'/>").text(c));
			}
            
        });
        table.append(row);
    });
	return table;
};

GameRunner.prototype.gameDone = function(winner, id) {
	var self = this;
	console.log("Game finished, winnerId", id);

	var times = [];
	var count = self._engine.playerCount();
	for (var i=0; i < count; i++) {
		var player = self._engine.getPlayer(i);
		if (player) {
			times.push(player.timePerTurn());
		}
	}

	var results = new Gameinfo(self._players.map(function(p, idx){return {id: p.hash, avgTime: times[idx]};}), id);
	
	self._uploader.uploadGameInfo(self._gameId, results.toString(), "ARENA");
	
	var cb = this._callback;
	
	this._engine = null;
	this._gameId = "";
	this._players = null;
	this._uploader = null;
	this._callback = null;
	
	if (cb) {
		cb();
	}
};

var debug = function(msg) {
	console.log(msg);
}


//--------------------------------------------------------------------------------------
//	RandomRunner
//--------------------------------------------------------------------------------------

// @AI = array of {hash: , name: }
var RandomRunner = function(AIs, max) {
	this._count = 0;
	this._stop = false;
	this._max = max || -1;
	this._players = AIs;
	
};

RandomRunner.prototype.setMax = function(max) {
	this._max = max;
};

RandomRunner.prototype.start = function() {
	
	// construct a random list of players
	var players = [];
	var numPlayers = 1 + Math.ceil(Math.random() * 7);

	var pool = Globals.shuffleArray(this._players);

	while (pool.length && players.length < numPlayers) {
		players.push(pool.shift());
	}
	
	this._count++;
	this._runner = new GameRunner(players);
	console.log("game " + this._count + " starting");
	$('#counter').html("Currently playing game " + this._count + " out of " + this._max);
	$('#status').html("Current Game: " + JSON.stringify(players.map(function(p){return p.name;})));
	this._runner.start(this.done.bind(this));
};

RandomRunner.prototype.stop = function() {
	this._stop = true;
	if (this._runner) {
		this._runner.stop();
		delete this._runner;
		this._runner = null;

		$('#status').html("Stopped");
	}
};

RandomRunner.prototype.done = function() {
	console.log("game over");
	this._runner = null;
	if (this._stop || (this._max > 0 && this._count >= this._max)) {
		console.log("Exiting Thunderdome");
		$('#status').html("Done");
		$('#stop_btn').prop('disabled', true);
		$('#start_btn').prop('disabled', false);
		this._count = 0;
	} else {
		setTimeout(this.start.bind(this), 0);
	}
};


//--------------------------------------------------------------------------------------
//	Thunderdome
//--------------------------------------------------------------------------------------


$(function() {

	
	window.Thunderdome = {
		
		_AIs: [], // array of {hash: , name: }
		_runner: null,
		_downloader: null,
		
		init: function () {
			Thunderdome._downloader = new Downloader();
			Thunderdome._downloader.getAIs(Thunderdome.aiListReceived);
			
			$('#stop_btn').prop('disabled', true);
			$('#start_btn').prop('disabled', true);
			
			$('#start_btn').click(Thunderdome.start);
			$('#stop_btn').click(Thunderdome.stop);
		},
		
		aiListReceived: function(success, data) {
			if (success) {
				
				if (data && data.length) {
					$('#stop_btn').prop('disabled', true);
					$('#start_btn').prop('disabled', false);
					Thunderdome._AIs = data;
					Thunderdome._runner = new RandomRunner(Thunderdome._AIs, 1);
				}
				
			} else {
				console.log("ERROR retrieving AI list", data);
			}
		},
		
		start: function() {
			$('#stop_btn').prop('disabled', false);
			$('#start_btn').prop('disabled', true);
			var count = $('#count').val();
			Thunderdome._runner.setMax(parseInt(count));
			Thunderdome._runner.start();			
		},
		
		stop: function() {
			$('#stop_btn').prop('disabled', true);
			$('#start_btn').prop('disabled', false);
			Thunderdome._runner.stop();
		},


	};
});

