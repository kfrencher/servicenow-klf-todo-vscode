# Copilot Instructions

This workspace hosts one or more **ServiceNow scoped applications**, developed locally
via the [ServiceNow VS Code extension](https://marketplace.visualstudio.com/items?itemName=ServiceNow.now-vscode),
which two-way syncs files here with a live ServiceNow instance. There is no local
runtime for the application code — Script Includes execute server-side on the
ServiceNow instance, and Client Scripts execute in the ServiceNow browser UI.

More detailed, path-scoped rules live in `.github/instructions/*.md` and are applied
automatically based on file path/type (`applyTo` front matter). Look there for:
- JSDoc type-safety and JS/TS style rules
- ServiceNow workspace/scope navigation and Script Include practices
- Jasmine unit test conventions
- Facts specific to an individual application in this workspace (name, sys_id, scope,
  shared library file names, etc.)

## Repository layout

Each ServiceNow scoped application is a top-level folder named after the application,
containing its own `app.config.json` and `src/`:

```
<ApplicationName>/
├── app.config.json
└── src/
    ├── Server Development/
    │   ├── Script Includes/    (*.script.js — server-side classes)
    │   ├── Business Rules/
    │   └── UI Actions/
    └── Client Development/
        └── Client Scripts/
```

A workspace can contain multiple such application folders side by side. Other
top-level items:

- `system/sn-workspace.json` — maps every application loaded in this workspace to its
  `sys_id`/scope (`ALL_APPLICATIONS`) and marks the `ACTIVE_APPLICATION`. Consult it to
  see which application folders exist locally and their scope names (e.g.
  `x_<vendor>_<app>` for scoped, `global` for global-scope apps) before assuming where
  a table/API/Script Include belongs.
- `lib/dts/` — shared library code and Glide API type declarations (`*.d.ts`) used for
  `tsc` checking against the ServiceNow Glide APIs; excluded from compilation
  themselves (see `tsconfig.json`'s `exclude`). The actual shared-library file names
  are workspace/app-specific — check the app-specific instructions file.
- `<ApplicationName>/background scripts/`, `<ApplicationName>/scratch/` — ad hoc
  scripts, not part of the deployed app.

## Build / lint commands

- **Type check:** `npx tsc` — no build step runs this automatically; run it directly.
  Zero errors required. `tsconfig.json` may scope stricter checking (e.g. via
  `typescript-strict-plugin`) to specific app paths — check its `plugins` config.
  There is no single-file shortcut configured; `tsc` type-checks per `tsconfig.json`'s
  `include`/`exclude` rules.
- **Lint:** config is `.eslintrc` (Glide globals aren't declared to ESLint, so
  `no-undef`/`no-unused-vars` are off; most other rules are `warn`-level). Run via the
  editor's "eslint: lint whole folder" task, or `npx eslint .` if the CLI is installed.

## Testing

Unit tests are **ServiceNow Script Includes**, not a local test framework — they run
inside the ServiceNow instance via Jasmine, not through a CLI here. A test file sits
next to the code it tests with a `Test` suffix, e.g.
`Script Includes/GroupUtils.script.js` → `GroupUtilsTest.script.js`. Follow
`servicenow-test.instructions.md` for structure (`describe`/`it`, test-utils helper for
fixtures/cleanup, Chance.js for random data). To run a test, execute it from the
ServiceNow instance's test runner UI — there's no local invocation.

## Key conventions

- Every `.js`/`.ts` file must carry full JSDoc type annotations checked by `tsc`; this
  is enforced project-wide, not optional style.
- Scoped vs. global: application code lives under its scope prefix except shared
  utilities placed in a `global`-scope app — check `system/sn-workspace.json` before
  assuming which scope a table/API belongs to.
- Client-side (browser) code and server-side (ServiceNow instance) code are strictly
  separated — Client Scripts must not contain server-only APIs (e.g. `GlideRecord`) and
  vice versa.

## Accessibility

Client-facing UI (Client Scripts, any HTML/CSS) must meet **WCAG 2.1 AA**: full keyboard
operability, visible focus indicators, minimum 44x44px touch targets, text resizing up
to 200%, `prefers-color-scheme`/`prefers-reduced-motion` support, and 4.5:1 minimum color
contrast.
