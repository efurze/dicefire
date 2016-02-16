"use strict"





var Renderer2d = {
		
		_canvas: null,
		_context: null,
		_initialized: false,
		_isRendering: false,
		_highlightedCountry: -1,
		_selectedCountry: -1,
		_mouseOverCountry: -1,
		_names: [],
		_map: null,
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
		_lastRenderedState: null,
		_listener: null,
		
		init: function(canvas, map, playerNames, listener) {
			if (!Globals.suppress_ui) {
				Globals.ASSERT(Globals.implements(listener, Renderer.iface));
				this._canvas = canvas;
				if (!canvas) {
					return;
				}
				this._context = this._canvas.getContext('2d');
				this.clearAll();
				this._context.lineJoin = "straight";
				this._map = map;
				this._names = playerNames || [];
				this._listener = listener;

				$(canvas).mousemove(this.mouseMove.bind(this));
    			$(canvas).mouseleave(this.mouseLeave.bind(this));
				
				this._initialized = true;
			}			
		},

		clearAll: function() {
			if (Globals.suppress_ui || !this._initialized) {
				return;
			}							
			Globals.debug("clearAll", Globals.LEVEL.INFO, Globals.CHANNEL.RENDERER);
			this._context.clearRect(0,0,2000,2000);
			this.stateHash.reset();
		},

		mouseMove: function(event) {
			if (this._listener) {
				var hex = this._map.fromMousePos(event.offsetX, event.offsetY);
				var countryId = hex ? hex.countryId() : -1;
				if (countryId != this._mouseOverCountry) {
					this._mouseOverCountry = countryId;
					this._listener.mouseOverCountry(countryId);
				}
			}
		},

		mouseLeave: function(event) {
			if (this._listener) {
				if (this._mouseOverCountry != -1) {
					this._mouseOverCountry = -1;
					this._listener.mouseOverCountry(-1);	
				}
			}
		},
		
		setMouseOverCountry: function(id) {
			if (!this._isRendering) {
				Renderer2d._highlightedCountry = id;
				this.render(this._lastRenderedState, null);
			}
		},
		
		setSelectedCountry: function(id) {
			if (!this._isRendering) {
				Renderer2d._selectedCountry = id;
				this.render(this._lastRenderedState, null);
			}
		},
		

		render: function(state, callback) {
			var self = this;
			if (self._isRendering) {
				Globals.debug("previous state rendering, render aborted", Globals.LEVEL.DEBUG, Globals.CHANNEL.RENDERER);
				callback();
				return;
			}
			Globals.debug("render()", Globals.LEVEL.INFO, Globals.CHANNEL.RENDERER);
			Globals.ASSERT(state instanceof Gamestate);
			
			self._renderMap(state);
			self._lastRenderedState = state;

			if (state.attack()) {
				self._renderAttack(state, callback);
			} else {
				if (callback) {
					callback(state, state.stateId());
				}
			}
		},
		
		/*
			@callback: function done(){}
		*/
		_renderAttack: function(state, callback) {
		
			if (Globals.suppress_ui || !this._initialized || !state) {
				callback();
				return;
			}
			Globals.debug("renderAttack", Globals.LEVEL.INFO, Globals.CHANNEL.RENDERER);
			
			var self = this;
			var fromCountry = state.attack().fromCountryId;
			var fromPlayerId = state.countryOwner(fromCountry);
			
			var toCountry = state.attack().toCountryId;
			
			var fromNumDice = state.attack().fromRollArray.length;
			var toNumDice = state.attack().toRollArray.length;
			
			var fromRoll = state.attack().fromRollArray.reduce(function(total, die) { return total + die; }, 0);
	    	var toRoll = state.attack().toRollArray.reduce(function(total, die) { return total + die; }, 0);
			
			self._resetRollDivs(state,
				fromCountry, 
				toCountry, 
				state.attack().fromRollArray, 
				state.attack().toRollArray);
	
			// roll attacker
			Globals.debug("render attacker", Globals.LEVEL.DEBUG, Globals.CHANNEL.RENDERER);
			self._renderCountry(fromCountry, state, true);
	        
			if (Globals.play_sounds && callback) {
	            $.playSound('/sounds/2_dice_throw_on_table');
	        }

	        self._isRendering = true;

            self._setupRollDivs();
			var timeout = callback ? Globals.timeout : 0;
	        window.setTimeout(function(){renderAttackRoll(state);}, timeout);
	
			function renderAttackRoll(state) {
				$('#lefttotal').html(fromRoll);
	            $('#leftroll').show();

				self._renderCountry(toCountry, state, true);
	            window.setTimeout(function(){renderDefendRoll(state);}, timeout);
			}
			
			function renderDefendRoll(state) {
				Globals.debug("render defender", Globals.LEVEL.DEBUG, Globals.CHANNEL.RENDERER);
				$('#righttotal').html(toRoll);
	            $('#rightroll').show();
	            window.setTimeout(function(){renderVerdict(state);}, timeout);
			}
			
			function renderVerdict(state) {
				Globals.debug("render verdict", Globals.LEVEL.DEBUG, Globals.CHANNEL.RENDERER);
	        	if (fromRoll > toRoll) {
					// attacker wins
	                if (Globals.play_sounds && callback) {
	                    $.playSound('/sounds/clink_sound');
	                }
	        	} else {
					// defender wins
	                if (Globals.play_sounds && callback) {                
	                    $.playSound('/sounds/wood_hit_brick_1');               
	                }
	            }

	            self._isRendering = false;
				if (callback) {
					callback(state, state.stateId());
				}
			}
		
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
		
		
		_renderCountry: function (countryId, state, isFighting) {
			if (Globals.suppress_ui || !this._initialized) {
	        	return;
			}
			
			if (!this.stateHash.hasCountryChanged(countryId, isFighting, state.countryHash(countryId))) {
				return;
			}
			
			Globals.debug("renderCountry " + countryId, Globals.LEVEL.DEBUG, Globals.CHANNEL.RENDERER);
			
			var self = this;
			isFighting = isFighting || false;
			
	        self._map.countryHexes(countryId).forEach(function(hexId) {
	            self._renderHex(self._map.getHex(hexId), state, isFighting);
	        });

	        var ctr = self._map.countryCenter(countryId);

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
	            self._map.adjacentCountries(countryId).forEach(function(country) {
	                var otherCenter = self._map.countryCenter(country.id());
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
			self._map.adjacentCountries(countryId).forEach(function(neighborId) {
				self._renderNumberBox(neighborId, state);
			});
		},
		
		
		
		
		_resetRollDivs: function(state, fromCountry, toCountry, fromRollArray, toRollArray) {
			
			if (Globals.suppress_ui || !this._initialized) {
				return;
			}
			
			var self = this
	
			// clear previous attack info
	        $('#leftroll').hide();
	        $('#rightroll').hide();

			if (!fromCountry || !toCountry || !fromRollArray || !toRollArray) {
				return;
			}
	
			var fromNumDice = fromRollArray.length;
			var toNumDice = toRollArray.length;
			
			var fromRoll = fromRollArray.reduce(function(total, die) { return total + die; });
	    	var toRoll = toRollArray.reduce(function(total, die) { return total + die; });
	
			// style a div for each die both countries have
			for (var i = 0; i < Globals.maxDice; i++) {
				$('#leftdie' + i).css({
					'background-color': self._playerColors[state.countryOwner(fromCountry)]
				});

				if (i < fromNumDice) {
					$('#leftdie' + i).html(fromRollArray[i]);
					$('#leftdie' + i).show();
				} else {
					$('#leftdie' + i).hide();
				}

				$('#rightdie' + i).css({
					'background-color': self._playerColors[state.countryOwner(toCountry)]
				});

				if (i < toNumDice) {
					$('#rightdie' + i).html(toRollArray[i]);
					$('#rightdie' + i).show();
				} else {
					$('#rightdie' + i).hide();
				}
	    	}
		},
		
		
		_renderNumberBox: function (countryId, state) {
			if (Globals.suppress_ui || !this._initialized) {
				return;
			}
			
			var self = this;
			var ctr = self._map.countryCenter(countryId);
			
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


	        self._context.fillStyle = Renderer2d._countryDrawColor(countryId, state, isFighting);
	        if (hexToPaint._color) {
	            self._context.fillStyle = hexToPaint._color;
	        }
	        self._context.fill(path);


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
		
		_countryDrawColor: function(countryId, state, isFighting) {
			var self = this;
			var ownerId = state.countryOwner(countryId);
			if (isFighting) {
				return "black";
			} else if (countryId == self._highlightedCountry) {
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
		
		_setupRollDivs: function() {
	        $('#leftroll').hide();
	        $('#rightroll').hide();

            var diceDivIds = [];
            for (var i = 0; i < Globals.maxDice; i++) {
                $('#leftroll').append(
                    "<div id='leftdie" + i + "' class='roll-die'>5</div>"
                );

                diceDivIds.push('#leftdie' + i);

                $('#rightroll').append(
                    "<div id='rightdie" + i + "' class='roll-die'>5</div>"
                );

                diceDivIds.push('#rightdie' + i);
            }



            $('#leftroll').append(
                "<div id='lefttotal' class='roll-total'>35</div>"                    
            );


            $('#rightroll').append(
                "<div id='righttotal' class='roll-total'>35</div>"                    
            );

        },

        stateHash: {
	
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
				if (countryId == Renderer2d._highlightedCountry) {
					hash += 2;
				}
				if (countryId == Renderer2d._selectedCountry) {
					hash += 4;
				}
				if (this._countries[countryId] === hash) {
					return false;
				} else {
					this._countries[countryId] = hash;
					return true;
				}
			}
		}
	};
