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
		
		this._engine.init(pws, this.gameDone.bind(this));
		this._engine.setup();
		this._engine.registerStateCallback(this.engineUpdate.bind(this));
		
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

GameRunner.prototype.engineUpdate = function(gamestate, stateId) {
	var self = this;
	self._uploader.uploadState(self._gameId, stateId, gamestate.toString());


	var html = "Move number: " + gamestate.stateId() + "<br><br>Scores:<br>";
	var count = self._engine.playerCount();
	for (var i=0; i < count; i++) {
		var player = self._engine.getPlayer(i);
		if (player) {
			html += "Player " + i + ": " + player.countryCount() + "<br>";
		}
	}
	$('#score').html(html);

	if (gamestate.attack()) {
		window.setTimeout(function() {
			self._engine.finishAttack(gamestate.attack());
		}, 0);
	}
};

GameRunner.prototype.gameDone = function(winner, id) {
	var self = this;
	console.log("Game finished, winnerId", id);
	var results = new Gameinfo(self._players.map(function(p){return p.hash;}), id);
	
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
	while (players.length < numPlayers) {
		var pool = this._players.map(function(p) {return p;});
		while (pool.length && players.length < numPlayers) {
			var idx = Math.floor(Math.random() * pool.length);
			players.push(pool[idx]);
			pool.splice(idx, 1);
		}
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
};

RandomRunner.prototype.done = function() {
	console.log("game over");
	this._runner = null;
	if (this._stop) {
		console.log("Exiting Thunderdome");
		$('#status').html("Done");
	} else if (this._max > 0 && this._count >= this._max) {
		$('#status').html("Done");
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
			var count = $('#count').attr('value');
			Thunderdome._runner.setMax(parseInt(count));
			Thunderdome._runner.start();			
		},
		
		stop: function() {
			$('#stop_btn').prop('disabled', true);
			Thunderdome._runner.stop();
		},


	};
});

