"use strict"


$(function() {

	
	window.Creategame = {
		
		_gameId: null,
		
		init: function () {
			
			Creategame._gameId = uuid.v1();
	
			Globals.debug("gameId:", Creategame._gameId, Globals.LEVEL.INFO, Globals.CHANNEL.CLIENT);
			
			$('#start_game').click(Setupcontroller.startGame);

			// this will call start():
			Setupcontroller.init(Creategame.start);
		},
				
		start: function(playerCode) {
			var names = playerCode.map(function(p) {
				if (p instanceof String) {
					return p;
				} else if (p.hasOwnProperty('getName')) {
					return p.getName();
				}
			});
			var gameInfo = new Gameinfo(names);
			// create game on server
			$.post('/uploadGameInfo?gameId=' + Creategame._gameId, 
					gameInfo.serialize()
				).done(function(d) {
					// redirect player to game
					window.location.href = "/play?gameId=" + Creategame._gameId;		
				}).fail(function(err) {
					// TODO: FIXME: redirect to an error page here
					console.log("AJAX error: " + err);
				});
			
			
		},
				
	};
});

