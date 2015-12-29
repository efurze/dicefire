'use strict'

var SVG = false;

$(function(){
	window.SVGrenderer = {
		
		_svg: null,
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
		_angleY: 0,
		_angleX: 0,
		_mouseDown: false,
		_lastMouseX: -1,
		_lastMouseY: -1,
		_lastState: null,
		_lastRenderTime: -1,
		
		init: function(playerCount, canvas, map, playerNames) {
			if (!Globals.suppress_ui) {
				this._svg = d3.select("#svgcanvas");
				if (!this._svg) {
					console.log("No svg element");
					return;
				}
				
				this._context = canvas.getContext('2d');
				
				if (SVG) {
					$('#svgcanvas').on('mousedown', SVGrenderer.mouseDown.bind(this));
					$('#svgcanvas').on('mouseup', SVGrenderer.mouseUp.bind(this));
					$('#svgcanvas').on('mousemove', SVGrenderer.mouseMove.bind(this));
				} else {
					$('#c').on('mousedown', SVGrenderer.mouseDown.bind(this));
					$('#c').on('mouseup', SVGrenderer.mouseUp.bind(this));
					$('#c').on('mousemove', SVGrenderer.mouseMove.bind(this));
				}

				this._map = map;
				this._names = playerNames || [];
				this._initialized = true;
			}			
		},
		
		mouseMove: function(event) {
			if (this._mouseDown) {
				if (this._lastMouseX < 0 || this._lastMouseY < 0) {
					this._lastMouseX = event.offsetX;
					this._lastMouseY = event.offsetY;
					return;
				}
				
				var dx = this._lastMouseX - event.offsetX;
				var dy = this._lastMouseY - event.offsetY;
				this._lastMouseX = event.offsetX;
				this._lastMouseY = event.offsetY;
				
				this._angleY += dx/300;
				this._angleX -= dy/300;
				if (this._lastState) {
					this._svg.selectAll("*").remove();
					this.render(this._lastState);
				}
			}
		},
		
		mouseDown: function() {
			this._mouseDown = true;
		},
		
		mouseUp: function() {
			this._mouseDown = false;
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
			
			this._renderMap(state);
			this._lastState = state;
			this._lastRenderTime = Date.now();
		},
		
		_renderMap: function(state) {
			if (Globals.suppress_ui || !this._initialized) {
				return;
			}
			Globals.debug("renderMap", Globals.LEVEL.TRACE, Globals.CHANNEL.RENDERER);
			Globals.ASSERT(state instanceof Gamestate);
			var self = this;
			
			self._context.clearRect(0,0,2000,2000);
			
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
	
			//self._renderHex(self._map.getHex(self._map.countryHexes(countryId)[0]), state, isFighting);
			//self._renderHex(self._map.getHex(self._map.countryHexes(countryId)[1]), state, isFighting);
			//self._renderHex(self._map.getHex(self._map.countryHexes(countryId)[2]), state, isFighting);

	        //self._renderNumberBox(countryId, state);

			// number boxes can overlap between adjacent countries. Redraw
			// them for all our neighbors
			//self._map.adjacentCountries(countryId).forEach(function(neighborId) {
			//	self._renderNumberBox(neighborId, state);
			//});
		},
		
		_renderHex: function(hex, state, isFighting) {
			var self = this;		
			var countryId = hex.countryId();
			var country = self._map.getCountry(countryId);	
			var start = hex.upperLeft();
			
			var color = country ? SVGrenderer._countryDrawColor(countryId, state.countryOwner(countryId), isFighting) : "white";
	        if (hex._color) {
	            color = hex._color;
	        }
			
			var points = [];
			points.push([start[0] - Hex.FUDGE, start[1] - Hex.FUDGE, 0]);
			points.push([start[0] + Hex.EDGE_LENGTH + Hex.FUDGE, start[1] - Hex.FUDGE, 0]); 
			points.push([start[0] + Hex.EDGE_LENGTH + Hex.EDGE_LENGTH / 2, start[1] + Hex.HEIGHT / 2, 0]);
	        points.push([start[0] + Hex.EDGE_LENGTH + Hex.FUDGE, start[1] + Hex.HEIGHT + Hex.FUDGE, 0]);
	        points.push([start[0] - Hex.FUDGE, start[1] + Hex.HEIGHT + Hex.FUDGE, 0]);
	        points.push([start[0] - Hex.EDGE_LENGTH / 2, start[1] + Hex.HEIGHT / 2, 0]);
	        points.push([start[0] - Hex.FUDGE, start[1] - Hex.FUDGE, 0]);

			points = self.rotateX(points, [490, 290, 0], self._angleX);
			points = self.rotateY(points, [490, 290, 0], self._angleY);
			
			if (SVG) {
				var pointFunction = d3.svg.line()
										.x(function(point) { return point[0]; })
										.y(function(point) { return point[1]; })
										.interpolate("linear");
									
				self._svg.append("path")
							.attr("d", pointFunction(points))
							.attr("stroke", color)
							.attr("stroke-width", 1)
							.attr("fill", color);
			} else {
				var upperLeft = hex.upperLeft();
		        var upperLeftX = upperLeft[0], upperLeftY = upperLeft[1];
		
				var path = new Path2D();
		        path.moveTo(points[0][0], points[0][1]);
		        path.lineTo(points[1][0], points[1][1]);
		        path.lineTo(points[2][0], points[2][1]);
		        path.lineTo(points[3][0], points[3][1]);
		        path.lineTo(points[4][0], points[4][1]);
		        path.lineTo(points[5][0], points[5][1]);
		        path.lineTo(points[6][0], points[6][1]);
		        path.closePath();
				
				self._context.fillStyle = color;
				self._context.fill(path);
			}
			
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
				
				if (SVG) {
					self._svg.append("path")
								.attr("d", pointFunction([p1, p2]))
								.attr("stroke", edgeColor)
								.attr("stroke-width", 1);
				} else {
					var edgePath = new Path2D();
					edgePath.moveTo(p1[0], p1[1]);
					edgePath.lineTo(p2[0], p2[1]);
					edgePath.closePath();
					
					self._context.strokeStyle = edgeColor
	                self._context.lineWidth = hex.BORDER_THICKNESS;
	                self._context.stroke(edgePath);
				} 
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