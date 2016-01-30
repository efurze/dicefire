'use strict'

var Hex = {};
Hex.BORDER_THICKNESS = 3;
Hex.EDGE_LENGTH = 8;
Hex.HEIGHT = Hex.EDGE_LENGTH * Math.sqrt(3);
Hex.TOP_LEFT_X = 10;
Hex.TOP_LEFT_Y = 10;
Hex.NUM_WIDE = 40;
Hex.NUM_HIGH = 80;
Hex.TOTAL_HEXES = Hex.NUM_WIDE * Hex.NUM_HIGH;
// The fudge was selected to make it look nice :-)
Hex.FUDGE = 0.5;

var Renderer2d = {

	init: function(canvas) {

		this._canvas = canvas;
		if (!canvas) {
			return;
		}

		this._context = this._canvas.getContext('2d');
		this._context.lineJoin = "straight";
	},

	render: function() {
		this._renderHex(100, 100);
	},


	_renderHex: function (upperLeftX, upperLeftY) {
		var self = this;

        var path = new Path2D();
        path.moveTo(upperLeftX - Hex.FUDGE, upperLeftY - Hex.FUDGE);
        path.lineTo(upperLeftX + Hex.EDGE_LENGTH + Hex.FUDGE, upperLeftY - Hex.FUDGE);
        path.lineTo(upperLeftX + Hex.EDGE_LENGTH + Hex.EDGE_LENGTH / 2, upperLeftY + Hex.HEIGHT / 2);
        path.lineTo(upperLeftX + Hex.EDGE_LENGTH + Hex.FUDGE, upperLeftY + Hex.HEIGHT + Hex.FUDGE);
        path.lineTo(upperLeftX - Hex.FUDGE, upperLeftY + Hex.HEIGHT + Hex.FUDGE);
        path.lineTo(upperLeftX - Hex.EDGE_LENGTH / 2, upperLeftY + Hex.HEIGHT / 2);
        path.lineTo(upperLeftX - Hex.FUDGE, upperLeftY - Hex.FUDGE);
        path.closePath();


        self._context.fillStyle = "red";
        self._context.fill(path);
		
	},
};