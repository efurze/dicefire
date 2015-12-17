"use strict"


$(function() {

	
	window.Game = {
		
		_canvas: document.getElementById("c"),
		_controller: null,
		_mapController: null,
		_gameId: null,
		_uploader: null,
		_engine: null,
		
		
		currentPlayer: function() { return Game._engine.currentPlayer(); },
		
		init: function (gameId) {
			console.log("gameId: " + gameId);
			Game._gameId = gameId;
			Game._uploader = new Uploader(gameId);
			$('#setup').css('display', 'block');
			$('#game').css('display', 'none');
			
			$('#start_game').click(Setupcontroller.startGame);
			Setupcontroller.init(Game.start);
		},
		
		start: function(playerCode) {
			
			$('#setup').css('display', 'none');
			$('#game').css('display', 'block');
			if (Globals.uploadGame && Game._gameId) {
				$('#view_link').css('display', 'block');
			}
			
			Game._engine = new Engine();
			Game._engine.init(playerCode.map(function(pc){return pc;}), Game.gameOver);
			Game._engine.setup();
			
			Renderer.init(playerCode.length, Game._canvas, Game._engine.map(), playerCode.map(function(pc) {
				if (pc == "human") {
					return "human";
				} else {
					return pc.getName();
				}
			}));
			
			// upload map data to server
			if (Globals.uploadGame && Game._gameId) {
				Game._uploader.push(Game._engine.map().serializeHexes());
			}
			
			Game._engine.registerStateCallback(Game.engineUpdate);
			Game._controller = new Gamecontroller(Game._engine);
			Game._mapController = new Mapcontroller(Game.mapUpdate, Game._canvas, Game._engine.map(), Game.mapConInterface);

			Game.redraw();
			
			$('#end_turn').click(Game._controller.endTurn.bind(Game._controller));
			$('#back_btn').click(Game._controller.historyBack.bind(Game._controller));
			$('#forward_btn').click(Game._controller.historyForward.bind(Game._controller));
			
			Game._engine.startTurn(0);
		},
		
		gameOver: function(winningAI, winningID) {
			Game.redraw();
		},
		
		mapUpdate: function() {
			if (!Game._controller.viewingHistory()) {
				Game.redraw();
			}
		},

		engineUpdate: function(gamestate, stateId) {
			gamestate = gamestate || Game._engine.getState();
			if (Globals.uploadGame && Game._gameId) {
				// upload the state info
				Game._uploader.push(gamestate.clone());
			}
			Game.redraw(gamestate);
		},
		
		redraw: function(gamestate) {
			gamestate = gamestate || Game._engine.getState();
			Renderer.render(gamestate, Game._engine.finishAttack.bind(Game._engine));
			if (Game._controller) {
				Game._controller.update();
			}
		},
		
		mapConInterface: {
			currentPlayerId: function() {
				return Game._engine.currentPlayerId();
			},
			
			attack: function(from, to, callback) {
				Game._engine.attack(from, to, callback);
			},
			
			isThisPlayer: function(playerId) {
				return Game._engine.isHuman(playerId);
			},
			
			clickable: function() {
				return !Game._controller.viewingHistory();
			}
		}
		
	};
});

