mudaeRanker.directive('mudrRankingStart', ['Characters', 'Utilities', function(Characters, Utilities) {
	return {
		restrict: 'A',
		scope: false,
		link: function(scope, element, attrs) {
			element.on('click', function(event) {
				if (Characters.rankingInProgress)
				{
					$.MessageBox({buttonDone: {
							startOver: {
								text: 'Start Over'
							},
							resume: {
								text: 'Resume'
							}
						}, 
						buttonFail: 'Cancel', 
						buttonsOrder: 'done fail', 
						message: 'You have already ranked some characters, do you want to start over or resume ranking?',
						title: 'Confirm Restart'
					}).done(function (data, button) {
						if (button === 'startOver')
						{
							Characters.startRankMode();
						}
						else // resume
						{
							Characters.resumeRankMode();
						}
						scope.$apply();
					}).fail(function (data, button) {
						console.log('Fine then, stay in Edit mode');
					});
				}
				else
				{
					Characters.startRankMode();
					scope.$apply();
				}
			});
		}
	}
}]);
