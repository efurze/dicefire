"use strict"


$(function() {

	window.onerror = function(msg, url, lineNum) {
		Globals.debug("Uncaught exception", msg, url, lineNum, Globals.LEVEL.ERROR, Globals.CHANNEL.CLIENT, Game._gameId);
	};

	
	window.Game = {
		
		_canvas: document.getElementById("c"),
		_controller: null,
		_mapController: null,
		_gameId: null,
		_currentState: null,
		_uploader: null,
		_engine: null,
		_aiHash: null,
		_aiIdx: -1,
		
		
		currentPlayer: function() { return Game._engine.currentPlayer(); },
		
		// @players = ['human', 'Aggressive', 'Plyer 1.0']
		init: function (gameId, players, aiHash) {
			Game._gameId = gameId;
			Game._aiHash = aiHash;
			Game._uploader = new Uploader();
			Globals.initLogger(gameId, Game._uploader.uploadLogDump.bind(Game._uploader));

			if (typeof players == 'string') {
				players = players.trim().split(',');
			}

			var aiClassName = 'ai' + aiHash;

			// map player names to AI classes
			Game.start(players.map(function(name, idx) {
					name = name.trim();
					if (name === AI.Human.getName()) {
						return AI.Human;
					}  
					if (name === AI.Plyer.getName()) {
						return AI.Plyer;
					} 
					if (name === AI.Greedy.getName()) {
						return AI.Greedy;
					} 
					if (name === AI.Aggressive.getName()) {
						return AI.Aggressive;
					}
					if (name === aiHash) {
						Game._aiIdx = idx;
						return eval(aiClassName);
					}
				}));
		},
		
		start: function(playerCode) {
			
			$('#game').css('display', 'block');
			$('#game_controls').css('display', 'block');

			Game._engine = new Engine(false);
			// create the PlayerWrappers
			var pws = [];
			var playerNames = [];
			
			
			playerCode.forEach(function(player, idx) {
				if (player.getName() == 'human') {
					pws.push(Engine.PlayerInterface);
				} else if (idx == Game._aiIdx) {
					pws.push(new AIWrapper(Game._aiHash, Game._engine, pws.length, false, player.getName()));
				} else {
					pws.push(new AIWrapper(player, Game._engine, pws.length, true));
				}
			});
			
			Game._engine.init(pws, Game.gameOver);
			Game._engine.setup();
			
			playerCode.forEach(function(pc) {
				playerNames.push(pc.getName());
			});
			
			
			Game._engine.registerStateCallback(Renderer.stateUpdate.bind(Renderer));
			Game._controller = new Gamecontroller(0, Game._engine);
			Game._mapController = new Mapcontroller(0, Game._canvas, Game._engine.map(), Game.mapConInterface);
			Renderer.init3d(playerNames.length, Game._canvas, Game._engine.map(), playerNames, Game);
			
			$('#end_turn').click(Game._controller.endTurn.bind(Game._controller));
			$('#back_btn').click(Game._controller.historyBack.bind(Game._controller));
			$('#forward_btn').click(Game._controller.historyForward.bind(Game._controller));
			
			Game._engine.startTurn(0);
		},
		
		gameOver: function(winningAI, winningID) {
			Game.redraw();
		},
		
		// from renderer
		stateRendered: function(gamestate, stateId) {
			Game._currentState = gamestate;
			if (Game._controller) {
				Game._controller.update(gamestate);
			}
		},
		
		// from renderer
		mouseOverCountry: function(id) {
			Game._mapController.mouseOverCountry(id);
		},

		redraw: function() {
			Renderer.redraw();
		},
		
		mapConInterface: {
			currentPlayerId: function() {
				return Game._currentState ? Game._currentState.currentPlayerId() : -1;
			},

			attack: function(from, to, callback) {
				Game._engine.attack(from, to, callback);
			},
			
			clickable: function() {
				return !Game._controller.viewingHistory();
			}
		}
		
	};
});

