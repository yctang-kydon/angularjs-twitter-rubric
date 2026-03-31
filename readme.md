# AngularJS Twitter Rubric

A web app that lets a Twitter user review their followers, view their scores based on a rubric, filter and sort them by date and score criteria, and optionally remove certain followers. Built as a frontend tutorial using AngularJS 1.x Component Architecture.

## Live Demo

https://yctang-kydon.github.io/angularjs-twitter-rubric/

## How to Run Locally

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- A modern browser (Chrome or Safari recommended)

### Steps

1. Clone the repository:
   ```
   git clone https://github.com/yctang-kydon/angularjs-twitter-rubric.git
   ```

2. Navigate to the project folder:
   ```
   cd angularjs-twitter-rubric
   ```

3. Install dependencies:
   ```
   npm install
   ```

4. Start the development server:
   ```
   npm run dev
   ```

5. Open your browser and go to:
   ```
   http://localhost:8080
   ```

### Other Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite development server on port 8080 |
| `npm run build` | Build the production bundle into `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint across all JS files |

### Testing the loading state
 
The app implements a minimum display time of 1.5 seconds for the loading spinner. This ensures the spinner is always visible long enough to be meaningful — on fast connections (such as cached responses on GitHub Pages) the data may load in under 50ms, which would cause the spinner to flash imperceptibly without this minimum. On slow connections the data takes longer than 1.5 seconds anyway, so no artificial delay is added.
 
To observe the spinner on the live demo or locally, no special setup is needed — it will always display for at least 1.5 seconds on every page load.
 
To simulate a slower connection and see the spinner for longer:
 
1. Open Chrome DevTools (`F12` or `Cmd+Option+I`)
2. Go to the **Network** tab
3. Change the throttling dropdown from **"No throttling"** to **"Slow 3G"**
4. Hard refresh the page (`Cmd+Shift+R` on Mac, `Ctrl+Shift+R` on Windows)
 
Remember to set throttling back to **"No throttling"** when done — it affects all network requests in that tab.
 
## Deployment

This project is deployed to GitHub Pages via a GitHub Actions workflow defined in `.github/workflows/deploy.yml`. Every push to the `main` branch automatically triggers a Vite production build and deploys the output to the `gh-pages` branch, which GitHub Pages serves as the live site.

The two workflows visible in the Actions tab are intentional and form a chain:

1. **Deploy to GitHub Pages** (`deploy.yml`) — runs `npm install` and `npm run build`, then pushes `dist/` to the `gh-pages` branch.
2. **pages-build-deployment** — GitHub's own built-in workflow, triggered automatically when content is pushed to `gh-pages`. It publishes that content to the live URL.

To deploy manually without the action:
```
npm run build
git subtree push --prefix dist origin gh-pages
```

## Project Structure

```
.github/
  workflows/
    deploy.yml          CI/CD workflow for GitHub Pages deployment
public/
  data/
    twubric.json        Mock follower data (loaded at runtime via $http)
  templates/
    app.template.html           Root component template
    follower-card.template.html Follower card component template
js/
  main.js                       Entry point — imports Angular modules and components
  app.js                        Root component controller and app module definition
  follower-card.component.js    Follower card component controller
css/
  styles.css                    All application styles
