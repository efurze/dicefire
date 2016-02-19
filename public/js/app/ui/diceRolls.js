/*jslint browser: true*/

$(function() {

	'use strict';

	window.DiceRolls = {

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

		init: function() {
			this._setupRollDivs();
		},



		_setupRollDivs: function() {
	        $('#leftroll').hide();
	        $('#rightroll').hide();


            var diceDivIds = [];
            for (var i = 0; i < Globals.maxDice; i++) {

                $('#leftroll').append(
                    "<div id='leftdie" + i + "' class='die1-img'></div>"
                );

                diceDivIds.push('#leftdie' + i);

                $('#rightroll').append(
                    "<div id='rightdie" + i + "' class='die1-img'></div>"
                );

                diceDivIds.push('#rightdie' + i);
            }



            $('#leftroll').append(
                "<div id='lefttotal' class='roll-total'>35</div>"                    
            );


            $('#rightroll').append(
                "<div id='righttotal' class='roll-total'>35</div>"                    
            );

        },

        showAttack: function(fromRoll) {
        	$('#lefttotal').html(fromRoll);
	        $('#leftroll').show();
        },

        showDefense: function(toRoll) {
        	$('#righttotal').html(toRoll);
	        $('#rightroll').show();
        },

        resetRollDivs: function(state, fromCountry, toCountry, fromRollArray, toRollArray) {
			
			var self = this;
	
			// clear previous attack info
	        $('#leftroll').hide();
	        $('#rightroll').hide();

			if (!fromCountry || !toCountry || !fromRollArray || !toRollArray) {
				return;
			}
	
			var fromNumDice = fromRollArray.length;
			var toNumDice = toRollArray.length;
			
			var fromRoll = fromRollArray.reduce(function(total, die) { return total + die; });
	    	var toRoll = toRollArray.reduce(function(total, die) { return total + die; });
	
			// style a div for each die both countries have
			for (var i = 0; i < Globals.maxDice; i++) {
				
				$('#leftdie' + i).hide();
				$('#leftdie' + i).removeClass();

				if (i < fromNumDice) {
					$('#leftdie' + i).addClass("die" + fromRollArray[i] + "-img");	
					$('#leftdie' + i).show();
				}

				$('#rightdie' + i).hide();
				$('#rightdie' + i).removeClass();

				if (i < toNumDice) {
					$('#rightdie' + i).addClass("die" + toRollArray[i] + "-img");	
					$('#rightdie' + i).show();
				}
	    	}
		},
			

	};

});