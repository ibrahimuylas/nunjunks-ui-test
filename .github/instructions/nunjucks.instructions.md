---
applyTo: "src/app/views/**/*.njk"
---

# Nunjucks Instructions

- Render data prepared by view models.
- Avoid business logic, branching rules and data formatting in templates.
- Use GOV.UK Frontend macros for GOV.UK components.
- Use app partials only for reusable presentation.
- Keep forms as normal HTML form posts with explicit `method` and `action`.
- Use `novalidate` because validation is performed server-side.
- Do not rely on JavaScript for form submission or core journey progression.
- Avoid passing large HTML strings into macros unless the GOV.UK macro requires it.
- Include GOV.UK error summary and field-level errors for validation pages.
