// Generated by CoffeeScript 1.4.0

Workspace.controller('CollaborationDetailsCtrl', [
  '$scope', '$stateParams', 'collaborationService', function($scope, $stateParams, collaborationService) {
    $scope.currentCollaboration = _.find(collaborationService.mockData, function(item) {
      return item.collaboration.id === parseInt($stateParams.collaborationID);
    });
    return em.unit;
  }
]);
