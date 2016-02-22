/*jslint browser: true*/

$(function() {

	"use strict";

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
		
		
		// @players = ['human', 'Aggressive', 'Plyer 1.0']
		init: function (gameId, players, aiHash, test) {
			Game._gameId = gameId;
			Game._aiHash = aiHash;
			Game._test = test;
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
						/*jslint evil: true */
						return eval(aiClassName);
					}
				}));
		},
		
		start: function(playerCode) {
			console.log("playerCode", playerCode);
			
			$('#game').css('display', 'block');
			$('#game_controls').css('display', 'block');

			Game._engine = new Engine();
			// create the PlayerWrappers
			var pws = [];
			var playerNames = [];
			
			
			playerCode.forEach(function(player, idx) {
				if (player.getName() == 'human') {
					pws.push(Engine.PlayerInterface);
				} else if (idx == Game._aiIdx) {
					pws.push(new AIWrapper(Game._aiHash, Game._engine, pws.length, Game._test, player.getName()));
				} else {
					pws.push(new AIWrapper(player, Game._engine, pws.length, false));
				}
			});
			
			Game._engine.init(pws);
			Game._engine.registerGameCallback(Game.gameOver);
			Game._engine.registerStateCallback(Renderer.stateUpdate.bind(Renderer));
			
			playerCode.forEach(function(pc) {
				playerNames.push(pc.getName());
			});
			
			
			Game._controller = new HistoryController(Game._engine, 0);
			Game._mapController = new Mapcontroller(0, Game._engine.map(), Game.mapConInterface);
			Renderer.init(Game._canvas, Game._engine.map(), playerNames, Game);
			Game._engine.setup();
			
			$('#end_turn').click(Game.endTurnClicked.bind(Game));
			
			Game._engine.startTurn(0);
		},

		endTurnClicked: function() {
			if (!Game._controller.viewingHistory() && Game._engine.currentPlayerId() === 0) {
				Game._engine.endTurn();
			}
		},
		
		gameOver: function(winningAI, winningID) {
		},
		
		// from renderer
		stateRendered: function(gamestate, stateId) {
			Game._controller.updateStateCount(Game._engine.historyLength()-1);
			if (!Game._controller.viewingHistory()) {
				Game._currentState = gamestate;
				Game._controller.setViewState(stateId);
				if (Game._controller) {
					Game._controller.update(gamestate);
				}
			}
		},
		
		// from renderer
		mouseOverCountry: function(id) {
			Game._mapController.mouseOverCountry(id);
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

