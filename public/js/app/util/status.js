// Handles the overlay popup message for ladder client

$(function() {

	window.Status = {

		_stack: [],


		clear: function() {
			$('#status-msg').html("");
			$('#status-overlay').css('display', 'none');
			/*
			Status._stack.pop();

			if (Status._stack.length) {
				Status.setStatus(Status._stack.pop());
			} else {
				$('#status-msg').html("");
				$('#status-overlay').css('display', 'none');
			}
			*/
		},

		setStatus: function(msg) {
			$('#status-msg').html(msg);
			$('#status-overlay').css('display', 'block');
			//Status._stack.push(msg);
		},

	};

});
