mudaeRanker.directive('mudrNewCharacterCard', ['Characters', function(Characters) {
	return {
		restrict: 'A',
		scope: false,
		link: function(scope, element, attrs) {
			var newCharacterAdd = element.find('#NewCharacterAdd');
			var newCharacterCancel = element.find('#NewCharacterCancel');

			newCharacterAdd.on('click', function(event) {
				var newCharacterName = element.find('#NewCharacterName');
				var newCharacterSeries = element.find('#NewCharacterSeries');
				var newCharacterUrl = element.find('#NewCharacterUrl');
				var newCharacterSkip = element.find('#NewCharacterSkip');
				
				Characters.addNewCharacter(newCharacterName.val(), newCharacterSeries.val(), newCharacterUrl.val(), newCharacterSkip.first()[0].checked);
				
				newCharacterName.val('');
				newCharacterSeries.val('');
				newCharacterUrl.val('');
				newCharacterSkip.first()[0].checked = false;
				element[0].style.display='none';
			});

			newCharacterCancel.on('click', function(event) {
				var newCharacterName = element.find('#NewCharacterName');
				var newCharacterSeries = element.find('#NewCharacterSeries');
				var newCharacterUrl = element.find('#NewCharacterUrl');
				var newCharacterSkip = element.find('#NewCharacterSkip');

				newCharacterName.val('');
				newCharacterSeries.val('');
				newCharacterUrl.val('');
				newCharacterSkip.first()[0].checked = false;
				element[0].style.display='none';
			});
		}
	}
}]);