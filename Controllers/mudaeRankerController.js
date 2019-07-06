mudaeRanker.controller('mudaeRankerController', ['$scope', '$http', 'Characters', function($scope, $http, Characters) {

$scope.characters = Characters.getCharacters();
$scope.getModeClassName = Characters.getModeClassName;
$scope.getNextModeName = Characters.getNextModeName;

}]);