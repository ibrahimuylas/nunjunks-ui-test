# GOV.UK Design System test project

This is a small test project built with Ralph to explore server-rendered GOV.UK Design System journeys using Express, Nunjucks, Sass and GOV.UK Frontend.

It is not a real government service and it is not intended for production use. The journeys, data, records, references, caseworker access and decisions are all fictional.

The project was used to try out:

- Ralph-assisted implementation from written requirements
- Equal Experts-style rules, prompts and delivery workflow
- GOV.UK Frontend Nunjucks macros
- server-side validation and session-backed journey state
- Jest, Supertest and Playwright browser coverage

## What is included

The app contains:

- an original simple branching journey at `/start`
- a GOV.UK component demo at `/demo`
- two fictional demo flows:
  - `/demo/support/start` — public support-request journey
  - `/demo/casework/sign-in` — caseworker triage journey
- automated evidence that the installed GOV.UK Frontend components are rendered in real journey states

The component demo requirements are in
[`specs/001-govuk-component-demo-journeys.md`](specs/001-govuk-component-demo-journeys.md).

## Run locally

```bash
git submodule update --init --recursive
npm install
npx playwright install chromium
npm run build
npm run dev
```

The app starts at `http://localhost:3434` by default. If that port is busy, it uses the next available port and prints the URL.

To request a specific port:

```bash
PORT=3100 npm start
```

## Useful commands

```bash
npm run dev          # start with nodemon
npm start            # start with node
npm test             # run Jest and Supertest tests
npm run test:browser # build, start the app and run Playwright tests
npm run lint         # run ESLint
npm run build        # compile Sass and copy GOV.UK assets
```

## GOV.UK component demo

The `/demo` area is deliberately fictional. It exists to show GOV.UK Design System components inside realistic-looking service flows, not as a standalone component gallery.

The demo covers all 36 component directories shipped by the lockfile-resolved GOV.UK Frontend version used in this project, currently `5.14.0`.

The canonical coverage mapping lives in
[`src/app/config/demo-component-coverage.js`](src/app/config/demo-component-coverage.js). Tests compare this register with the installed GOV.UK package and then prove the mapped components render through real routes.

Important boundaries:

- do not enter real personal information, files or passwords
- the caseworker sign-in is fake and accepts any non-empty demo value
- uploaded file bytes are discarded
- demo state is kept only in the in-memory Express session
- there are no databases, analytics, notifications or external APIs

## Project shape

```text
src/app
  app.js          Express and Nunjucks setup
  server.js       HTTP entry point
  routes          Route declarations
  controllers     Page-focused request handlers
  services        Journey and session rules
  validators      Server-side validation
  view-models     Data prepared for templates
  views           Nunjucks templates
  public          Sass, JavaScript and copied GOV.UK assets

tests
  unit            Validators, view models and coverage register checks
  integration     Routes and full journey flow
  browser         Playwright browser checks
```

## GOV.UK Frontend wiring

GOV.UK Frontend is installed from npm. Nunjucks can import GOV.UK macros from `node_modules/govuk-frontend/dist`.

Example:

```njk
{% from "govuk/components/button/macro.njk" import govukButton %}
```

The Sass entry point is `src/app/public/stylesheets/application.scss` and sets:

```scss
$govuk-assets-path: '/public/assets/';
```

`npm run build` compiles the CSS and copies GOV.UK Frontend JavaScript and assets into `src/app/public`.

## Ralph and Equal Experts rules

This repository includes local AI-assistant guidance and prompts inspired by the Equal Experts `llm-toolkit` approach.

- `rules/` contains engineering guidance used while building the test app.
- `prompts/` contains repeatable task prompts.
- `prompts/library` is a Git submodule pointing at the upstream Equal Experts prompt library.
- `.github/copilot-instructions.md` and `.github/instructions/` provide repository guidance for AI coding tools.

If `prompts/library` is empty after cloning or pulling, run:

```bash
git submodule update --init --recursive
```

## Notes

This README is intentionally short. The repository is a learning and experimentation project, so the source, tests and spec are the best places to look for implementation detail.
