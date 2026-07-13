# Demonstrate all installed GOV.UK components in two service journeys

**Type:** Epic
**Priority:** P2 — useful as a reusable demonstration and test bed, but not a live-service requirement
**Risk:** Medium — broad component coverage, branching, validation and accessibility create a sizeable test surface

## Problem / Opportunity

The repository demonstrates a small GOV.UK-style application journey, but it does not provide a realistic way to see and test every GOV.UK Frontend component. A component gallery would show the components in isolation but would not demonstrate how they behave in a service.

Create a demo with two related, fictional scenarios so that product, delivery and engineering users can experience every component in context:

1. a member of the public requests emergency housing support; and
2. a caseworker reviews and triages submitted support requests.

The demo is for component exploration only. It must not imply that it is a real government service, accept real credentials, retain personal data, or connect to external systems.

## Users and Outcomes

### Demo visitor acting as a member of the public

As a demo visitor, I want to complete a realistic support request, including correcting mistakes and reviewing my answers, so that I can see how GOV.UK components work together in a public-facing service.

### Demo visitor acting as a caseworker

As a demo visitor, I want to inspect a queue, open a request and record a decision, so that I can see how GOV.UK components support information-dense internal workflows.

### Demo owner

As a demo owner, I want every component in the installed GOV.UK Frontend version to be represented and traceable to a journey page, so that omissions can be detected when the demo is reviewed or upgraded.

## Proposed Solution

Add a demo landing page that clearly identifies the service as fictional and offers links to the two scenarios. Keep each scenario under its own URL namespace and provide a way to return to the demo landing page.

Use the GOV.UK Frontend version resolved by this repository's lockfile as the coverage baseline. At the time this specification was written, that version is `5.14.0` and exposes the 36 components listed in the component coverage matrix below.

All pages use fictional seed data. User-entered values exist only for the current demo session and can be reset from the landing page.

## Scope

### In scope

- One landing page and two end-to-end scenarios.
- Successful, validation-error, back, change-answer and confirmation states.
- Branching and skip-ahead protection where a later page depends on an earlier answer.
- All 36 components shipped in the installed GOV.UK Frontend package, rendered through GOV.UK Nunjucks macros.
- Server-side rendering and server-side validation.
- Progressive enhancement where provided by GOV.UK Frontend, with a usable fallback when JavaScript is unavailable.
- Session-backed fictional answers and pre-seeded fictional casework records.
- Automated evidence that each component has at least one intended page or state.
- Journey, validation, view-model and accessibility-focused tests proportionate to the behavior.

### Scenario 1 — Request emergency housing support

**Primary user:** member of the public who may be at risk or using a shared device.

**Entry point:** `/demo/support/start`

1. **Start and guidance**
   - State prominently that this is a fictional demo and that visitors must not enter real personal information.
   - Explain what the fictional support covers and what information will be requested.
   - Group optional guidance about types of support in an accordion.
   - Use details for short supplementary help, inset text for contextual information and warning text for an important safety message.
   - Provide a start button and a persistent, appropriately labelled exit-this-page action.
2. **Eligibility**
   - Ask a single-choice eligibility question using radios in a fieldset with hint text.
   - An eligible answer continues to the task list.
   - An ineligible answer shows a clear outcome page and a route back to change the answer.
   - Submitting no answer shows both an error summary and a field-level error message, with focus moved to the error summary.
3. **Application task list**
   - Show the sections `About you`, `Support needs`, `Evidence` and `Check your answers`.
   - Display meaningful `Not started`, `In progress`, `Completed` and `Cannot start yet` states using tags.
   - Prevent access to `Check your answers` until all required sections are complete.
4. **About you**
   - Capture a fictional full name with a text input, date of birth with a date input, and current country with a select.
   - Every control has a visible label or legend and helpful hint where needed.
   - Missing or invalid answers are rejected server-side and shown in context without losing valid answers.
5. **Support needs**
   - Ask which types of help are needed using checkboxes.
   - Capture a short description using a character-count component with a 500-character limit.
   - Capture optional additional information with a textarea.
   - Preserve entered answers when a validation error occurs.
6. **Evidence**
   - Offer a file-upload control for an optional fictional supporting document.
   - Explain accepted demonstration file types and size in hint text.
   - Do not retain uploaded file contents; the review page may show only a safe filename for the current session.
7. **Check answers and submit**
   - Present answers in summary lists grouped as summary cards.
   - Each editable answer has a specific change link that returns to the correct page and then back to check answers.
   - Submission requires an explicit primary button and cannot succeed if required answers are missing.
8. **Confirmation**
   - Show a panel containing a fictional reference.
   - Explain what would happen next in a real service and provide a route back to the demo landing page.

