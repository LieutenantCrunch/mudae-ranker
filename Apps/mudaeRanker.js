var mudaeRanker = angular.module('mudaeRanker', ['ng-sortable']);

mudaeRanker.constant('Mode', { Edit: 0, Rank: 1}).constant('MergeCode', { NoAction: 0, NotFound: 1, Lookup: 2}).constant('RankChoice', { Left: -1, Right: 1 });
