mudaeRanker.directive('mudrExportClean', [function() {
	return {
		restrict: 'A',
		scope: false,
		link: function(scope, element, attrs) {
			element.on('click', function(event) {
				$('#OutputField').val('');
			});
		}
	}
}]);