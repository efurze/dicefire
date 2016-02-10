'use strict'

// This is how you compute the avg color for what goes in the heart of a snowflake.
var ADJACENCIES_FOR_SNOWFLAKE_DIV_3 = [
	[-1, -3], [1, -3], [-2, 0], [2, 0], [-1, 3], [1, 3]
];

var ADJACENCIES_FOR_SNOWFLAKE = [
	[0, 0], [0, -2], [1, -1], [-1, 1], [0, 2], [1, 1], [-1, -1]
];




var F2 = 0.5 * (Math.sqrt(3.0) - 1.0),
    G2 = (3.0 - Math.sqrt(3.0)) / 6.0,
    F3 = 1.0 / 3.0,
    G3 = 1.0 / 6.0,
    F4 = (Math.sqrt(5.0) - 1.0) / 4.0,
    G4 = (5.0 - Math.sqrt(5.0)) / 20.0;


function SimplexNoise(random) {
    if (!random) random = Math.random;
    this.p = new Uint8Array(256);
    this.perm = new Uint8Array(512);
    this.permMod12 = new Uint8Array(512);
    for (var i = 0; i < 256; i++) {
        this.p[i] = random() * 256;
    }
    for (i = 0; i < 512; i++) {
        this.perm[i] = this.p[i & 255];
        this.permMod12[i] = this.perm[i] % 12;
    }

}
SimplexNoise.prototype = {
    grad3: new Float32Array([1, 1, 0,
                            - 1, 1, 0,
                            1, - 1, 0,

                            - 1, - 1, 0,
                            1, 0, 1,
                            - 1, 0, 1,

                            1, 0, - 1,
                            - 1, 0, - 1,
                            0, 1, 1,

                            0, - 1, 1,
                            0, 1, - 1,
                            0, - 1, - 1]),
    grad4: new Float32Array([0, 1, 1, 1, 0, 1, 1, - 1, 0, 1, - 1, 1, 0, 1, - 1, - 1,
                            0, - 1, 1, 1, 0, - 1, 1, - 1, 0, - 1, - 1, 1, 0, - 1, - 1, - 1,
                            1, 0, 1, 1, 1, 0, 1, - 1, 1, 0, - 1, 1, 1, 0, - 1, - 1,
                            - 1, 0, 1, 1, - 1, 0, 1, - 1, - 1, 0, - 1, 1, - 1, 0, - 1, - 1,
                            1, 1, 0, 1, 1, 1, 0, - 1, 1, - 1, 0, 1, 1, - 1, 0, - 1,
                            - 1, 1, 0, 1, - 1, 1, 0, - 1, - 1, - 1, 0, 1, - 1, - 1, 0, - 1,
                            1, 1, 1, 0, 1, 1, - 1, 0, 1, - 1, 1, 0, 1, - 1, - 1, 0,
                            - 1, 1, 1, 0, - 1, 1, - 1, 0, - 1, - 1, 1, 0, - 1, - 1, - 1, 0]),
    noise2D: function (xin, yin) {
        var permMod12 = this.permMod12,
            perm = this.perm,
            grad3 = this.grad3;
        var n0=0, n1=0, n2=0; // Noise contributions from the three corners
        // Skew the input space to determine which simplex cell we're in
        var s = (xin + yin) * F2; // Hairy factor for 2D
        var i = Math.floor(xin + s);
        var j = Math.floor(yin + s);
        var t = (i + j) * G2;
        var X0 = i - t; // Unskew the cell origin back to (x,y) space
        var Y0 = j - t;
        var x0 = xin - X0; // The x,y distances from the cell origin
        var y0 = yin - Y0;
        // For the 2D case, the simplex shape is an equilateral triangle.
        // Determine which simplex we are in.
        var i1, j1; // Offsets for second (middle) corner of simplex in (i,j) coords
        if (x0 > y0) {
            i1 = 1;
            j1 = 0;
        } // lower triangle, XY order: (0,0)->(1,0)->(1,1)
        else {
            i1 = 0;
            j1 = 1;
        } // upper triangle, YX order: (0,0)->(0,1)->(1,1)
        // A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and
        // a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where
        // c = (3-sqrt(3))/6
        var x1 = x0 - i1 + G2; // Offsets for middle corner in (x,y) unskewed coords
        var y1 = y0 - j1 + G2;
        var x2 = x0 - 1.0 + 2.0 * G2; // Offsets for last corner in (x,y) unskewed coords
        var y2 = y0 - 1.0 + 2.0 * G2;
        // Work out the hashed gradient indices of the three simplex corners
        var ii = i & 255;
        var jj = j & 255;
        // Calculate the contribution from the three corners
        var t0 = 0.5 - x0 * x0 - y0 * y0;
        if (t0 >= 0) {
            var gi0 = permMod12[ii + perm[jj]] * 3;
            t0 *= t0;
            n0 = t0 * t0 * (grad3[gi0] * x0 + grad3[gi0 + 1] * y0); // (x,y) of grad3 used for 2D gradient
        }
        var t1 = 0.5 - x1 * x1 - y1 * y1;
        if (t1 >= 0) {
            var gi1 = permMod12[ii + i1 + perm[jj + j1]] * 3;
            t1 *= t1;
            n1 = t1 * t1 * (grad3[gi1] * x1 + grad3[gi1 + 1] * y1);
        }
        var t2 = 0.5 - x2 * x2 - y2 * y2;
        if (t2 >= 0) {
            var gi2 = permMod12[ii + 1 + perm[jj + 1]] * 3;
            t2 *= t2;
            n2 = t2 * t2 * (grad3[gi2] * x2 + grad3[gi2 + 1] * y2);
        }
        // Add contributions from each corner to get the final noise value.
        // The result is scaled to return values in the interval [-1,1].
        return 70.0 * (n0 + n1 + n2);
    },
    // 3D simplex noise
    noise3D: function (xin, yin, zin) {
        var permMod12 = this.permMod12,
            perm = this.perm,
            grad3 = this.grad3;
        var n0, n1, n2, n3; // Noise contributions from the four corners
        // Skew the input space to determine which simplex cell we're in
        var s = (xin + yin + zin) * F3; // Very nice and simple skew factor for 3D
        var i = Math.floor(xin + s);
        var j = Math.floor(yin + s);
        var k = Math.floor(zin + s);
        var t = (i + j + k) * G3;
        var X0 = i - t; // Unskew the cell origin back to (x,y,z) space
        var Y0 = j - t;
        var Z0 = k - t;
        var x0 = xin - X0; // The x,y,z distances from the cell origin
        var y0 = yin - Y0;
        var z0 = zin - Z0;
        // For the 3D case, the simplex shape is a slightly irregular tetrahedron.
        // Determine which simplex we are in.
        var i1, j1, k1; // Offsets for second corner of simplex in (i,j,k) coords
        var i2, j2, k2; // Offsets for third corner of simplex in (i,j,k) coords
        if (x0 >= y0) {
            if (y0 >= z0) {
                i1 = 1;
                j1 = 0;
                k1 = 0;
                i2 = 1;
                j2 = 1;
                k2 = 0;
            } // X Y Z order
            else if (x0 >= z0) {
                i1 = 1;
                j1 = 0;
                k1 = 0;
                i2 = 1;
                j2 = 0;
                k2 = 1;
            } // X Z Y order
            else {
                i1 = 0;
                j1 = 0;
                k1 = 1;
                i2 = 1;
                j2 = 0;
                k2 = 1;
            } // Z X Y order
        }
        else { // x0<y0
            if (y0 < z0) {
                i1 = 0;
                j1 = 0;
                k1 = 1;
                i2 = 0;
                j2 = 1;
                k2 = 1;
            } // Z Y X order
            else if (x0 < z0) {
                i1 = 0;
                j1 = 1;
                k1 = 0;
                i2 = 0;
                j2 = 1;
                k2 = 1;
            } // Y Z X order
            else {
                i1 = 0;
                j1 = 1;
                k1 = 0;
                i2 = 1;
                j2 = 1;
                k2 = 0;
            } // Y X Z order
        }
        // A step of (1,0,0) in (i,j,k) means a step of (1-c,-c,-c) in (x,y,z),
        // a step of (0,1,0) in (i,j,k) means a step of (-c,1-c,-c) in (x,y,z), and
        // a step of (0,0,1) in (i,j,k) means a step of (-c,-c,1-c) in (x,y,z), where
        // c = 1/6.
        var x1 = x0 - i1 + G3; // Offsets for second corner in (x,y,z) coords
        var y1 = y0 - j1 + G3;
        var z1 = z0 - k1 + G3;
        var x2 = x0 - i2 + 2.0 * G3; // Offsets for third corner in (x,y,z) coords
        var y2 = y0 - j2 + 2.0 * G3;
        var z2 = z0 - k2 + 2.0 * G3;
        var x3 = x0 - 1.0 + 3.0 * G3; // Offsets for last corner in (x,y,z) coords
        var y3 = y0 - 1.0 + 3.0 * G3;
        var z3 = z0 - 1.0 + 3.0 * G3;
        // Work out the hashed gradient indices of the four simplex corners
        var ii = i & 255;
        var jj = j & 255;
        var kk = k & 255;
        // Calculate the contribution from the four corners
        var t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
        if (t0 < 0) n0 = 0.0;
        else {
            var gi0 = permMod12[ii + perm[jj + perm[kk]]] * 3;
            t0 *= t0;
            n0 = t0 * t0 * (grad3[gi0] * x0 + grad3[gi0 + 1] * y0 + grad3[gi0 + 2] * z0);
        }
        var t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
        if (t1 < 0) n1 = 0.0;
        else {
            var gi1 = permMod12[ii + i1 + perm[jj + j1 + perm[kk + k1]]] * 3;
            t1 *= t1;
            n1 = t1 * t1 * (grad3[gi1] * x1 + grad3[gi1 + 1] * y1 + grad3[gi1 + 2] * z1);
        }
        var t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
        if (t2 < 0) n2 = 0.0;
        else {
            var gi2 = permMod12[ii + i2 + perm[jj + j2 + perm[kk + k2]]] * 3;
            t2 *= t2;
            n2 = t2 * t2 * (grad3[gi2] * x2 + grad3[gi2 + 1] * y2 + grad3[gi2 + 2] * z2);
        }
        var t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
        if (t3 < 0) n3 = 0.0;
        else {
            var gi3 = permMod12[ii + 1 + perm[jj + 1 + perm[kk + 1]]] * 3;
            t3 *= t3;
            n3 = t3 * t3 * (grad3[gi3] * x3 + grad3[gi3 + 1] * y3 + grad3[gi3 + 2] * z3);
        }
        // Add contributions from each corner to get the final noise value.
        // The result is scaled to stay just inside [-1,1]
        return 32.0 * (n0 + n1 + n2 + n3);
    },
    // 4D simplex noise, better simplex rank ordering method 2012-03-09
    noise4D: function (x, y, z, w) {
        var permMod12 = this.permMod12,
            perm = this.perm,
            grad4 = this.grad4;

        var n0, n1, n2, n3, n4; // Noise contributions from the five corners
        // Skew the (x,y,z,w) space to determine which cell of 24 simplices we're in
        var s = (x + y + z + w) * F4; // Factor for 4D skewing
        var i = Math.floor(x + s);
        var j = Math.floor(y + s);
        var k = Math.floor(z + s);
        var l = Math.floor(w + s);
        var t = (i + j + k + l) * G4; // Factor for 4D unskewing
        var X0 = i - t; // Unskew the cell origin back to (x,y,z,w) space
        var Y0 = j - t;
        var Z0 = k - t;
        var W0 = l - t;
        var x0 = x - X0; // The x,y,z,w distances from the cell origin
        var y0 = y - Y0;
        var z0 = z - Z0;
        var w0 = w - W0;
        // For the 4D case, the simplex is a 4D shape I won't even try to describe.
        // To find out which of the 24 possible simplices we're in, we need to
        // determine the magnitude ordering of x0, y0, z0 and w0.
        // Six pair-wise comparisons are performed between each possible pair
        // of the four coordinates, and the results are used to rank the numbers.
        var rankx = 0;
        var ranky = 0;
        var rankz = 0;
        var rankw = 0;
        if (x0 > y0) rankx++;
        else ranky++;
        if (x0 > z0) rankx++;
        else rankz++;
        if (x0 > w0) rankx++;
        else rankw++;
        if (y0 > z0) ranky++;
        else rankz++;
        if (y0 > w0) ranky++;
        else rankw++;
        if (z0 > w0) rankz++;
        else rankw++;
        var i1, j1, k1, l1; // The integer offsets for the second simplex corner
        var i2, j2, k2, l2; // The integer offsets for the third simplex corner
        var i3, j3, k3, l3; // The integer offsets for the fourth simplex corner
        // simplex[c] is a 4-vector with the numbers 0, 1, 2 and 3 in some order.
        // Many values of c will never occur, since e.g. x>y>z>w makes x<z, y<w and x<w
        // impossible. Only the 24 indices which have non-zero entries make any sense.
        // We use a thresholding to set the coordinates in turn from the largest magnitude.
        // Rank 3 denotes the largest coordinate.
        i1 = rankx >= 3 ? 1 : 0;
        j1 = ranky >= 3 ? 1 : 0;
        k1 = rankz >= 3 ? 1 : 0;
        l1 = rankw >= 3 ? 1 : 0;
        // Rank 2 denotes the second largest coordinate.
        i2 = rankx >= 2 ? 1 : 0;
        j2 = ranky >= 2 ? 1 : 0;
        k2 = rankz >= 2 ? 1 : 0;
        l2 = rankw >= 2 ? 1 : 0;
        // Rank 1 denotes the second smallest coordinate.
        i3 = rankx >= 1 ? 1 : 0;
        j3 = ranky >= 1 ? 1 : 0;
        k3 = rankz >= 1 ? 1 : 0;
        l3 = rankw >= 1 ? 1 : 0;
        // The fifth corner has all coordinate offsets = 1, so no need to compute that.
        var x1 = x0 - i1 + G4; // Offsets for second corner in (x,y,z,w) coords
        var y1 = y0 - j1 + G4;
        var z1 = z0 - k1 + G4;
        var w1 = w0 - l1 + G4;
        var x2 = x0 - i2 + 2.0 * G4; // Offsets for third corner in (x,y,z,w) coords
        var y2 = y0 - j2 + 2.0 * G4;
        var z2 = z0 - k2 + 2.0 * G4;
        var w2 = w0 - l2 + 2.0 * G4;
        var x3 = x0 - i3 + 3.0 * G4; // Offsets for fourth corner in (x,y,z,w) coords
        var y3 = y0 - j3 + 3.0 * G4;
        var z3 = z0 - k3 + 3.0 * G4;
        var w3 = w0 - l3 + 3.0 * G4;
        var x4 = x0 - 1.0 + 4.0 * G4; // Offsets for last corner in (x,y,z,w) coords
        var y4 = y0 - 1.0 + 4.0 * G4;
        var z4 = z0 - 1.0 + 4.0 * G4;
        var w4 = w0 - 1.0 + 4.0 * G4;
        // Work out the hashed gradient indices of the five simplex corners
        var ii = i & 255;
        var jj = j & 255;
        var kk = k & 255;
        var ll = l & 255;
        // Calculate the contribution from the five corners
        var t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0 - w0 * w0;
        if (t0 < 0) n0 = 0.0;
        else {
            var gi0 = (perm[ii + perm[jj + perm[kk + perm[ll]]]] % 32) * 4;
            t0 *= t0;
            n0 = t0 * t0 * (grad4[gi0] * x0 + grad4[gi0 + 1] * y0 + grad4[gi0 + 2] * z0 + grad4[gi0 + 3] * w0);
        }
        var t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1 - w1 * w1;
        if (t1 < 0) n1 = 0.0;
        else {
            var gi1 = (perm[ii + i1 + perm[jj + j1 + perm[kk + k1 + perm[ll + l1]]]] % 32) * 4;
            t1 *= t1;
            n1 = t1 * t1 * (grad4[gi1] * x1 + grad4[gi1 + 1] * y1 + grad4[gi1 + 2] * z1 + grad4[gi1 + 3] * w1);
        }
        var t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2 - w2 * w2;
        if (t2 < 0) n2 = 0.0;
        else {
            var gi2 = (perm[ii + i2 + perm[jj + j2 + perm[kk + k2 + perm[ll + l2]]]] % 32) * 4;
            t2 *= t2;
            n2 = t2 * t2 * (grad4[gi2] * x2 + grad4[gi2 + 1] * y2 + grad4[gi2 + 2] * z2 + grad4[gi2 + 3] * w2);
        }
        var t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3 - w3 * w3;
        if (t3 < 0) n3 = 0.0;
        else {
            var gi3 = (perm[ii + i3 + perm[jj + j3 + perm[kk + k3 + perm[ll + l3]]]] % 32) * 4;
            t3 *= t3;
            n3 = t3 * t3 * (grad4[gi3] * x3 + grad4[gi3 + 1] * y3 + grad4[gi3 + 2] * z3 + grad4[gi3 + 3] * w3);
        }
        var t4 = 0.6 - x4 * x4 - y4 * y4 - z4 * z4 - w4 * w4;
        if (t4 < 0) n4 = 0.0;
        else {
            var gi4 = (perm[ii + 1 + perm[jj + 1 + perm[kk + 1 + perm[ll + 1]]]] % 32) * 4;
            t4 *= t4;
            n4 = t4 * t4 * (grad4[gi4] * x4 + grad4[gi4 + 1] * y4 + grad4[gi4 + 2] * z4 + grad4[gi4 + 3] * w4);
        }
        // Sum up and scale the result to cover the range [-1,1]
        return 27.0 * (n0 + n1 + n2 + n3 + n4);
    }


};



