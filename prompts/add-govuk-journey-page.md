# Add GOV.UK Journey Page

Add a new server-rendered page to this Express, Nunjucks and GOV.UK Frontend journey.

## Requirements

- User can access the page only when required previous answers exist.
- User can submit the form with server-side validation.
- Validation errors render a GOV.UK error summary and field-level errors.
- Submitted answers are stored in `express-session` through `journey-service.js`.
- Check answers includes the answer if it is user-reviewable.
- The journey works without client-side JavaScript.

## Rules

- `rules/govuk-nunjucks-architecture.md`
- `rules/journey-design.md`
- `rules/testing-and-quality.md`
- `rules/sdlc-guardrails.md`

## Component Architecture

```js
routes/index.js
  router.get('/new-page', newPageController.showNewPage)
  router.post('/new-page', newPageController.submitNewPage)

controllers/new-page-controller.js
  showNewPage(req, res)
  submitNewPage(req, res)

validators/new-page-validator.js
  validateNewPage(input)

view-models/new-page-view-model.js
  newPageViewModel({ answers, errors })

views/pages/new-page.njk
  GOV.UK macros only
```

## Extra Considerations

- Update `src/app/config/journey-steps.js` for required answers, next paths and previous paths.
- Clear stale answers if this page changes branch selection.
- Keep custom JavaScript optional.
- Prefer GOV.UK component macros over hand-coded component HTML.

## Testing Considerations

- Unit test the validator.
- Unit test the view model.
- Integration test GET page render.
- Integration test validation failure.
- Integration test successful POST redirect.
- Integration test skip-ahead guard.
- Integration test check answers row if applicable.

## Implementation Notes

- Keep the controller thin.
- Keep the template presentational.
- Put formatting in the view model.
- Put journey decisions in the service/config.

## Specification By Example

Given the user has completed required previous answers, when they open `/new-page`, then the page renders.

Given the user submits an empty required answer, when they post the form, then they see a GOV.UK error summary and field-level error.

Given the user submits a valid answer, when they post the form, then the answer is stored in session and the user is redirected to the next page.

## Verification

- [ ] `npm test`
- [ ] `npm run lint`
- [ ] `npm run build` if templates, Sass or assets changed
- [ ] README updated if journey flow changed
