"use strict"

if (!$) {
	var $ = function(){};
}

$(function(){
	window.Renderer = {
		
		_canvas: null,
		_context: null,
		
		init: function(playerCount, canvas) {
			if (!Globals.suppress_ui) {
				this._canvas = canvas;
				this._context = this._canvas.getContext('2d');
				this.clearAll();
	            this._context.lineJoin = "straight";
				this.setupRollDivs();
				this.setupPlayerDivs(playerCount);
			}			
		},
		
		clearAll: function() {
			if (Globals.suppress_ui) {
				return;
			}
			
			this._context.clearRect(0,0,2000,2000);
		},
		
		render: function() {
			if (Globals.suppress_ui) {
				return;
			}
			this.renderMap();
			this.renderPlayers();
			this.renderControls();
		},
		
		renderMap: function() {
			if (Globals.suppress_ui) {
				return;
			}
			var self = this;
			Map._countryArray.forEach(function(country) {
				self.renderCountry(country);
			});
		},
		
		renderControls: function() {
			if (Globals.suppress_ui) {
				return;
			}
			
			$('#back_btn').prop('disabled', true);
			$('#forward_btn').prop('disabled', true);
			
			var history_count = Engine._history.length;
			var current = Engine._historyIndex + 1;
			
			if (Engine.isHuman(Engine._currentPlayerId) || current != history_count) {	
				if (current == history_count) {
					$('#end_turn').prop('disabled', false);
				} else {
					// don't let player end their turn while they're looking at history
					$('#end_turn').prop('disabled', true);
				}
				
				$('#history').html(current + ' / ' + history_count);
				
				if (current < history_count) {
					$('#forward_btn').prop('disabled', false);
				}
				
				if (current > 1) {
					$('#back_btn').prop('disabled', false);
				}
				
			} else {
				$('#end_turn').prop('disabled', true);
			}
		},
		
		renderPlayers: function() {
			if (Globals.suppress_ui) {
				return;
			}
			
			var self = this;
			Player.array().forEach(function(player){
				self.renderPlayer(player);
			});
		},
		
		renderPlayer: function(player) {
			if (Globals.suppress_ui || !player) {
				return;
			}
			
			if (player.countryCount() == 0) {
				$('#player' + player._id).css({'display': 'none'});
			} else {
				
				$('#player' + player._id).css({'display': 'inline-block'});
				
				// Highlight the player's status box
				if (player == Game.currentPlayer()) {
					$('#player' + player._id).css({'border': '3px double'});
				} else {
					$('#player' + player._id).css({'border': '1px solid'});
				}
				
				// update stats
				$('#dice' + player._id).html(player._numContiguousCountries);
		    	$('#stored' + player._id).html(player._storedDice);
			}
		},
		
		
		/*
			@callback: function done(){}
		*/
		renderAttack: function(fromCountry, toCountry, fromRollArray, toRollArray, callback) {
		
			if (Globals.suppress_ui) {
				callback();
				return;
			}
			
			Renderer.renderControls();
			
			var fromPlayer = Player.get(fromCountry.ownerId());
			
			// disable the 'end turn' button if the current attacking player is the human
			if (Engine.isHuman(fromPlayer._id) && fromPlayer == Engine.currentPlayer()) {
				$('#end_turn').prop('disabled', true);
			}
			
			var fromNumDice = fromRollArray.length;
			var toNumDice = toRollArray.length;
			
			var fromRoll = fromRollArray.reduce(function(total, die) { return total + die; });
	    	var toRoll = toRollArray.reduce(function(total, die) { return total + die; });
			
			this.resetRollDivs(fromCountry, toCountry, fromRollArray, toRollArray);
	
			// roll attacker
			fromCountry.setIsFighting(true);
	        if (Globals.play_sounds) {
	            $.playSound('/sounds/2_dice_throw_on_table');
	        }
	        window.setTimeout(renderAttackRoll, Globals.timeout);
	
			function renderAttackRoll() {
				$('#lefttotal').html(fromRoll);
	            $('#roll').css({
	                "display": "inline-block"
	            });
	            $('#leftroll').css({
	                "display": "inline-block"
	            });

	            toCountry.setIsFighting(true);
	            window.setTimeout(renderDefendRoll, Globals.timeout);
			}
			
			function renderDefendRoll() {
				$('#righttotal').html(toRoll);
	            $('#rightroll').css({
	                "display": "inline-block"
	            });              
	            window.setTimeout(renderVerdict, Globals.timeout);
			}
			
			function renderVerdict() {
				
	        	if (fromRoll > toRoll) {
					// attacker wins
	                if (Globals.play_sounds) {
	                    $.playSound('/sounds/clink_sound');
	                }
	        	} else {
					// defender wins
	                if (Globals.play_sounds) {                
	                    $.playSound('/sounds/wood_hit_brick_1');               
	                }
	            }
	
				// re-enable the 'end turn' button
				if (Engine.isHuman(fromPlayer._id) && fromPlayer == Engine.currentPlayer()) {
					$('#end_turn').prop('disabled', false);
				}
				
				callback();
				
				Renderer.renderCountry(fromCountry);
				Renderer.renderCountry(toCountry);
				Renderer.renderPlayer(Player.get(toCountry.ownerId()));
				Renderer.renderPlayer(Player.get(fromCountry.ownerId()));
				Renderer.renderControls();
			}
		
		},
		
		renderHistoricalAttack: function(fromCountry, toCountry, fromRollArray, toRollArray) {
			if (Globals.suppress_ui) {
				return;
			}
				
			if (!fromCountry || !toCountry || !fromRollArray || !toRollArray) {
				return;
			}
			
			this.resetRollDivs(fromCountry, toCountry, fromRollArray, toRollArray);
			
			var fromRoll = fromRollArray.reduce(function(total, die) { return total + die; });
	    	var toRoll = toRollArray.reduce(function(total, die) { return total + die; });
			
			// Render attack roll
			$('#lefttotal').html(fromRoll);
            $('#roll').css({
                "display": "inline-block"
            });
            $('#leftroll').css({
                "display": "inline-block"
            });

			// Render defensive roll
			$('#righttotal').html(toRoll);
            $('#rightroll').css({
                "display": "inline-block"
            });
			
			
			// draw countries as attacking
			fromCountry.setIsFighting(true);
			toCountry.setIsFighting(true);
			
			this.renderMap();
			this.renderCountry(fromCountry);
			this.renderCountry(toCountry);
			
			fromCountry.setIsFighting(false);
			toCountry.setIsFighting(false);
		},
		
		resetRollDivs: function(fromCountry, toCountry, fromRollArray, toRollArray) {
			
			if (Globals.suppress_ui) {
				return;
			}
	
			// clear previous attack info
			$('#roll').css({
				"display": "none"
	    	});

	        $('#leftroll').css({
	            "display": "none"
	        });

	        $('#rightroll').css({
	            "display": "none"
	        });
	
			if (!fromCountry || !toCountry || !fromRollArray || !toRollArray) {
				return;
			}
	
			var fromNumDice = fromRollArray.length;
			var toNumDice = toRollArray.length;
			
			var fromRoll = fromRollArray.reduce(function(total, die) { return total + die; });
	    	var toRoll = toRollArray.reduce(function(total, die) { return total + die; });
	
			// create a div for each die both countries have
			for (var i = 0; i < Globals.maxDice; i++) {
				$('#leftdie' + i).css({
					'display': (i < fromNumDice ? 'inline-block' : 'none'),
					'background-color': Player.get(fromCountry.ownerId()).color()
				});

				if (i < fromNumDice) {
					$('#leftdie' + i).html(fromRollArray[i]);
				}

				$('#rightdie' + i).css({
					'display': (i < toNumDice ? 'inline-block' : 'none'),
					'background-color': Player.get(toCountry.ownerId()).color()				
				});

				if (i < fromNumDice) {
					$('#rightdie' + i).html(toRollArray[i]);
				}
	    	}
		},
		
		
		renderNumberBox: function (country) {
			if (Globals.suppress_ui) {
				return;
			}
			
			var self = this;
			
			var ctr = country.center();
			
			// Draw the number box.
	        var boxSize = 10;
			if (Globals.showCountryIds) {
				boxSize = 12;
			}
	        self._context.fillStyle = "white";
	        self._context.fillRect(ctr[0] - boxSize, ctr[1] - boxSize * 1.6, boxSize * 2, boxSize * 2);
	        self._context.rect(ctr[0] - boxSize, ctr[1] - boxSize * 1.6, boxSize * 2, boxSize * 2);
			if (!Globals.showCountryIds) {
	        	self._context.lineWidth = 1;
	        	self._context.strokeStyle = "black";
	        	self._context.stroke();
			}

	        self._context.fillStyle = "black";
	        self._context.font = "bold 18px sans-serif";
			if (Globals.showCountryIds) {
	        	self._context.textAlign = "right";
			} else {
	        	self._context.textAlign = "center";
			}
			self._context.fillText(country._numDice, ctr[0], ctr[1]);
			
			if (Globals.showCountryIds) {
	        	self._context.fillStyle = "black";
				self._context.textAlign = "left";
	        	self._context.font = "10px sans-serif";
	        	self._context.fillText(country.id(), ctr[0], ctr[1]);
			}
		},
		

		renderCountry: function (country) {
			if (Globals.suppress_ui || !country) {
	        	return;
			}
			
			var self = this;
			
	        country._hexes.forEach(function(elem) {
	            self.renderHex(elem);
	        });

	        var ctr = country.center();

	        self.renderNumberBox(country);

	        if (Globals.markCountryCenters) {
	            var path = new Path2D();
	            path.moveTo(ctr[0] - 4, ctr[1] - 4);
	            path.lineTo(ctr[0] + 4, ctr[1] + 4);
	            path.closePath();
	            self._context.strokeStyle = "black";
	            self._context.lineWidth = 2;
	            self._context.stroke(path);

	            path = new Path2D();
	            path.moveTo(ctr[0] - 4, ctr[1] + 4);
	            path.lineTo(ctr[0] + 4, ctr[1] - 4);
	            path.closePath();
	            self._context.strokeStyle = "black";
	            self._context.lineWidth = 2;
	            self._context.stroke(path);
	        }

	        if (Globals.drawCountryConnections) {
	            Map.adjacentCountries(country.id()).forEach(function(country) {
	                var otherCenter = country.center();
	                var path = new Path2D();
	                path.moveTo(ctr[0], ctr[1]);
	                path.lineTo(otherCenter[0], otherCenter[1]);
	                path.closePath();
	                self._context.strokeStyle = "black";
	                self._context.lineWidth = 1;
	                self._context.stroke(path);
	            });
	        }
	
			// number boxes can overlap between adjacent countries. Redraw
			// them for all our neighbors
			Map.adjacentCountries(country.id()).forEach(function(neighborId) {
				self.renderNumberBox(Map.getCountry(neighborId));
			});
		},

		renderHex: function (hexToPaint) {
			if (Globals.suppress_ui) {
				return;
			}
			
			var self = this;
			var country = hexToPaint.country();
			var upperLeft = hexToPaint.upperLeft();
	        var upperLeftX = upperLeft[0], upperLeftY = upperLeft[1];

	        var path = new Path2D();
	        path.moveTo(upperLeftX - Hex.FUDGE, upperLeftY - Hex.FUDGE);
	        path.lineTo(upperLeftX + Hex.EDGE_LENGTH + Hex.FUDGE, upperLeftY - Hex.FUDGE);
	        path.lineTo(upperLeftX + Hex.EDGE_LENGTH + Hex.EDGE_LENGTH / 2, upperLeftY + Hex.HEIGHT / 2);
	        path.lineTo(upperLeftX + Hex.EDGE_LENGTH + Hex.FUDGE, upperLeftY + Hex.HEIGHT + Hex.FUDGE);
	        path.lineTo(upperLeftX - Hex.FUDGE, upperLeftY + Hex.HEIGHT + Hex.FUDGE);
	        path.lineTo(upperLeftX - Hex.EDGE_LENGTH / 2, upperLeftY + Hex.HEIGHT / 2);
	        path.lineTo(upperLeftX - Hex.FUDGE, upperLeftY - Hex.FUDGE);
	        path.closePath();


	        self._context.fillStyle = country ? Renderer.countryDrawColor(country) : "white";
	        if (hexToPaint._color) {
	            self._context.fillStyle = hexToPaint._color;
	        }
	        self._context.fill(path);


	        if (country) {
	            hexToPaint._countryEdgeDirections.forEach(function(dir) {
	                var edgePath = new Path2D();
	                switch(dir) {
	                    case Dir.obj.NW: 
	                    case "NW":
	                        edgePath.moveTo(upperLeftX, upperLeftY);
	                        edgePath.lineTo(upperLeftX - Hex.EDGE_LENGTH / 2, upperLeftY + Hex.HEIGHT / 2);
	                        break;

	                    case Dir.obj.N:
	                    case "N":
	                        edgePath.moveTo(upperLeftX, upperLeftY);
	                        edgePath.lineTo(upperLeftX + Hex.EDGE_LENGTH, upperLeftY);
	                        break;

	                    case Dir.obj.NE:
	                    case "NE":
	                        edgePath.moveTo(upperLeftX + Hex.EDGE_LENGTH, upperLeftY);
	                        edgePath.lineTo(upperLeftX + Hex.EDGE_LENGTH + Hex.EDGE_LENGTH / 2, upperLeftY + Hex.HEIGHT / 2);
	                        break;

	                    case Dir.obj.SE:
	                    case "SE":
	                        edgePath.moveTo(upperLeftX + Hex.EDGE_LENGTH + Hex.EDGE_LENGTH / 2, upperLeftY + Hex.HEIGHT / 2);
	                        edgePath.lineTo(upperLeftX + Hex.EDGE_LENGTH, upperLeftY + Hex.HEIGHT);
	                        break;

	                    case Dir.obj.S:
	                    case "S":
	                        edgePath.moveTo(upperLeftX + Hex.EDGE_LENGTH, upperLeftY + Hex.HEIGHT);
	                        edgePath.lineTo(upperLeftX, upperLeftY + Hex.HEIGHT);
	                        break;

	                    case Dir.obj.SW:
	                    case "SW":
	                        edgePath.moveTo(upperLeftX, upperLeftY + Hex.HEIGHT);
	                        edgePath.lineTo(upperLeftX - Hex.EDGE_LENGTH / 2, upperLeftY + Hex.HEIGHT / 2);
	                        break;                    


	                }
	                edgePath.closePath();
	                self._context.strokeStyle = country.borderColor();
	                self._context.lineWidth = hexToPaint.BORDER_THICKNESS;

	                self._context.stroke(edgePath);
	            });
	        }
	
			if (Globals.showNumbers) {
	            self._context.lineWidth = 1;
	            self._context.font = "11px sans-serif";
	            self._context.strokeText(hexToPaint._id, upperLeftX, upperLeftY + hexToPaint.HEIGHT / 2);
	        }

	        if (Globals.markHexCenters) {
	            var ctr = hexToPaint.center();
	            var path = new Path2D();
	            path.moveTo(ctr[0] - 2, ctr[1] - 2);
	            path.lineTo(ctr[0] + 2, ctr[1] + 2);
	            path.closePath();
	            self._context.strokeStyle = "black";
	            self._context.lineWidth = 1;
	            self._context.stroke(path);

	            path = new Path2D();
	            path.moveTo(ctr[0] - 2, ctr[1] + 2);
	            path.lineTo(ctr[0] + 2, ctr[1] - 2);
	            path.closePath();
	            self._context.strokeStyle = "black";
	            self._context.lineWidth = 1;
	            self._context.stroke(path);
	        }
			
		},
		
		countryDrawColor: function(country) {
			if (country.isFighting()) {
				return "black";
			} else if (country == Game.mouseOverCountry()) {
		        if (country == Game.selectedCountry()) {
		            return "gray";
		        } else {
		            return "lightgray";
		        }
		    } else {
		        if (country == Game.selectedCountry()) {
		            return "black";
		        } else {
		            return Player.get(country.ownerId()).color();
		        }
		    }
		},
		
		setupPlayerDivs: function(playerCount) {
			if (Globals.suppress_ui) {
				return;
			}
			
			$('#players').html('');
			
			// add a "country count" div for each player
			for (var id=0; id < playerCount; ++id) {
				
				$('#players').append(
		    		"<div id='player" + id + "'><div id='colorblock" + id + "'></div>" + 
		    		"<div id='dice" + id + "'>1</div>" +
		    		"<div id='stored" + id + "'>0</div></div>"
		    	);

		    	$('#player' + id).css(
		    		{
		    			'font-family': 'sans-serif',
		    			'display': 'inline-block',
		    			'margin': '10px',
		    			'padding': '10px',
		    			'width': '80px',
		    			'height': '20px',
		    			'border': '1px solid black'

		    		}
		    	);

		    	$('#colorblock' + id).css( 
			    	{
			    		'display': 'inline-block',
			    		'width': '20px',
			    		'height': '20px',
			    		'background-color': Player.colors[id]
			    	}
		    	);

		    	$('#dice' + id).css(
			    	{
						'display': 'inline-block',
						'margin-left': '12px',
						'margin-top': '2px',
						'vertical-align': 'top',
						'text-align': 'center'
			    	}
		    	);

				$('#stored' + id).css(
			    	{
						'display': 'inline-block',
						'margin-left': '12px',
						'margin-top': '2px',
						'vertical-align': 'top',
						'text-align': 'center',
						'color': Player.colors[id]
			    	}
		    	);
			}
			
		},
		
		setupRollDivs: function() {

            $('#roll').css({
                "display": "none",
                "vertical-align": "top",
                "margin-top": "3px"
            });

            $('#leftroll').css({
                "display": "inline-block",
                "margin-left": "20px"
            });

            $('#rightroll').css({
                "display": "inline-block",
                "margin-left": "20px"                
            });

            var diceDivIds = [];
            for (var i = 0; i < Globals.maxDice; i++) {
                $('#leftroll').append(
                    "<div id='leftdie" + i + "'>5</div>"
                );

                diceDivIds.push('#leftdie' + i);

                $('#rightroll').append(
                    "<div id='rightdie" + i + "'>5</div>"
                );

                diceDivIds.push('#rightdie' + i);
            }

            diceDivIds.forEach(function(divId) {
                $(divId).css({
                    "display": "inline-block",
                    "width": "20px",
                    "height": "20px",
                    "border": "1px solid black",
                    "background-color": "red",
                    "font-family": "sans-serif",
                    "color": "white",
                    "font-size": "14px",
                    "text-align": "center",
                    "padding-top": "2px",
                    "padding-bottom": "0px",
                    "vertical-align": "top",
                    "font-weight": "bold",
                    "margin-left": "5px"
                });
            });



            $('#leftroll').append(
                "<div id='lefttotal'>35</div>"                    
            );


            $('#rightroll').append(
                "<div id='righttotal'>35</div>"                    
            );

            var totalDivIds = [];
            totalDivIds.push('#lefttotal');
            totalDivIds.push('#righttotal');
            totalDivIds.forEach(function(divId) {
                $(divId).css({
                    "display": "inline-block",
                    "vertical-align": "top",
                    "font-family": "sans-serif",
                    "font-size": "18px",
                    "text-align": "center",
                    "color": "black",
                    "margin-left": "20px"
                });
            });

        }
	};
});