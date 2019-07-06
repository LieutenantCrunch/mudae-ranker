mudaeRanker.controller('mudaeRankerController', ['$scope', '$http', 'Characters', function($scope, $http, Characters) {

$scope.characters = Characters.getCharacters();
$scope.getModeClassName = Characters.getModeClassName;
$scope.getNextModeName = Characters.getNextModeName;
$scope.getLeftCompare = Characters.getLeftCompare;
$scope.getRightCompare = Characters.getRightCompare;

}]);
