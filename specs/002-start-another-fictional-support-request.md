# Start another fictional support request from confirmation

**Type:** Improvement  
**Priority:** P3 — useful for repeated demonstrations, but not required for the existing journey to work  
**Risk:** Low — the change is limited to one confirmation-page action and existing public-journey session reset behavior  
**Story points:** 3

## Problem / Opportunity

After completing the public support journey, a demo visitor can only return to the demo home page. To demonstrate the public journey again, they must return home, reset the public journey, and then re-enter it. This adds unnecessary steps during demos and user testing.

As a demo visitor who has submitted a fictional support request, I want to start another fictional request directly from the confirmation page, so that I can repeat the public journey without manually resetting it from the demo home page.

## Proposed Solution

Add a secondary `Start another fictional request` action to the public support confirmation page at `/demo/support/confirmation`.

The action must submit a `POST` request to a public-journey-specific endpoint. The endpoint must clear the existing public support journey state by reusing the repository's current reset behavior, then redirect the visitor to `/demo/support/start`.

Keep the existing `Return to demo home` link unchanged. The new action is an additional choice, not a replacement.

## Scope

### In scope

- Add a clearly labelled secondary action to the public support confirmation page.
- Use a form with `method="post"` for the reset action; do not reset state through a `GET` request.
- Clear the current public support journey answers, task progress, submission state, uploaded-file metadata and fictional reference.
- Redirect to `/demo/support/start` after the reset succeeds.
- Preserve all caseworker journey session state.
- Reuse existing controller or service reset behavior where practical rather than introducing a second reset implementation.
- Add proportionate integration and view-model or rendering test coverage.

### MVP

A visitor can select `Start another fictional request` on the confirmation page, arrive at the public journey start page, and begin with a clean public support journey while caseworker state remains unchanged.

### Nice to have

None. Keep this story intentionally small.

## Acceptance Criteria

1. **Given** a visitor has submitted a fictional support request and is viewing `/demo/support/confirmation`, **when** the page is rendered, **then** it shows both the existing `Return to demo home` link and a secondary action labelled `Start another fictional request`.
2. **Given** a completed public support journey, **when** the visitor selects `Start another fictional request`, **then** the server handles the action using `POST`, clears the public support journey state, and redirects to `/demo/support/start`.
3. **Given** the visitor has used the new action, **when** they start the public journey again, **then** previous answers, task completion, uploaded-file metadata, submission status and fictional reference are not present.
4. **Given** caseworker journey state exists in the same session, **when** the visitor starts another public support request, **then** the caseworker journey state is unchanged.
5. **Given** the change is complete, **when** the repository checks are run, **then** `npm test`, `npm run lint` and `npm run build` pass.

## Out of Scope

- Changing the existing demo-home reset action or its redirect behavior.
- Removing or changing the `Return to demo home` link.
- Resetting the caseworker journey.
- Automatically starting a new request when the confirmation page is refreshed or revisited.
- Redesigning the confirmation page or changing its panel, reference, or explanatory content.
- Adding confirmation dialogs, client-side JavaScript, persistence, analytics or external services.
- Creating a general-purpose reset framework.

## Open Questions

None. The wording, destination and reset boundary are defined for this example story.

## Implementation Notes

- Follow the existing Express, controller, service, view-model and Nunjucks boundaries described in `rules/govuk-nunjucks-architecture.md`.
- Prefer the GOV.UK button Nunjucks macro with secondary styling for the new action.
- Keep reset rules in the existing journey/session service layer. The controller should coordinate the reset and redirect.
- Do not clear or replace the whole Express session, because that could remove the caseworker state and shared demo preferences.
- Use POST-redirect-GET behavior so refreshing `/demo/support/start` does not repeat the reset request.
- Preserve the existing confirmation-page access guard.

## Required Test Evidence

- An integration test completes and submits the public journey, posts the new action, and verifies the redirect to `/demo/support/start`.
- The test verifies that the old confirmation URL is no longer accessible as a completed submission and routes according to the existing clean-journey guard.
- The test verifies that the restarted journey does not contain the previous public answers or reference.
- A session-boundary test verifies that caseworker state survives the public reset.
- A render assertion verifies the confirmation page contains the new POST form/action and retains the existing demo-home link.
- Existing public reset, submission, confirmation and session-boundary tests continue to pass.

## Suggested Next Step

Ask Ralph to implement this specification as one small vertical slice: add the confirmation-page action, connect it to the scoped public reset behavior, add the required tests, and run the repository validation commands. Ralph should not broaden the work beyond this file's acceptance criteria and out-of-scope boundaries.
