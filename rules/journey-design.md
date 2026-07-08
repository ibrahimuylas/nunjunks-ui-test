# Journey Design Rules

Rules for linear and branching GOV.UK-style service journeys.

## Context

*Applies to:* Journey routes, branch decisions, access guards, check answers pages and confirmation pages.

*Level:* Tactical.

*Audience:* Developers, service designers and AI coding assistants.

## Core Principles

1. *One question at a time:* Prefer focused pages that ask for related information only.
2. *Explicit branching:* Branch decisions should be visible in config and tests.
3. *Recoverable navigation:* Users should be able to go back, change answers and continue safely.

## Rules

### Must Have

- *RULE-001:* Define branch and required-answer rules in `src/app/config/journey-steps.js`.
- *RULE-002:* Apply access guards through `journey-service.js`.
- *RULE-003:* Redirect users to the first missing required answer when they skip ahead.
- *RULE-004:* Clear stale branch answers when a branch-changing answer changes.
- *RULE-005:* Check answers must show only rows relevant to the selected branch.
- *RULE-006:* Change links must return users to the page where the answer can be edited.
- *RULE-007:* Confirmation pages must not be accessible until the journey has been accepted/submitted.

### Should Have

- *RULE-101:* Keep each page controller focused on one page or closely related page pair.
- *RULE-102:* Use a view model to construct branch-specific check answers rows.
- *RULE-103:* Add tests for every branch and convergence point.
- *RULE-104:* Keep route URLs stable unless there is a user-facing reason to change them.

### Could Have

- *RULE-201:* Add a journey diagram to the README for complex flows.
- *RULE-202:* Extract journey-specific files under `journeys/<journey-name>/` when multiple journeys exist.

## Patterns & Anti-Patterns

### Do This

```js
function getNextPath(stepKey, answers) {
  if (stepKey === 'businessType') {
    return answers.hasFarmingBusiness === 'yes' ? '/business-details' : '/full-name';
  }

  return '/start';
}
```

### Do Not Do This

```js
if (req.body.hasFarmingBusiness === 'yes') {
  return res.redirect('/business-details');
}
// Same branch rule repeated in multiple controllers.
```

## Decision Framework

*When adding a new page:*

1. Decide which answers are required before the page.
2. Add or update `journey-steps.js`.
3. Add controller, validator, view model, template and tests.
4. Update check answers if the answer is user-reviewable.

*When adding a branch:*

- Identify the branch-changing answer.
- Decide which old answers become stale when it changes.
- Test both branches and the convergence point.

## Quality Gates

- *Automated checks:* Route integration tests cover branch yes/no paths.
- *Code review focus:* No duplicated branch rules in controllers.
- *Testing requirements:* Skip-ahead guards, back/change links and check answers rows.

## Related Rules

- `rules/govuk-nunjucks-architecture.md`
- `rules/testing-and-quality.md`

## References

- [GOV.UK Service Manual](https://www.gov.uk/service-manual)
- [GOV.UK Design System](https://design-system.service.gov.uk/)

## TL;DR

Put branch rules in config/services, test every path, clear stale branch data, and make check answers reflect the chosen path only.
