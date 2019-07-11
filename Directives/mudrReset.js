mudaeRanker.directive('mudrReset', ['Characters', function(Characters) {
	return {
		restrict: 'A',
		scope: false,
		link: function(scope, element, attrs) {
			element.on('click', function(event) {
				$.MessageBox({buttonDone: 'Yes', 
					buttonFail: 'No', 
					buttonsOrder: 'done fail', 
					message: 'Are you sure you want to reset everything?',
					title: 'Confirm Reset'
				}).done(function (data, button) {
					$('#InputField').val('');
					$('#OutputField').val('');
					Characters.clean();
					scope.$apply();
				}).fail(function (data, button) {
					console.log('Then why did you click the reset button?');
				});
			});
		}
	}
}]);