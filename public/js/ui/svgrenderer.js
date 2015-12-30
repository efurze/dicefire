'use strict'

var SVG = true;

$(function(){
	
	
	window.SVGrenderer = {
		
		_svg: null,
		_dice: null,
		_context: null,
		_initialized: false,
		_mouseOverCountry: -1,
		_selectedCountry: -1,
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
		_lastState: null,
		_lastRenderTime: -1,
		_mapGraph: [],
		
		init: function(playerCount, map, playerNames) {
			if (!Globals.suppress_ui) {
				var self = this;
				self._svg = d3.select("#svgcanvas");
				if (!self._svg) {
					console.log("No svg element");
					return;
				}
				
				$('#canvas_div').css('display', 'none');
				$('#svgcanvas').css('display', 'block');
				
				self._map = map;
				self._names = playerNames || [];
				self._initialized = true;				
			}			
		},
		
		
		render: function(state, attackCallback) {
			if (Globals.suppress_ui || !this._initialized) {
				return;
			}
			Globals.debug("render()", Globals.LEVEL.TRACE, Globals.CHANNEL.RENDERER);
			Globals.ASSERT(state instanceof Gamestate);
			if (state == this._lastRenderedState && Date.now() - this._lastRenderTime < 200) {
				return;
			} 
			
			if (state != this._lastRenderedState) {
				this._drawMap(state);
			}
			
			this._renderMap();
			this._lastState = state;
			this._lastRenderTime = Date.now();
		},
		
		
		_drawMap: function(state) {
			if (Globals.suppress_ui || !this._initialized) {
				return;
			}
			Globals.debug("renderMap", Globals.LEVEL.TRACE, Globals.CHANNEL.RENDERER);
			Globals.ASSERT(state instanceof Gamestate);
			
			var self = this;
			self._mapGraph = [];
			state.countryIds().forEach(function(countryId) {
				self._drawCountry(countryId, state)
			});
		},
		
		_drawCountry: function (countryId, state, isFighting) {
			if (Globals.suppress_ui || !this._initialized) {
	        	return;
			}
			
			//if (!stateHash.hasCountryChanged(countryId, isFighting, state.countryHash(countryId))) {
			//	return;
			//}
			
			Globals.debug("drawCountry " + countryId, Globals.LEVEL.DEBUG, Globals.CHANNEL.RENDERER);
			
			var self = this;
			isFighting = isFighting || false;
			
	        self._map.countryHexes(countryId).forEach(function(hexId) {
	            self._drawHex(self._map.getHex(hexId), state, isFighting);
	        });
	

	        //self._renderNumberBox(countryId, state);

			// number boxes can overlap between adjacent countries. Redraw
			// them for all our neighbors
			//self._map.adjacentCountries(countryId).forEach(function(neighborId) {
			//	self._renderNumberBox(neighborId, state);
			//});
		},
		
		_renderMap: function() {
			var self = this;
			self._mapGraph.forEach(function(hex) {
				
				var points = hex.points();
				var color = hex.color();

				var pointFunction = d3.svg.line()
									.x(function(point) { return point[0]; })
									.y(function(point) { return point[1]; })
									.interpolate("linear");
								
				self._svg.append("path")
							.attr("d", pointFunction(points))
							.attr("stroke", color)
							.attr("stroke-width", 1)
							.attr("fill", color);
			
				
				hex.getEdges().forEach(function(edge) {
					var indices = [];
					switch(edge) {
						case Dir.obj.N:
							indices = [0,1];
							break;
						case Dir.obj.NE:
							indices = [1,2];
							break;
						case Dir.obj.SE:
							indices = [2,3];
							break;
						case Dir.obj.S:
							indices = [3,4];
							break;
						case Dir.obj.SW:
							indices = [4,5];
							break;
						case Dir.obj.NW:
							indices = [5,6];
							break;
					}

					var p1 = points[indices[0]];
					var p2 = points[indices[1]];

					self._svg.append("path")
								.attr("d", pointFunction([p1, p2]))
								.attr("stroke", hex.edgeColor())
								.attr("stroke-width", 1);
					
				 
				});
			});
			
			if (!SVG) {
				self._renderDice();
			}
			
		},
		
		_drawHex: function(hex, state, isFighting) {
			var self = this;		
			var countryId = hex.countryId();
			var country = self._map.getCountry(countryId);	
			var start = hex.upperLeft();
			
			var color = country ? SVGrenderer._countryDrawColor(countryId, state.countryOwner(countryId), isFighting) : "white";
	        if (hex._color) {
	            color = hex._color;
	        }
			
			var h = new Hexagon(start, color);
			h.setEdges(hex.countryEdgeDirections(), isFighting ? "red" : "black");
			self._mapGraph.push(h);
		},
		
				
		_renderDice: function (countryId, state) {
			if (Globals.suppress_ui || !this._initialized) {
				return;
			}
			
			var self = this;
			var ctr = self._map.countryCenter(countryId);
			

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
		
	};
	
	var Hexagon = function(upperLeft, color) {
		this._color = color;
		this._points = [];
		this._edges = [];
		this._edgeColor = "black";

		this._points.push([upperLeft[0] - Hex.FUDGE, upperLeft[1] - Hex.FUDGE, 0]);
		this._points.push([upperLeft[0] + Hex.EDGE_LENGTH + Hex.FUDGE, upperLeft[1] - Hex.FUDGE, 0]); 
		this._points.push([upperLeft[0] + Hex.EDGE_LENGTH + Hex.EDGE_LENGTH / 2, upperLeft[1] + Hex.HEIGHT / 2, 0]);
        this._points.push([upperLeft[0] + Hex.EDGE_LENGTH + Hex.FUDGE, upperLeft[1] + Hex.HEIGHT + Hex.FUDGE, 0]);
        this._points.push([upperLeft[0] - Hex.FUDGE, upperLeft[1] + Hex.HEIGHT + Hex.FUDGE, 0]);
        this._points.push([upperLeft[0] - Hex.EDGE_LENGTH / 2, upperLeft[1] + Hex.HEIGHT / 2, 0]);
        this._points.push([upperLeft[0] - Hex.FUDGE, upperLeft[1] - Hex.FUDGE, 0]);
	};

	Hexagon.prototype.color = function() {
		return this._color;
	};

	Hexagon.prototype.points = function() {
		return JSON.parse(JSON.stringify(this._points));
	};

	Hexagon.prototype.setEdges = function(edges, color) {
		this._edges = edges;
		this._edgeColor = color;
	};

	Hexagon.prototype.getEdges = function() {
		return this._edges;
	};

	Hexagon.prototype.edgeColor = function() {
		return this._edgeColor;
	};
	
});