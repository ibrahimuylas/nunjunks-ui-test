# Repository Instructions

This is a server-rendered Node.js, Express, Nunjucks and GOV.UK Frontend application for GOV.UK/Defra-style journeys.

Follow these project rules:

- Apply the relevant files in `rules/` before making code changes.
- Do not introduce React, Vue, Angular, client-side routing or SPA patterns.
- The journey must work without client-side JavaScript.
- Use client-side JavaScript only for progressive enhancement.
- Use GOV.UK Frontend macros for GOV.UK components.
- Keep Nunjucks templates thin and presentational.
- Put request handling in page-focused controllers.
- Put session, branching, business rules and API submission logic in services.
- Put form validation in validators.
- Put page-ready GOV.UK macro data in view models.
- Store journey answers in `express-session`.
- Keep branch and access rules in `src/app/config/journey-steps.js` and `journey-service.js`.
- Add or update Jest/Supertest tests for journey, validation, route and view model changes.
- Run `npm test`, `npm run lint` and, where assets/templates changed, `npm run build`.
- Prefer small, focused changes that preserve the existing architecture.

When in doubt: server-render first, validate on the server, prepare data in view models, and keep templates boring.
