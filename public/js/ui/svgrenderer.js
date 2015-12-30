'use strict'

var SVG = false;

$(function(){
	
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
	
	
	
	var Cube = function(ctr, color) {
		this._color = color;
		this._center = ctr;
		
		var r = Cube.EDGE_LENGTH / 2;
		
		this._bottomFace = [
			[ctr[0] - r, ctr[1] - r, 0], // upper left
			[ctr[0] + r, ctr[1] - r, 0], // upper right
			[ctr[0] + r, ctr[1] + r, 0],
			[ctr[0] - r, ctr[1] + r, 0],
		];
		
		this._topFace = [
			[ctr[0] - r, ctr[1] - r, Cube.EDGE_LENGTH], // upper left (northwest)
			[ctr[0] + r, ctr[1] - r, Cube.EDGE_LENGTH], // upper right (northeast)
			[ctr[0] + r, ctr[1] + r, Cube.EDGE_LENGTH], // lower right (southeast)
			[ctr[0] - r, ctr[1] + r, Cube.EDGE_LENGTH], // lower left (southwest)
		];
		
	};
	
	Cube.EDGE_LENGTH = Hex.EDGE_LENGTH * 1.5;
	Cube.EDGE_COLOR = "black";
	// North == -y direction
	// East == +x direction
	Cube.FACE = {'NORTH':0, 'EAST':1, 'SOUTH':2, 'WEST':3};
	Cube.CORNER = {'NORTHWEST': 0, 'NORTHEAST':1, 'SOUTHEAST':2, 'SOUTHWEST':3};
	
	Cube.prototype.bottomFace = function() {
		return JSON.parse(JSON.stringify(this._bottomFace));
	};
	
	Cube.prototype.topFace = function() {
		return JSON.parse(JSON.stringify(this._topFace));
	};
	
	Cube.prototype.color = function() {
		return this._color;
	};
	
	window.SVGrenderer = {
		
		X: 0, Y:1, Z: 2,
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
		_mapGraph: [],  // array of Hexagon
		_diceGraph: [], // array of Cube
		
		init: function(playerCount, canvas, map, playerNames) {
			if (!Globals.suppress_ui) {
				this._svg = d3.select("#svgcanvas");
				if (!this._svg) {
					console.log("No svg element");
					return;
				}
				
				this._context = canvas.getContext('2d');
				
				if (SVG) {
					$('#canvas_div').css('display', 'none');
					$('#svgcanvas').css('display', 'block');
					$('#svgcanvas').on('mousedown', SVGrenderer.mouseDown.bind(this));
					$('#svgcanvas').on('mouseup', SVGrenderer.mouseUp.bind(this));
					$('#svgcanvas').on('mousemove', SVGrenderer.mouseMove.bind(this));
				} else {
					$('#svgcanvas').css('display', 'none');
					$('#canvas_div').css('display', 'block');
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
			this._lastMouseX = -1;
			this._lastMouseY = -1;
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
			self._diceGraph = [];
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
	

			if (!SVG) {
				self._drawDice(countryId, state);
			}
	        //self._renderNumberBox(countryId, state);

			// number boxes can overlap between adjacent countries. Redraw
			// them for all our neighbors
			//self._map.adjacentCountries(countryId).forEach(function(neighborId) {
			//	self._renderNumberBox(neighborId, state);
			//});
		},
		
		_renderMap: function() {
			var self = this;
			self._context.clearRect(0,0,2000,2000);
			self._mapGraph.forEach(function(hex) {
				
				var points = hex.points();
				points = self.rotateX(points, [490, 290, 0], self._angleX);
				points = self.rotateY(points, [490, 290, 0], self._angleY);
			
				var color = hex.color();
			
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

					if (SVG) {
						self._svg.append("path")
									.attr("d", pointFunction([p1, p2]))
									.attr("stroke", hex.edgeColor())
									.attr("stroke-width", 1);
					} else {
						var edgePath = new Path2D();
						edgePath.moveTo(p1[0], p1[1]);
						edgePath.lineTo(p2[0], p2[1]);
						edgePath.closePath();

						self._context.strokeStyle = hex.edgeColor();
		                self._context.lineWidth = hex.BORDER_THICKNESS;
		                self._context.stroke(edgePath);
					} 
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
		
		
		_drawDice: function (countryId, state) {
			if (Globals.suppress_ui || !this._initialized) {
				return;
			}
			
			var self = this;
			var ctr = self._map.countryCenter(countryId);
			
			self._diceGraph.push(new Cube(ctr, "gray"));
		},
		
		_renderDice: function() {
			var self = this;
			self._diceGraph.forEach(function(die) {
				self._renderDie(die);
			});
		},
		
		_renderDie: function(die) {
			var self = this;
			
			var bottomFace = die.bottomFace();
			var topFace = die.topFace();
			
			bottomFace = self.rotateX(bottomFace, [490, 290, 0], self._angleX);
			bottomFace = self.rotateY(bottomFace, [490, 290, 0], self._angleY);
			topFace = self.rotateX(topFace, [490, 290, 0], self._angleX);
			topFace = self.rotateY(topFace, [490, 290, 0], self._angleY);
			
			self._context.strokeStyle = Cube.EDGE_COLOR;
			self._context.lineWidth = 1;
						
			var COLORS = ['white', 'blue', 'red', 'green'];
			
			// returns corner with largest z-value
			var topCorner = function() {
				var topCorner = Cube.CORNER.NORTHWEST;
				var z = 0;
				Cube.CORNER.forEach(function(corner) {
					if (topFace[corner][Z] > z) {
						z = topFace[corner][Z];
						topCorner = corner;
					}
				});
				return topCorner;
			};
			
			// draw faces
			var edgePath;
			for (var i=0; i < 4; i++) {
				edgePath = new Path2D();
				edgePath.moveTo(bottomFace[i][0], bottomFace[i][1]);
				edgePath.lineTo(bottomFace[(i+1) % 4][0], bottomFace[(i+1) % 4][1]);
				edgePath.lineTo(topFace[(i+1) % 4][0], topFace[(i+1) % 4][1]);
				edgePath.lineTo(topFace[i][0], topFace[i][1]);
				edgePath.closePath();
	            self._context.stroke(edgePath);
				self._context.fillStyle = 'gray';
				self._context.fill(edgePath);
			}
			
			// draw top
			edgePath = new Path2D();
			edgePath.moveTo(topFace[0][0], topFace[0][1]);
			edgePath.lineTo(topFace[1][0], topFace[1][1]);
			edgePath.lineTo(topFace[2][0], topFace[2][1]);
			edgePath.lineTo(topFace[3][0], topFace[3][1]);
			edgePath.lineTo(topFace[0][0], topFace[0][1]);
			edgePath.closePath();
            self._context.stroke(edgePath)
			self._context.fillStyle = "gray";
			self._context.fill(edgePath);
			
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