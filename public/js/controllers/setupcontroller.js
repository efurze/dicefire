"use strict"


$(function(){

	window.Setupcontroller = {
		
	_ai: [AI.Plyer, AI.Greedy, AI.Aggressive],
	_callback: null,
		
	init: function(callback, numberOfPlayers) {
		
		Setupcontroller._callback = callback;
		numberOfPlayers = numberOfPlayers || Globals.maxPlayers;
		
		var options = "<option value='human'>human</option>";
		Setupcontroller._ai.forEach(function(ai) {
			options += "<option value='" + ai.getName() + "'>" + ai.getName() + "</option>";
		});
		
		options += "<option value='none'>none</option>";
		
		for (var id=0; id < numberOfPlayers; id++) {
			$('#player_select').append(
	    		  "<div style='margin-left:10px; margin-top:10px; margin-bottom: 20px;'>"
				+		"<select class='player_selector' id='player_" + id + "'>"
				+			options
				+		"</select>"
				+ "</div>"
	    	);
		}
		
		$('#player_0').val("human");
		$('#player_1').val("Aggressive");
		$('#player_2').val("Greedy");
		$('#player_3').val("Plyer");
		$('#player_4').val("Plyer");
		$('#player_5').val("Greedy");
		$('#player_6').val("Aggressive");
		$('#player_7').val("none");
		
		$('.player_selector').change(Setupcontroller.update);
	},


	startGame: function() {
		var self = this;
		var players = [];
		
		for (var id=0; id < Globals.maxPlayers; id++) {
			var option = $('#player_' + id).val(); 
			if (option === "human") {
				players.push("human");
			}  
			if (option === "Plyer") {
				players.push(AI.Plyer);
			} 
			if (option === "Greedy") {
				players.push(AI.Greedy);
			} 
			if (option === "Aggressive") {
				players.push(AI.Aggressive);
			}
		}
		
		if (Setupcontroller._callback) {
			Setupcontroller._callback(players);
		}
	},
	
	};


});

