angular.module('twitterRubricApp')
    .directive('flatpickrInput', function() {
        return {
            restrict: 'A',
            require: 'ngModel',
            link: function(scope, element, attrs, ngModel) {

                const fp = flatpickr(element[0], {
                    dateFormat: 'Y-m-d',
                    altInput: true,
                    altFormat: 'j M Y',
                    onChange: function(selectedDates, dateStr) {
                        scope.$apply(function() {
                            ngModel.$setViewValue(dateStr);
                        });
                    }
                });

                // Watch for null - when model is cleared, clear Flatpickr too
                scope.$watch(function() {
                    return ngModel.$modelValue;
                }, function(newVal) {
                    if (!newVal) {
                        fp.clear();
                    }
                });

                scope.$on('$destroy', function() {
                    fp.destroy();
                });
            }
        };
    });