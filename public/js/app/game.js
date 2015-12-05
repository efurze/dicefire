"use strict"

var Uploader = function(gameId) {
	this._count = 1;
	this._gameId = gameId;
	this._array = [];
	this._pending = false;
};

Uploader.prototype.push = function(data) {
	this._array.push(data);
	this._doNext();
};

Uploader.prototype._doNext = function() {
	var self = this;
	if (!self._pending && self._array.length) {
		var data = self._array.shift();
		self._pending = true;
		
		
		$.post('/uploadState?gameId=' + self._gameId + "&moveId=" + self._count,
			data).done(function(d) {
				self.ajaxDone(d);
			}).fail(function(err) {
				self.ajaxFail(err);
			});

		this._count++;
	}
};

Uploader.prototype.ajaxDone = function(data) {
	Globals.ASSERT(this._pending);
	this._pending = false;
	this._doNext();
};

Uploader.prototype.ajaxFail = function(err) {
	console.log("UPLOAD FAILURE: ", err.error(), JSON.stringify(err));
	this._pending = false;
	this._doNext();
};

$(function() {

	
	window.Game = {
		
		_mouseOverCountry: null,
	    _selectedCountry: null,
		_canvas: document.getElementById("c"),
		_controller: null,
		_mapController: null,
		_gameId: null,
		_lastUploadedState: 0,
		_uploader: null,
		
		
		currentPlayer: function() { return Engine.currentPlayer(); },
		
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
			
			Engine.init(playerCode.map(function(pc){return pc;}));
			Renderer.init(playerCode.length, Game._canvas, playerCode.map(function(pc) {
				if (pc == "human") {
					return "human";
				} else {
					return pc.getName();
				}
			}));
			
			Engine.setup();
			
			if (Globals.uploadGame && Game._gameId) {
				// upload map data to server
				$.ajax({
					type: 'POST',
					url: '/uploadMap?gameId=' + Game._gameId,
					data: Map.serializeHexes(),
					contentType: "application/json; charset=utf-8",
					dataType: "json",
					success: Game.uploadSuccess,
					failure: Game.uploadFailure
				});
			}
			
			
			Engine.registerStateCallback(Game.update);
			Game._controller = new Gamecontroller();
			Game._mapController = new Mapcontroller(Game.update);

			Game.update();
			
			
			$('#end_turn').click(Game._controller.endTurn.bind(Game._controller));
			$('#back_btn').click(Game._controller.historyBack.bind(Game._controller));
			$('#forward_btn').click(Game._controller.historyForward.bind(Game._controller));
			
			Engine.startTurn(0);
		},
		
		uploadSuccess: function(data) {
			console.log("UPLOAD SUCCESS: " + errMsg);
		},
		
		uploadFailure: function(errMsg) {
			console.log("UPLOAD FAILURE: " + errMsg);
		},

		update: function(gamestate, stateId) {
			gamestate = gamestate || Engine.getState();
			Renderer.render(gamestate);
			if (Game._controller) {
				Game._controller.update();
			}
			
			if (Globals.uploadGame && Game._gameId && Game._lastUploadedState < Engine.historyLength()) {
				// upload the state info
				Game._lastUploadedState = Engine.historyLength();
				Game._uploader.push(JSON.parse(Engine.getHistory(Game._lastUploadedState - 1).serialize()));
			}
		},
		
	};
});

