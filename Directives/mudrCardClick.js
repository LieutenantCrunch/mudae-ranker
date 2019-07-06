mudaeRanker.directive('mudrCardClick', ['Characters', function(Characters) {
	return {
		restrict: 'A',
		scope: false,
		link: function(scope, element, attrs) {
			element.on('click', function(event) {
				Characters.clickCard(element, scope.$index);
				scope.$apply();
				event.stopPropagation();
			});
		}
	}
}]);