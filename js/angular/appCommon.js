if (typeof app === 'undefined') {
    throw 'app variable should exist';
}

app.constant('wcTemplatesDir', '/static/js/wcTemplates/');

/**
 * Order of including JS files for using front-end library:
 * 1. local app.js
 * 2. library appCommon.js
 * 3. local appConfig.js
 */

app.config(function($httpProvider, $rootScope) {
    // Show and hide AJAX loader.
    var activeAjaxes = 0;
    var ajaxStart = function() {
        activeAjaxes++;
        jQuery('.ajax_loader').show();
    },
    ajaxComplete = function() {
        activeAjaxes--;
        if (! activeAjaxes) {
            jQuery('.ajax_loader').hide();
        }
    }

    $httpProvider.interceptors.push(['$q', 'alertService', function($q, alerts) {
        return {
            'request': function(config) {
                ajaxStart();
                return config;
            },
            'requestError': function(rejection) {
                alerts.add('Some error in HTTP request');
                ajaxComplete();
                return $q.reject(rejection);
            },
            'response': function(response) {
                ajaxComplete();
                if (typeof response['data'] === 'object' &&
                    typeof response['data']['status'] !== 'undefined' &&
                    response['data']['status'] == 'error') {
                    alerts.add(response['data']['message']);
                }
                return response;
            },
            'responseError': function(rejection) {
                alerts.add('Some error in HTTP response ('+ rejection.status +')');
                ajaxComplete();
                return $q.reject(rejection);
            }
        };
    }]);

    $rootScope.Utils = {
        Object: {
            keys: Object.keys,
        },
    };

    /**
     * Return complex object for check and update a finish date of the date period directive,
     * if on server time new day started.
     */
    $rootScope.initFilterFinishDateUpdater = function() {
        var isLastDateInFilter = null;

        return {
            reset: function() {
                isLastDateInFilter = null;
            },
            check: function(data, currentFinishDate) {
                if (typeof data['server_time'] === 'undefined') {
                    return currentFinishDate;
                }

                var serverDateMoment = moment(data['server_time'] * 1000),
                    serverDate = serverDateMoment.format('YYYY-MM-DD'),
                    filterDate = moment(currentFinishDate).format('YYYY-MM-DD');

                if (isLastDateInFilter === null && filterDate == serverDate) {
                    isLastDateInFilter = true;
                }
                if (isLastDateInFilter === true && filterDate != serverDate) {
                    return serverDateMoment.toDate();
                }

                return currentFinishDate;
            },
        };
    };
});
