import angular from 'angular';

angular.module('twitterRubricApp')
    .component('followerCard', {
        templateUrl: 'templates/follower-card.template.html',
        controller: FollowerCardController,
        bindings: {
            follower: '<',
            sortField: '<',
            onRemove: '&'
        }
    });

function FollowerCardController() {
    const $ctrl = this;

    // --- STATE --- 
    // Precomputed Score Metadata - set once in $onChanges
    $ctrl.scores = null;

    // --- LIFECYCLE ---

    $ctrl.$onChanges = (changes) => {
        if (changes.follower && changes.follower.currentValue) {
            $ctrl.scores = _computeScores($ctrl.follower);
        }
    };

    $ctrl.$onDestroy = () => {
        // placeholder for future cleanup
    };

    // --- METHODS ---

    $ctrl.remove = () => {
        $ctrl.onRemove({ follower: $ctrl.follower });
    };
        
    $ctrl.isRemoveDisabled = () => {
        return $ctrl.sortField === 'chirpiness' &&
                $ctrl.scores && $ctrl.scores.chirpiness.label === 'High';
    };

    // --- PRIVATE HELPERS ---

    function _computeScores(follower) {
        return {
            friends: _scoreInfo(follower.twubric.friends, 2),
            influence: _scoreInfo(follower.twubric.influence, 4),
            chirpiness: _scoreInfo(follower.twubric.chirpiness, 4)
        };
    }

    let _callCount = 0;

    function _scoreInfo(score, max) {
        _callCount++;
        // eslint-disable-nextline no-console
        console.log(`_scoreInfo call #${_callCount}`);

        const ratio = score / max;
        const label = ratio > 0.66 ? 'High' : ratio > 0.33 ? 'Average' : 'Low';
        const badgeClass = label === 'High' ? 'bg-success' :
            label === 'Average' ? 'bg-warning text-dark' : 'bg-secondary';
        return {label, badgeClass}; 
    }
}

