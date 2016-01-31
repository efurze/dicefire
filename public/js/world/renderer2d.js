'use strict'

var Hex = {};
Hex.BORDER_THICKNESS = 3;
Hex.EDGE_LENGTH = 40;
Hex.HEIGHT = 60;
Hex.WIDTH = Hex.HEIGHT;
Hex.TOP_LEFT_X = 10;
Hex.TOP_LEFT_Y = 10;
Hex.TOTAL_HEXES = Hex.NUM_WIDE * Hex.NUM_HIGH;
// The fudge was selected to make it look nice :-)
Hex.FUDGE = 0;

var Renderer2d = {

	_screenCenter: [0,0],

	init: function(canvas) {

		this._canvas = canvas;
		if (!canvas) {
			return;
		}

		this._context = this._canvas.getContext('2d');
		this._context.lineJoin = "straight";
		this._canvasWidth = this._context.canvas.clientWidth;
		this._canvasHeight = this._context.canvas.clientHeight;
		
	},

	_clear: function() {
		this._context.clearRect(0,0,2000,2000);
	},

	// @screenCenter: [x,y] screen center in world coordinates
	render: function(screenCenter) {
		var self = this;
		self._clear();
		self._screenCenter = screenCenter || [0,0];
		self._screenUpperLeft = [self._screenCenter[0] - self._canvasWidth/2, self._screenCenter[1] + self._canvasHeight/2]

		var x=0, y=0;
		while (y < self._canvasHeight) {
			while (x < self._canvasWidth) {
				var worldPt = self._screenToWorld([x, y]);
				var hexW = self._hexCenter(worldPt);
				var hex = self._worldToScreen(hexW);

				x = hex[0];
				self._renderHex(hex);
				x += 3*Hex.WIDTH/4;
				
			}
			x = 0;
			y += Hex.HEIGHT/2;
		}

	},

	_worldToScreen: function(point) {
		return [point[0] - this._screenUpperLeft[0], this._screenUpperLeft[1] - point[1]];
	},

	_screenToWorld: function(point) {
		return [point[0] + this._screenUpperLeft[0], this._screenUpperLeft[1] - point[1]];
	},

	_distance: function(p1, p2) {
		return Math.sqrt(Math.pow(p1[0]-p2[0], 2) + Math.pow(p1[1]-p2[1], 2));
	},

	// _hexCenter() - uses world coords
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
	_hexCenter: function(point) {
		var self = this;
		
		var col = 4*point[0] / (3*Hex.WIDTH);
		var row = 2 * point[1] / Hex.HEIGHT;

		var possibleCols = (col == Math.floor(col)) ? [col-1, col, col+1] : [Math.floor(col), Math.ceil(col)];
		var possibleRows = (row == Math.floor(row)) ? [row-1, row, row+1] : [Math.floor(row), Math.ceil(row)];

		var minDistance = 10000000;
		var closestHex = [0,0];

		for (var i=0; i < possibleCols.length; i++) {
			for (var j=0; j < possibleRows.length; j++) {
				// even columns only have even rows
				if (Math.abs(possibleCols[i]%2) !== Math.abs(possibleRows[j]%2)) {
					continue; 
				}

				var c = possibleCols[i];
				var r = possibleRows[j];
				var hexCenter = [c * Hex.WIDTH * 3 / 4, r * Hex.HEIGHT/2];
				var dist = self._distance(point, hexCenter);
				if (dist < minDistance) {
					col = c;
					row = r;
					minDistance = dist;
					closestHex = hexCenter;
				}
			}
		}

		return closestHex;

	},


	_renderHex: function (hexCenter) {
		var self = this;

		var upperLeftX = hexCenter[0] - Hex.WIDTH/4;
		var upperLeftY = hexCenter[1] + Hex.WIDTH/2;

        var path = new Path2D();
        path.moveTo(upperLeftX, upperLeftY);
        path.lineTo(upperLeftX + Hex.WIDTH/2, upperLeftY);
        path.lineTo(hexCenter[0] + Hex.WIDTH/2, hexCenter[1]);
        path.lineTo(upperLeftX + Hex.WIDTH/2, hexCenter[1] - Hex.WIDTH/2);
        path.lineTo(upperLeftX, hexCenter[1] - Hex.WIDTH/2);
        path.lineTo(hexCenter[0] - Hex.WIDTH/2, hexCenter[1]);
        path.lineTo(upperLeftX, upperLeftY);
        path.closePath();

        self._context.strokeStyle = "blue";
	    self._context.lineWidth = 1;
	    self._context.stroke(path);
		
	},



};