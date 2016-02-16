app.directive('wcDatePeriod', ['$compile', 'wcTemplatesDir', function($compile, templatesDir) {
    return {
        restrict: 'E',
        scope: {
            startDate: '=',
            finishDate: '=',
            minDate: '=?',
            maxDate: '=?',
            showCallback: '&?',
            closeCallback: '&?',
            startInputId: '@',
            startRequired: '@',
            finishRequired: '@',
        },
        templateUrl: function(elem, attr) {
            attr.template = attr.template || 'default';

            if (! /^[\d\w]+$/.test(attr.template)) {
                throw new Error('Unsecure symbols in template name: '+ attr.template);
            }

            return templatesDir +'wcDatePeriod/'+ attr.template +'.html';
        },
        link: {
            pre: preLink,
            post: postLink,
        },
    };

    function preLink (scope, element, attrs) {
        scope.startInputId   = scope.startInputId || 'period_start';
        scope.showCallback   = scope.showCallback  || function () {};
        scope.closeCallback  = scope.closeCallback || function () {};
        scope.startRequired  = (typeof scope.startRequired  !== 'undefined' ? scope.startRequired  : true);
        scope.finishRequired = (typeof scope.finishRequired !== 'undefined' ? scope.finishRequired : true);

        scope.options = {startingDay: 1};
        initModel(scope, scope.minDate, scope.maxDate);
    };

    function initModel (scope, absMinDate, absMaxDate) {
        scope.startDate = new Date(Math.max(scope.startDate, absMinDate));

        var pickerInit = function() {
            var result = {
                opened: false,
                show: function () {
                    result.opened = true;
                }
            };
            return result;
        };

        scope.startPicker = pickerInit();
        scope.finishPicker = pickerInit();

        scope.updateRanges = function() {
            var startMaxBoundary = [scope.finishDate];
            if (typeof absMaxDate !== 'undefined') {
                startMaxBoundary.push(absMaxDate);
            }
            var finishMinBoundary = [scope.startDate];
            if (typeof absMinDate !== 'undefined') {
                finishMinBoundary.push(absMinDate);
            }

            scope.startPicker.minDate = absMinDate;
            scope.startPicker.maxDate = new Date(Math.min.apply(null, startMaxBoundary));
            scope.finishPicker.minDate = new Date(Math.max.apply(null, finishMinBoundary));
            scope.finishPicker.maxDate = absMaxDate;
        };

        scope.updateRanges();
    };

    function postLink (scope, element, attrs) {
        // Add ID to start input for clickable a label.
        jQuery('input[ng-model="startDate"]', element).attr('id', scope.startInputId);

        if (scope.startDate || scope.finishDate) {
            scope.closeCallback();
        }

        scope.$watchGroup(['startDate', 'finishDate'], function(newValue, oldValue) {
            scope.updateRanges();
        });
        scope.$watch('startPicker.opened', function(newValue, oldValue) {
            if (newValue == oldValue) {
                return;
            }

            newValue == false ? scope.closeCallback() : scope.showCallback();
        });
        scope.$watch('finishPicker.opened', function(newValue, oldValue) {
            if (newValue == oldValue) {
                return;
            }

            newValue == false ? scope.closeCallback() : scope.showCallback();
        });
    };
}]);