var ComputeCache = {
	MAGIC_NUMBER: 2 / Math.sqrt(3),	// This is the ratio, for a hex, between a circumscribed and an inscribed edge.
	COS: Math.cos(Math.PI/3),
	SIN: Math.sin(Math.PI/3),	
	ROOT3: Math.sqrt(3),
	COS_TIMES_RADIUS: 0,
	SIN_TIMES_RADIUS: 0,
	RADIUS: 0,
	RADIUS_TIMES_MAGIC_NUMBER: 0,
	RADIUS_TIMES_ROOT3: 0,
	setup: function(radius, zoomFactor) {
		ComputeCache.RADIUS = radius;
		ComputeCache.RADIUS_TIMES_MAGIC_NUMBER = radius * Math.pow(3, zoomFactor - 1) * ComputeCache.MAGIC_NUMBER;		
		ComputeCache.COS_TIMES_RADIUS = ComputeCache.COS * ComputeCache.RADIUS_TIMES_MAGIC_NUMBER;
		ComputeCache.SIN_TIMES_RADIUS = ComputeCache.SIN * ComputeCache.RADIUS_TIMES_MAGIC_NUMBER;
		ComputeCache.RADIUS_TIMES_ROOT3 = radius * ComputeCache.ROOT3;
	}
};

