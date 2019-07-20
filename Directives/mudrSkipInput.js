mudaeRanker.directive('mudrSkipInput', ['Characters', function(Characters) {
	return {
		restrict: 'A',
		scope: false,
		link: function(scope, element, attrs) {
			element.on('click', function(event) {
				if (event.target.tagName === 'INPUT')
				{
					Characters.handleSkippedCharacter(scope.$index);
					event.stopPropagation();
				}
			});
		}
	}
}]);