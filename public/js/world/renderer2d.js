'use strict'

var Hex = {
	STARTING_RADIUS: 20,
	RADIUS: 20,
	BORDER_THICKNESS: 1,
	FUDGE: 0.5,
	SVG_TEMPLATE: _.template("M<%=x1%> <%=y1%> L<%=x2%> <%=y2%> L<%=x3%> <%=y3%> L<%=x4%> <%=y4%> L<%=x5%> <%=y5%> L<%=x6%> <%=y6%>z"),
	COS: Math.cos(Math.PI/3),
	SIN: Math.sin(Math.PI/3),
	ROOT3: Math.sqrt(3),
	width: function() { 
		return Hex.RADIUS * Hex.ROOT3;
	},
	height: function() { 
		return Hex.RADIUS;
	},
	center: function(hexId) {
		return [hexId[0] * Hex.width(), hexId[1] * Hex.height()];
	},
	svg: function(center, radius) {
//		radius *= 1.15;
		var cx = center[0], cy = center[1];
		return new Path2D(Hex.SVG_TEMPLATE({
			x1: cx - radius,
			y1: cy,
			x2: cx - Hex.COS * radius,
			y2: cy - Hex.SIN * radius,
			x3: cx + Hex.COS * radius,
			y3: cy - Hex.SIN * radius,
			x4: cx + radius,
			y4: cy,
			x5: cx + Hex.COS * radius,
			y5: cy + Hex.SIN * radius,
			x6: cx - Hex.COS * radius,
			y6: cy + Hex.SIN * radius
		}));
	},
	isValid: function(x, y) {
		return !((x + y) % 2);
	}
};