var Hex = {
	BORDER_THICKNESS: 1,
	SVG_TEMPLATE: _.template("M<%=x1%> <%=y1%> L<%=x2%> <%=y2%> L<%=x3%> <%=y3%> L<%=x4%> <%=y4%> L<%=x5%> <%=y5%> L<%=x6%> <%=y6%>z"),
	width: function() { 
		return ComputeCache.RADIUS_TIMES_ROOT3;
	},
	height: function() { 
		return ComputeCache.RADIUS;
	},
	center: function(hexId) {
		return [hexId[0] * Hex.width(), hexId[1] * Hex.height()];
	},
	svg: function(center) {
		var cx = center[0], cy = center[1];

		var cx_minus_cos = cx - ComputeCache.COS_TIMES_RADIUS;
		var cx_plus_cos = cx + ComputeCache.COS_TIMES_RADIUS;
		var cy_minus_sin = cy - ComputeCache.SIN_TIMES_RADIUS;
		var cy_plus_sin = cy + ComputeCache.SIN_TIMES_RADIUS;

		return new Path2D(Hex.SVG_TEMPLATE({
			x1: cx - ComputeCache.RADIUS_TIMES_MAGIC_NUMBER,
			y1: cy,
			x2: cx_minus_cos,
			y2: cy_minus_sin,
			x3: cx_plus_cos,
			y3: cy_minus_sin,
			x4: cx + ComputeCache.RADIUS_TIMES_MAGIC_NUMBER,
			y4: cy,
			x5: cx_plus_cos,
			y5: cy_plus_sin,
			x6: cx_minus_cos,
			y6: cy_plus_sin
		}));
	},
	isValid: function(x, y) {
		return !((x + y) % 2);
	}
};

