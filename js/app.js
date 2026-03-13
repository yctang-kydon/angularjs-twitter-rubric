const app = angular.module('twitterRubricApp', []);

// Date Filter
app.filter('unixDate', function() {
    return function(timestamp) {
        if (!timestamp) return '';
        const date = new Date(timestamp * 1000);
        return date.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };
});

// Root Component
app.component('rubricApp', {
    templateUrl: 'templates/app.template.html',
    controller: AppController
});

AppController.$inject = ['$http'];
function AppController($http) {
    // ViewModel pattern - using 'this' to refer to the controller instance
    const $ctrl = this; 

    $ctrl.title = 'Twitter Rubric';
    // database of followers
    $ctrl.followers = [];
    // filtered list of followers to display
    $ctrl.filteredFollowers =[];

    $ctrl.startDate = null;
    $ctrl.endDate = null;
    $ctrl.sortField = null;
    $ctrl.sortAscending = true;

    // Lifecycle Hook - Called when the component is initialized
    $ctrl.$onInit = function() {
        $http.get('data/twubric.json').then(function(response){
            $ctrl.followers = response.data; 
            // show all by default
            $ctrl.filteredFollowers = $ctrl.followers;
        });
    };

    // Remove a follower from the array
    $ctrl.removeFollower = function(follower) {
        $ctrl.followers = $ctrl.followers.filter(function(f) {
            return f.uid !== follower.uid;
        });
        $ctrl.filteredFollowers = $ctrl.filteredFollowers.filter(function(f) {
            return f.uid !== follower.uid;
        });
    };

    $ctrl.applyDateFilter = function() {
        if ($ctrl.isRangeOverSixMonths() && $ctrl.sortField === 'chirpiness') {
            $ctrl.sortField = null;
            $ctrl.sortAscending = true;
        }

        if (!$ctrl.startDate || !$ctrl.endDate) {
            $ctrl.filteredFollowers = $ctrl.followers;
            return;
        }

        const start = new Date($ctrl.startDate).getTime() / 1000;
        const end = new Date($ctrl.endDate).getTime() / 1000;
        $ctrl.filteredFollowers = $ctrl.followers.filter(function(follower) {
            return follower.join_date >= start && follower.join_date <= end;
        });
    };

    $ctrl.clearDate = function(which) {
        if (which === 'start') {
            $ctrl.startDate = null;
        } else {
            $ctrl.endDate = null;
        }
        $ctrl.applyDateFilter();
    };
        
    // Sort followers by a specific field
    $ctrl.sortBy = function(field) {
        if ($ctrl.sortField === field) {
            // Same field clicked - toggle direction
            $ctrl.sortAscending = !$ctrl.sortAscending;
        } else {
            $ctrl.sortField = field;
            $ctrl.sortAscending = true;
        }

        $ctrl.filteredFollowers.sort(function(a, b) {
            const valA = a.twubric[field];
            const valB = b.twubric[field];
            if ($ctrl.sortAscending) {
                return valA - valB;
            } else {
                return valB - valA;
            }
        });
    };

    // Disable chirpiness sorting if date range > 6 months
    $ctrl.isRangeOverSixMonths = function() {
        // If either date is missing, we can't determine the range, so return false
        if (!$ctrl.startDate || !$ctrl.endDate) return false;

        const start = new Date($ctrl.startDate);
        const end = new Date($ctrl.endDate);

        // Only true if end is after start AND range > 6 months
        if (end <= start) return false; 

        const sixMonthsMs = 6 * 30 * 24 * 60 * 60 * 1000;
        return (end - start) > sixMonthsMs;
    };
}