"use strict"

$(function() {
	
	window.Game = {
		
		_mouseOverCountry: null,
	    _selectedCountry: null,
		_canvas: document.getElementById("c"),
		_players: [AI.Aggressive, AI.Aggressive],
		_initialMap: null,
		_initialState: null,
		
		mouseOverCountry: function() { return Game._mouseOverCountry; },
		selectedCountry: function() { return Game._selectedCountry; },
		currentPlayer: function() { return Engine.currentPlayer(); },
		
		init: function () {
			Renderer.init(Game._players.length, Game._canvas);						
            

			$.get( "/testmaps/initialstate.json").done(function(data) {
				Game.ajaxDone(data);
			}).fail(function(err) {
				Game.ajaxFail(err);
			});
		},
		
		ajaxDone: function (data){
			//console.log("Got ajax data: " + JSON.stringify(data));
			Game._initialState = JSON.stringify(data.state);
			Game._initialMap = JSON.stringify(data.map);
			
			Engine.init(Game._players.map(function(p){return p;}));
			Engine.setup(Game._initialMap, Game._initialState);
			Renderer.clearAll();
			Renderer.render();
			$('#start_test').click(Game.start);
		},
		
		ajaxFail: function(err) {
			console.log("Ajax error: ", err.error(), err);
			//$('#start_test').click(Game.start);
		},
		
		start: function () {
			Engine.startTurn(0);
		}
		
	};
});