index.html                      Single HTML entry point
vite.config.js                  Vite build and dev server configuration
eslint.config.mjs               ESLint configuration
```

Note: `public/templates/` and `public/data/` are served as static assets by Vite — they are not bundled. This is required because AngularJS resolves `templateUrl` strings at runtime via HTTP, not at build time.

## Architecture Decisions

### Component structure

The app uses AngularJS 1.x Component Architecture with two components:

- `<rubric-app>` — the root component. Owns all application state: the master follower list, filter state, sort state, menu state, and filter panel state. All data flows down to child components via bindings.
- `<follower-card>` — a stateless display component. Receives a single follower object and the current sort field as one-way bindings (`<`). Emits a remove action upward via an expression binding (`&`). Score metadata is precomputed once in `$onChanges` rather than recalculated on every digest cycle.

Filter and sort controls live directly in `app.template.html` rather than in their own component, as they are one-off controls that do not need to be reused elsewhere.

### Data management

Two arrays are maintained throughout the app's lifecycle:

- `$ctrl.followers` — the source of truth, loaded once from JSON and only modified when a follower is permanently removed.
- `$ctrl.filteredFollowers` — the display list, always derived fresh from `followers` by the `_derive()` function.

`_derive()` is the single place where `filteredFollowers` is updated. It is idempotent and safe to call after any state change. The pipeline is always: reset invalid sort state → apply date filter → apply sort → assign. Neither step mutates its input — each returns a new array.

### Chirpiness date range logic

The spec requires chirpiness sorting to be disabled when a date range exceeds 6 months. This app extends that rule beyond the literal spec to cover single-date cases:

- **Both dates set** — the explicit range is checked.
- **Only start date set** — the implied range is start → today. If that span exceeds 6 months, chirpiness is disabled. This is the most common open-ended case and the rule applies logically.
- **Only end date set** — the lower bound is unknown, so no span can be calculated. Chirpiness remains available rather than making an arbitrary assumption.
- **No dates set** — no range, chirpiness unrestricted.

This decision is documented here because it goes beyond the spec's literal wording. The rationale is that a start date of several years ago with no end date clearly represents a long timeframe, making chirpiness sorting as misleading as an explicit multi-year range.

### Mobile filter panel

On desktop (viewport ≥ 768px) the filter panel is always visible. On mobile it is collapsed by default so cards are immediately visible on load. A "Filters & Sort" toggle button with a funnel icon reveals the panel. The funnel icon fills solid and an "active" badge appears when any filter or sort is currently applied, so the user can tell at a glance that something is active even when the panel is collapsed.

`$ctrl.filtersOpen` is initialised by reading `$window.innerWidth` at controller construction time — not with a hardcoded `false` — so the panel is never incorrectly hidden on desktop on first load. A `resize` event listener keeps the state in sync when the viewport crosses the breakpoint, for example when using browser DevTools responsive mode.

### Navigation drawer

A slide-in navigation drawer is triggered by a hamburger button in the header. On desktop it slides in from the left at 260px wide with a semi-transparent backdrop. On mobile it expands to full screen. The drawer is always present in the DOM and its visibility is controlled by a CSS `transform: translateX` transition toggled via an `ng-class` — this ensures the slide animation works correctly. `ng-if` was deliberately avoided here as it would destroy and recreate the drawer on every toggle, preventing the transition from firing.

A `$document` click listener closes the drawer when the user clicks outside it. The listener is registered in `$onInit` and deregistered in `$onDestroy` to prevent memory leaks. Both the click handler and the resize listener use `$scope.$apply()` to wrap state changes, since native DOM events fire outside Angular's digest cycle.

## Libraries Used

- **AngularJS 1.7.9** — the core framework, used as specified in the tutorial requirements.
- **Angular Material 1.1.26** — provides `md-datepicker` for the date filter inputs, `$mdDialog` for the remove confirmation modal, and supporting modules (`ngAnimate`, `ngAria`, `ngMessages`).
- **Bootstrap 5** — grid system and utility classes for the card layout and responsive columns.
- **Bootstrap Icons** — icon font used throughout the UI (hamburger, funnel, trash, chevrons, etc.).
- **Vite** — development server and production bundler. Replaced `http-server` to provide a proper npm-managed build pipeline and enable GitHub Pages deployment.

Note: Flatpickr, which was used in an earlier version of the app, has been replaced by `md-datepicker` from Angular Material. This eliminates the need for a custom AngularJS directive to bridge Flatpickr with the framework's data binding.

## Known Limitations & Future Improvements

**Business logic in components** — the `_scoreInfo()` function that calculates High/Average/Low labels is embedded in `follower-card.component.js`. In a production app this should be extracted into an AngularJS service to make it reusable and independently testable:
```js
app.service('RubricService', function() {
    this.getScoreInfo = function(score, max) { ... };
});
```

**Chirpiness threshold** — the threshold for disabling the Remove button when sorting by Chirpiness (`score.label === 'High'`, derived from a ratio > 0.66 of the max score of 4) is calculated from hardcoded values. In production these thresholds should be driven by configuration or the API.

**Data source** — the app loads follower data from a local JSON file to simulate an API response. In production this would be replaced with a real Twitter/X API integration.

**No unit tests** — the controller logic, particularly `_derive()` and `isRangeOverSixMonths()`, is well-structured for testing but no test suite has been added. AngularJS's `$componentController` and `$httpBackend` utilities make these straightforward to test.