### Scenario 2 — Triage emergency housing support requests

**Primary user:** fictional caseworker reviewing demonstration records.

**Entry point:** `/demo/casework/sign-in`

1. **Demo sign-in**
   - Explain that this is not real authentication and that visitors must not enter a real password.
   - Use the password-input component, including its show/hide enhancement.
   - Accept any non-empty demonstration value, discard it immediately and continue to the queue.
   - A missing value shows the standard error summary and field-level error behavior.
2. **Request queue**
   - Show a notification banner describing newly assigned fictional work.
   - Provide tabs for `Unassigned`, `My requests` and `Completed` records.
   - Show requests in a table with reference, applicant alias, received date, urgency and status.
   - Use tags for statuses and pagination when the seeded result set spans more than one page.
   - Preserve the selected tab and page when the user returns from a request.
3. **Request details**
   - Use breadcrumbs to show the casework hierarchy.
   - Present the request using summary-list cards, including the filename but no file contents.
   - Use details for secondary audit information.
   - Provide actions to record a decision or return to the queue.
4. **Record a decision**
   - Ask for `Priority`, `Standard` or `More information needed` using radios in a fieldset.
   - Capture an optional case note using a textarea.
   - Display warning text before the decision is saved.
   - A missing decision shows the standard error summary and field-level error behavior.
5. **Decision outcome**
   - Show a success notification banner that identifies the fictional request and recorded status.
   - Allow the user to return to the same queue tab, where the seed record reflects the decision for the remainder of the session.

### Shared journey behavior

- The header identifies the fictional service and links back to the demo landing page.
- Service navigation provides links to `Demo home`, `Public journey` and `Caseworker journey`.
- A phase banner labels the service as a prototype/demo.
- A skip link targets the main content, and every page includes the GOV.UK footer.
- Back links are used on linear form steps; breadcrumbs are used where the user is navigating a hierarchy. Do not show both for the same navigation purpose.
- Cookie-banner accept and reject states can be demonstrated without setting analytics or non-essential cookies.
- Pages use one clear `h1`, logical heading order, descriptive link text and GOV.UK content style.
- Refreshing or navigating back must not create duplicate submissions or lose valid session answers.

## Component Coverage Matrix

Coverage means that the component is rendered in a user-visible page or state, not merely imported. Low-level components such as label, hint and error message may be rendered through their parent form macros.

| Installed component | Required scenario and state |
| --- | --- |
| Accordion | Public start page: types of support |
| Back link | Public and caseworker linear form steps |
| Breadcrumbs | Caseworker request details; optional public guidance hierarchy |
| Button | Start, continue, save decision and submit actions |
| Character count | Public support-needs description |
| Checkboxes | Public types of help needed |
| Cookie banner | Shared first-visit accept/reject demonstration |
| Date input | Public date of birth |
| Details | Public supplementary guidance and caseworker audit information |
| Error message | Invalid public form and demo sign-in/decision states |
| Error summary | Invalid public form and demo sign-in/decision states |
| Exit this page | Public journey safety action |
| Fieldset | Grouped eligibility, checkbox and decision questions |
| File upload | Public optional evidence |
| Footer | Shared page shell |
| Header | Shared page shell |
| Hint | Public and caseworker form guidance |
| Input (text input) | Public fictional full name |
| Inset text | Public start-page context |
| Label | Public text fields and caseworker demo sign-in, directly or through parent macros |
| Notification banner | Caseworker queue and saved-decision outcome |
| Pagination | Caseworker request queue |
| Panel | Public submission confirmation |
| Password input | Caseworker demo sign-in |
| Phase banner | Shared prototype/demo label |
| Radios | Public eligibility and caseworker decision |
| Select | Public current country |
| Service navigation | Shared links between demo areas |
| Skip link | Shared page shell |
| Summary list | Public check answers and caseworker request details, including card presentation |
| Table | Caseworker request queue |
| Tabs | Caseworker request-queue states |
| Tag | Public task statuses and caseworker request statuses |
| Task list | Public application sections |
| Textarea | Public additional information and caseworker note |
| Warning text | Public safety guidance and caseworker decision warning |

## Acceptance Criteria

