mudaeRanker.directive('mudrRightCompareSkip', ['Characters', function(Characters) {
	return {
		restrict: 'A',
		scope: false,
		link: function(scope, element, attrs) {
			element.on('click', function(event) {
				Characters.skipRight();
				scope.$apply();
				event.stopPropagation();
			});
		}
	}
}]);