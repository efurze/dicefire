//'use strict'

var ANIMATE = false;
var DRAW_DICE = true;

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
		_mapCenterX: 0,
		_mapCenterY: 0,
		_angleY: 0,
		_angleX: 0,
		_angleZ: Math.PI/2,
		_theta: Math.PI/4,
		_elevation: 35,
		_radius: 75,
		_mouseDown: false,
		_lastMouseX: -1,
		_lastMouseY: -1,
		_lastRenderTime: -1,
		_diceGraph: [], // array of Cube
		_cylinders: {},
		_dice: {},
		_canvasHeight: 0,
		_canvasWidth: 0,
		_mouseVector: null,
		_raycaster: null,
		_listener: null,
		
		init: function(canvas, map, playerNames, listener) {
			var self = this;
			if (!Globals.suppress_ui) {
				Globals.ASSERT(Globals.implements(listener, Renderer.iface));
				this._listener = listener;
				this._mouseVector = new THREE.Vector2();
				this._raycaster = new THREE.Raycaster();

				this._map = map;
				this._names = playerNames || [];
				this._initialized = true;

				var maxX=-1, minX=10000, minY=10000, maxY=-1;
				map._hexArray.forEach(function(hex) {
					var ul = hex.upperLeft();
					maxX = Math.max(maxX, ul[0]);
					minX = Math.min(minX, ul[0]);
					maxY = Math.max(maxY, ul[1]);
					minY = Math.min(minY, ul[1]);
				});
				self._mapCenterX = (maxX - minX)/(2 * Hex.EDGE_LENGTH);
				self._mapCenterY = (maxY - minY)/(2 * Hex.EDGE_LENGTH);

				var canvas = $('#c')[0];
				this._scene = new THREE.Scene();
				this._camera = new THREE.PerspectiveCamera( 75, c.width / c.height, 1, 1000 );
				this._camera.up = new THREE.Vector3(0,0,1);

				var xyProjection = self._radius * Math.cos(self._theta);
				self._camera.position.z = self._radius * Math.sin(self._theta);
				self._camera.position.y = xyProjection * Math.sin(self._angleZ);
				self._camera.position.x = xyProjection * Math.cos(self._angleZ);

				self._camera.position.y += self._mapCenterY;
				self._camera.position.x += self._mapCenterX;

				this._camera.lookAt(new THREE.Vector3(self._mapCenterX, self._mapCenterY, 0));

				var ambientLight = new THREE.AmbientLight( 0x000000 );
				this._scene.add( ambientLight );

				var lights = [];
				lights[0] = new THREE.SpotLight( 0xffffff, 1, 0 );
				lights[1] = new THREE.SpotLight( 0xffffff, 1, 0 );
				lights[2] = new THREE.SpotLight( 0xffffff, 1, 0 );
				lights[3] = new THREE.SpotLight( 0xffffff, 1, 0 );
				
				lights[0].position.set( -200, 200, 100 );
				lights[1].position.set( 200, 200, 100 );
				lights[2].position.set( -200, -200, 100 );
				lights[3].position.set( -200, 200, 100 );

				lights[1].castShadow = true;
				lights[1].shadowDarkness = 1;

				this._scene.add( lights[0] );
				this._scene.add( lights[1] );
				this._scene.add( lights[2] );				


				this._renderer = new THREE.WebGLRenderer({ antialias: true });
				this._renderer.shadowMap.enabled = true;
				this._renderer.setSize(c.width, c.height);
				$('#canvas3d_div').append(this._renderer.domElement);
				$(this._renderer.domElement).on('mousedown', GLrenderer.mouseDown.bind(this));
				$(this._renderer.domElement).on('mouseup', GLrenderer.mouseUp.bind(this));
				$(this._renderer.domElement).on('mousemove', GLrenderer.mouseMove.bind(this));
				$(this._renderer.domElement).on('mouseleave', GLrenderer.mouseLeave.bind(this));
				$(document).keydown(GLrenderer.keyDown.bind(this));

				var canvas = $(this._renderer.domElement);
				this._canvasWidth = canvas.width();
				this._canvasHeight = canvas.height();
				
				this._texture = new THREE.TextureLoader().load('/public/images/dice6-red.png', function() {
					self.update();
				});

				
				var loader = new THREE.CubeTextureLoader();
				self._cubeTexture = loader.load(['/public/images/dice6.png',
											'/public/images/dice6.png',
											'/public/images/dice6.png',
											'/public/images/dice6.png',
											'/public/images/dice6.png',
			 								'/public/images/dice6.png'], 
							 				function(img) {
												self.update();
											}
				);
			}
		},

		setMouseOverCountry: function(id) {
			if (!this._isRendering) {
				Globals.debug("setMouseOverCountry", id, Globals.LEVEL.TRACE, Globals.CHANNEL.RENDERER);
				var old = this._highlightedCountry
				this._highlightedCountry = id;
				if (old != -1) {
					this._drawCountry(old, this._lastRenderedState, false);
				}
				if (id != -1) {
					this._drawCountry(id, this._lastRenderedState, false);
				}
				this.update();
			}
		},
		
		setSelectedCountry: function(id) {
			if (!this._isRendering) {
				Globals.debug("setSelectedCountry", id, Globals.LEVEL.TRACE, Globals.CHANNEL.RENDERER);
				var old = this._selectedCountry;
				this._selectedCountry = id;

				if (old != -1) {
					this._drawCountry(old, this._lastRenderedState, false);
				}
				if (id != -1) {
					this._drawCountry(id, this._lastRenderedState, false);
				}
				this.update();
			}
		},

		setPlayerName: function(id, name) {

		},

		render: function(state, callback) {
			var self = this;
			if (!state || self._isRendering) {
				Globals.debug("previous state rendering, render aborted", Globals.LEVEL.DEBUG, Globals.CHANNEL.RENDERER);
				if (callback) {
					//callback();
				}
				return;
			}
			self._isRendering = true;
			Globals.debug("render()", state.stateId(), Globals.LEVEL.TRACE, Globals.CHANNEL.RENDERER);
			Globals.ASSERT(state instanceof Gamestate);
			
			if (state.attack()) {
				this._renderAttack(state)
					.then(function() {
						self.update();
						self._lastRenderedState = state;
						self._lastRenderTime = Date.now();
						self._isRendering = false;
						if (callback) {
							callback(state, state.stateId());
						}
					});
			} else {
				this._drawMap(state, callback)
					.then(function() {
						self.update();
						self._lastRenderedState = state;
						self._lastRenderTime = Date.now();
						self._isRendering = false;
						if (callback) {
							callback(state, state.stateId());
						}
					});
			}
		},

		/*
			@callback: function stateRendered(state, id){}
		*/
		_renderAttack: function(state) {
		
			if (Globals.suppress_ui || !this._initialized || !state) {
				return;
			}

			var self = this;

			return new Promise(function(resolve) {
				Globals.debug("renderAttack", Globals.LEVEL.INFO, Globals.CHANNEL.RENDERER);
			
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
		        
				if (Globals.play_sounds) {
		            $.playSound('/sounds/2_dice_throw_on_table');
		        }

				var timeout =  Globals.timeout;
		        window.setTimeout(function(){renderAttackRoll(state);}, timeout);
		
				function renderAttackRoll(state) {
					Globals.debug("render defender", Globals.LEVEL.INFO, Globals.CHANNEL.RENDERER);
					self._drawCountry(toCountry, state, true);
					self.update();
					window.setTimeout(function(){renderDefendRoll(state);}, timeout);
					/*
					if (DRAW_DICE) {
						var ary = [];
						ary.length = fromNumDice;
						return Promise.map(ary, function(item, idx) {
							return animateAttackDice(idx+1);
						});
					} else {
			            window.setTimeout(function(){renderDefendRoll(state);}, timeout);
			        }
			        */
				}

				function animateAttackDice(diceId) {
					self._camera.updateMatrix();
					self._camera.updateMatrixWorld();

					var dest = self._camera.localToWorld(new THREE.Vector3(-7,2,-10));
					dest.x += (diceId-1);
					var dice = self._dice[fromCountry + ':' + diceId];
					var step = 0;
					var stepCount = 10;
					var stepX = (dest.x - dice.position.x)/stepCount;
					var stepY = (dest.y - dice.position.y)/stepCount;
					var stepZ = (dest.z - dice.position.z)/stepCount;

					return new Promise(function(resolve) {
						var animateCallback = function() {

							self._renderer.render(self._scene, self._camera);
							step++;
							
							if (step < stepCount) {
								dice.position.x += stepX;
								dice.position.y += stepY;
								dice.position.z += stepZ;
								dice.lookAt(self._camera.localToWorld(new THREE.Vector3(0,0,0)));
								requestAnimationFrame(animateCallback);
							} else {
								dice.position.x = dest.x;
								dice.position.y = dest.y;
								dice.position.z = dest.z;
								dice.lookAt(self._camera.localToWorld(new THREE.Vector3(0,0,0)));
								self.update();
								resolve();
							}
						}
						requestAnimationFrame(animateCallback);
					});
				}
				
				function renderDefendRoll(state) {
					Globals.debug("render defense roll", Globals.LEVEL.INFO, Globals.CHANNEL.RENDERER);
		            window.setTimeout(function(){renderVerdict(state);}, timeout);
				}
				
				function renderVerdict(state) {
					Globals.debug("render verdict", Globals.LEVEL.INFO, Globals.CHANNEL.RENDERER);
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
					resolve();
				}
			});
		},

		
		_drawMap: function(state) {
			if (Globals.suppress_ui || !this._initialized) {
				return;
			}
			Globals.debug("drawMap", Globals.LEVEL.DEBUG, Globals.CHANNEL.RENDERER);
			Globals.ASSERT(state instanceof Gamestate);
			
			var self = this;
			return Promise.mapSeries(state.countryIds(), function(countryId) {
				return self._animateCountry(countryId, state);
			});

			
		},

		_animateCountry: function(countryId, state) {
			var self = this;

			var toDice = state.countryDice(countryId);
			var fromDice = self._lastRenderedState ? self._lastRenderedState.countryDice(countryId) : toDice;


			Globals.debug("animateCountry", countryId, "from", fromDice, "to", toDice, Globals.LEVEL.TRACE, Globals.CHANNEL.RENDERER);

			if (!ANIMATE || fromDice == toDice || (DRAW_DICE && state.attack())) {
				return self._drawCountry(countryId, state, false);
			}

			Globals.debug("animating", toDice, Globals.LEVEL.TRACE, Globals.CHANNEL.RENDERER);

			var STEP = (fromDice < toDice) ? 0.5 : -0.5;
			if (DRAW_DICE) {
				STEP = (fromDice < toDice) ? 1 : -1;
			}
			state.setCountryDice(countryId, fromDice);

			return new Promise(function(resolve) {

				var animateCountryCB = function() {

					if (state.countryDice(countryId) != toDice) {
						state.setCountryDice(countryId, state.countryDice(countryId) + STEP);
						self._drawCountry(countryId, state, false);
						self.update();
						requestAnimationFrame(animateCountryCB);
					} else {
						state.setCountryDice(countryId, toDice);
						self._drawCountry(countryId, state, false);
						resolve();
					}
				};

				requestAnimationFrame(animateCountryCB);
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

			// draw dice
			if (DRAW_DICE) {
				self._drawDice(countryId, state);
			}

		},


		_drawHex: function(hex, state, isFighting) {
			var self = this;					
			var countryId = hex.countryId();
			var start = hex.upperLeft();
			var height = DRAW_DICE ? 1 : 4 * state.countryDice(countryId);
			var cylinder;
			
			if (!self._cylinders[hex.id()]) {
				var color = self._playerColors[state.countryOwner(countryId)];
				var geometry = new THREE.CylinderGeometry( 1, 1, height, 6);
				var material = new THREE.MeshPhongMaterial({color: color, specular: 0x111111, shininess: 30, shading: THREE.FlatShading});
				cylinder = new THREE.Mesh(geometry, material);
				cylinder.rotation.x = Math.PI / 2;
				cylinder.rotation.y = Math.PI / 6;
				cylinder.position.x = start[0]/Hex.EDGE_LENGTH;
				cylinder.position.y = start[1]/Hex.EDGE_LENGTH;
				cylinder.userData['hexId'] = hex.id();
				cylinder.receiveShadow = true;
				self._scene.add(cylinder);
				self._cylinders[hex.id()] = cylinder;

				if (hex._countryEdgeDirections.length) {
					cylinder.updateMatrixWorld();

					material = new THREE.LineBasicMaterial({
						color: 0x000000
					});

					
					hex._countryEdgeDirections.forEach(function(dir) {
						var g = new THREE.Geometry();
						if (dir == Dir.obj.NE) {
							var vertex = cylinder.geometry.vertices[0].clone();
							cylinder.localToWorld(vertex);
							g.vertices.push(vertex);	

							vertex = cylinder.geometry.vertices[1].clone();
							cylinder.localToWorld(vertex);
							g.vertices.push(vertex);	
						} 
						if (dir == Dir.obj.SE) {
							var vertex = cylinder.geometry.vertices[1].clone();
							cylinder.localToWorld(vertex);
							g.vertices.push(vertex);	

							vertex = cylinder.geometry.vertices[2].clone();
							cylinder.localToWorld(vertex);
							g.vertices.push(vertex);	
						} 
						if (dir == Dir.obj.S) {
							var vertex = cylinder.geometry.vertices[2].clone();
							cylinder.localToWorld(vertex);
							g.vertices.push(vertex);	

							vertex = cylinder.geometry.vertices[3].clone();
							cylinder.localToWorld(vertex);
							g.vertices.push(vertex);
						}
						if (dir == Dir.obj.SW) {
							var vertex = cylinder.geometry.vertices[3].clone();
							cylinder.localToWorld(vertex);
							g.vertices.push(vertex);	

							vertex = cylinder.geometry.vertices[4].clone();
							cylinder.localToWorld(vertex);
							g.vertices.push(vertex);	
						}
						if (dir == Dir.obj.NW) {
							var vertex = cylinder.geometry.vertices[4].clone();
							cylinder.localToWorld(vertex);
							g.vertices.push(vertex);	

							vertex = cylinder.geometry.vertices[5].clone();
							cylinder.localToWorld(vertex);
							g.vertices.push(vertex);	
						}
						if (dir == Dir.obj.N) {
							var vertex = cylinder.geometry.vertices[5].clone();
							cylinder.localToWorld(vertex);
							g.vertices.push(vertex);	

							vertex = cylinder.geometry.vertices[0].clone();
							cylinder.localToWorld(vertex);
							g.vertices.push(vertex);	
						} 
						var line = new THREE.Line(g, material);
						self._scene.add(line);
					});
					
				}

			} else {
				cylinder = self._cylinders[hex.id()];
				self._scene.remove(cylinder);
				cylinder.material.color = self._getCountryColor(countryId, state, isFighting);
				cylinder.geometry.dispose();
				cylinder.geometry = null;
				cylinder.geometry = new THREE.CylinderGeometry( 1, 1, height, 6);
				cylinder.receiveShadow = true;
				self._scene.add(cylinder);
			}
		},

		_getCountryColor: function(countryId, state, isFighting) {
			var self = this;
			isFighting = isFighting || false;
			var color = new THREE.Color(self._playerColors[state.countryOwner(countryId)]);

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
			var self = this;

			if (!self._dice[countryId + ':' + 1]) {
				self._initializeDice(countryId);
			}

			for (var i=1; i < 9; i++) {
				if (i <= state.countryDice(countryId)) {
					self._dice[countryId + ':' + i].visible = true;
				} else {
					self._dice[countryId + ':' + i].visible = false;
				}
			}
		},

		_initializeDice: function (countryId) {
			var self = this;

			var center = self._map.countryCenter(countryId);
			var x = center[0]/Hex.EDGE_LENGTH;
			var y = center[1]/Hex.EDGE_LENGTH;
			var z = 2;
			var angle = 0;

			var color = 0xeeeee0;
			var geometry = new THREE.BoxGeometry( 2,2,2 );
			var material = new THREE.MeshBasicMaterial({color: 0xffffff,
														map: self._texture});

			for (var i=1; i < 9; i++) {
				var cube = new THREE.Mesh( geometry, material );
				cube.position.x = x;
				cube.position.y = y;
				cube.position.z = z;
				cube.rotation.z = angle;
				cube.castShadow = true;
				self._dice[countryId + ':' + i] = cube;
				self._scene.add(cube);

				z += 2;
				angle += Math.PI/10;

				if (i == 4) {
					z = 2;
					angle = 0;
					y += 2.1;
				}
			}
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
			
			self._mouseVector.x = 2 * (event.offsetX / self._canvasWidth) - 1;
			self._mouseVector.y = 1 - 2 * ( event.offsetY / self._canvasHeight );

			var hexes = [];
			Object.keys(self._cylinders).forEach(function(id) {
				hexes.push(self._cylinders[id]);
			});

			self._raycaster.setFromCamera(self._mouseVector, self._camera);
			var intersects = self._raycaster.intersectObjects(hexes);

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
					Globals.debug("detected mouse over country", countryId, Globals.LEVEL.TRACE, Globals.CHANNEL.RENDERER);
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
			self._camera.position.y += self._mapCenterY;
			self._camera.position.x += self._mapCenterX;


			self._camera.lookAt(new THREE.Vector3(self._mapCenterX, self._mapCenterY, 0));

			self.update();
		},

		update: function() {
			var self = this;
			Globals.debug("update()", Globals.LEVEL.DEBUG, Globals.CHANNEL.RENDERER);
			requestAnimationFrame(self.renderEngineCallback.bind(self));
		},

		renderEngineCallback: function() {
			//Globals.debug("renderEngineCallback", Globals.LEVEL.DEBUG, Globals.CHANNEL.RENDERER);
			var self = this;	
			//console.time("RenderTime");
			self._renderer.render(self._scene, self._camera);
			//console.timeEnd("RenderTime");
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
	

