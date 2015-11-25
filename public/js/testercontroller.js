"use strict"

/*

<div style="margin-left:10px; margin-top:10px; margin-bottom: 20px;">
	<select id="player_3">
	  <option value="human">human</option>
	  <option value="none">none</option>
	</select>
</div>
*/

$(function(){

	window.Testercontroller = {
		
	_ai: [AI.Plyer, AI.Greedy, AI.Aggressive],
	_callback: null,
		
	init: function(callback, numberOfPlayers) {
		
		Testercontroller._callback = callback;
		numberOfPlayers = numberOfPlayers || Globals.maxPlayers;
		
		$('#runCount').val("100");
		
		var options = "<option value='human'>human</option>";
		Testercontroller._ai.forEach(function(ai) {
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
		
		$('#player_0').val("Aggressive");
		$('#player_1').val("Aggressive");
		$('#player_2').val("Aggressive");
		$('#player_3').val("Aggressive");
		$('#player_4').val("none");
		$('#player_5').val("none");
		$('#player_6').val("none");
		$('#player_7').val("none");
		
		$('.player_selector').change(Testercontroller.update);
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
		
		var runCount = Number($('#runCount').val());
		
		if (Testercontroller._callback) {
			Testercontroller._callback(players, runCount);
		}
	},
	
	};


});

