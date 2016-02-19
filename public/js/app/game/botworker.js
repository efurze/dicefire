/*jslint browser: true*/

//--------------------------------------------------------------------------------------------------------------------
// BotWorker - this is a WebWorker that runs the standard AI bots (not user-submitted code). It's only able to run
// classes that are specified in the 'importScripts' directives below.
//--------------------------------------------------------------------------------------------------------------------


if( 'function' === typeof importScripts) {

importScripts('/js/app/globals.js');
importScripts('/js/app/game/gamestate.js');
importScripts('/js/app/ai/util.js');
importScripts('/js/app/ai/plyer.js');
importScripts('/js/app/ai/greedy.js');
importScripts('/js/app/ai/aggressive.js');

var initAIs = function() {
	aiMap[AI.Plyer.getName()] = AI.Plyer;
	aiMap[AI.Greedy.getName()] = AI.Greedy;
	aiMap[AI.Aggressive.getName()] = AI.Aggressive;
};

var createAIByName = function(name, playerId) {
	return aiMap[name].create(playerId);
};

var adjacencyList = null;
var state = null;
var ai = null;
var attackCallback = null;
var aiMap = {};

initAIs();

onmessage = function(e) {
	var data = e.data;

	switch (data.command) {
		case 'init':
			adjacencyList = data.adjacencyList;
			var playerId = data.playerId;
			ai = createAIByName(data.ai, playerId);
			break;
		case 'startTurn':
			state = Gamestate.deserialize(data.state);
			ai.startTurn(AIInterface());
			break;
		case 'attackResult':
			state = Gamestate.deserialize(data.state);
			attackCallback(data.result);
			break;
	}
	
};


var AIInterface = function() {
	return {
		adjacentCountries: function(countryId) { return adjacencyList[countryId];},
		getState: function() { return state; },
		attack: function(fromCountryId, toCountryId, callback) { 
			attackCallback = callback;	
			postMessage({command: 'attack', from: fromCountryId, to: toCountryId});
		},
		endTurn: function() { 
			postMessage({command: 'endTurn'});
		}
	};
};

}