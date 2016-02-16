if (typeof module !== 'undefined' && module.exports) {
	var Globals = require('../globals.js');
	var Gamestate = require('./gamestate.js');
}

/*-----------------------------------------------------------------------------------------------
AIInterface - this is what gets passed to all AIs. 
-----------------------------------------------------------------------------------------------*/
var AIInterface = function(aiwrapper) {
	var controller = aiwrapper._controller;
	return {
		adjacentCountries: function(countryId) { return controller.map().adjacentCountries(countryId);},
		getState: function() { return controller.getState(); },
		attack: function(fromCountryId, toCountryId, callback) { 	
			aiwrapper.attack(fromCountryId, toCountryId, callback);
		},
		endTurn: function() { 
			aiwrapper.endTurn(); 
		}
	};
};


//--------------------------------------------------------------------------------------------------------------------
//	AIWrapper - implements Engine::PlayerInterface, which allows the engine to control us. This is an adapter class
//	between engine (or Client) and bots.
// 
// @ai: EITHER an AI class OR a string representing the id (hash) of an AI stored on the server. 
//		If it's a hash, then @name must be defined, and it will automatically assumed to be untrusted, 
//		regardless of the value of @trusted
//
// @test: true only if we're testing a submitted AI
//
// @controller: what this class calls back into to attack or end a turn. must implement Engine.ControllerInterface
//--------------------------------------------------------------------------------------------------------------------
var AIWrapper = function(ai, controller, playerId, test, name) {
	Globals.debug("AIWrapper()", (typeof ai == 'string') ? ai : ai.getName(), playerId, test, name, Globals.LEVEL.INFO, Globals.CHANNEL.AI_WRAPPER);
	Globals.ASSERT(Globals.implements(controller, Engine.ControllerInterface));
	this._test = test;
	this._isMyTurn = false;
	this._controller = controller;
	this._id = playerId;
	
	if (typeof ai === 'string') {
		Globals.ASSERT(name);
		this._trusted = false;
		this._ai = null;
		this._aiHash = ai;
		this._name = name;
	} else {
		this._trusted = true;
		this._name = ai.getName();
	}
	
	if (this._trusted) {
		this._ai = ai.create(playerId);
	}

	Globals.ASSERT(Globals.implements(this, Engine.PlayerInterface));
};



AIWrapper.prototype.getName = function() {
	return this._name;
};

AIWrapper.prototype.isHuman = function() {
	return false;
};

// from engine
AIWrapper.prototype.start = function() {
	Globals.debug("AIWrapper.start()", this._name, Globals.LEVEL.INFO, Globals.CHANNEL.AI_WRAPPER);
	if (!this._trusted) {

		// the difference between an AIWorker and a BotWorker is that user-submitted code must be run
		// in an AIWorker.

		if (this._aiHash) {
			// grab a specialized worker
			var workerPath = (this._test ? "/testworker/" : "/aiworker/") + this._aiHash;
			Globals.debug("Downloading new aiworker", workerPath, Globals.LEVEL.INFO, Globals.CHANNEL.AI_WRAPPER);
			this._worker = new Worker(workerPath);
		} else {
			Globals.debug("Creating new botworker", Globals.LEVEL.INFO, Globals.CHANNEL.AI_WRAPPER);
			this._worker = new Worker("/js/game/botworker.js");
		}
		
		this._worker.onmessage = this.callback.bind(this);
		this._worker.postMessage({
								command: 'init', 
								adjacencyList: this._controller.map().adjacencyList(), 
								ai: this._aiHash ? this._aiHash : this._name, 
								playerId: this._id});
	}
};

// from engine
AIWrapper.prototype.stop = function() {
	if (!this._trusted && this._worker) {
		this._worker.terminate();
		this._worker = null;
	}
};

// from engine
AIWrapper.prototype.startTurn = function(state) {
	Globals.ASSERT(!this._isMyTurn);
	this._isMyTurn = true;
	if (this._trusted) {
		Globals.ASSERT(this._ai);
		this._ai.startTurn(AIInterface(this));
	} else {
		Globals.ASSERT(this._worker);
		this._worker.postMessage({command: 'startTurn', state: state.serialize()});
	}
};

// from engine
AIWrapper.prototype.attackDone = function(success) {
	if (this._trusted) {
		this._aiCallback(success);
	} else {
		Globals.ASSERT(this._worker);
		this._worker.postMessage({command: 'attackResult', result: success, state: this._controller.getState().serialize()});
	}
};

// from engine
AIWrapper.prototype.turnEnded = function() {
	this._isMyTurn = false;
};

// from engine
AIWrapper.prototype.loses = function() {
	if (this._trusted) {
		this._ai = null;
	} else {
		this._worker.close();
		this._worker = null;
	}
};

// from AI
AIWrapper.prototype.endTurn = function() {
	if (this._isMyTurn) {
		this._isMyTurn = false;
		this._controller.endTurn();
	}
};

// from AI
AIWrapper.prototype.attack = function(from, to, callback) {
	if (this._isMyTurn) {
		this._aiCallback = callback;
		this._controller.attack(this._controller.map().getCountry(from), this._controller.map().getCountry(to), this.attackDone.bind(this));
	}
};

// from BotWorker
AIWrapper.prototype.callback = function(e) {
	if (this._isMyTurn) {
		var data = e.data;
		switch (data.command) {
			case 'attack':
				var from = parseInt(data.from);
				var to = parseInt(data.to);
				this._controller.attack(this._controller.map().getCountry(from), this._controller.map().getCountry(to), this.attackDone.bind(this));
				break;
			case 'endTurn':
				this._isMyTurn = false;
				this._controller.endTurn();
				break;
		}
	}
};

if (typeof module !== 'undefined' && module.exports) {
	module.exports = AIWrapper;
}