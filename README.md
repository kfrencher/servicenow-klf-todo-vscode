# servicenow-klf-todo

Local development workspace for **KLF Todo**, a ServiceNow scoped application, synced
to a live ServiceNow instance via the
[ServiceNow VS Code extension](https://marketplace.visualstudio.com/items?itemName=ServiceNow.now-vscode).
There is no local runtime for the application code — Script Includes execute
server-side on the instance, and Client Scripts execute in the ServiceNow browser UI.
This repo exists for source control, type checking, and linting of that synced code.

## Application

- **Name:** KLF Todo
- **Scope:** `x_912467_klf_todo`
- **sys_id:** `8e18843f97a02550b2e1f97e6253af64`
- **Synced instance build:** Xanadu

See `system/sn-workspace.json` for the current source of truth (it changes as the app
is synced/upgraded) and `.github/instructions/klf-todo.instructions.md` for more
application-specific facts.

## Repository layout

```
KLF Todo/
├── app.config.json
└── src/
    ├── Server Development/
    │   ├── Script Includes/    (*.script.js — server-side classes)
    │   ├── Business Rules/
    │   └── UI Actions/
    └── Client Development/
        └── Client Scripts/
lib/
├── data/
└── dts/                        (shared library code + Glide API type declarations)
system/                         (ServiceNow workspace metadata, e.g. sn-workspace.json)
```

- `lib/dts/klf.js` / `g_klf.js` — shared server-side helper utilities (scoped and
  global, respectively). Check these before writing new helper logic.
- `lib/dts/serverAPI.d.ts` / `clientAPI.d.ts` (and `updated*` counterparts) — Glide API
  type declarations used by `tsc`.
- `KLF Todo/background scripts/`, `KLF Todo/scratch/` — ad hoc scripts, not part of the
  deployed app.

## Build / lint commands

- **Type check:** `npx tsc` — no build step runs this automatically; run it directly.
  Zero errors required. `tsconfig.json` scopes stricter checking (via
  `typescript-strict-plugin`) to `KLF Todo/src/Server Development/Script Includes`.
- **Lint:** config is `.eslintrc`. Run via the editor's "eslint: lint whole folder"
  task, or `npx eslint .` if the CLI is installed.

### Enable project-level errors from eslint

The extension lints an individual file only on typing. To lint the whole workspace,
set `eslint.lintTask.enable` to `true` and the extension will contribute the
`eslint: lint whole folder` task. No need to define a custom task in `tasks.json`.

### Enable project-level TypeScript errors

Set `typescript.tsserver.experimental.enableProjectDiagnostics` to `true` to enable
project-level errors from TypeScript:

```json
"typescript.tsserver.experimental.enableProjectDiagnostics": true
```

## Testing

Unit tests are ServiceNow Script Includes that run inside the instance via Jasmine —
not through a local CLI. A test file sits next to the code it tests with a `Test`
suffix, e.g. `Script Includes/GroupUtils.script.js` →
`GroupUtilsTest.script.js`. See
`.github/instructions/servicenow-test.instructions.md` for structure conventions. Run
tests from the ServiceNow instance's test runner UI.

## Key conventions

- Every `.js`/`.ts` file must carry full JSDoc type annotations checked by `tsc`.
- Client-side (browser) code and server-side (instance) code are strictly separated —
  Client Scripts must not contain server-only APIs (e.g. `GlideRecord`) and vice versa.
- Client-facing UI must meet **WCAG 2.1 AA** accessibility standards.

See `.github/instructions/*.md` for the full set of path-scoped rules applied when
editing code in this workspace.
