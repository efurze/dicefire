'use strict'

$(function(){
	window.SVGrenderer = {
		
		_svg: null,
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
		_angle: 0,
		
		init: function(playerCount, map, playerNames) {
			if (!Globals.suppress_ui) {
				this._svg = d3.select("#svgcanvas");
				if (!this._svg) {
					console.log("No svg element");
					return;
				}

				this._map = map;
				this._names = playerNames || [];				
				this._initialized = true;
			}			
		},
		
		render: function(state, attackCallback) {
			if (Globals.suppress_ui || !this._initialized) {
				return;
			}
			Globals.debug("render()", Globals.LEVEL.TRACE, Globals.CHANNEL.RENDERER);
			Globals.ASSERT(state instanceof Gamestate);
			
			this._renderMap(state);
		},
		
		_renderMap: function(state) {
			if (Globals.suppress_ui || !this._initialized) {
				return;
			}
			Globals.debug("renderMap", Globals.LEVEL.TRACE, Globals.CHANNEL.RENDERER);
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
			
			//if (!stateHash.hasCountryChanged(countryId, isFighting, state.countryHash(countryId))) {
			//	return;
			//}
			
			Globals.debug("renderCountry " + countryId, Globals.LEVEL.DEBUG, Globals.CHANNEL.RENDERER);
			
			var self = this;
			isFighting = isFighting || false;
			
	        self._map.countryHexes(countryId).forEach(function(hexId) {
	            self._renderHex(self._map.getHex(hexId), state, isFighting);
	        });

	        self._renderNumberBox(countryId, state);

			// number boxes can overlap between adjacent countries. Redraw
			// them for all our neighbors
			self._map.adjacentCountries(countryId).forEach(function(neighborId) {
				self._renderNumberBox(neighborId, state);
			});
		},
		
		_renderHex: function(hex, state, isFighting) {
			var self = this;		
			var countryId = hex.countryId();
			var country = self._map.getCountry(countryId);	
			var points = [];
			var start = hex.upperLeft();
			
			points.push([start[0] - Hex.FUDGE, start[1] - Hex.FUDGE, 0]);
			points.push([start[0] + Hex.EDGE_LENGTH + Hex.FUDGE, start[1] - Hex.FUDGE, 0]); 
			points.push([start[0] + Hex.EDGE_LENGTH + Hex.EDGE_LENGTH / 2, start[1] + Hex.HEIGHT / 2, 0]);
	        points.push([start[0] + Hex.EDGE_LENGTH + Hex.FUDGE, start[1] + Hex.HEIGHT + Hex.FUDGE, 0]);
	        points.push([start[0] - Hex.FUDGE, start[1] + Hex.HEIGHT + Hex.FUDGE, 0]);
	        points.push([start[0] - Hex.EDGE_LENGTH / 2, start[1] + Hex.HEIGHT / 2, 0]);
	        points.push([start[0] - Hex.FUDGE, start[1] - Hex.FUDGE, 0]);
	
			//points = self.rotateX(points, [490, 290, 0], 0.2);
			//points = self.rotateY(points, [490, 290, 0], 0.2);
			
			
			var color = country ? SVGrenderer._countryDrawColor(countryId, state.countryOwner(countryId), isFighting) : "white";
	        if (hex._color) {
	            color = hex._color;
	        }
			
			var pointFunction = d3.svg.line()
									.x(function(point) { return point[0]; })
									.y(function(point) { return point[1]; })
									.interpolate("linear");
									
			self._svg.append("path")
						.attr("d", pointFunction(points))
						.attr("stroke", color)
						.attr("stroke-width", 1)
						.attr("fill", color);
			
			var edgeColor = isFighting ? "red" : "black";
			hex.countryEdgeDirections().forEach(function(edge) {
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
							.attr("stroke", edgeColor)
							.attr("stroke-width", 1);
			});

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
			
			var g = self._svg.append("g");
			
			g.append("rect")
				.attr("x", ctr[0] - boxSize)
				.attr("y", ctr[1] - boxSize * 1.6)
				.attr("width", boxSize * 2)
				.attr("height", boxSize * 2)
				.attr("stroke", "black")
				.attr("stroke-width", 1)
				.attr("fill", "white");
						
						
			g.append("text")
				.attr("x", ctr[0])
				.attr("y", ctr[1])
				.style("text-anchor", Globals.showCountryIds ? "start" : "middle")
				.attr("font-family", "sans-serif")
				.attr("font-size", "18px")
				.attr("font-weight", "bold")
				.text(state.countryDice(countryId));
				
			if (Globals.showCountryIds) {
				g.append("text")
					.attr("x", ctr[0])
					.attr("y", ctr[1])
					.style("text-anchor", "end")
					.attr("font-family", "sans-serif")
					.attr("font-size", "10px")
					.text(countryId);
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
		
		rotateX: function(points, axis, angle) {
			return points.map(function(point) {
				var translated = point.map(function(coord,idx){return coord - axis[idx];});
				return [translated[0] + axis[0],
						Math.cos(angle)*translated[1] - Math.sin(angle)*translated[2] + axis[1],
						Math.sin(angle)*translated[1] + Math.cos(angle)*translated[2] + axis[2]];
			});
		},
		
		rotateY: function(points, axis, angle) {
			return points.map(function(point) {
				var translated = point.map(function(coord,idx){return coord - axis[idx];});
				return [Math.cos(angle)*translated[0] + Math.sin(angle)*translated[2] + axis[0],
						translated[1] + axis[1],
						-Math.sin(angle)*translated[0] + Math.cos(angle)*translated[2] + axis[2]];
			});
		},
		
		rotateZ: function(points, axis, angle) {
			return points.map(function(point) {
				var translated = point.map(function(coord,idx){return coord - axis[idx];});
				return [Math.cos(angle)*translated[0] - Math.sin(angle)*translated[1] + axis[0],
						Math.sin(angle)*translated[0] + Math.cos(angle)*translated[1] + axis[1],
						translated[2] + axis[2]];
			});
		}
	};
});