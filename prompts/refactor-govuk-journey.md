# Refactor GOV.UK Journey

Refactor this project while preserving user-visible journey behavior.

## Requirements

- Existing routes continue to work unless explicitly changed.
- Existing tests continue to pass or are updated to reflect intentional behavior changes.
- No client-side framework is introduced.
- No business logic is moved into Nunjucks templates.
- Refactor remains focused on the stated goal.

## Rules

- `rules/govuk-nunjucks-architecture.md`
- `rules/journey-design.md`
- `rules/testing-and-quality.md`
- `rules/sdlc-guardrails.md`

## Component Architecture

```text
Before changing code:
1. Identify current behavior with tests or route inspection.
2. Identify target structure.
3. Move one responsibility at a time.
4. Run tests.
```

## Extra Considerations

- Preserve route names and session keys unless there is a migration plan.
- Avoid formatting-only churn in unrelated files.
- Keep commits/review scope small.

## Testing Considerations

- Existing integration tests should pass.
- Add regression tests for any bug discovered during the refactor.
- Add tests before refactoring fragile behavior.

## Implementation Notes

- Prefer moving code over rewriting code.
- Keep public behavior stable.
- Update README if architecture changes.

## Specification By Example

Given a successful business branch journey worked before the refactor, it must still work after the refactor.

Given a user skips ahead, they must still be redirected to the first missing required page.

## Verification

- [ ] `npm test`
- [ ] `npm run lint`
- [ ] `npm run build` if templates, Sass or assets changed
- [ ] Behavior changes are documented
