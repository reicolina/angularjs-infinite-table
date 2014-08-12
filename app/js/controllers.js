'use strict';

/* Controllers */

angular.module('myApp.controllers', [])
  .controller('MyCtrl1', ['$scope', '$window', 'Reddit', function ($scope, $window, Reddit) {
      $scope.reddit = new Reddit();
  }])
  .controller('MyCtrl2', ['$scope', function($scope) {

  }]);
