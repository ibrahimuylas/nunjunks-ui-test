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
npm run test:browser # build, start the app and run the Playwright browser suite
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
address prevents the harness from accidentally reusing an unrelated IPv4 server.

The suite runs JavaScript-enabled and JavaScript-disabled Chromium projects. It covers the legacy
bootstrap and demo shell, completes both fictional journeys without JavaScript, exercises GOV.UK
enhancements and keyboard/focus behavior, checks mobile and desktop reflow, and scans representative
states with Axe. Every browser context fails on unexpected console output or uncaught page errors.
Shared viewport definitions live in `tests/browser/helpers/viewports.js`.

Playwright with Chromium was selected because it can exercise the same server-rendered pages with
and without JavaScript. `@axe-core/playwright` provides repeatable automated WCAG 2.2 A and AA smoke
scans in the JavaScript-enabled project; the separate no-JavaScript project proves the essential
flows without relying on Axe. These are regression checks, not a complete accessibility assessment.
Manual review is still required before public sharing, including screen-reader, zoom/reflow and
content-safety review.

## GOV.UK component demo

The fictional component demo is separate from the existing example journey and uses the `/demo`
namespace. Open `/demo` to choose between these stable scenario entry points:

- `/demo/support/start` — the public support-request journey
- `/demo/casework/sign-in` — the caseworker triage journey

Both demo journeys are complete. The demo shell uses neutral fictional branding and tells visitors
not to enter real personal information or passwords. Its header and service navigation always
provide a route back to `/demo`. The existing `/start` journey and all of its URLs remain unchanged.

### Caseworker journey

