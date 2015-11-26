"use strict"

$(function(){

	window.Testerrenderer = {
		
	_chart: null,
				
	init: function(players, container) {

		// make the results table
		var uniquePlayers = {}; // so we don't have 2 entries for 2 copies of the same AI
		var data = [];
		var topRow = ["Start Position"];
		players.forEach(function(player, idx) {
			topRow.push(idx+1);
			
			if (uniquePlayers[player.getName()]) {
				return;
			} else {
				uniquePlayers[player.getName()] = true;
			}
			
			var row = [];
			row.length = players.length+1;
			row.fill(0);
			if (player == "human") {
				row[0] = "human";
			} else {
				row[0] = player.getName();
			}
			data.push(row);
		});
		data.unshift(topRow);
		
		var table = Testerrenderer._makeTable($('#results'), data);
		container.append(table);

        Testerrenderer._chart = new google.charts.Bar(document.getElementById('results_chart'));
	},


	update: function(results, runTracker) {
		$('#counter').html(AI_Tester._runner._currentRun + "/" + AI_Tester._runner._runCount);
		
		var options = {
          chart: {
            title: 'AI Win Rate by Position',
          },
		  hAxis: {minValue: 0, maxValue: 100, viewWindow: {min: 0, max: 100}},
          bars: 'horizontal', // Required for Material Bar Charts.
		  
        };

		//if (AI_Tester._runner._currentRun == AI_Tester._runner._runCount) {
			Testerrenderer._chart.draw(Testerrenderer._formatData(results, runTracker), google.charts.Bar.convertOptions(options));
		//}
		
		Object.keys(results).forEach(function(name, row) {
			var playerResults = results[name];
			
			playerResults.forEach(function(result, col) {
				var percentage = "% " + ((runTracker[name][col]) ? (100*result/runTracker[name][col]).toPrecision(3) : "--");
				$('#results #' + (row+1) + (col+1)).html(percentage);
			});
		});
	},
	
	/*
		results = {
			"Plyer" : [2, 54, 345]  // wins by position
		}
		
		runTracker = {
			"Plyer" : [23, 23, 43] // # of times playing in that position
		}
	*/
	_formatData: function (results, runTracker) {
		/*
		var data = google.visualization.arrayToDataTable([
		          ['Year', 'Sales', 'Expenses', 'Profit'],
		          ['2014', 1000, 400, 200],
		          ['2015', 1170, 460, 250],
		          ['2016', 660, 1120, 300],
		          ['2017', 1030, 540, 350]
		        ]);
		
			[
			  ['Position', 'Plyer', 'Greedy', 'Aggressive'],
	          ['1', 1000, 400, 200],
	          ['2', 1170, 460, 250],
	          ['3', 660, 1120, 300],
	          ['4', 1030, 540, 350]
	        ]
	
			[["Position","Plyer","Greedy","Aggressive"],["1",1000,400,200],["2",1170,460,250],["3",660,1120,300],["4",1030,540,350]]
			
		*/
		var playerNames = Object.keys(results);
		var data = [];
		data.length = results[playerNames[0]].length + 1;
		data[0] = ["Position"];
		playerNames.forEach(function(name, row) {
			data[0].push(name); // player label
			
			results[name].forEach(function (result, col) {
				data[col+1] = data[col+1] || [];
				data[col+1][0] = (col+1).toString(); // position label
				data[col+1][row+1] = runTracker[name][col] ? (100*result/runTracker[name][col]) : 0;
			});
		});
				
		return google.visualization.arrayToDataTable(data)	;
	},
	
	_makeTable: function (table, data) {
	    $.each(data, function(rowIndex, r) {
	        var row = $("<tr/>");
	        $.each(r, function(colIndex, c) { 
				if (rowIndex == 0) {
					row.append($("<th/>").text(c));
				} else {
					row.append($("<td id='" + (rowIndex) + (colIndex) + "'/>").text(c));
				}
	            
	        });
	        table.append(row);
	    });
		return table;
	},
	
	};


});