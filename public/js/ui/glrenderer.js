//'use strict'
$(function(){	


	var rotWorldMatrix;

	// Rotate an object around an arbitrary axis in world space       
	function rotateAroundWorldAxis(object, axis, radians) {
	    rotWorldMatrix = new THREE.Matrix4();
	    rotWorldMatrix.makeRotationAxis(axis.normalize(), radians);
	    rotWorldMatrix.multiply(object.matrix);        // pre-multiply
	    object.matrix = rotWorldMatrix;
	    object.rotation.setFromRotationMatrix(object.matrix);
	};

	function rotateAroundXAxis(object, radians) {
		rotateAroundWorldAxis(object, new THREE.Vector3(1,0,0), radians);
	};

	function rotateAroundYAxis(object, radians) {
		rotateAroundWorldAxis(object, new THREE.Vector3(0,1,0), radians);
	};

	function rotateAroundZAxis(object, radians) {
		rotateAroundWorldAxis(object, new THREE.Vector3(0,0,1), radians);
	};

	window.GLrenderer = {
		
		X: 0, Y:1, Z: 2,
		_context: null,
		_initialized: false,
		_mouseOverCountry: -1,
		_selectedCountry: -1,
		_names: [],
		_map: null,
		_playerColors: [
			0xff0000,
			0x0000ff,
			0x00ff00,
			0xffff00,
			0xff9000,
			0x900090,
			0x804030,
			0xb09080
		],
		_angleY: 0,
		_angleX: 0,
		_angleZ: -Math.PI/2,
		_radius: 75,
		_mouseDown: false,
		_lastMouseX: -1,
		_lastMouseY: -1,
		_lastState: null,
		_lastRenderTime: -1,
		_mapGraph: [],  // array of Hexagon
		_diceGraph: [], // array of Cube
		_cylinders: {},
		
		init: function(playerCount, canvas, map, playerNames) {
			var self = this;
			if (!Globals.suppress_ui) {

				$('#canvas_div').css('display', 'block');
				this._map = map;
				this._names = playerNames || [];
				this._initialized = true;

				var canvas = $('#c')[0];
				this._scene = new THREE.Scene();
				this._camera = new THREE.PerspectiveCamera( 75, c.width / c.height, 0.1, 1000 );
				this._camera.up = new THREE.Vector3(0,0,1);
				this._camera.position.z = 35;

				this._camera.position.y = this._radius * Math.sin(this._angleZ);
				this._camera.position.x = this._radius * Math.cos(this._angleZ);
				this._camera.lookAt(new THREE.Vector3(0, 0, 0));

				var ambientLight = new THREE.AmbientLight( 0x000000 );
				this._scene.add( ambientLight );

				var lights = [];
				lights[0] = new THREE.PointLight( 0xffffff, 1, 0 );
				lights[1] = new THREE.PointLight( 0xffffff, 1, 0 );
				lights[2] = new THREE.PointLight( 0xffffff, 1, 0 );
				
				lights[0].position.set( 0, 200, 0 );
				lights[1].position.set( 100, 200, 100 );
				lights[2].position.set( -100, -200, -100 );

				this._scene.add( lights[0] );
				this._scene.add( lights[1] );
				this._scene.add( lights[2] );				


				this._renderer = new THREE.WebGLRenderer({ antialias: true });
				this._renderer.setSize(c.width, c.height);
				$('#c').hide();
				$('#canvas_div').append(this._renderer.domElement);
				$(this._renderer.domElement).on('mousedown', GLrenderer.mouseDown.bind(this));
				$(this._renderer.domElement).on('mouseup', GLrenderer.mouseUp.bind(this));
				$(this._renderer.domElement).on('mousemove', GLrenderer.mouseMove.bind(this));
				$(document).keydown(GLrenderer.keyDown.bind(this));

				this.update();
			}
		},

		update: function() {
			requestAnimationFrame(this.renderEngineCallback.bind(this));
		},

		renderEngineCallback: function() {
			var self = this;
			self._renderer.render(self._scene, self._camera);
		},
		
		keyDown: function(event) {
			// 37 = left
			// 38 = up
			// 39 = right
			// 40 = down
			// 87 = w
			// 83 = s
			// 65 = a
			// 68 = d
			//console.log(event.which);
			var self = this;
			switch (event.which) {
				case 37: // left
					self._angleZ -= .1;
					//self._camera.position.x -= 5;
					break;
				case 38: // up
					//self._camera.position.y += 5;
					self._radius -= 10;
					self._radius = Math.max(self._radius, 0);
					break;
				case 39: // right
					self._angleZ += .1;
					//self._camera.position.x += 5;
					break;
				case 40: // down
					//self._camera.position.y -= 5;
					self._radius += 10;
					break;
			}

			self._camera.position.y = self._radius * Math.sin(self._angleZ);
			self._camera.position.x = self._radius * Math.cos(self._angleZ);		
			self._camera.lookAt(new THREE.Vector3(0, 0, 0));

			if (self._lastState) {
					self.render(self._lastState);
			}
			self.update();
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
				//this._angleX += dx;
				this._angleZ += dx/1000;
				//this._angleY += dy;
				console.log("LSKDJFS");

				/*
				this._lastMouseX = event.offsetX;
				this._lastMouseY = event.offsetY;
				
				this._angleY += dx/300;
				this._angleX -= dy/300;
				*/
				if (this._lastState) {
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
			if (/*state == this._lastRenderedState &&*/ Date.now() - this._lastRenderTime < 20000000000) { //200) {
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
	

			self._drawDice(countryId, state);
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

				// By convention the first vertex is the center.
				var vertices = hex.points();

		

				var color = hex.color();
				var hexColors = [];
				for (var i = 0; i < vertices.length; i++) {
					hexColors = hexColors.concat(color);
				}

//				console.log(vertices);
//				console.log(hexColors);


			});
			
			//self._renderDice();
			
		},
		
		_drawHex: function(hex, state, isFighting) {
			var self = this;					
			var countryId = hex.countryId();
			var country = self._map.getCountry(countryId);	
			var start = hex.upperLeft();
			
			var color = country ? GLrenderer._countryDrawColor(countryId, state.countryOwner(countryId), isFighting) : "white";
	        if (hex._color) {
	            color = hex._color;
	        }
			
			var geometry = new THREE.CylinderGeometry( 0.9, 0.9, /*country.numDice() * 4*/1, 6);
			var material = new THREE.MeshPhongMaterial({color: color, specular: 0x111111, shininess: 30, shading: THREE.FlatShading});
			var cylinder = new THREE.Mesh(geometry, material);
			cylinder.rotation.x = Math.PI / 2;
			cylinder.rotation.y = Math.PI / 6;
			cylinder.position.x = ( start[0] - (Hex.NUM_WIDE * Hex.EDGE_LENGTH) ) / Hex.EDGE_LENGTH;
			cylinder.position.y = ( start[1] - (Hex.NUM_HIGH * Hex.HEIGHT / 4) ) / Hex.EDGE_LENGTH;	
			this._scene.add(cylinder);
	        self._cylinders[hex.id()] = cylinder;

			var h = new Hexagon(start, color);
			h.setEdges(hex.countryEdgeDirections(), isFighting ? "red" : "black");
			self._mapGraph.push(h);
		},
		
		
		_drawDice: function (countryId, state) {
			if (Globals.suppress_ui || !this._initialized) {
				return;
			}
			
			var self = this;
			/*
			var ctr = self._map.countryCenter(countryId);
			
			self._diceGraph.push(new Cube(ctr, "gray"));
			*/
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
				
				switch (i) {
					case Cube.FACE.NORTH:
						break;
					case Cube.FACE.EAST:
						break;
					case Cube.FACE.SOUTH:
						break;
					case CUBE.FACE.WEST:
						break;
				}
				
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
			
		},
		
		_countryDrawColor: function(countryId, ownerId, isFighting) {
			var self = this;
			if (isFighting) {
				return [0.0, 0.0, 0.0, 1.0];
			} else if (countryId == self._mouseOverCountry) {
		        if (countryId == self._selectedCountry) {
		            return [0.5, 0.5, 0.5, 1.0];
		        } else {
		            return [0.7, 0.7, 0.7, 1.0];
		        }
		    } else {
		        if (countryId == self._selectedCountry) {
		            return [0.0, 0.0, 0.0, 1.0];
		        } else {
		            return self._playerColors[ownerId];
		        }
		    }
		}
		

	};
	
	
	
	
	var Hexagon = function(upperLeft, color) {
		this._color = color;
		this._points = [];
		this._edges = [];
		this._edgeColor = "black";

        // Compute the center
	    this._center = upperLeft;
	    this._center[0] += Math.floor(Hex.EDGE_LENGTH / 2);
	    this._center[1] += Math.floor(Hex.HEIGHT / 2);

	    // Make the points array
		this._points = [
			this._center[0],										this._center[1],						0,
			upperLeft[0] - Hex.FUDGE, 								upperLeft[1] - Hex.FUDGE, 				0,
			upperLeft[0] + Hex.EDGE_LENGTH + Hex.FUDGE, 			upperLeft[1] - Hex.FUDGE, 				0,
			upperLeft[0] + Hex.EDGE_LENGTH + Hex.EDGE_LENGTH / 2, 	upperLeft[1] + Hex.HEIGHT / 2, 			0,
			upperLeft[0] + Hex.EDGE_LENGTH + Hex.FUDGE, 			upperLeft[1] + Hex.HEIGHT + Hex.FUDGE, 	0,
			upperLeft[0] - Hex.EDGE_LENGTH / 2, 					upperLeft[1] + Hex.HEIGHT / 2, 			0,
			upperLeft[0] - Hex.FUDGE, 								upperLeft[1] - Hex.FUDGE, 				0
		];

		for (var i = 0; i < 7; i++) {
			this._points[i * 3] /= 100;
			this._points[i * 3] -= Math.floor(this._points[i * 3]);
			this._points[i * 3 + 1] /= 100;
			this._points[i * 3 + 1] -= Math.floor(this._points[i * 3 + 1]);
		}
	};

	Hexagon.prototype.color = function() {
		return this._color;
	};

	Hexagon.prototype.points = function() {
		return this._points;
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


	Hexagon.prototype.center = function() {
		return this._center;
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

});