1. **Given** a visitor opens the demo landing page, **when** they choose either scenario, **then** they can enter that scenario, see that all data is fictional, and return to or reset the demo without affecting the other scenario.
2. **Given** an eligible visitor starts the public scenario, **when** they complete every required section, correct any validation errors, review their answers and submit, **then** they reach a confirmation panel with a fictional reference.
3. **Given** a visitor changes a public answer or attempts to skip ahead, **when** the answer changes required downstream information or a prerequisite is missing, **then** stale answers are cleared as appropriate and the visitor is routed to the first required incomplete step.
4. **Given** a visitor enters the caseworker scenario, **when** they use a non-empty demo password, filter and paginate the seeded queue, open a request and record a valid decision, **then** they see a success banner and the updated fictional status persists for that session.
5. **Given** the installed GOV.UK Frontend version is `5.14.0`, **when** component coverage is checked, **then** all 36 components in the matrix have at least one automated route, render or browser assertion proving their required user-visible state.
6. **Given** JavaScript is unavailable, **when** either scenario is used, **then** all essential content, navigation, validation and completion behavior remains usable; JavaScript-enhanced components degrade according to GOV.UK guidance.
7. **Given** the demo is reviewed for accessibility and safety, **when** pages are used with keyboard navigation and common responsive widths, **then** focus order, visible focus, labels, legends, errors, headings and status content remain understandable, and no real credential, uploaded file content or external request is stored or transmitted.

## Non-functional Requirements

- Continue to use server-rendered Express and Nunjucks; do not introduce a client-side framework or SPA routing.
- Use GOV.UK Frontend Nunjucks macros and documented options rather than recreating components with custom HTML.
- Keep custom styling and custom client-side JavaScript to the minimum needed for demo-specific layout or state.
- Target WCAG 2.2 AA and preserve GOV.UK focus, keyboard and responsive behavior.
- Validate and normalize all submitted values server-side before saving permitted demo values to the session.
- Do not log or persist the demonstration password, uploaded file contents or user-entered personal details outside the session.
- Use fictional, clearly labelled content throughout; do not make claims about actual eligibility, support decisions or government response times.
- Preserve the existing demo journey unless a later implementation plan explicitly migrates or replaces it.

## Required Test Evidence

- Integration tests for the landing page, both complete journeys, each branch, skip-ahead guards, back/change links and session reset.
- Validator tests for missing and invalid values, character limit, date input and file-selection metadata.
- View-model tests for task states, summary rows/cards, queue rows, tags, pagination and decision outcomes.
- Render assertions for all 36 component classes or component-specific landmarks, mapped to the coverage matrix.
- Validation tests that assert both the error summary and linked field-level error.
- A no-JavaScript journey check for both scenarios.
- Keyboard, focus and automated accessibility smoke checks for representative content, form, queue and confirmation pages.
- Successful completion of `npm test`, `npm run lint` and `npm run build`.

## Out of Scope

- A production emergency-housing service or authoritative service content.
- Real authentication, authorization, GOV.UK One Login or staff identity management.
- Databases, persistent user records, email, notifications, analytics or external APIs.
- Virus scanning, storage or retrieval of uploaded file contents.
- A full content-management system or generic component playground.
- GOV.UK Design System patterns that are not components, except where needed to make the two journeys coherent.
- Components that are not present in the lockfile-resolved GOV.UK Frontend `5.14.0` package. Adding newly released components requires a separate dependency-upgrade decision and coverage update.
- Replacing or redesigning the existing application journey as part of this epic.

## Assumptions and Dependencies

- "All GOV.UK components" means all component directories shipped by the repository's lockfile-resolved GOV.UK Frontend version, including low-level form components used through composed macros.
- The existing Express, Nunjucks, session, controller, service, validator and view-model architecture remains the delivery baseline.
- Seeded casework records may be reset whenever the server or demo session restarts.
- The exit-this-page component is included because the fictional public scenario is safety-sensitive; its destination and history behavior must follow current GOV.UK component guidance.
- Detailed content should be reviewed for clarity and sensitivity before presenting the demo publicly.

## Open Questions

These do not block an initial Ralph plan, but should be resolved before public sharing:

- Should the demo use a neutral fictional department name, or match a specific department's service header?
- Is manual accessibility review sufficient for the demo, or is a specific automated browser tool required?
- Should a future work item upgrade GOV.UK Frontend before implementation so the demo targets components added after `5.14.0`?

## Suggested Next Step

Ask Ralph to turn this epic into small vertical slices, starting with the shared shell and coverage register, followed by the public journey, caseworker journey, negative states and accessibility/coverage verification. Keep each slice independently testable and do not treat a rendered component alone as proof that its flow behavior works.

## References

- [GOV.UK Design System components](https://design-system.service.gov.uk/components/)
- [Using GOV.UK Frontend in production](https://design-system.service.gov.uk/get-started/production/)
- Repository rules: `rules/govuk-nunjucks-architecture.md`, `rules/journey-design.md`, `rules/testing-and-quality.md`, `rules/sdlc-guardrails.md`