var Renderer2d = {

	_screenCenter: [0,0],
	_mouseOverHex: null,
	_selectedHex: null,

	init: function(canvas) {

		this._canvas = canvas;
		if (!canvas) {
			return;
		}

		this._context = this._canvas.getContext('2d');
		this._context.lineJoin = "straight";

		$(canvas).mousemove(this.mouseMove.bind(this));
    	$(canvas).mouseleave(this.mouseLeave.bind(this));
	},

	canvasWidth: function() {
		return this._context.canvas.clientWidth;
	},

	canvasHeight: function() {
		return this._context.canvas.clientHeight;
	},

	_pointCmp: function(p1, p2) {
		return p1 == p2 ||  (p1 && p2 && p1[0] == p2[0] && p1[1] == p2[1]);
 	},

	mouseMove: function(event) {
		var self = this;
		var hexId = self._pointToHex(self._screenToWorld([event.offsetX, event.offsetY]));
		if (!self._pointCmp(hexId, self._mouseOverHex)) {
			self._mouseOverHex = hexId;
			self.render(self._lastState);
		}
	},

	mouseLeave: function(event) {
		if (this._mouseOverHex != null) {
			this._mouseOverHex = null;
			this.render(this._lastState);
		}
	},

	_clear: function() {
		this._context.clearRect(0,0,2000,2000);
	},

	// @screenCenter: [x,y] screen center in world coordinates
	setPosition: function(screenCenter) {
		this._screenCenter = screenCenter || [0,0];
		this.render(this._lastState);
	},

	setZoomLevel: function(zoomLevel) {
		Hex.RADIUS = Hex.STARTING_RADIUS * zoomLevel;
		this.render(this._lastState);
	},

	zoomLevel: function() {
		return Hex.RADIUS / Hex.STARTING_RADIUS;
	},

	render: function(state) {
		var self = this;
		self._clear();
		self._lastState = state;

		// Note this should happen on resize or something not constantly.
		self._screenUpperLeft = [self._screenCenter[0] - self.canvasWidth()/2, self._screenCenter[1] - self.canvasHeight()/2]
		self._screenBottomRight = [self._screenCenter[0] + self.canvasWidth()/2, self._screenCenter[1] + self.canvasHeight()/2];
		var upperLeftHex = self._pointToHex(self._screenUpperLeft);
		var bottomRightHex = self._pointToHex(self._screenBottomRight);

		// Iterate over an extra index in each direction to ensure we get everything.
		for (var i = upperLeftHex[0] - 1; i <= bottomRightHex[0] + 1; i++) {
			for (var j = upperLeftHex[1] - 1; j <= bottomRightHex[1] + 1; j++) {
				if (Hex.isValid(i, j)) {
					self._renderHex([i, j], state);
				}
			}
		}
	},

	update: function(state) {
		var self = this;

		state.hexIds().forEach(function(hexId) {
			self._renderHex(hexId, state);
		});

		self._lastState.merge(state);
	},

	_worldToScreen: function(point) {
		return [point[0] - this._screenUpperLeft[0], point[1] - this._screenUpperLeft[1]];
	},

	_screenToWorld: function(point) {
		return [point[0] + this._screenUpperLeft[0], point[1] + this._screenUpperLeft[1]];
	},

	_distanceSquared: function(p1, p2) {
		return Math.pow(p1[0]-p2[0], 2) + Math.pow(p1[1]-p2[1], 2);

	},

	_distance: function(p1, p2) {
		return Math.sqrt(this._distanceSquared(p1, p2));
	},

	// _pointToHex() - uses world coords. Returns hex id
	// A hex is centered on (0,0) in the world. That defines row 0, col 0
	// 
	//		[0,2]
	//				[1,1]
	//		[0,0]
	//				[1,-1]
	//		[0,-2]
	//
	// The coords of [1,1] are (Hex.WIDTH*3/4, Hex.HEIGHT*1/2)
	// In general, the center coords of a hex in row R and column C are
	// (C * Hex.WIDTH * 3/4, R * Hex.HEIGHT * 1/2)
	_pointToHex: function(point) {
		var self = this;
		
		var col = point[0] / Hex.width();
		var row = point[1] / Hex.height();

		var possibleCols = (col == Math.floor(col)) ? [col-1, col, col+1] : [Math.floor(col), Math.ceil(col)];
		var possibleRows = (row == Math.floor(row)) ? [row-1, row, row+1] : [Math.floor(row), Math.ceil(row)];

		var minDistance = 10000000;
		var closestHex = [0,0];	// Is this right?

		for (var i=0; i < possibleCols.length; i++) {
			for (var j=0; j < possibleRows.length; j++) {
				var x = possibleCols[i];
				var y = possibleRows[j];
				if (Hex.isValid(x, y)) {
					var hexCenter = Hex.center([x, y]);
					var dist = self._distanceSquared(point, hexCenter);

					if (dist < minDistance) {
						minDistance = dist;
						closestHex = [x, y];
					}
				}
			}
		}

		return closestHex;

	},



	_renderHex: function (hexId, state) {
		var self = this;

		var hexState = null;
		if (state) {
			hexState = state.getHex(hexId);
		}
		var hexCenter = self._worldToScreen(Hex.center(hexId));

        var path = Hex.svg(hexCenter, Hex.RADIUS);

        self._context.strokeStyle = "blue";
	    self._context.lineWidth = Hex.BORDER_THICKNESS;
	    self._context.stroke(path);

	    var color = "white";

	    if (hexState && hexState.ownerId() >= 0) {
	    	color = self._ownerColor(hexState.ownerId());
	    }

	    if (self._pointCmp(hexId, self._mouseOverHex)) {
		    color = "lightgray";
		}

		self._context.fillStyle = color;
		self._context.fill(path);

		if (hexState) {
			self._renderDice(hexCenter, hexState.diceCount());
		}
		
	},

	_ownerColor: function(id) {
		if (id == 0) {
			return "rgb(255, 120, 120)";
		} else if (id == 1) {
			return "rgb(120, 255, 120)";
		}
	},

	_renderDice: function (hexCenter, count) {
		var self = this;
		var pointSize = Math.floor(14 * this.zoomLevel());

		if (pointSize > 7) {
			self._context.fillStyle = "black";
		    self._context.font = pointSize + "px sans-serif";
		    self._context.textAlign = "center";
		    self._context.fillText(count, hexCenter[0], hexCenter[1] + ((pointSize - 4) / 2));
		}
	},


};