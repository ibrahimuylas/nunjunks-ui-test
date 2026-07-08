---
applyTo: "src/app/controllers/**/*.js,src/app/services/**/*.js,src/app/config/**/*.js"
---

# Controllers, Services And Journey Rules

- Route files should map URLs to controller functions only.
- Controllers should coordinate request handling, validation, services, rendering and redirects.
- Controllers should stay thin and avoid business rules.
- Services own session state, branching, access rules, submission and reusable business decisions.
- Branching rules belong in `src/app/config/journey-steps.js` and are applied through `journey-service.js`.
- Redirect users to the first missing required answer when they skip ahead.
- When a branch-changing answer changes, clear answers from the old branch.
- Do not call external APIs directly from templates or browser JavaScript.
- Submit to external APIs from server-side services only.
