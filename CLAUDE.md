# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Workspace Overview

This workspace hosts one or more **ServiceNow scoped applications**, developed
locally via the [ServiceNow VS Code extension](https://marketplace.visualstudio.com/items?itemName=ServiceNow.now-vscode),
which two-way syncs files here with a live ServiceNow instance. **There is no local
runtime for the application code** — Script Includes execute server-side on the
ServiceNow instance, and Client Scripts execute in the ServiceNow browser UI.

Each scoped application is a top-level folder (named after the app) containing its
own `app.config.json` and `src/`, organized by artifact type (Script Includes,
Business Rules, UI Actions, Client Scripts, etc.). `system/sn-workspace.json` maps
every application loaded in this workspace to its `sys_id`/scope — check it before
assuming which app/scope a table or API belongs to.

## Detailed Instructions

Full, path-scoped guidance lives in `.github/instructions/*.md` (applied
automatically by editors that honor `applyTo` front matter) — read the relevant file
before writing code in that area:

- **`javascript.instructions.md`** — JSDoc/TypeScript type-safety rules, code style,
  and naming conventions for all `.js`/`.ts` files. Applies everywhere.
- **`servicenow.instructions.md`** — ServiceNow artifact types (Script Include,
  Business Rule, UI Action, Scheduled Job, REST Message, Fix Script, Scripted REST
  API, Client Script, UI Script, Service Portal Widget) and their execution contexts;
  `sn-workspace.json` structure; querying the live instance with `@servicenow/sdk`
  (including resolving table schemas from `.table.now` stub files); Script Include and
  Table Manager conventions.
- **`table-manager-pattern.instructions.md`** — the Table Manager pattern for
  centralizing a table's Business Rule / UI Action / ACL logic into one Script
  Include, including its naming conventions.
- **`servicenow-widgets.instructions.md`** — Service Portal widget structure
  (`Widgets/`, `Widget Angular Providers/`), the AngularJS 1.x + Bootstrap 3.3.6 stack,
  and widget-specific best practices.
- **`servicenow-test.instructions.md`** — Jasmine unit testing conventions for
  Script Includes (naming, `KLF_TestUtils`, matchers, test organization).
- **`klf-todo.instructions.md`** — application-specific facts for the KLF Todo app in
  this workspace (identity, shared library location, type declarations).

Run `npx tsc` (zero errors required) and `npx eslint .` per the Build/Lint commands
in `copilot-instructions.md` before considering JS/TS work done. There is no local
test runner — Script Include unit tests run in the ServiceNow instance's Jasmine test
runner UI.
