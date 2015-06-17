'use strict';

angular.module('boursesApp')
  .controller('VosRessourcesCtrl', function($scope, $http, $state, $timeout, $modal, store) {
    $scope.credentials = store.get('credentials') || {};
    $scope.data = store.get('svair-data') || {};
    $scope.identite = store.get('identite-adulte') || {garde: 'non'};

    var currentYear = new Date().getFullYear();
    $scope.nMinus1 = currentYear - 1;
    $scope.nMinus2 = currentYear - 2;

    $scope.newCredentials = _.cloneDeep($scope.credentials);
    $scope.status = $scope.credentials.status;
    $scope.cancelCredentials = cancelCredentials;

    $scope.validateSvair = function(form) {
      if (form.$valid) {
        $scope.loading = true;

        $http.get('/api/connection/svair', {params: $scope.newCredentials})
        .success(function(data) {
          data.identites = [];
          if (data.declarant1) {
            data.identites.push(data.declarant1);
          }
          if (data.declarant2) {
            data.identites.push(data.declarant2);
          }

          store.set('svair-data', data);
          $scope.data = data;
          saveCredentials('success');
        })
        .error(function(err) {
          $scope.error = err.message;
          $scope.status = 'error';
        })
        .finally(function() {
          $scope.loading = false;
        });
      }
    };

    $scope.edit = function() {
      $scope.status = 'pending';
    };

    $scope.next = function(form) {
      if (form.$valid) {
        if ($scope.status !== 'success') {
          $modal.open({
            animation: true,
            template: '<div class="modal-body"><h1>Vous n\'avez pas rempli ou validé vos informations fiscales.</h1></div>' +
            '<div class="modal-footer">' +
                '<button class="btn btn-primary" ng-click="ok()">OK</button>' +
            '</div>',
            controller: function($scope, $modalInstance) {
              $scope.ok = function() {
                $modalInstance.dismiss();
              };
            }
          });

          return;
        }

        var steps = store.get('steps');
        steps.connexion = form.$valid;
        store.set('steps', steps);
        store.set('identite-adulte', $scope.identite);
        $state.go('layout.nouvelle_demande.vos-renseignements');
      }
    };

    function cancelCredentials() {
      $scope.newCredentials = _.cloneDeep($scope.credentials);
      $scope.status = $scope.credentials.status;
    }

    function saveCredentials(status) {
      $scope.credentials = $scope.newCredentials;
      $scope.status = $scope.credentials.status = status;
      store.set('credentials', $scope.credentials);
    }
  });
