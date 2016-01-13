"use strict"


$(function() {

	
	window.AI_Test = {
		
		_canvas: document.getElementById("c"),
		_uploader: null,
		_engine: null,
		_aiName: null,
		
				
		init: function (aiName) {
			AI_Test._aiName = aiName;
			AI_Test._uploader = new Uploader();
			Globals.initLogger("AI_TEST", AI_Test._uploader.uploadLogDump.bind(AI_Test._uploader));
			

			AI_Test._engine = new Engine(false);

			var playerCode = [AI.Aggressive, AI.Aggressive];

			// create the PlayerWrappers
			var pws = [];
			var playerNames = [];
			
			if (AI_Test._aiName) {
				var ai = eval(AI_Test._aiName);
				pws.push(new AIWrapper(ai, AI_Test._engine, 0, true));
				playerNames.push(ai.getName());
			}
			
			playerCode.forEach(function(player, idx) {
				if (player.getName() == 'human') {
					pws.push(Engine.PlayerInterface);
				} else {
					pws.push(new AIWrapper(player, AI_Test._engine, pws.length, false));
				}
			});
			
			AI_Test._engine.init(pws, AI_Test.gameOver);
			AI_Test._engine.setup();
			
			playerCode.forEach(function(pc) {
				playerNames.push(pc.getName());
			});
			Renderer.init(playerNames.length, AI_Test._canvas, AI_Test._engine.map(), playerNames);

			AI_Test._engine.registerStateCallback(AI_Test.engineUpdate);			
			AI_Test._engine.pushHistory();
		},
		
		start: function() {
			$('#goButton').css('display', 'none');
			AI_Test._engine.registerStateCallback(AI_Test.engineUpdate);			
			AI_Test._engine.startTurn(0);
		},
		
		gameOver: function(winningAI, winningID) {
			AI_Test.redraw();
		},
		

		engineUpdate: function(gamestate, stateId) {
			gamestate = gamestate || AI_Test._engine.getState();
			AI_Test.redraw(gamestate);
		},
		
		redraw: function(gamestate) {
			gamestate = gamestate || AI_Test._engine.getState();
			if (gamestate) {
				Renderer.render(gamestate, AI_Test._engine.finishAttack.bind(AI_Test._engine));
			}
		},
		
	};
});

