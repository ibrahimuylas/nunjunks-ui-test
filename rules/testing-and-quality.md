# Testing And Quality Rules

Rules for automated checks and evidence before changing this project.

## Context

*Applies to:* Unit tests, integration tests, linting, build checks and review readiness.

*Level:* Operational.

*Audience:* Developers and AI coding assistants.

## Core Principles

1. *Test behavior, not implementation details:* Cover user-visible routes and outcomes.
2. *Keep fast feedback:* Unit tests for pure logic, integration tests for routes and journeys.
3. *Every change earns confidence:* Update tests alongside code changes.

## Rules

### Must Have

- *RULE-001:* Run `npm test` before completing code changes.
- *RULE-002:* Run `npm run lint` before completing code changes.
- *RULE-003:* Run `npm run build` when templates, Sass, assets or build scripts change.
- *RULE-004:* Add validator unit tests for validation changes.
- *RULE-005:* Add view model unit tests for display mapping changes.
- *RULE-006:* Add integration tests for new or changed routes.
- *RULE-007:* Test validation error summaries and field-level errors.
- *RULE-008:* Test successful journey flow to confirmation.

### Should Have

- *RULE-101:* Test skip-ahead protection for pages that require previous answers.
- *RULE-102:* Test branch-specific check answers rows.
- *RULE-103:* Keep tests readable and scenario-focused.
- *RULE-104:* Avoid fragile assertions on complete HTML.

### Could Have

- *RULE-201:* Add accessibility or browser smoke tests for high-risk UI changes.
- *RULE-202:* Add contract tests for external API submission services.

## Patterns & Anti-Patterns

### Do This

```js
await agent
  .post('/business-type')
  .type('form')
  .send({ hasFarmingBusiness: 'yes' })
  .expect(302)
  .expect('Location', '/business-details');
```

### Do Not Do This

```js
expect(response.text).toEqual('<!doctype html>...');
```

## Decision Framework

*For a changed validator:* Add unit tests for valid, missing and invalid input.

*For a changed page:* Add integration tests for GET, validation error and successful POST.

*For a changed journey:* Test the complete flow and skip-ahead behavior.

## Quality Gates

- *Automated checks:* `npm test`, `npm run lint`, `npm run build` when relevant.
- *Code review focus:* Tests cover the changed user behavior.
- *Testing requirements:* Both happy path and failure path are represented.

## Related Rules

- `rules/govuk-nunjucks-architecture.md`
- `rules/journey-design.md`

## References

- [Jest](https://jestjs.io/)
- [Supertest](https://github.com/ladjs/supertest)

## TL;DR

Test validators, view models and routes. Cover happy paths, validation errors, skip-ahead guards and branches. Run test, lint and build checks before handoff.
