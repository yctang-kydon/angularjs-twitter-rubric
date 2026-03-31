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

AppController.$inject = ['$http', '$log', '$document', '$scope', '$window', '$timeout'];
function AppController($http, $log, $document, $scope, $window, $timeout) {
    // ViewModel pattern - using 'this' to refer to the controller instance
    const $ctrl = this; 

    // --- STATE ---
    $ctrl.title = 'Twitter Rubric';
    $ctrl.followers = [];
    $ctrl.filteredFollowers =[];
    $ctrl.errorMessage = null;
    $ctrl.isLoading = false;

    // --- REASON FOR EMPTY LIST: 'filtered' | 'removed' | null
    $ctrl.emptyReason = null;

    // --- MENU STATE ---
    $ctrl.menuOpen = false;

    // FILTER PANEL STATE ---
    // On desktop/tablet (>= 768px) panel is always open
    // On mobile it starts collapsed so cards are immediately visible
    $ctrl.filtersOpen = _isDesktop();

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

        // Minimum display time for loading spinner for illustration purposes
        const minLoadMs = 1500;
        const loadStart = Date.now();

        $http.get('data/twubric.json').then((response) => {
            const elapsed = Date.now() - loadStart;
            const remaining = Math.max(0, minLoadMs - elapsed);

            $timeout(() => {
                $ctrl.followers = response.data; 
                _derive();
                $ctrl.isLoading = false;
            }, remaining);
        }).catch((error) => {
            $log.error('Failed to load followers:', error);
            $ctrl.errorMessage = 'Failed to load followers data. Please check your connection and try again.';
            $ctrl.isLoading = false;
        });

        // Close the menu when user clicks outside the drawer.
        // Note that this event fires outside of Angular's digest cycle so
        // we need to wrap this in $scope.$apply so it can be detected.
        $document.on('click', _onOutsideClick);

        // Keep filtersOpen in sync when window is resized across breakpoints
        $window.addEventListener('resize', _onResize);
    };

    $ctrl.$onDestroy = () => {
        // Deregister the document listener and event listener to prevent leakage
        $document.off('click', _onOutsideClick);
        $window.removeEventListener('resize', _onResize);
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

    // Toggle filter panel open or close (mobile only)
    $ctrl.toggleFilters = () => {
        $ctrl.filtersOpen = !$ctrl.filtersOpen;
    };

    // Toggle menu drawer 
    $ctrl.toggleMenu = () => {
        $ctrl.menuOpen = !$ctrl.menuOpen;
    };

    // Close the drawer (either using backdrop click or X button)
    $ctrl.closeMenu = () => {
        $ctrl.menuOpen = false;
    };

    // --- STATE CHECKS ---

    // Check if date range > 6 months
    $ctrl.isRangeOverSixMonths = () => {
        const now = new Date();

        const sixMonthsLater = (date) => {
            const d = new Date(date);
            d.setMonth(d.getMonth() + 6);
            return d;
        };

        // Start Date and End Date are specified, check the range
        if ($ctrl.startDate && $ctrl.endDate) {
            if ($ctrl.endDate <= $ctrl.startDate) return false;
            return $ctrl.endDate > sixMonthsLater($ctrl.startDate);
        }

        // Only start date specified - implied end date is today
        if ($ctrl.startDate && !$ctrl.endDate) {
            return now > sixMonthsLater($ctrl.startDate);
        }

        // Only end date set - lower bound unknown
        // Not possible to calculate range, hence we do not apply 6-month restriction
        if (!$ctrl.startDate && $ctrl.endDate) {
            return false;
        }
        
        // No dates set - no restriction applied
        return false;
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

    // Returns true if viewport is at desktop/tablet breakpoint (>= 768px)
    function _isDesktop() {
        return $window.innerWidth >= 768;
    }

    // Syncs filtersOpen when window crosses mobile/desktop breakpoint
    // Uses $scope.$apply because resize fires outside of Angular's digest cycle
    function _onResize() {
        $scope.$apply(() => {
            if (_isDesktop()) {
                // Always open on desktop
                $ctrl.filtersOpen = true;
            } else if ($ctrl.filtersOpen && !$ctrl.isFiltered() && !$ctrl.sortField) {
                // Only collapse if crossing to mobile with no active filters
                $ctrl.filtersOpen = false;
            }
        });
    }

    // Closes the menu when user clicks outside drawer or X button. 
    // Uses $scope.$apply as the native DOM click element fires outside of Angular's digest cycle.
    function _onOutsideClick(event) {
        const drawer = document.querySelector('.nav-drawer');
        const menu = document.querySelector('.app-header__menu');
        if (!drawer || !menu) return;
        if (!drawer.contains(event.target) && !menu.contains(event.target)) {
            $scope.$apply(() => {
                $ctrl.menuOpen = false;
            });
        }
    }

    // This is idempotent - safe to call after every state change.
    // Pattern: correct state → filter → sort → assign. Never mutates inputs.
    function _derive() {
        // Note: To check if current date range invalidates chirpiness sorting
        // Reset sort state BEFORE the pipeline runs so _applySort gets clean state
        if ($ctrl.isRangeOverSixMonths() && $ctrl.sortField === 'chirpiness') {
            $ctrl.sortField = null;
            $ctrl.sortAscending = true;
        }
        
        // Pipeline: Start from the masterlist, return new arrays at each step
        // 1. Filter
        let result = _applyDateFilter($ctrl.followers);
        // 2. Sort the filtered result
        result = _applySort(result);

        // Track why the list is empty then show the relevant message
        // 'removed' - master list is empty (all followers removed)
        // 'filtered' - master list has entries but date filter matched none
        if (result.length === 0) {
            $ctrl.emptyReason = $ctrl.followers.length === 0 ? 'removed' : 'filtered'; 
        } else {
            $ctrl.emptyReason = null;
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