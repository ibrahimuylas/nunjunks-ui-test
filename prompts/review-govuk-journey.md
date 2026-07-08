# Review GOV.UK Journey Change

Review a proposed change to this Express, Nunjucks and GOV.UK Frontend journey.

## Requirements

- Identify bugs, regressions and missing tests first.
- Check GOV.UK patterns and server-rendered behavior.
- Check journey branching, access guards and stale session data.
- Check privacy and API safety if submission or personal data changes.
- Provide concise findings with file and line references where possible.

## Rules

- `rules/govuk-nunjucks-architecture.md`
- `rules/journey-design.md`
- `rules/testing-and-quality.md`
- `rules/sdlc-guardrails.md`

## Component Architecture

```text
Review order:
1. Route and access behavior
2. Validation and error rendering
3. Session and branch state
4. View model/template separation
5. Tests and docs
6. Security/privacy concerns
```

## Extra Considerations

- Verify the app still works without client-side JavaScript.
- Look for duplicated journey rules in controllers.
- Look for stale answers after branch changes.
- Look for templates doing business logic.

## Testing Considerations

- Confirm tests cover changed happy paths and failure paths.
- Confirm both branches are tested when branch logic changes.
- Confirm check answers output is tested when summary rows change.

## Implementation Notes

- Do not rewrite the change during review unless explicitly asked.
- Keep findings actionable and ordered by severity.

## Specification By Example

Finding example:

```text
[P1] Branch change leaves stale businessName in session
If a user selects "yes", enters a business name, then changes to "no", check answers can still include stale business data. Clear old branch answers when saving the branch answer.
```

## Verification

- [ ] Findings are ordered by severity
- [ ] Each finding explains user impact
- [ ] Missing tests are listed
- [ ] Residual risk is stated
