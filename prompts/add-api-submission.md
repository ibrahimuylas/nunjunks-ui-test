# Add API Submission

Submit completed journey answers from the server to an external API.

## Requirements

- API submission happens only after the user accepts check answers.
- API calls are made from a server-side service.
- API secrets are read from environment variables.
- User input is validated and normalised before submission.
- API failures are handled without exposing sensitive details.
- The journey still works without client-side JavaScript.

## Rules

- `rules/govuk-nunjucks-architecture.md`
- `rules/testing-and-quality.md`
- `rules/sdlc-guardrails.md`

## Component Architecture

```js
services/application-submission-service.js
  submitApplication(answers)

controllers/check-answers-controller.js
  submitCheckAnswers(req, res)
    validate journey complete
    submit application
    mark complete
    redirect confirmation
```

## Extra Considerations

- Do not put API tokens in browser JavaScript.
- Do not log personal data or secrets.
- Consider idempotency if repeated submissions are possible.
- Consider timeout and retry behavior based on API requirements.

## Testing Considerations

- Unit test payload mapping.
- Mock API responses in tests.
- Test successful submission redirects to confirmation.
- Test API failure renders or redirects to an appropriate error page.
- Test incomplete journeys cannot submit.

## Implementation Notes

- Keep payload mapping explicit.
- Keep API client code small and isolated.
- Add README environment variable documentation.

## Specification By Example

Given the user has completed the journey, when they submit check answers, then the server sends a JSON payload to the configured API.

Given the API fails, when the user submits, then the user sees a safe error response and secrets are not exposed.

## Verification

- [ ] API secrets are not in source code
- [ ] Payload mapping is tested
- [ ] Success and failure paths are tested
- [ ] `npm test`
- [ ] `npm run lint`
