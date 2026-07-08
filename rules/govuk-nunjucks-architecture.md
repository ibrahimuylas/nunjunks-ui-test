# GOV.UK Nunjucks Architecture Rules

Rules for this server-rendered Express, Nunjucks and GOV.UK Frontend application.

## Context

*Applies to:* Express routes, controllers, services, validators, view models, Nunjucks templates and public assets.

*Level:* Operational.

*Audience:* Developers and AI coding assistants.

## Core Principles

1. *Server-rendered by default:* Users must be able to complete the service without client-side JavaScript.
2. *GOV.UK patterns first:* Use GOV.UK Frontend components, validation patterns and content style.
3. *Separation of concerns:* Controllers coordinate, services decide, validators validate, view models prepare, templates render.

## Rules

### Must Have

- *RULE-001:* Do not introduce a client-side framework or SPA routing.
- *RULE-002:* Every form journey must work with JavaScript disabled.
- *RULE-003:* Use GOV.UK Frontend macros for GOV.UK components.
- *RULE-004:* Keep Nunjucks templates thin and presentational.
- *RULE-005:* Put business rules, branching rules and session decisions in services.
- *RULE-006:* Put page-ready GOV.UK macro options in view models.
- *RULE-007:* Validate all user input server-side before saving it to the session.
- *RULE-008:* Use `express-session` for journey answers unless a persistence requirement says otherwise.
- *RULE-009:* Add or update tests for every journey, validation or route change.

### Should Have

- *RULE-101:* Use page-focused controllers.
- *RULE-102:* Keep route files limited to route declarations.
- *RULE-103:* Use one validator per form page or closely related group of inputs.
- *RULE-104:* Prefer structured view model data over HTML strings.
- *RULE-105:* Keep custom CSS minimal and GOV.UK-compatible.
- *RULE-106:* Keep progressive enhancement JavaScript small, optional and resilient.

### Could Have

- *RULE-201:* Group files by journey once there are multiple substantial journeys.
- *RULE-202:* Use app partials for repeated presentational fragments.
- *RULE-203:* Add ADRs for major architecture changes.

## Patterns & Anti-Patterns

### Do This

```js
return res.render(
  'pages/check-answers.njk',
  checkAnswersPageViewModel({ answers: journeyService.getAnswers(req.session) }),
);
```

### Do Not Do This

```njk
{% if answers.hasFarmingBusiness == "yes" and answers.businessName %}
  <!-- complex journey logic in template -->
{% endif %}
```

## Decision Framework

*When rules conflict:*

1. Preserve the no-JavaScript journey.
2. Prefer GOV.UK Design System patterns.
3. Prefer the simplest server-side implementation.

*When facing edge cases:*

- Put reusable decisions in services.
- Put display decisions in view models.
- Add an integration test for the user-visible path.

## Quality Gates

- *Automated checks:* `npm test`, `npm run lint`, `npm run build`.
- *Code review focus:* Separation of concerns, GOV.UK patterns, no hidden SPA behavior.
- *Testing requirements:* Validators, view models, route behavior, successful journeys and validation errors.

## Related Rules

- `rules/journey-design.md`
- `rules/testing-and-quality.md`
- `rules/sdlc-guardrails.md`

## References

- [GOV.UK Design System](https://design-system.service.gov.uk/)
- [GOV.UK Frontend](https://frontend.design-system.service.gov.uk/)
- [EqualExperts llm-toolkit](https://github.com/EqualExperts/llm-toolkit)

## TL;DR

Server-render first. Use GOV.UK macros. Keep templates simple. Put rules in services, prepared data in view models, validation in validators, and test the user journey.
