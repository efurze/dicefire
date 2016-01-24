//'use strict'



var GLrenderer = {
		
		X: 0, Y:1, Z: 2,
		_context: null,
		_initialized: false,
		_highlightedCountry: -1,
		_selectedCountry: -1,
		_mouseOverCountry: -1,
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
		_theta: Math.PI/4,
		_elevation: 35,
		_radius: 75,
		_mouseDown: false,
		_lastMouseX: -1,
		_lastMouseY: -1,
		_lastRenderTime: -1,
		_diceGraph: [], // array of Cube
		_cylinders: {},
		_canvasHeight: 0,
		_canvasWidth: 0,
		mouseVector: null,
		raycaster: null,
		_listener: null,
		
		init: function(playerCount, canvas, map, playerNames, listener) {
			var self = this;
			if (!Globals.suppress_ui) {
				Globals.ASSERT(Globals.implements(listener, Renderer.iface));
				this._listener = listener;
				this.mouseVector = new THREE.Vector2();
				this.raycaster = new THREE.Raycaster();

				$('#canvas_div').css('display', 'block');
				this._map = map;
				this._names = playerNames || [];
				this._initialized = true;

				var canvas = $('#c')[0];
				this._scene = new THREE.Scene();
				this._camera = new THREE.PerspectiveCamera( 75, c.width / c.height, 0.1, 1000 );
				this._camera.up = new THREE.Vector3(0,0,1);

				var xyProjection = self._radius * Math.cos(self._theta);
				self._camera.position.z = self._radius * Math.sin(self._theta);
				self._camera.position.y = xyProjection * Math.sin(self._angleZ);
				self._camera.position.x = xyProjection * Math.cos(self._angleZ);

				this._camera.lookAt(new THREE.Vector3(0, 0, 0));

				var ambientLight = new THREE.AmbientLight( 0x000000 );
				this._scene.add( ambientLight );

				var lights = [];
				lights[0] = new THREE.PointLight( 0xffffff, 1, 0 );
				lights[1] = new THREE.PointLight( 0xffffff, 1, 0 );
				lights[2] = new THREE.PointLight( 0xffffff, 1, 0 );
				
				lights[0].position.set( 0, 200, 200 );
				lights[0].position.set( 0, -200, 200 );
				lights[1].position.set( 200, 0, 200 );
				lights[2].position.set( -200, 0, 200 );

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
				$(this._renderer.domElement).on('mouseleave', GLrenderer.mouseLeave.bind(this));
				$(document).keydown(GLrenderer.keyDown.bind(this));

				var canvas = $(this._renderer.domElement);
				this._canvasWidth = canvas.width();
				this._canvasHeight = canvas.height();
			}
		},

		setMouseOverCountry: function(id) {
			var old = this._highlightedCountry
			this._highlightedCountry = id;
		},
		
		setSelectedCountry: function(id) {
			var old = this._selectedCountry;
			this._selectedCountry = id;
		},

		
		render: function(state, attackCallback) {
			if (this._isAnimatingAttack) {
				Globals.debug("attack animating, render aborted", Globals.LEVEL.TRACE, Globals.CHANNEL.RENDERER);
				return;
			}
			Globals.debug("render()", Globals.LEVEL.TRACE, Globals.CHANNEL.RENDERER);
			Globals.ASSERT(state instanceof Gamestate);
			
			this._drawMap(state);
			
			if (state.attack()) {
				this._renderAttack(state, attackCallback);
			}

			this._lastRenderedState = state;
			this._lastRenderTime = Date.now();
			this.update();
		},

		/*
			@callback: function done(){}
		*/
		_renderAttack: function(state, callback) {
		
			if (Globals.suppress_ui || !this._initialized || !state || this._isAnimatingAttack) {
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
			
	
			// roll attacker
			Globals.debug("render attacker", Globals.LEVEL.INFO, Globals.CHANNEL.RENDERER);
			self._drawCountry(fromCountry, state, true);
			self.update();
	        
			if (Globals.play_sounds && callback) {
	            $.playSound('/sounds/2_dice_throw_on_table');
	        }

	        self._isAnimatingAttack = true;

			var timeout = callback ? Globals.timeout : 0;
	        window.setTimeout(function(){renderAttackRoll(state);}, timeout);
	
			function renderAttackRoll(state) {
				Globals.debug("render defender", Globals.LEVEL.INFO, Globals.CHANNEL.RENDERER);
				self._drawCountry(toCountry, state, true);
				self.update();
	            window.setTimeout(function(){renderDefendRoll(state);}, timeout);
			}
			
			function renderDefendRoll(state) {
				Globals.debug("render defense roll", Globals.LEVEL.INFO, Globals.CHANNEL.RENDERER);
	            window.setTimeout(function(){renderVerdict(state);}, timeout);
			}
			
			function renderVerdict(state) {
				Globals.debug("render verdict", Globals.LEVEL.INFO, Globals.CHANNEL.RENDERER);
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

	            self._isAnimatingAttack = false;
				if (callback) {
					callback(state.attack());
				}
			}
		
		},
		
		
		_drawMap: function(state) {
			if (Globals.suppress_ui || !this._initialized) {
				return;
			}
			Globals.debug("drawMap", Globals.LEVEL.DEBUG, Globals.CHANNEL.RENDERER);
			Globals.ASSERT(state instanceof Gamestate);
			
			var self = this;
			self._diceGraph = [];
			state.countryIds().forEach(function(countryId) {
				self._drawCountry(countryId, state)
			});
		},
		
		_drawCountry: function (countryId, state, isFighting) {
			if (Globals.suppress_ui || !this._initialized) {
	        	return;
			}

			var self = this;
			isFighting = isFighting || false;
			
			if (!self.stateHash.hasCountryChanged(countryId, isFighting, state.countryHash(countryId))) {
				return;
			}
			
			Globals.debug("drawCountry " + countryId, Globals.LEVEL.TRACE, Globals.CHANNEL.RENDERER);
			
			self._map.countryHexes(countryId).forEach(function(hexId) {
				self._drawHex(self._map.getHex(hexId), state, isFighting);
			});
	
			//self._drawDice(countryId, state);

		},
		
		
		_drawHex: function(hex, state, isFighting) {
			var self = this;					
			var countryId = hex.countryId();
			var country = self._map.getCountry(countryId);	
			var start = hex.upperLeft();
			
			
			
			if (!self._cylinders[hex.id()]) {
				var color = self._playerColors[state.countryOwner(countryId)];
				var geometry = new THREE.CylinderGeometry( 1, 1, country.numDice() * 4, 6);
				var material = new THREE.MeshPhongMaterial({color: color, specular: 0x111111, shininess: 30, shading: THREE.FlatShading});
				var cylinder = new THREE.Mesh(geometry, material);
				cylinder.rotation.x = Math.PI / 2;
				cylinder.rotation.y = Math.PI / 6;
				cylinder.position.x = ( start[0] - (Hex.NUM_WIDE * Hex.EDGE_LENGTH) ) / Hex.EDGE_LENGTH;
				cylinder.position.y = ( start[1] - (Hex.NUM_HIGH * Hex.HEIGHT / 4) ) / Hex.EDGE_LENGTH;	
				cylinder.userData['hexId'] = hex.id();
				self._scene.add(cylinder);
				self._cylinders[hex.id()] = cylinder;
			} else {
				var cylinder = self._cylinders[hex.id()];
				self._scene.remove(cylinder);
				cylinder.material.color = self._getCountryColor(countryId, state, isFighting);
				cylinder.geometry.dispose();
				cylinder.geometry = null;
				cylinder.geometry = new THREE.CylinderGeometry( 1, 1, country.numDice() * 4, 6);
				self._scene.add(cylinder);
			}
		},

		_getCountryColor: function(countryId, state, isFighting) {
			var self = this;
			isFighting = isFighting || false;
			var country = self._map.getCountry(countryId);	
			var color = new THREE.Color(self._playerColors[country.ownerId()]);

			if (isFighting) {
				color = new THREE.Color("rgb(50, 50, 50)");
			} else if (countryId == self._highlightedCountry) {
				if (countryId == self._selectedCountry) {
					color = new THREE.Color("rgb(75, 75, 75)");
				} else {
					color = new THREE.Color("rgb(100, 100, 100)");
				}
			} else {
				if (countryId == self._selectedCountry) {
					color = new THREE.Color("rgb(50, 50, 50)");
				} 
			}

			return color;
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
		

		mouseLeave: function(event) {
			this._lastMouseX = -1;
			this._lastMouseY = -1;
			if (this._listener && this._mouseOverCountry != -1) {
				this._mouseOverCountry = -1;
				this._listener.mouseOverCountry(-1);
			}
		},


		mouseMove: function(event) {
			var self = this;
			
			self.mouseVector.x = 2 * (event.offsetX / self._canvasWidth) - 1;
			self.mouseVector.y = 1 - 2 * ( event.offsetY / self._canvasHeight );

			var hexes = [];
			Object.keys(self._cylinders).forEach(function(id) {
				hexes.push(self._cylinders[id]);
			});

			self.raycaster.setFromCamera(self.mouseVector, self._camera);
			var intersects = self.raycaster.intersectObjects(hexes);

			var cylinder = intersects[0];
			var countryId = -1;
			if (cylinder) {
				var hex = self._map.getHex(cylinder.object.userData.hexId);
				if (hex) {
					countryId = hex.countryId();
				}
			}

			if (self._mouseOverCountry != countryId) {
				self._mouseOverCountry = countryId;
				if (self._listener) {
					self._listener.mouseOverCountry(countryId);
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
		
		keyDown: function(event) {
			
			var self = this;

			switch (event.which) {
				case 37: // left
				case 65: // a
					self._angleZ -= .1;
					//self._camera.position.x -= 5;
					//self._camera.translateOnAxis(new THREE.Vector3(1,0,0), -5);
					break;
				case 38: // up
				case 87: // w
					//self._elevation += 5;
					self._theta += .1;
					self._theta = Math.min(self._theta, Math.PI/2);
					break;
				case 39: // right
				case 68: // d
					self._angleZ += .1;
					//self._camera.position.x += 5;
					//self._camera.translateOnAxis(new THREE.Vector3(1,0,0), 5);
					break;
				case 40: // down
				case 83: // s
					//self._elevation -= 5;
					self._theta -= .1;
					self._theta = Math.max(self._theta, 0);
					break;
				case 81: // q
					self._radius -= 5;
					self._radius = Math.max(self._radius, 0);
					break;
				case 90: // z
					self._radius += 5;
					break;
			}

			var xyProjection = self._radius * Math.cos(self._theta);
			self._camera.position.z = self._radius * Math.sin(self._theta);
			self._camera.position.y = xyProjection * Math.sin(self._angleZ);
			self._camera.position.x = xyProjection * Math.cos(self._angleZ);

			self._camera.lookAt(new THREE.Vector3(0, 0, 0));

			if (self._lastRenderedState) {
					self.render(self._lastRenderedState);
			}
		},

		update: function() {
			var self = this;
			Globals.debug("update()", Globals.LEVEL.DEBUG, Globals.CHANNEL.RENDERER);
			requestAnimationFrame(self.renderEngineCallback.bind(self));
		},

		renderEngineCallback: function() {
			//Globals.debug("renderEngineCallback", Globals.LEVEL.DEBUG, Globals.CHANNEL.RENDERER);
			var self = this;	
			console.time("RenderTime");
			self._renderer.render(self._scene, self._camera);
			console.timeEnd("RenderTime");
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
				if (countryId == GLrenderer._highlightedCountry) {
					hash += 2;
				}
				if (countryId == GLrenderer._selectedCountry) {
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
	

