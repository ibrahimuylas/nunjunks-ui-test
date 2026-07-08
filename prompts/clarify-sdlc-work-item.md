# Clarify SDLC Work Item

Turn a vague change request into a small, testable work item for this project.

## Requirements

- Identify the user outcome.
- Identify affected journey pages or branches.
- Identify data captured, stored or submitted.
- Identify validation and error states.
- Identify tests and documentation required.
- Keep the work item small enough to review safely.

## Rules

- `rules/sdlc-guardrails.md`
- `rules/journey-design.md`
- `rules/testing-and-quality.md`

## Component Architecture

```text
Clarified work item:
- Goal
- In scope
- Out of scope
- Acceptance criteria
- Affected files/areas
- Tests required
- Open questions
```

## Extra Considerations

- Ask about external APIs, data retention and personal data.
- Ask whether branch decisions should clear old answers.
- Ask whether URLs or existing user flows must remain stable.

## Testing Considerations

- Acceptance criteria should map directly to tests where possible.

## Implementation Notes

- Do not implement while the work item is still ambiguous.
- Prefer explicit examples over broad descriptions.

## Specification By Example

Given the request "add address", clarify whether it means personal address, business address, postcode lookup, manual entry, validation rules, check answers row and API payload changes.

## Verification

- [ ] Goal is clear
- [ ] Scope is clear
- [ ] Acceptance criteria are testable
- [ ] Open questions are listed