var Renderer2d = {
	_hexRadius: 20,
	_screenCenter: [0,0],
	_mouseOverHex: null,
	_selectedHex: null,
	_zoomLevel: 1,

	init: function(canvas) {

		this._canvas = canvas;
		if (!canvas) {
			return;
		}

		this._simplexNoise = new SimplexNoise();

		this._context = this._canvas.getContext('2d');
		this._context.lineJoin = "straight";

		$('.navbar').css('opacity', '0.7');

		$(canvas).mousemove(this.mouseMove.bind(this));
    	$(canvas).mouseleave(this.mouseLeave.bind(this));
		this.setZoomLevel(1);		
    	$(window).resize(this.resize.bind(this));

    	this.resize(null);
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

	resize: function(event) {
		this._context.canvas.width = $('#game').width();
		this._context.canvas.height = $('#game').height();
		this.render(this._lastState);
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
		this._zoomLevel = zoomLevel;	
		this._zoomNotch = this._computeZoomNotch();
		this._zoomDivisor = Math.pow(3, this._zoomNotch - 1);
		ComputeCache.setup(this.hexRadius(), this._zoomNotch);
		this.render(this._lastState);
	},

	zoomLevel: function() {
		return this._zoomLevel;
	},

	_computeZoomNotch: function() {
		var NOTCH = 0.5;
		var z = this.zoomLevel();
		var notch = 1;
		while (true) {
			if (z > NOTCH) {
				return notch;
			}
			notch++;
			z /= NOTCH;
		}

		return notch;
	},

	_shouldRender: function(x, y) {
		x /= this._zoomDivisor;
		y /= this._zoomDivisor;
		return Math.round(x) == x && Math.round(y) == y;
	},

	hexRadius: function() {
		return this._hexRadius * this.zoomLevel();
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

		if (!self._shouldRender(hexId[0], hexId[1])) {
			return;
		}


		var hexState = null;
		if (state) {
			hexState = state.getHex(hexId);
		}
		var hexCenter = self._worldToScreen(Hex.center(hexId));

        var path = Hex.svg(hexCenter);

        self._context.strokeStyle = "blue";
	    self._context.lineWidth = Hex.BORDER_THICKNESS;
	    self._context.stroke(path);

	    var color = "white";

	    if (hexState && hexState.ownerId() >= 0) {
	    	color = self._ownerColor(hexState.ownerId());
	    } else {
			function hex(x) {
				return ("0" + parseInt(x).toString(16)).slice(-2);
			}	    		

	    	var noiseColor = self._simplexNoise.noise2D(hexId[0] / 24, hexId[1] / 24);
	    	if (noiseColor <= -0.1) {
	    		noiseColor = 255 * (1 + noiseColor);
	    		color = "#256d7b";// + hex(noiseColor);
	    	} else {
	    		noiseColor = 255 * noiseColor;
	    		color = "#DEB887";// + hex(noiseColor) + "00";
	    	}
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