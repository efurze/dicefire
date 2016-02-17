/*jslint browser: true*/

$(function() {

	'use strict';

	window.PlayerStatus = {

		_playerColors: [
			"red",
			"blue",
			"green",
			"yellow",
			"orange",
			"purple",
			"brown",
			"tan"
		],

		init: function(players) {
			this._players = players;
			this._setupPlayerDivs(this._players.length);
		},

		setPlayerName: function(id, name) {
			if (this._players[id]) {
				this._players[id] = name;
			}
		},

		_setupPlayerDivs: function(playerCount) {

			var self = this;
			
			$('#players').html('');
			
			// add a "country count" div for each player
			for (var id=0; id < playerCount; ++id) {
				
				var colorHint = self._players[id] + ' owns all regions of this color.';
				var contigousHint = 'Number of adjacent regions owned by ' + self._players[id];
				var storedHint = 'Number of dice ' + self._players[id] + ' has stored';
				$('#players').append(
					"<div id='player" + id + "' class='col-sm-2 player-box'>" + 
					"<div id='colorblock" + id + "' class='color-block status-icon hint--info' data-hint='" + colorHint + "'></div>" +
					((self._players && self._players[id]) ? ("<div id='name" + id + "' class='name-box'>" + self._players[id] + "</div>") : "") +
					"<div id='dice" + id + "' class='dice-box status-icon hint--info' data-hint='" + contigousHint + "'>1</div>" +
					"<div id='stored" + id + "' class='stored-box status-icon hint--info' data-hint='" + storedHint + "'>0</div></div>"
					);

		    	$('#colorblock' + id).css( 
			    	{		
			    		'background-color': self._playerColors[id]
			    	}
		    	);

				$('#stored' + id).css(
			    	{
						'color': self._playerColors[id]
			    	}
		    	);
			}
		},

		renderPlayers: function(state) {
			var self = this;
			state.playerIds().forEach(function(playerId){
				self._renderPlayer(playerId, state);
			});
		},
		
		_renderPlayer: function(playerId, state) {
			Globals.debug("renderPlayer " + playerId, Globals.LEVEL.DEBUG, Globals.CHANNEL.RENDERER);
			Globals.ASSERT(state instanceof Gamestate);
			
			if (state.playerHasLost(playerId)) {
				$('#player' + playerId).hide();
			} else {				
				$('#player' + playerId).show();
				
				// Highlight the player's status box
				if (playerId == state.currentPlayerId()) {
					$('#player' + playerId).addClass("current-player");
				} else {
					$('#player' + playerId).removeClass("current-player");
				}
				
				// update stats
				$('#dice' + playerId).html(state.numContiguous(playerId));
		    	$('#stored' + playerId).html(state.storedDice(playerId));
			}
		},
			

	};

});