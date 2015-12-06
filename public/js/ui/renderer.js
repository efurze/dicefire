"use strict"



var stateHash = {
	
	_players: {},
	_countries: {},
	
	reset: function() {
		this._players = {};
		this._countries = {};
	},
	
	hasPlayerChanged: function(playerId, hash) {
		if (this._players[playerId] === hash) {
			return false;
		} else {
			this._players[playerId] = hash;
			return true;
		}
	},
	
	hasCountryChanged: function(countryId, isFighting, hash) {
		if (isFighting) {
			hash += 1;
		}
		if (countryId == Renderer._mouseOverCountry) {
			hash += 2;
		}
		if (countryId == Renderer._selectedCountry) {
			hash += 4;
		}
		if (this._countries[countryId] === hash) {
			return false;
		} else {
			this._countries[countryId] = hash;
			return true;
		}
	}
};

$(function(){
	window.Renderer = {
		
		_canvas: null,
		_context: null,
		_initialized: false,
		_mouseOverCountry: -1,
		_selectedCountry: -1,
		_names: [],
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
		
		init: function(playerCount, canvas, playerNames) {
			if (!Globals.suppress_ui) {
				this._canvas = canvas;
				if (!canvas) {
					return;
				}
				this._context = this._canvas.getContext('2d');
				this.clearAll();
	            this._context.lineJoin = "straight";
				this._names = playerNames || [];
				
				this._setupRollDivs();
				this._setupPlayerDivs(playerCount);
				this._initialized = true;
			}			
		},
		
		clearAll: function() {
			if (Globals.suppress_ui || !this._initialized) {
				return;
			}
			
			Globals.debug("clearAll", Globals.LEVEL.INFO, Globals.CHANNEL.RENDERER);
			this._context.clearRect(0,0,2000,2000);
			stateHash.reset();
		},
		
		setMouseOverCountry: function(id) {
			Renderer._mouseOverCountry = id;
		},
		
		setSelectedCountry: function(id) {
			Renderer._selectedCountry = id;
		},
		
		render: function(state) {
			if (Globals.suppress_ui || !this._initialized) {
				return;
			}
			Globals.debug("render()", Globals.LEVEL.INFO, Globals.CHANNEL.RENDERER);
			Globals.ASSERT(state instanceof Gamestate);
			
			this._renderMap(state);
			this._renderPlayers(state);
		},
		
		/*
			@callback: function done(){}
		*/
		renderAttack: function(fromCountry, toCountry, fromRollArray, toRollArray, state, callback) {
		
			if (Globals.suppress_ui || !this._initialized || !state) {
				callback();
				return;
			}
			Globals.debug("renderAttack", Globals.LEVEL.DEBUG, Globals.CHANNEL.RENDERER);
			
			var self = this;
			
			var fromPlayerId = fromCountry.ownerId();
			
			var fromNumDice = fromRollArray.length;
			var toNumDice = toRollArray.length;
			
			var fromRoll = fromRollArray.reduce(function(total, die) { return total + die; });
	    	var toRoll = toRollArray.reduce(function(total, die) { return total + die; });
			
			self._resetRollDivs(fromCountry, toCountry, fromRollArray, toRollArray);
	
			// roll attacker
			Globals.debug("render attacker", Globals.LEVEL.DEBUG, Globals.CHANNEL.RENDERER);
			self._renderCountry(fromCountry.id(), state, true);
	        
			if (Globals.play_sounds) {
	            $.playSound('/sounds/2_dice_throw_on_table');
	        }
	        window.setTimeout(function(){renderAttackRoll(state);}, Globals.timeout);
	
			function renderAttackRoll(state) {
				$('#lefttotal').html(fromRoll);
	            $('#roll').css({
	                "display": "inline-block"
	            });
	            $('#leftroll').css({
	                "display": "inline-block"
	            });

				self._renderCountry(toCountry.id(), state, true);
	            window.setTimeout(function(){renderDefendRoll(state);}, Globals.timeout);
			}
			
			function renderDefendRoll(state) {
				Globals.debug("render defender", Globals.LEVEL.DEBUG, Globals.CHANNEL.RENDERER);
				$('#righttotal').html(toRoll);
	            $('#rightroll').css({
	                "display": "inline-block"
	            });              
	            window.setTimeout(function(){renderVerdict(state);}, Globals.timeout);
			}
			
			function renderVerdict(state) {
				Globals.debug("render verdict", Globals.LEVEL.DEBUG, Globals.CHANNEL.RENDERER);
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
					
				callback();
			}
		
		},
		
		renderHistoricalAttack: function(fromCountry, toCountry, fromRollArray, toRollArray, state) {
			if (Globals.suppress_ui || !this._initialized) {
				return;
			}
				
			if (!fromCountry || !toCountry || !fromRollArray || !toRollArray) {
				return;
			}
			
			this._resetRollDivs(fromCountry, toCountry, fromRollArray, toRollArray);
			
			var fromRoll = fromRollArray.reduce(function(total, die) { return parseInt(total) + parseInt(die); });
	    	var toRoll = toRollArray.reduce(function(total, die) { return parseInt(total) + parseInt(die); });
			
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
			this._renderMap(state);
			this._renderCountry(fromCountry.id(), state, true);
			this._renderCountry(toCountry.id(), state, true);
		},
		
		
		_renderMap: function(state) {
			if (Globals.suppress_ui || !this._initialized) {
				return;
			}
			Globals.debug("renderMap", Globals.LEVEL.INFO, Globals.CHANNEL.RENDERER);
			Globals.ASSERT(state instanceof Gamestate);
			var self = this;
			
			state.countryIds().forEach(function(countryId) {
				self._renderCountry(countryId, state)
			});
		},
		
		_renderPlayers: function(state) {
			if (Globals.suppress_ui || !this._initialized) {
				return;
			}
			Globals.debug("renderPlayers", Globals.LEVEL.INFO, Globals.CHANNEL.RENDERER);
			Globals.ASSERT(state instanceof Gamestate);
			
			var self = this;
			state.playerIds().forEach(function(playerId){
				self._renderPlayer(playerId, state);
			});
		},
		
		_renderPlayer: function(playerId, state) {
			if (Globals.suppress_ui || !this._initialized) {
				return;
			}
			Globals.debug("renderPlayer " + playerId, Globals.LEVEL.DEBUG, Globals.CHANNEL.RENDERER);
			Globals.ASSERT(state instanceof Gamestate);
			
			if (state.playerHasLost(playerId)) {
				$('#player' + playerId).css({'display': 'none'});
			} else {
				
				$('#player' + playerId).css({'display': 'inline-block'});
				
				// Highlight the player's status box
				if (playerId == state.currentPlayerId()) {
					$('#player' + playerId).css({'border': '3px double'});
				} else {
					$('#player' + playerId).css({'border': '1px solid'});
				}
				
				// update stats
				$('#dice' + playerId).html(state.numContiguous(playerId));
		    	$('#stored' + playerId).html(state.storedDice(playerId));
			}
		},
		
		_renderCountry: function (countryId, state, isFighting) {
			if (Globals.suppress_ui || !this._initialized) {
	        	return;
			}
			
			if (!stateHash.hasCountryChanged(countryId, isFighting, state.countryHash(countryId))) {
				return;
			}
			
			Globals.debug("renderCountry " + countryId, Globals.LEVEL.DEBUG, Globals.CHANNEL.RENDERER);
			
			var self = this;
			isFighting = isFighting || false;
			
	        Map.countryHexes(countryId).forEach(function(hexId) {
	            self._renderHex(Map.getHex(hexId), state, isFighting);
	        });

	        var ctr = Map.countryCenter(countryId);

	        self._renderNumberBox(countryId, state);

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
	            Map.adjacentCountries(countryId).forEach(function(country) {
	                var otherCenter = Map.countryCenter(country.id());
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
			Map.adjacentCountries(countryId).forEach(function(neighborId) {
				self._renderNumberBox(neighborId, state);
			});
		},
		
		
		
		
		_resetRollDivs: function(fromCountry, toCountry, fromRollArray, toRollArray) {
			
			if (Globals.suppress_ui || !this._initialized) {
				return;
			}
			
			var self = this
	
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
					'background-color': self._playerColors[fromCountry.ownerId()]
				});

				if (i < fromNumDice) {
					$('#leftdie' + i).html(fromRollArray[i]);
				}

				$('#rightdie' + i).css({
					'display': (i < toNumDice ? 'inline-block' : 'none'),
					'background-color': self._playerColors[toCountry.ownerId()]
				});

				if (i < fromNumDice) {
					$('#rightdie' + i).html(toRollArray[i]);
				}
	    	}
		},
		
		
		_renderNumberBox: function (countryId, state) {
			if (Globals.suppress_ui || !this._initialized) {
				return;
			}
			
			var self = this;
			var ctr = Map.countryCenter(countryId);
			
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
			self._context.fillText(state.countryDice(countryId), ctr[0], ctr[1]);
			
			if (Globals.showCountryIds) {
	        	self._context.fillStyle = "black";
				self._context.textAlign = "left";
	        	self._context.font = "10px sans-serif";
	        	self._context.fillText(countryId, ctr[0], ctr[1]);
			}
		},
		


		_renderHex: function (hexToPaint, state, isFighting) {
			if (Globals.suppress_ui || !this._initialized) {
				return;
			}
			
			var self = this;
			var countryId = hexToPaint.countryId();
			var country = Map.getCountry(countryId);
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


	        self._context.fillStyle = country ? Renderer._countryDrawColor(countryId, state.countryOwner(countryId), isFighting) : "white";
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
	                self._context.strokeStyle = isFighting ? "red" : "black";
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
		
		_countryDrawColor: function(countryId, ownerId, isFighting) {
			var self = this;
			if (isFighting) {
				return "black";
			} else if (countryId == self._mouseOverCountry) {
		        if (countryId == self._selectedCountry) {
		            return "gray";
		        } else {
		            return "lightgray";
		        }
		    } else {
		        if (countryId == self._selectedCountry) {
		            return "black";
		        } else {
		            return self._playerColors[ownerId];
		        }
		    }
		},
		
		_setupPlayerDivs: function(playerCount) {
			if (Globals.suppress_ui) {
				return;
			}
			
			var self = this;
			
			$('#players').html('');
			
			// add a "country count" div for each player
			for (var id=0; id < playerCount; ++id) {
				
				$('#players').append(
		    		"<div id='player" + id + "'><div id='colorblock" + id + "'></div>"
					+ ((this._names && this._names[id]) ? ("<div id='name" + id + "'>" + this._names[id] + "</div>") : "")
		    		+ "<div id='dice" + id + "'>1</div>"
		    		+ "<div id='stored" + id + "'>0</div></div>"
		    	);

		    	$('#player' + id).css(
		    		{
		    			'font-family': 'sans-serif',
		    			'display': 'inline-block',
		    			'margin': '10px',
		    			'padding': '10px',
		    			'width': '120px',
		    			'height': '20px',
		    			'border': '1px solid black'

		    		}
		    	);

		    	$('#colorblock' + id).css( 
			    	{
			    		'display': 'inline-block',
			    		'width': '20px',
			    		'height': '20px',
			    		'background-color': self._playerColors[id]
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
		
				$('#name' + id).css(
			    	{
						'display': 'inline-block',
						'margin-left': '10px',
						'margin-top': '2px',
						'font-size': '8pt',
						'vertical-align': 'top',
						'text-align': 'center'
			    	}
		    	);

				$('#stored' + id).css(
			    	{
						'display': 'inline-block',
						'margin-left': '5px',
						'margin-top': '2px',
						'vertical-align': 'top',
						'text-align': 'center',
						'color': self._playerColors[id]
			    	}
		    	);
			}
			
		},
		
		_setupRollDivs: function() {

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