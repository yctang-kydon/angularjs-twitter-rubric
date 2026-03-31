import angular from 'angular';

const app = angular.module('twitterRubricApp', [
    'ngMaterial',
    'ngAnimate',
    'ngAria',
    'ngMessages'
]);

// Date Filter
app.filter('unixDate', () => {
    return (timestamp) => {
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

AppController.$inject = ['$http', '$log'];
function AppController($http, $log) {
    // ViewModel pattern - using 'this' to refer to the controller instance
    const $ctrl = this; 

    // --- STATE ---
    $ctrl.title = 'Twitter Rubric';
    $ctrl.followers = [];
    $ctrl.filteredFollowers =[];
    $ctrl.errorMessage = null;
    $ctrl.isLoading = false;

    // --- FILTER STATE ---
    $ctrl.startDate = null;
    $ctrl.endDate = null;

    // --- SORT STATE ---
    $ctrl.sortField = null;
    $ctrl.sortAscending = true;

    // --- CONFIG: SORT OPTIONS ---
    $ctrl.sortOptions = [
        {field: 'total', label: 'Score'},
        {field: 'friends', label: 'Friends'},
        {field: 'influence', label: 'Influence'},
        {field: 'chirpiness', label: 'Chirpiness'}
    ];

    // --- LIFECYCLE HOOK ---
    $ctrl.$onInit = () => {
        $ctrl.isLoading = true;

        $http.get('data/twubric.json').then((response) => {
            $ctrl.followers = response.data; 
            _derive();
        }).catch((error) => {
            $log.error('Failed to load followers:', error);
            $ctrl.errorMessage = 'Failed to load followers data. Please check your connection and try again.';
        }).finally(() => {
            $ctrl.isLoading = false;
        });
    };

    $ctrl.$onDestroy = () => {
        // placeholder code to cleanup scope
    }; 

    // --- METHODS (USER ACTIONS) ---

    // Remove a follower from the array
    $ctrl.removeFollower = (follower) => {
        $ctrl.followers = $ctrl.followers.filter(f => f.uid !== follower.uid);
        _derive();
    };

    // Clear date(s) selected
    $ctrl.clearDate = (which) => {
        if (which === 'start') {
            $ctrl.startDate = null;
        } else {
            $ctrl.endDate = null;
        }
        _derive();
    };

    // Apply date filter
    $ctrl.applyDateFilter = () => {
        _derive();
    };

    // Sort followers by a specific field
    $ctrl.sortBy = (field) => {
        if ($ctrl.sortField === field) {
            // Same field clicked - toggle direction
            $ctrl.sortAscending = !$ctrl.sortAscending;
        } else {
            $ctrl.sortField = field;
            $ctrl.sortAscending = true;
        }
        _derive();
    }; 

    // Reset sort fields
    $ctrl.resetSort = () => {
        $ctrl.sortField = null; 
        $ctrl.sortAscending = true;
        // reapply date filter to restore original order
        _derive();
    };


    // --- STATE CHECKS ---

    // Check if date range > 6 months
    $ctrl.isRangeOverSixMonths = () => {
        // If either date is missing, we can't determine the range, so return false
        if (!$ctrl.startDate || !$ctrl.endDate) return false;
        if ($ctrl.endDate <= $ctrl.startDate) return false;

        const sixMonthsLater = new Date($ctrl.startDate);
        sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
        return $ctrl.endDate > sixMonthsLater;
    };

    // Check if no followers are shown
    $ctrl.isEmpty = () => {
        return $ctrl.filteredFollowers.length === 0;
    };

    // Sort buttons disabled on specific conditions
    $ctrl.isSortDisabled = (field) => {
        if ($ctrl.isEmpty()) return true;
        if (field === 'chirpiness') return $ctrl.isRangeOverSixMonths();
        return false;
    };

    // --- COMPUTED PROPERTY ---
    // Returns true when any filter is current active
    $ctrl.isFiltered = () => {
        return $ctrl.startDate !== null || $ctrl.endDate !== null;
    };

    // --- PRIVATE HELPERS: PURE FUNCTIONS ---

    function _derive() {
        let result = _applyDateFilter($ctrl.followers);
        result = _applySort(result);

        if ($ctrl.isRangeOverSixMonths() && $ctrl.sortField === 'chirpiness') {
            $ctrl.sortField = null;
            $ctrl.sortAscending = true;
            result = _applySort($ctrl.followers);
        }
        $ctrl.filteredFollowers = result;
    
    }

    function _applyDateFilter(list) {
        return list.filter((follower) => {
            const joinDate = new Date(follower.join_date * 1000);
            // start date - show followers who joined FROM this date
            if ($ctrl.startDate && joinDate < $ctrl.startDate) return false;
            // end date - show followers who joined UP TO this date
            if ($ctrl.endDate && joinDate > $ctrl.endDate) return false;
            return true;
        });
    }

    function _applySort(list) {
        if (!$ctrl.sortField) return list;

        return list.slice().sort((a, b) => {
            const valA = a.twubric[$ctrl.sortField];
            const valB = b.twubric[$ctrl.sortField];
            return $ctrl.sortAscending ? valA - valB : valB - valA;
        });
    }

}