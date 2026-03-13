# AngularJS Twitter Rubric

## What is this?
A simple web app that allows a Twitter user to review their followers, 
view their "scores" based on a rubric, filter & sort them, and optionally 
remove certain followers. The intent is to demonstrate how rubrics can be 
applied in a product context — specifically in a filtering, sorting, and 
removal scenario.

## How to Run Locally

### Prerequisites
- A modern browser (Chrome or Safari recommended)
- [Node.js](https://nodejs.org/) installed (for the local server)

### Steps
1. Clone the repository:
   git clone <your-repo-url>

2. Navigate to the project folder:
   cd angularjs-twitter-rubric

3. Install dependencies:
   npm install

4. Start the local server:
   npx http-server .

5. Open your browser and go to:
   http://localhost:8080

## Architecture Decisions

This app uses AngularJS 1.6 Component Architecture. The key decisions were:

**Component Structure**
- `<rubric-app>` — root component that owns all data and state
- `<follower-card>` — child component responsible for displaying 
  individual follower data
- Filters and sort controls live in `app.template.html` directly, 
  as they are one-off controls that don't warrant their own component

**Data Management**
Two separate arrays are maintained:
- `followers` — the master list loaded from JSON, never modified 
  directly
- `filteredFollowers` — the display list, derived from `followers` 
  based on active filters and sort state

This ensures that clearing a filter restores the full list, while 
Remove actions are permanent across both arrays.

**Rubric Scoring Labels**
High/Average/Low labels are calculated using fixed thresholds based 
on each criterion's maximum weightage (Friends: 2, Influence: 4, 
Chirpiness: 4). A fixed scale was chosen over dynamic/relative 
scaling to ensure labels remain consistent regardless of how many 
followers are removed.

## Libraries Used

- **AngularJS 1.6** — the tech stack used for the company's product
- **Bootstrap 5** — provides consistent and familiar UI components 
  without custom CSS overhead
- **Flatpickr** — used for the date picker to ensure cross-browser 
  compatibility between Safari and Chrome. Native HTML5 
  `<input type="date">` renders inconsistently across browsers.

## Known Limitations & Future Improvements

**Business Logic in Components**
The `getLabel()` function for High/Average/Low scoring is currently 
embedded in `follower-card.component.js`. In a production app, this 
business logic should be extracted into an AngularJS Service:

   app.service('RubricService', function() {
       this.getLabel = function(score, max) { ... };
   });

This would make the logic reusable across components and easier to 
unit test.

**Chirpiness "High" Threshold**
The current threshold for disabling Remove when sorting by Chirpiness 
is >= 3. In production this should be driven by the API or a 
configurable constant rather than a hardcoded value.

**Data Source**
The app currently loads from a local JSON file. In production this 
would be replaced with a real Twitter/X API integration.

## Running the Linter

   npm run lint