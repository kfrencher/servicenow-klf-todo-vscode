---
description: 'Guidelines for building Service Portal widgets and widget Angular providers with AngularJS and Bootstrap 3.3.6'
applyTo: '**/Service Portal/**'
---

# Service Portal Widget Guidelines

ServiceNow has multiple widget-like artifact types (e.g. Content Blocks, UI Builder
components); this file applies specifically to **Service Portal** artifacts, which
live under an application's `src/.../Service Portal/` directory:

- **`Widgets/`** — one subfolder per widget (named after the widget), containing its
  coupled files, e.g. for a widget named `My Widget`:
  - `My Widget.template.html` — the AngularJS HTML template
  - `My Widget.client_script.js` — the AngularJS client controller
  - `My Widget.script.js` — the server script
  - `My Widget.link.js` — optional AngularJS link function (DOM-level behavior not
    appropriate for the controller, e.g. raw DOM event listeners)
  - `My Widget.css.scss` — optional widget-scoped SCSS
  - `My Widget.option_schema.json` — declares configurable widget options (each entry
    has `name`, `label`, `type`, `default_value`, `section`, `hint`, etc.), surfaced to
    page/widget instance configuration
  - `My Widget.demo_data.json` — sample `data` payload used by the widget editor's
    preview when there's no live server data
- **`Widget Angular Providers/`** — reusable AngularJS services/factories shared across
  multiple widgets' client controllers/link functions, one file per provider. Written
  as a `factory(...)` function with injected dependencies as parameters (e.g.
  `function factory($q, $http, ...) { ... return serviceObject; }`). Put shared
  client-side logic here instead of duplicating it inside individual widgets.

## Technology Stack

Service Portal widgets and Widget Angular Providers in this workspace are built
exclusively on the platform's built-in stack — do not introduce other frameworks or
libraries:

- **AngularJS (1.x)** — the client controller, HTML template, link function, and any
  Widget Angular Provider use AngularJS conventions (`ng-repeat`, `ng-if`, `ng-model`,
  `ng-click`, `{{ }}` interpolation, dependency injection via constructor/function
  arguments), not React/Vue/vanilla-JS DOM manipulation. Prefer Angular bindings over
  direct DOM manipulation in the controller; reserve raw DOM work (e.g.
  `element.on(...)`) for the widget's `.link.js`.
- **Bootstrap 3.3.6** — use Bootstrap's grid (`row`/`col-*`), components (`panel`,
  `btn`, `btn-*`, `form-group`, `list-group`, `modal`, `dropdown-menu`, `alert-*`), and
  utility classes for layout and styling before writing any custom CSS/SCSS. Note this
  is Bootstrap **3**, not 4/5 — avoid classes/utilities that only exist in later
  Bootstrap versions (e.g. `d-flex`, `card`, `btn-outline-*`, the 5-tier grid).
- Only add widget-specific CSS/SCSS (`.css.scss`) when Bootstrap 3.3.6 and simple
  Angular bindings genuinely cannot achieve the required layout or look. Keep any
  custom styles minimal, scoped to the widget, and consistent with the instance's
  existing visual language.

## Best Practices

- Populate all data the template needs on `data` in the server script (`.script.js`)
  rather than making the client controller reach back to the server repeatedly; use
  `$scope.server.get()` for on-demand refreshes triggered by user interaction, and
  `input`/`$scope.server.update()` to send data back to the server script.
- Document the shape of `data`/`input` and any widget option keys with a comment block
  near the top of the server script and client controller, matching each option
  declared in `.option_schema.json`.
- Use `ng-if`/`ng-show` appropriately: prefer `ng-if` when the element (and any
  Glide/API calls tied to it) should not exist in the DOM at all.
- Extract Angular logic shared by two or more widgets into a Widget Angular Provider
  under `Widget Angular Providers/` rather than copy-pasting it into each widget's
  client controller or link function; check that folder for an existing provider
  before writing new shared client logic.
- Follow the JSDoc type-annotation and code-style rules in
  `javascript.instructions.md` for the client controller, server script, link
  function, and any Widget Angular Provider.
- Keep templates accessible: semantic HTML elements, labeled form controls
  (`<label for>` / `aria-label`), visible focus states, and sufficient color contrast,
  per the workspace's WCAG 2.1 AA requirement for client-facing UI.
- Avoid inline `style=` attributes in the HTML template where a Bootstrap class would
  do; an `ng-style` binding driven from the controller is acceptable when the value is
  genuinely dynamic.
