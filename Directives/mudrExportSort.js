mudaeRanker.directive('mudrExportSort', ['Characters', function(Characters) {
	return {
		restrict: 'A',
		scope: false,
		link: function(scope, element, attrs) {
			element.on('click', function(event) {
				Characters.exportSort();
			});
		}
	}
}]);