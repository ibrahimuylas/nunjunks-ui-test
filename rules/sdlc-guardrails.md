# SDLC Guardrail Rules

Rules for safe delivery throughout analysis, implementation, review and release.

## Context

*Applies to:* Feature work, refactoring, API integration, review, documentation and release readiness.

*Level:* Strategic.

*Audience:* Developers, reviewers, delivery leads and AI coding assistants.

## Core Principles

1. *Small safe increments:* Prefer changes that can be reviewed and verified easily.
2. *Explicit evidence:* Every meaningful change should leave tests, docs or review notes.
3. *Security and privacy by default:* Treat user input and API credentials carefully.

## Rules

### Must Have

- *RULE-001:* Clarify acceptance criteria before large changes.
- *RULE-002:* Keep secrets out of source code, templates and client-side JavaScript.
- *RULE-003:* Send external API requests from server-side services only.
- *RULE-004:* Validate and normalise user input before storing or submitting it.
- *RULE-005:* Document new journeys or branch rules in the README when they change user flow.
- *RULE-006:* Do not remove existing tests without replacing their coverage.
- *RULE-007:* Do not mix unrelated refactors with feature changes unless required.

### Should Have

- *RULE-101:* Use reusable prompts in `prompts/` for repeated LLM-assisted tasks.
- *RULE-102:* Keep commits focused by feature, fix or refactor.
- *RULE-103:* Add comments only for non-obvious decisions.
- *RULE-104:* Review generated code for maintainability, accessibility and security.

### Could Have

- *RULE-201:* Add ADRs for major architecture, persistence or integration decisions.
- *RULE-202:* Add threat-model notes before adding sensitive integrations.

## Patterns & Anti-Patterns

### Do This

```text
Change: add new branch page
Evidence: route tests, validator tests, README journey diagram
Checks: npm test, npm run lint, npm run build
```

### Do Not Do This

```text
Change: add page, refactor all controllers, change styles and alter tests with no explanation
```

## Decision Framework

*Before implementation:*

1. Identify user outcome and acceptance criteria.
2. Identify touched layers.
3. Decide required tests and docs.

*Before handoff:*

- State what changed.
- State what was verified.
- State any known limitation or follow-up.

## Quality Gates

- *Automated checks:* Tests, lint and build as relevant.
- *Code review focus:* Scope control, privacy, security, maintainability and accessibility.
- *Testing requirements:* Evidence matches risk and blast radius.

## Related Rules

- `rules/govuk-nunjucks-architecture.md`
- `rules/journey-design.md`
- `rules/testing-and-quality.md`

## References

- [EqualExperts llm-toolkit](https://github.com/EqualExperts/llm-toolkit)
- [GOV.UK Service Manual](https://www.gov.uk/service-manual)

## TL;DR

Work in small increments, protect secrets, validate inputs, keep changes focused, update docs, and finish with clear verification evidence.
