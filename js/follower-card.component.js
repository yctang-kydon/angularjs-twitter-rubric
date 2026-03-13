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

    $ctrl.$onInit = function() {
        $ctrl.remove = function() {
            $ctrl.onRemove({ follower: $ctrl.follower });
        };

        $ctrl.getLabel = function(score, max) {
            const ratio = score / max;
            if (ratio > 0.66) return 'High';
            if (ratio > 0.33) return 'Average';
            return 'Low';
        };

        $ctrl.isRemoveDisabled = function() {
            const label = $ctrl.getLabel($ctrl.follower.twubric.chirpiness, 4);
            return $ctrl.sortField === 'chirpiness' && label === 'High';
        };
    };
}

