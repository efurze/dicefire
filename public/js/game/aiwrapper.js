if (typeof module !== 'undefined' && module.exports) {
	var Globals = require('../globals.js');
	var Gamestate = require('./gamestate.js');
}

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

var ControllerInterface = {
	map: function(){},
	getState: function(){},
	endTurn: function(){},
	attack: function(from, to, callback){} // callback: function(success){}
};

//--------------------------------------------------------------------------------------
//	AIWrapper - implements Engine::PlayerInterface
// 
// @controller: must implement ControllerInterface above
//--------------------------------------------------------------------------------------
var AIWrapper = function(ai, controller, playerId, trusted) {
	Globals.ASSERT(Globals.implements(controller, ControllerInterface));
	this._trusted = (typeof trusted == undefined) ? false : trusted;
	this._isMyTurn = false;
	this._controller = controller;
	this._name = ai.getName();
	this._id = playerId;
	
	if (this._trusted) {
		this._ai = ai.create(playerId);
	}
};

AIWrapper.prototype.getName = function() {
	return this._name;
};

AIWrapper.prototype.isHuman = function() {
	return false;
};

// from engine
AIWrapper.prototype.start = function() {
	if (!this._trusted) {
		this._worker = new Worker("/js/game/aiworker.js");
		this._worker.onmessage = this.callback.bind(this);
		this._worker.postMessage({command: 'init', adjacencyList: this._controller.map().adjacencyList(), ai: this._name, playerId: this._id});
	}
};

// from engine
AIWrapper.prototype.stop = function() {
	if (!this._trusted && this._worker) {
		this._worker.close();
		this._worker = null;
	}
};

// from engine
AIWrapper.prototype.startTurn = function(state) {
	Globals.ASSERT(!this._isMyTurn);
	this._isMyTurn = true;
	if (this._trusted) {
		this._ai.startTurn(AIInterface(this));
	} else {
		this._worker.postMessage({command: 'startTurn', state: state.serialize()});
	}
};

// from engine
AIWrapper.prototype.attackDone = function(success) {
	if (this._trusted) {
		this._aiCallback(success);
	} else {
		this._worker.postMessage({command: 'attackResult', result: success, state: this._controller.getState().serialize()})
	}
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
	Globals.ASSERT(this._isMyTurn);
	this._isMyTurn = false;
	this._controller.endTurn();
};

// from AI
AIWrapper.prototype.attack = function(from, to, callback) {
	this._aiCallback = callback;
	this._controller.attack(this._controller.map().getCountry(from), this._controller.map().getCountry(to), this.attackDone.bind(this));
}

// from AIWorker
AIWrapper.prototype.callback = function(e) {
	Globals.ASSERT(this._isMyTurn);
	console.log("Got message from worker", e);
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
};

if (typeof module !== 'undefined' && module.exports) {
	module.exports = AIWrapper;
}