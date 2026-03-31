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

FollowerCardController.$inject = ['$mdDialog'];
function FollowerCardController($mdDialog) {
    const $ctrl = this;

    // --- STATE --- 
    // Precomputed Score Metadata - set once in $onChanges
    $ctrl.scores = null;

    // State for remove icon
    $ctrl.imageError = false;

    // --- LIFECYCLE ---

    $ctrl.$onChanges = (changes) => {
        if (changes.follower && changes.follower.currentValue) {
            $ctrl.scores = _computeScores($ctrl.follower);
            $ctrl.imageError = false;
        }
    };

    $ctrl.$onDestroy = () => {
        // close any open dialog if card is removed from DOM
        $mdDialog.cancel();
    };

    // --- METHODS ---

    $ctrl.initiateRemove = (event) => {
        const confirm = $mdDialog.confirm()
            .title(`Remove @${$ctrl.follower.username}?`)
            .textContent(
                `${$ctrl.follower.fullname} will be permanently removed from your follower list.`
            )
            .ariaLabel('Remove follower confirmation')
            .targetEvent(event)
            .ok('Remove')
            .cancel('Cancel');
        
        $mdDialog.show(confirm).then(() => {
            $ctrl.onRemove({follower: $ctrl.follower});
        }).catch(() => {
            // No action if clicked on cancel or pressed Escape
        });
    };

    $ctrl.isRemoveDisabled = () => {
        return $ctrl.sortField === 'chirpiness' &&
                $ctrl.scores && $ctrl.scores.chirpiness.label === 'High';
            };
    
    $ctrl.onImageError = () => { 
        $ctrl.imageError = true;
    };
            
    // --- PRIVATE HELPERS ---

    function _computeScores(follower) {
        return {
            friends: _scoreInfo(follower.twubric.friends, 2),
            influence: _scoreInfo(follower.twubric.influence, 4),
            chirpiness: _scoreInfo(follower.twubric.chirpiness, 4)
        };
    }

    function _scoreInfo(score, max) {
        const ratio = score / max;
        const label = ratio > 0.66 ? 'High' : ratio > 0.33 ? 'Average' : 'Low';
        const badgeClass = label === 'High' ? 'score-badge--high' :
            label === 'Average' ? 'score-badge--avg' : 'score-badge--low';
        return {label, badgeClass}; 
        }
};
