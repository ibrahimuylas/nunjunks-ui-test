# GOV.UK / Defra-style Express and Nunjucks example

This is a server-rendered Node.js application using Express, Nunjucks, Sass and GOV.UK Frontend. It includes a small multi-page journey with session-backed answers, server-side validation, thin templates, view model mappers and tests.

## Setup

```bash
npm install
npx playwright install chromium
npm run build
npm run dev
```

The app tries to run at `http://localhost:3434` by default. If that port is already in use, it automatically starts on the next available port and prints the URL.

To request a specific port:

```bash
PORT=3100 npm start
```

## Scripts

```bash
npm run dev      # start with nodemon
npm start        # start with node
npm test         # run Jest and Supertest tests
npm run test:browser # build, start the app and run the Chromium smoke tests
npm run lint     # run ESLint
npm run build    # compile Sass and copy GOV.UK assets
```

## Browser testing

The browser harness uses Playwright Test on Node.js 20 with Chromium. Install the browser once
with `npx playwright install chromium`, then run:

```bash
npm run test:browser
```

The command builds the generated CSS, JavaScript and assets, starts a test-only server on IPv6
loopback at `http://[::1]:3000`, and shuts it down after the tests. Using an explicit loopback
address prevents the harness from accidentally reusing an unrelated IPv4 server. For a manual
browser check, open `http://localhost:3000` while the test server is running.

The legacy start-page smoke test runs in both JavaScript-enabled and JavaScript-disabled
contexts. In the enhanced context it verifies the runtime markers added by GOV.UK Frontend's
`initAll`; every context fails on unexpected browser console output or uncaught page errors.

Shared desktop and mobile viewport sizes live in `tests/browser/helpers/viewports.js` for later
journey coverage. `@axe-core/playwright` is configured with WCAG 2.2 A and AA tags, ready for the
first automated accessibility scan in the demo-shell browser increment.

## GOV.UK Frontend wiring

GOV.UK Frontend is installed from npm. Nunjucks is configured with both the app views directory and `node_modules/govuk-frontend/dist`, so templates can import macros directly:

```njk
{% from "govuk/components/button/macro.njk" import govukButton %}
```

The Sass entry point is `src/app/public/stylesheets/application.scss`. It imports GOV.UK Frontend and sets:

```scss
$govuk-assets-path: "/public/assets/";
```

`npm run build` compiles `application.css`, copies GOV.UK Frontend JavaScript to `src/app/public/javascripts/govuk-frontend.min.js`, and copies GOV.UK assets to `src/app/public/assets`.

## Architecture

The application is server-side rendered by default. JavaScript is used only for progressive enhancement, so the journey works with JavaScript disabled.

```text
src/app
  app.js                 Express and Nunjucks setup
  server.js              HTTP entry point
  routes                 Route declarations
  controllers            Thin page-focused request handlers
  services               Journey/session business rules
  validators             Server-side validation
  view-models            Data prepared for templates
  views                  Layouts, partials and page templates
  public                 Sass, JavaScript, images and copied assets
tests
  unit                   Validators and view models
  integration            Routes and full journey flow
```

Controllers coordinate the request, call validators and services, then pass prepared view models to templates. Templates render GOV.UK component macros and simple app partials only.

## Example branching journey

1. Start page: `/start`
2. Branch question: `/business-type`
3. If the user has a farming business:
   - Business details: `/business-details`
4. If the user does not have a farming business:
   - Personal details: `/full-name`
5. Shared updates page: `/updates`
6. Check your answers: `/check-answers`
7. Confirmation: `/confirmation`

The branch question asks whether the user has a farming business. A `yes` answer sends the user to the business branch. A `no` answer sends the user to the individual branch. Both branches then converge at the updates page.

```text
/start
  |
/business-type
  |
  |-- yes --> /business-details
  |              |
  |              v
  |            /updates
  |
  |-- no  --> /full-name
                 |
                 v
               /updates

/updates -> /check-answers -> /confirmation
```

Answers are stored in `express-session`. Later pages redirect to the first missing answer, and change links take users back to previous pages.

Branching rules live in `src/app/config/journey-steps.js`. The journey service uses that config to decide required answers, next paths, previous paths and access guards.

## Adding a new page

1. Add a route in `src/app/routes/index.js`.
2. Add controller actions in `src/app/controllers`.
3. Put validation in `src/app/validators` if the page has user input.
4. Put business rules or session changes in `src/app/services`.
5. Create a view model mapper in `src/app/view-models`.
6. Create a thin Nunjucks template in `src/app/views/pages`.
7. Add or update unit and integration tests.

Keep Nunjucks templates focused on rendering prepared data. Put branching, formatting and business decisions in services or view models.

## LLM rules and prompts

This project includes local AI-assistant guidance inspired by the EqualExperts `llm-toolkit` approach.

Use `rules/` for always-relevant engineering standards:

```text
rules/
  govuk-nunjucks-architecture.md
  journey-design.md
  testing-and-quality.md
  sdlc-guardrails.md
```

Use `prompts/` for repeatable tasks:

```text
prompts/
  add-govuk-journey-page.md
  add-branching-journey.md
  add-api-submission.md
  refactor-govuk-journey.md
  review-govuk-journey.md
  clarify-sdlc-work-item.md
```

The `.github/copilot-instructions.md` file provides repository-wide guidance for GitHub Copilot. Path-specific instructions live in `.github/instructions/`.

Suggested workflow:

1. Start with `prompts/clarify-sdlc-work-item.md` if the change is unclear.
2. Use a task prompt from `prompts/` when implementing or reviewing a common change.
3. Apply the related `rules/` files during implementation and review.
4. Finish with `npm test`, `npm run lint` and `npm run build` when templates, Sass or assets changed.
