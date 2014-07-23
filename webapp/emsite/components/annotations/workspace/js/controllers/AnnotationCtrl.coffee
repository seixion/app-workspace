Workspace.controller 'AnnotationCtrl', [
	'$rootScope', '$scope', '$filter', 'ngTableParams', 'collectionAssetData', 
	($rootScope, $scope, $filter, ngTableParams, collectionAssetData) ->
		$rootScope.$broadcast 'navigatedTo', 'Annotations'
		data = collectionAssetData.assetData
		$scope.tableParams = new ngTableParams 
			page: 1
			count: 5
			sorting:
				'annotation.hasRecentActivity': 'desc'
		, 
			total: data.length
			getData: ($defer, params) ->
				orderedData = if params.sorting() then $filter('orderBy') data, params.orderBy() else data
				$defer.resolve orderedData.slice (params.page() - 1) * params.count(), params.page() * params.count()
				em.unit
		em.unit;
]
