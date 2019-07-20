mudaeRanker.controller('mudaeRankerController', ['$scope', '$http', 'Characters', function($scope, $http, Characters) {

$scope.characters = Characters.getCharacters();
$scope.getModeClassName = Characters.getModeClassName;
$scope.getNextModeName = Characters.getNextModeName;
$scope.getLeftCompare = Characters.getLeftCompare;
$scope.getRightCompare = Characters.getRightCompare;
$scope.getRankingInProgress = Characters.getRankingInProgress;
$scope.hasCharacters = Characters.hasCharacters;

$scope.sortableConfig = {
	onEnd: function (event)
	{
		Characters.dragAndDropSortEnd(event);
	}
}

}]);
