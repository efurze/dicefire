/*jslint browser: true*/

//--------------------------------------------------------------------------------------------------------------------
// AIWorker - this is a WebWorker that runs user-submitted code. It is loaded by an AIWrapper. The way it's specialized
// for a particular AI is a little unusual - I'm not sure if it's clever or just janky. Say the name of the AI class
// that we want to load is 'AIFoo'. The AIWrapper will create a WebWorker with the path "/aiworker/AIFoo", which
// is a route (currently) handled on the server by userAI.getAIWorker(). Before serving this file back, the server 
// does a String Replace of "_replaceThisWithAIHash_" (you'll see that string below) with "AIFoo". So you should
// obviously NEVER EDIT THE STRING '_replaceThisWithAIHash_'
//--------------------------------------------------------------------------------------------------------------------

if( 'function' === typeof importScripts) {

importScripts('/js/globals.js');
importScripts('/js/game/gamestate.js');
importScripts('/js/ai/util.js');
importScripts('/_replaceThisWithAIHash_'); /* NEVER EDIT THIS LINE */



var createAIByName = function(name, playerId) {
	/*jslint evil: true */
	return eval('ai'+name).create(playerId);
};

var adjacencyList = null;
var state = null;
var ai = null;
var attackCallback = null;


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