mudaeRanker.directive('mudrParseInput', ['Characters', 'Utilities', function(Characters, Utilities) {
	return {
		restrict: 'A',
		scope: false,
		link: function(scope, element, attrs) {
			element.on('click', function(event) {
				Utilities.parseDiscordDump($('#DiscordDump').first().val());
			});
		}
	}
}]);