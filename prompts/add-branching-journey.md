# Add Branching Journey

Add or change a branch in the GOV.UK-style journey.

## Requirements

- User selects an answer that determines the next page.
- Each branch has its own required answers.
- Both branches converge at a shared page or completion point.
- Users cannot skip into pages that do not belong to their selected branch.
- Check answers shows only rows for the selected branch.
- Changing the branch answer clears stale answers from the old branch.

## Rules

- `rules/journey-design.md`
- `rules/govuk-nunjucks-architecture.md`
- `rules/testing-and-quality.md`
- `rules/sdlc-guardrails.md`

## Component Architecture

```js
config/journey-steps.js
  getNextPath(stepKey, answers)
  getPreviousPath(stepKey, answers)
  getRequiredAnswers(answers)
  getRequiredAnswersBefore(stepKey, answers)

services/journey-service.js
  saveBranchAnswer(session, value)
  firstMissingAnswerPath(session)
  firstMissingPreviousAnswerPath(session, stepKey)

view-models/check-answers-page-view-model.js
  branch-specific summary rows
```

## Extra Considerations

- Keep the branch question clear and answerable.
- Avoid duplicating branch conditions across controllers.
- Keep branch-specific check answers rows in the check answers view model.
- Preserve normal browser back/change behavior.

## Testing Considerations

- Test the branch question validation error.
- Test branch answer A redirects to branch A.
- Test branch answer B redirects to branch B.
- Test skip-ahead guard for each branch.
- Test branch convergence.
- Test branch-specific check answers rows.
- Test stale branch answers are cleared when the branch answer changes.

## Implementation Notes

- Update branch rules first.
- Then add controllers, validators, view models and templates.
- Update README with a simple journey diagram.

## Specification By Example

Given the user selects `yes`, when they submit the branch question, then they are redirected to the business branch.

Given the user selects `no`, when they submit the branch question, then they are redirected to the individual branch.

Given the user changes from `yes` to `no`, then business branch answers are removed from session.

## Verification

- [ ] Both branches complete successfully
- [ ] Branch-specific skip-ahead guards work
- [ ] Check answers only shows relevant rows
- [ ] `npm test`
- [ ] `npm run lint`
- [ ] `npm run build`
