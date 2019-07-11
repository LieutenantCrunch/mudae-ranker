mudaeRanker.directive('mudrCardDelete', ['Characters', function(Characters) {
	return {
		restrict: 'A',
		scope: false,
		link: function(scope, element, attrs) {
			element.on('click', function(event) {
				Characters.deleteActiveCard().then(function(){scope.$apply();}).catch(function(){});
				event.stopPropagation();
			});
		}
	}
}]);