The caseworker sign-in is a component demonstration, not real authentication. Protected casework
URLs redirect to `/demo/casework/sign-in` until the current session has the demonstration access
flag described under [Operating boundaries](#operating-boundaries).

The complete caseworker route graph is:

```text
/demo
  |
  |-- /demo/casework/sign-in
  |             |
  |             `-- POST --> /demo/casework/queue
  |                              |
  |                              |-- ?tab=unassigned&page=1
  |                              |-- ?tab=my-requests&page=1..n
  |                              `-- ?tab=completed&page=1..n
  |                                         |
  |                         /demo/casework/requests/:reference
  |                                         |
  |                         /demo/casework/requests/:reference/decision
  |                                         |
  |                                  POST --`-- /decision/outcome
  |                                                   |
  |                                                   `-- return to queue tab/page
  |
  `-- POST /demo/casework/reset --> /demo
```

Queue tabs and pagination use allow-listed `tab` and positive `page` query parameters. Request,
decision and outcome links carry only that validated context; invalid or extraneous context is
redirected to a canonical URL. A saved decision uses POST-redirect-GET, moves the fictional record
to `Completed`, and persists its status and optional normalized case note only in the current
casework session. Refreshing the outcome does not repeat the decision. The caseworker reset restores
the seeded records and clears fictional access and outcomes without changing the public journey.

### Public journey

The public journey starts with an explicitly fictional eligibility branch:

```text
/demo
  |
  |-- /demo/support/start
  |        |
  |   /demo/support/eligibility
  |        |
  |        |-- ineligible --> /demo/support/ineligible
  |        |                         |
  |        |                         v
  |        |                 /demo/support/eligibility/change
  |        |
  |        `-- eligible ----> /demo/support/tasks
  |                                  |
  |                                  |-- /demo/support/about-you
  |                                  |-- /demo/support/support-needs
  |                                  |-- /demo/support/evidence
  |                                  `-- /demo/support/check-answers
  |                                             |
  |                                             `-- POST --> /demo/support/confirmation
  |
  `-- POST /demo/support/reset --> /demo
```

The eligible destination is the public application task list.
Changing an existing eligibility answer clears public-journey answers that depend on it; submitting
the same answer leaves those answers intact. The branch is defined in `journey-steps.js` and applied
through the journey-service facade.

Eligible visitors can now open `/demo/support/tasks`. `About you`, `Support needs` and `Evidence`
are available in any order and move from `Not started` to `In progress` when visited, then to
`Completed` only after the section is validly completed. The optional evidence file does not make
the section optional: visitors explicitly complete it with or without a file. `Check your answers`
remains at `Cannot start yet` until all three sections are complete, and direct skip attempts redirect
to the first incomplete section in the order shown. Every section route requires the eligible
branch answer.

Each completed section returns to the task list. Its normal back link returns to the task list,
except for the evidence page's linear back link to support needs. Once every section is complete,
check answers provides fixed change routes for eligibility, about-you details, support needs and
evidence. Valid section edits return to check answers. Changing eligibility to the other branch
clears dependent answers and routes to the ineligible outcome or the first incomplete task; request
parameters cannot override those destinations.

The exact change routes are `/demo/support/eligibility/change`,
`/demo/support/about-you/change`, `/demo/support/support-needs/change` and
`/demo/support/evidence/change`.

The evidence page accepts one optional demonstration file with PDF, JPG or PNG metadata up to
2 MB. It is a component demonstration, not a production upload or content-scanning service; its
storage behavior is described under [Operating boundaries](#operating-boundaries).

Submission revalidates the stored answers and uses POST-redirect-GET to create one fictional
reference. Refreshing confirmation or replaying submission keeps that reference. Editing an answer
after submission invalidates confirmation until the request is submitted again. The public reset
action on `/demo` clears only the public journey and sends the visitor back to the demo landing page.

### Session and reset behavior

The public and caseworker scenarios occupy separate state below the current Express session. Seeded
casework records are cloned into that session before they are changed, so answers, task progress,
references, access flags and decisions do not cross between browsers or scenarios. The legacy
`/start` journey also keeps its separate session state.

The `/demo` landing page provides two POST-only reset actions:

- `POST /demo/support/reset` clears only public answers, progress and a submitted reference.
- `POST /demo/casework/reset` restores seeded casework records and clears demonstration access,
  decisions and outcomes.

Neither reset changes the other scenario, the legacy journey, or the shared cookie-banner choice.
The cookie banner records an accept or reject demonstration choice in the session but does not set
analytics or non-essential cookies. This example uses the default in-memory session store, so its
state is not durable and a server restart clears it.

### Operating boundaries

This demo is deliberately not a service:

- Do not enter real names, dates of birth, support needs, files or passwords. Public answers and
  case notes are normalized and kept only in the current in-memory demo session.
- The caseworker sign-in is not identity verification, authentication or authorization. Any
  non-empty made-up value is accepted, discarded immediately and never logged; only a boolean
  demonstration access flag is retained.
- Uploaded bytes are drained and discarded without being buffered or written to disk. Only a
  sanitized base filename can be retained in the support session.
- Eligibility, references, casework records and decisions are fictional. They make no claim about
  a real service, entitlement, outcome or response time.
- The demo has no database, file store, analytics, email, notification or external API integration.
  It does not transmit demo answers, passwords, file contents or decisions to external systems.

### Component coverage traceability

GOV.UK Frontend is lockfile-resolved to `5.14.0`. The canonical
[component coverage register](src/app/config/demo-component-coverage.js) contains one ordered entry
for each of its 36 component directories. Every entry names the real `/demo` route, the session or
validation state needed to render it, and the selector used as automated evidence. The register is
the single source of truth for this mapping; this README does not duplicate a matrix that could
drift.

`tests/unit/demo-component-coverage.test.js` compares the register with the installed package and
fails on a version mismatch or a missing, extra, duplicate or incomplete entry.
`tests/integration/demo-component-coverage.test.js` then establishes each registered state through
the real journeys and checks component-specific visible content and semantics for all 36 entries.
Run those checks with `npm test`; run the complete real-browser evidence with
`npm run test:browser`.

## GOV.UK Frontend wiring

GOV.UK Frontend is installed from npm. Nunjucks is configured with both the app views directory and `node_modules/govuk-frontend/dist`, so templates can import macros directly:

```njk
{% from "govuk/components/button/macro.njk" import govukButton %}
```

The Sass entry point is `src/app/public/stylesheets/application.scss`. It imports GOV.UK Frontend and sets:

```scss
$govuk-assets-path: '/public/assets/';
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
