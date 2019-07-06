mudaeRanker.directive('mudrLeftCompareSkip', ['Characters', function(Characters) {
	return {
		restrict: 'A',
		scope: false,
		link: function(scope, element, attrs) {
			element.on('click', function(event) {
				Characters.skipLeft();
				scope.$apply();
				event.stopPropagation();
			});
		}
	}
}]);