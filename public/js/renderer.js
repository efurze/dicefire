$(function(){
	window.Renderer = {
		render: function(state) {
			this.paintWorld();
		},
		
		paintWorld: function() {
			var self = this;
			Country._array.forEach(function(country) {
				self.paintCountry(country);
			});
		},
		
		setupRollDivs: function() {

            $('#roll').css({
                "display": "none",
                "vertical-align": "top",
                "margin-top": "3px"
            });

            $('#leftroll').css({
                "display": "inline-block",
                "margin-left": "20px"
            });

            $('#rightroll').css({
                "display": "inline-block",
                "margin-left": "20px"                
            });

            var diceDivIds = [];
            for (var i = 0; i < Globals.maxDice; i++) {
                $('#leftroll').append(
                    "<div id='leftdie" + i + "'>5</div>"
                );

                diceDivIds.push('#leftdie' + i);

                $('#rightroll').append(
                    "<div id='rightdie" + i + "'>5</div>"
                );

                diceDivIds.push('#rightdie' + i);
            }

            diceDivIds.forEach(function(divId) {
                $(divId).css({
                    "display": "inline-block",
                    "width": "20px",
                    "height": "20px",
                    "border": "1px solid black",
                    "background-color": "red",
                    "font-family": "sans-serif",
                    "color": "white",
                    "font-size": "14px",
                    "text-align": "center",
                    "padding-top": "2px",
                    "padding-bottom": "0px",
                    "vertical-align": "top",
                    "font-weight": "bold",
                    "margin-left": "5px"
                });
            });



            $('#leftroll').append(
                "<div id='lefttotal'>35</div>"                    
            );


            $('#rightroll').append(
                "<div id='righttotal'>35</div>"                    
            );

            var totalDivIds = [];
            totalDivIds.push('#lefttotal');
            totalDivIds.push('#righttotal');
            totalDivIds.forEach(function(divId) {
                $(divId).css({
                    "display": "inline-block",
                    "vertical-align": "top",
                    "font-family": "sans-serif",
                    "font-size": "18px",
                    "text-align": "center",
                    "color": "black",
                    "margin-left": "20px"
                });
            });

        },

		paintCountry: function (country) {
			if (Globals.suppress_ui) {
	        	return;
			}
			
			var self = this;
			
	        country._hexes.forEach(function(elem) {
	            self.paintHex(elem);
	        });

	        var ctr = country.center();

	        // Draw the number box.
	        var boxSize = 10;
	        Globals.context.fillStyle = "white";
	        Globals.context.fillRect(ctr[0] - boxSize, ctr[1] - boxSize * 1.6, boxSize * 2, boxSize * 2);
	        Globals.context.rect(ctr[0] - boxSize, ctr[1] - boxSize * 1.6, boxSize * 2, boxSize * 2);
	        Globals.context.lineWidth = 1;
	        Globals.context.strokeStyle = "black";
	        Globals.context.stroke();

	        Globals.context.fillStyle = "black";
	        Globals.context.textAlign = "center";
	        Globals.context.font = "bold 18px sans-serif";
	        Globals.context.fillText(country._numDice, ctr[0], ctr[1]);

	        if (Globals.markCountryCenters) {
	            var path = new Path2D();
	            path.moveTo(ctr[0] - 4, ctr[1] - 4);
	            path.lineTo(ctr[0] + 4, ctr[1] + 4);
	            path.closePath();
	            Globals.context.strokeStyle = "black";
	            Globals.context.lineWidth = 2;
	            Globals.context.stroke(path);

	            path = new Path2D();
	            path.moveTo(ctr[0] - 4, ctr[1] + 4);
	            path.lineTo(ctr[0] + 4, ctr[1] - 4);
	            path.closePath();
	            Globals.context.strokeStyle = "black";
	            Globals.context.lineWidth = 2;
	            Globals.context.stroke(path);
	        }

	        if (Globals.drawCountryConnections) {
	            country._adjacentCountries.forEach(function(country) {
	                var otherCenter = country.center();
	                var path = new Path2D();
	                path.moveTo(ctr[0], ctr[1]);
	                path.lineTo(otherCenter[0], otherCenter[1]);
	                path.closePath();
	                Globals.context.strokeStyle = "black";
	                Globals.context.lineWidth = 1;
	                Globals.context.stroke(path);
	            });
	        }
		},

		paintHex: function (hexToPaint) {
			var upperLeft = hexToPaint.upperLeft();
	        var upperLeftX = upperLeft[0], upperLeftY = upperLeft[1];

	        var path = new Path2D();
	        path.moveTo(upperLeftX - Hex.FUDGE, upperLeftY - Hex.FUDGE);
	        path.lineTo(upperLeftX + Hex.EDGE_LENGTH + Hex.FUDGE, upperLeftY - Hex.FUDGE);
	        path.lineTo(upperLeftX + Hex.EDGE_LENGTH + Hex.EDGE_LENGTH / 2, upperLeftY + Hex.HEIGHT / 2);
	        path.lineTo(upperLeftX + Hex.EDGE_LENGTH + Hex.FUDGE, upperLeftY + Hex.HEIGHT + Hex.FUDGE);
	        path.lineTo(upperLeftX - Hex.FUDGE, upperLeftY + Hex.HEIGHT + Hex.FUDGE);
	        path.lineTo(upperLeftX - Hex.EDGE_LENGTH / 2, upperLeftY + Hex.HEIGHT / 2);
	        path.lineTo(upperLeftX - Hex.FUDGE, upperLeftY - Hex.FUDGE);
	        path.closePath();


	        Globals.context.fillStyle = hexToPaint._country ? hexToPaint._country.color() : "white";
	        if (hexToPaint._color) {
	            Globals.context.fillStyle = hexToPaint._color;
	        }
	        Globals.context.fill(path);


	        if (hexToPaint._country) {
	            hexToPaint._countryEdgeDirections.forEach(function(dir) {
	                var edgePath = new Path2D();
	                switch(dir) {
	                    case Dir.obj.NW: 
	                    case "NW":
	                        edgePath.moveTo(upperLeftX, upperLeftY);
	                        edgePath.lineTo(upperLeftX - hexToPaint.EDGE_LENGTH / 2, upperLeftY + hexToPaint.HEIGHT / 2);
	                        break;

	                    case Dir.obj.N:
	                    case "N":
	                        edgePath.moveTo(upperLeftX, upperLeftY);
	                        edgePath.lineTo(upperLeftX + hexToPaint.EDGE_LENGTH, upperLeftY);
	                        break;

	                    case Dir.obj.NE:
	                    case "NE":
	                        edgePath.moveTo(upperLeftX + hexToPaint.EDGE_LENGTH, upperLeftY);
	                        edgePath.lineTo(upperLeftX + hexToPaint.EDGE_LENGTH + hexToPaint.EDGE_LENGTH / 2, upperLeftY + hexToPaint.HEIGHT / 2);
	                        break;

	                    case Dir.obj.SE:
	                    case "SE":
	                        edgePath.moveTo(upperLeftX + hexToPaint.EDGE_LENGTH + hexToPaint.EDGE_LENGTH / 2, upperLeftY + hexToPaint.HEIGHT / 2);
	                        edgePath.lineTo(upperLeftX + hexToPaint.EDGE_LENGTH, upperLeftY + hexToPaint.HEIGHT);
	                        break;

	                    case Dir.obj.S:
	                    case "S":
	                        edgePath.moveTo(upperLeftX + hexToPaint.EDGE_LENGTH, upperLeftY + hexToPaint.HEIGHT);
	                        edgePath.lineTo(upperLeftX, upperLeftY + hexToPaint.HEIGHT);
	                        break;

	                    case Dir.obj.SW:
	                    case "SW":
	                        edgePath.moveTo(upperLeftX, upperLeftY + hexToPaint.HEIGHT);
	                        edgePath.lineTo(upperLeftX - hexToPaint.EDGE_LENGTH / 2, upperLeftY + hexToPaint.HEIGHT / 2);
	                        break;                    


	                }
	                edgePath.closePath();
	                Globals.context.strokeStyle = hexToPaint._country.borderColor();
	                Globals.context.lineWidth = hexToPaint.BORDER_THICKNESS;

	                Globals.context.stroke(edgePath);
	            });
	        }
	
			if (Globals.showNumbers) {
	            Globals.context.lineWidth = 1;
	            Globals.context.font = "11px sans-serif";
	            Globals.context.strokeText(hexToPaint._id, upperLeftX, upperLeftY + hexToPaint.HEIGHT / 2);
	        }

	        if (Globals.markHexCenters) {
	            var ctr = hexToPaint.center();
	            var path = new Path2D();
	            path.moveTo(ctr[0] - 2, ctr[1] - 2);
	            path.lineTo(ctr[0] + 2, ctr[1] + 2);
	            path.closePath();
	            Globals.context.strokeStyle = "black";
	            Globals.context.lineWidth = 1;
	            Globals.context.stroke(path);

	            path = new Path2D();
	            path.moveTo(ctr[0] - 2, ctr[1] + 2);
	            path.lineTo(ctr[0] + 2, ctr[1] - 2);
	            path.closePath();
	            Globals.context.strokeStyle = "black";
	            Globals.context.lineWidth = 1;
	            Globals.context.stroke(path);
	        }
			
		}
	};
});