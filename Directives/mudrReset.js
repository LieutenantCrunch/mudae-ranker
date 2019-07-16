mudaeRanker.directive('mudrReset', ['Characters', 'Utilities', function(Characters, Utilities) {
	return {
		restrict: 'A',
		scope: false,
		link: function(scope, element, attrs) {
			element.on('click', function(event) {
				Utilities.confirm('Are you sure you want to reset everything?', 'Confirm Reset').done(function (data, button) {
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