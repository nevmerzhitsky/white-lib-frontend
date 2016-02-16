angular.module('alertService', [])
    .factory('alertService', ['$rootScope', function ($rootScope) {
        var alertsData = [];
        $rootScope.alerts = {};

        $rootScope.alerts.add = function(msg, type) {
            type = type || 'danger';
            alertsData.push({
                type: type,
                msg: msg
            });
        };
        $rootScope.alerts.close = function(index) {
            alertsData.splice(index, 1);
        };
        $rootScope.alerts.closeAll = function() {
            alertsData = [];
        };
        $rootScope.alerts.alerts = function() {
            return alertsData;
        }

        return $rootScope.alerts;
    }]);
