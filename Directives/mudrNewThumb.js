mudaeRanker.directive('mudrNewThumb', ['Characters', function(Characters) {
	return {
		restrict: 'A',
		scope: false,
		link: function(scope, element, attrs) {
			element.on('click', function(event) {
				document.getElementById('NewCharacterCard').style.display='';
				event.stopPropagation();
			});
		}
	}
}]);