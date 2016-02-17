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
                    "<div id='leftdie" + i + "' class='roll-die'>5</div>"
                );

                diceDivIds.push('#leftdie' + i);

                $('#rightroll').append(
                    "<div id='rightdie" + i + "' class='roll-die'>5</div>"
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
				$('#leftdie' + i).css({
					'background-color': self._playerColors[state.countryOwner(fromCountry)]
				});

				if (i < fromNumDice) {
					$('#leftdie' + i).html(fromRollArray[i]);
					$('#leftdie' + i).show();
				} else {
					$('#leftdie' + i).hide();
				}

				$('#rightdie' + i).css({
					'background-color': self._playerColors[state.countryOwner(toCountry)]
				});

				if (i < toNumDice) {
					$('#rightdie' + i).html(toRollArray[i]);
					$('#rightdie' + i).show();
				} else {
					$('#rightdie' + i).hide();
				}
	    	}
		},
			

	};

});