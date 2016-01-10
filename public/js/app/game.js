"use strict"


$(function() {

	
	window.Game = {
		
		_canvas: document.getElementById("c"),
		_controller: null,
		_mapController: null,
		_gameId: null,
		_uploader: null,
		_engine: null,
		_aiName: null,
		
		
		currentPlayer: function() { return Game._engine.currentPlayer(); },
		
		init: function (gameId, aiName) {
			Game._gameId = gameId;
			Game._uploader = new Uploader();
			Globals.initLogger(gameId, Game._uploader.uploadLogDump.bind(Game._uploader));
			
			$('#setup').css('display', 'block');
			$('#game').css('display', 'none');
			
			if (aiName) {
				Game._aiName = aiName;
				Game.start([AI.Aggressive, AI.Aggressive]);
			} else {
				$('#start_game').click(Setupcontroller.startGame);
				Setupcontroller.init(Game.start);
			}
		},
		
		start: function(playerCode) {
			
			$('#setup').css('display', 'none');
			$('#game').css('display', 'block');
			if (Globals.uploadGame && Game._gameId) {
				$('#view_link').css('display', 'block');
			}
			
			Game._engine = new Engine(false);
			// create the PlayerWrappers
			var pws = [];
			var playerNames = [];
			
			if (Game._aiName) {
				var ai = eval(Game._aiName);
				pws.push(new AIWrapper(ai, Game._engine, 0, true));
				playerNames.push(Game._aiName);
			}
			
			playerCode.forEach(function(player, idx) {
				if (player.getName() == 'human') {
					pws.push(Engine.PlayerInterface);
				} else {
					pws.push(new AIWrapper(player, Game._engine, pws.length, false));
				}
			});
			
			Game._engine.init(pws, Game.gameOver);
			Game._engine.setup();
			
			playerCode.forEach(function(pc) {
				playerNames.push(pc.getName());
			});
			Renderer.init(playerNames.length, Game._canvas, Game._engine.map(), playerNames);
			
			
			if (Globals.uploadGame && Game._gameId) {
				// upload game info to server
				var info = new Gameinfo(playerNames);
				Game._uploader.uploadGameInfo(Game._gameId, info.toString());
			
				// upload map data to server
				Game._uploader.uploadMap(Game._gameId, Game._engine.serializeMap());
			}
			
			Game._engine.registerStateCallback(Game.engineUpdate);
			Game._controller = new Gamecontroller(Game._engine);
			Game._mapController = new Mapcontroller(Game.mapUpdate, Game._canvas, Game._engine.map(), Game.mapConInterface);
			
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
				Game._uploader.uploadState(Game._gameId, stateId, gamestate.toString());
			}
			Game.redraw(gamestate);
		},
		
		redraw: function(gamestate) {
			gamestate = gamestate || Game._engine.getState();
			if (gamestate) {
				Renderer.render(gamestate, Game._engine.finishAttack.bind(Game._engine));
			}
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

