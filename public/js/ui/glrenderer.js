//'use strict'




$(function(){
	var gl;

    function getShader(gl, id) {
        var shaderScript = document.getElementById(id);
        if (!shaderScript) {
            return null;
        }

        var str = "";
        var k = shaderScript.firstChild;
        while (k) {
            if (k.nodeType == 3) {
                str += k.textContent;
            }
            k = k.nextSibling;
        }

        var shader;
        if (shaderScript.type == "x-shader/x-fragment") {
            shader = gl.createShader(gl.FRAGMENT_SHADER);
        } else if (shaderScript.type == "x-shader/x-vertex") {
            shader = gl.createShader(gl.VERTEX_SHADER);
        } else {
            return null;
        }

        gl.shaderSource(shader, str);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            alert(gl.getShaderInfoLog(shader));
            return null;
        }

        return shader;
    }


    var shaderProgram;

    function initShaders() {
        var fragmentShader = getShader(gl, "shader-fs");
        var vertexShader = getShader(gl, "shader-vs");

        shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);

        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            alert("Could not initialise shaders");
        }

        gl.useProgram(shaderProgram);

        shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
        gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

        shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
        gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);

        shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
        shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    }


    var mvMatrix = mat4.create();
    var pMatrix = mat4.create();

    function setMatrixUniforms() {
        gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
        gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
    }

	
	window.GLrenderer = {
		
		X: 0, Y:1, Z: 2,
		_context: null,
		_initialized: false,
		_mouseOverCountry: -1,
		_selectedCountry: -1,
		_names: [],
		_map: null,
		_playerColors: [
			[1.0, 0.0, 0.0, 1.0],
			[0.0, 0.0, 1.0, 1.0],
			[0.0, 1.0, 0.0, 1.0],
			[1.0, 1.0, 0.0, 1.0],
			[1.0, 0.6, 0.0, 1.0],
			[0.6, 0.0, 0.6, 1.0],
			[0.5, 0.3, 0.2, 1.0],
			[0.8, 0.6, 0.5, 1.0]
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
				var canvas = $('#c')[0];
				try {
					gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
			        initShaders(gl);

					gl.clearColor(1.0, 1.0, 1.0, 1.0);
					gl.viewportWidth = canvas.width;
					gl.viewportHeight = canvas.height;
					gl.enable(gl.DEPTH_TEST);
//					gl.depthFunc(gl.LEQUAL);
					this._context = gl;
				} catch(e) {
					console.error("Couldn't get GL context", e);
					return;
				}

				$('#canvas_div').css('display', 'block');
//				$('#c').on('mousedown', SVGrenderer.mouseDown.bind(this));
//				$('#c').on('mouseup', SVGrenderer.mouseUp.bind(this));
//				$('#c').on('mousemove', SVGrenderer.mouseMove.bind(this));

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

	        gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	        mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);

	        mat4.identity(mvMatrix);

			mat4.translate(mvMatrix, [0.0, 0.0, -2.0]);


			self._mapGraph.slice(0,1).forEach(function(hex) {

				// By convention the first vertex is the center.
				var vertices = hex.points();

				var hexVerticesBuffer = gl.createBuffer();
				gl.bindBuffer(gl.ARRAY_BUFFER, hexVerticesBuffer);				
				gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
				hexVerticesBuffer.itemSize = 3;
				hexVerticesBuffer.numItems = 7;			

				var color = hex.color();
				var hexColors = [];
				for (var i = 0; i < 7; i++) {
					hexColors = hexColors.concat(color);
				}
				var hexVerticesColorBuffer = gl.createBuffer();
				gl.bindBuffer(gl.ARRAY_BUFFER, hexVerticesColorBuffer);
				gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(hexColors), gl.STATIC_DRAW);
				hexVerticesColorBuffer.itemSize = 4;
				hexVerticesColorBuffer.numItems = 7;

				console.log(vertices);
				console.log(hexColors);
		        gl.bindBuffer(gl.ARRAY_BUFFER, hexVerticesBuffer);
		        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, hexVerticesBuffer.itemSize, gl.FLOAT, false, 0, 0);

		        gl.bindBuffer(gl.ARRAY_BUFFER, hexVerticesColorBuffer);
		        gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, hexVerticesColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

		        setMatrixUniforms(gl);
		        gl.drawArrays(gl.TRIANGLES, 0, hexVerticesBuffer.numItems);


/*

        squareVertexPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
        vertices = [
             1.0,  1.0,  0.0,
            -1.0,  1.0,  0.0,
             1.0, -1.0,  0.0,
            -1.0, -1.0,  0.0
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        squareVertexPositionBuffer.itemSize = 3;
        squareVertexPositionBuffer.numItems = 4;

        squareVertexColorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexColorBuffer);
        colors = [];
        for (var i=0; i < 4; i++) {
            colors = colors.concat([0.5, 0.5, 1.0, 1.0]);
        }
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
        squareVertexColorBuffer.itemSize = 4;
        squareVertexColorBuffer.numItems = 4;


        mat4.translate(mvMatrix, [3.0, 0.0, 0.0]);
        gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, squareVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexColorBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, squareVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

        setMatrixUniforms(gl);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, squareVertexPositionBuffer.numItems);

*/
/*
				
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

					var edgePath = new Path2D();
					edgePath.moveTo(p1[0], p1[1]);
					edgePath.lineTo(p2[0], p2[1]);
					edgePath.closePath();

					self._context.strokeStyle = hex.edgeColor();
	                self._context.lineWidth = hex.BORDER_THICKNESS;
	                self._context.stroke(edgePath);
				});
				*/
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





    var triangleVertexPositionBuffer;
    var triangleVertexColorBuffer;
    var squareVertexPositionBuffer;
    var squareVertexColorBuffer;

    function initBuffers() {
        triangleVertexPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexPositionBuffer);
        var vertices = [
             0.0,  1.0,  0.0,
            -1.0, -1.0,  0.0,
             1.0, -1.0,  0.0,
             0.0, -3.0,  0.0
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        triangleVertexPositionBuffer.itemSize = 3;
        triangleVertexPositionBuffer.numItems = 4;

        triangleVertexColorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexColorBuffer);
        var colors = [
            1.0, 0.0, 0.0, 1.0,
            0.0, 1.0, 0.0, 1.0,
            0.0, 0.0, 1.0, 1.0,
            1.0, 1.0, 0.0, 1.0
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
        triangleVertexColorBuffer.itemSize = 4;
        triangleVertexColorBuffer.numItems = 3;


        squareVertexPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
        vertices = [
             1.0,  1.0,  0.0,
            -1.0,  1.0,  0.0,
             1.0, -1.0,  0.0,
            -1.0, -1.0,  0.0
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        squareVertexPositionBuffer.itemSize = 3;
        squareVertexPositionBuffer.numItems = 4;

        squareVertexColorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexColorBuffer);
        colors = [];
        for (var i=0; i < 4; i++) {
            colors = colors.concat([0.5, 0.5, 1.0, 1.0]);
        }
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
        squareVertexColorBuffer.itemSize = 4;
        squareVertexColorBuffer.numItems = 4;
    }



    function drawScene() {
        gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);

        mat4.identity(mvMatrix);

        mat4.translate(mvMatrix, [-1.5, 0.0, -7.0]);
        gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, triangleVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexColorBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, triangleVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

        setMatrixUniforms(gl);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, triangleVertexPositionBuffer.numItems);

        mat4.translate(mvMatrix, [3.0, 0.0, 0.0]);
        gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, squareVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexColorBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, squareVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

        setMatrixUniforms(gl);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, squareVertexPositionBuffer.numItems);
    }



    function webGLStart() {
        var canvas = document.getElementById("c");
//        initGL(canvas);
//        initShaders();
        initBuffers();

//        gl.clearColor(0.0, 0.0, 0.0, 1.0);
 //       gl.enable(gl.DEPTH_TEST);

        drawScene();
    }

	window.startIt = webGLStart;
});


