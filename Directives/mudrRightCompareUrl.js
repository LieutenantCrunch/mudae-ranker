mudaeRanker.directive('mudrRightCompareUrl', ['Characters', function(Characters) {
	return {
		restrict: 'A',
		scope: false,
		link: function(scope, element, attrs) {
			element.on('keyup', function(event) {
				event.stopPropagation();
			});

			element.on('input', function(event) {
				Characters.getLeftCompare().imageUrl = element.val();
				scope.$apply();
			});

			element.on('click', function(event) {
				event.stopPropagation();
			});
		}
	}
}]);