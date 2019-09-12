mudaeRanker.directive('mudrUrlInput', ['Characters', function(Characters) {
	return {
		restrict: 'A',
		scope: false,
		link: function(scope, element, attrs) {
			element.on('keyup', function(event) {
				event.stopPropagation();
			});

			element.on('input', function(event) {
				Characters.updateCharacterImage(scope.$index, element.val());
			});

			element.on('click', function(event) {
				event.stopPropagation();
			});
		}
	}
}]);