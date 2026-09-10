---
description: Instructions for integrating with ServiceNow
applyTo: '**/*.js, **/*.ts'
---

# ServiceNow Integration Instructions

## Overview
This document provides guidelines for integrating with the ServiceNow platform, focusing on best practices for JavaScript development within the ServiceNow environment.

This workspace uses the [ServiceNow® Extension for VS Code](https://marketplace.visualstudio.com/items?itemName=ServiceNow.now-vscode) for development, which provides two-way synchronization between VS Code and ServiceNow instances, IntelliSense for Glide APIs, and other development features.

## ServiceNow Artifact Types

An application's `src/` tree is organized by these artifact types. Each runs in a
different context and has different implicit variables available — don't assume APIs
from one type (e.g. `GlideRecord`) are available in another (e.g. Client Scripts).

**Server-side** (run on the ServiceNow instance, full Glide server API available):
- **Script Include** (`Script Includes/`) — reusable server-side class/function
  library, loaded on demand by name. Not executed directly; called from Business
  Rules, other Script Includes, REST endpoints, UI Actions, etc. This is where shared
  server logic belongs.
- **Business Rule** (`Business Rules/`) — server-side logic that runs when a record on
  a table is queried, inserted, updated, or deleted (`before`/`after`/`async`/
  `display`). Has implicit `current` (the record) and, for update rules, `previous`.
- **UI Action** (`UI Actions/`) — adds a button/link/context-menu item to a form or
  list. Its script can run on the client (if "Client" checkbox is set, referencing
  `g_form`) or the server (implicit `current` record, `action` object to control
  redirect and messages).
- **Scheduled Job (Script)** — server-side script executed on a schedule (`sys_trigger`
  scheduled jobs), used for batch/background processing. No implicit `current` — obtain
  records via `GlideRecord` queries.
- **REST Message** — declarative definition of an outbound HTTP endpoint (base URL,
  HTTP methods, headers) invoked from server-side scripts via `sn_ws.RESTMessageV2`;
  not itself a script but is referenced by Script Includes/Business Rules that make
  outbound calls.
- **Fix Script** — one-off/on-demand server-side script run manually (e.g. from
  `sys.scripts.do` or via an update set) for data migrations or maintenance tasks;
  same server API as a Scheduled Job. Not triggered automatically, so don't rely on it
  running as part of normal application flow.
- **Scripted REST API / Inbound REST** — defines an *inbound* HTTP endpoint hosted by
  the instance (a REST API "resource" with its own path, HTTP method, and script).
  Server-side script has implicit `request` and `response` objects
  (`request.body.data`, `response.setBody(...)`) instead of `current`; use
  `GlideRecord` inside the resource script to read/write data. This is the inverse of a
  REST Message: REST Message = this instance calling out; Scripted REST API = another
  system calling into this instance.

**Client-side** (run in the browser, no server Glide APIs like `GlideRecord`):
- **Client Script** (`Client Scripts/`) — runs on a form (`onLoad`/`onChange`/
  `onSubmit`/`onCellEdit`) using the implicit `g_form` (and `g_scratchpad` from
  `display` Business Rules). Use `GlideAjax` to call server-side Script Includes marked
  `client callable`.
- **UI Script** (`UI Scripts/`) — reusable client-side JavaScript library (analogous to
  a Script Include, but for the browser), included on forms/pages that need it.

**Mixed (has both client and server pieces)**:
- **Service Portal Widget** — a UI component with up to four coupled parts: an HTML
  template, a server script (implicit `data`/`input`, has full server Glide API), a
  client controller (Angular-style, implicit `$scope`, calls the server script via
  `$scope.server.get()`/`update()`), and CSS/SCSS. Keep server-only logic out of the
  client controller and vice versa, same as Client Scripts vs. Business Rules.

## Workspace Structure

### Understanding sn-workspace.json

The `system/sn-workspace.json` file contains configuration and metadata for all ServiceNow applications loaded in this workspace. This file is managed by the ServiceNow VS Code extension.

**Key Properties:**

- **ALL_APPLICATIONS**: Contains all ServiceNow applications loaded locally
  - Each key is the application name (e.g., "KLF", "G KLF")
  - Each application has properties including:
    - `sys_id`: The application's sys_id in ServiceNow
    - `sys_scope`: The scope name (e.g., "x_912467_klf" for scoped apps, "global" for global scope)
    - `package_type`: Usually "sys_app"
    - `PROJECT_STATE`: Current sync state (e.g., "consistent")
    - `INSTANCE_ID`: The instance this application is synced with
    - `BUILD_NAME`: The ServiceNow release version (e.g., "Tokyo")

- **ACTIVE_APPLICATION**: The currently active/selected application for development

**Example sn-workspace.json (illustrative — see the actual file in this workspace for real values):**
```json
{
    "ALL_APPLICATIONS": {
        "MyApp": {
            "sys_id": "<sys_id>",
            "sys_scope": "x_<vendor>_myapp",
            "package_type": "sys_app"
        },
        "MyApp Shared": {
            "sys_id": "<sys_id>",
            "sys_scope": "global",
            "package_type": "sys_app"
        }
    },
    "ACTIVE_APPLICATION": "MyApp"
}
```

### Finding Application Source Code

To locate the actual source code for applications in the workspace:

1. **Check sn-workspace.json**: Look at the `ALL_APPLICATIONS` property to see which applications are loaded locally
2. **Navigate to application folder**: Each application name is a top-level folder
3. **Source files location**: Application source code is in the `{ApplicationName}/src/` directory

**Examples:**
- Application "MyApp" → Source code in `MyApp/src/`
- Application "MyApp Shared" → Source code in `MyApp Shared/src/`

**Directory Structure:**
```
workspace-root/
├── system/
│   └── sn-workspace.json
├── MyApp/
│   ├── app.config.json
│   └── src/
│       ├── Server Development/
│       │   ├── Script Includes/
│       │   ├── Business Rules/
│       │   └── ...
│       └── Client Development/
│           ├── Client Scripts/
│           ├── UI Scripts/
│           └── ...
└── MyApp Shared/
    ├── app.config.json
    └── src/
        └── Server Development/
            └── Script Includes/
```

### Scoped vs Global Applications

- **Scoped Applications**: Have a specific scope (e.g., `x_<vendor>_<appname>`)
  - All tables, Script Includes, and other artifacts are namespaced
  - Use the scope prefix when referencing from outside the scope
  
- **Global Applications**: Use the "global" scope
  - Accessible from all scopes
  - No namespace prefix required
  - Should be used for shared utilities and common functionality

### Working with Multiple Applications

When searching for code or creating new files:
1. Identify which application the code belongs to
2. Check `sn-workspace.json` to verify the application is loaded locally
3. Navigate to the appropriate `{ApplicationName}/src/` directory
4. Follow the ServiceNow file structure (Server Development, Client Development, etc.)

## ServiceNow Development Best Practices
1. **Use Script Includes for Reusable Code:**
   - Encapsulate reusable logic in Script Includes to promote code reuse and maintainability.
   - Script Includes run on the server side, so ensure that any client-side logic is separated appropriately. Client side code executes in the browser, while server side code runs on the ServiceNow server.
   - When querying the database with GlideRecord use a descriptive variable name for the GlideRecord object, e.g., `var userGR = new GlideRecord('sys_user');`
   - There is a common library that should be used for common operations, avoid duplicating code that already exists in the common library. Its location varies per application — check that application's specific instructions file (e.g. `klf-todo.instructions.md`) for the exact path.