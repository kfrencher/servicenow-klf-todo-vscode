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

## Querying the Live Instance with @servicenow/sdk

If the `@servicenow/sdk` package is available (check with
`npx @servicenow/sdk query --help`), it can be used to query data and metadata
directly from the synced ServiceNow instance — useful for looking up live records,
choice values, or table schemas that aren't fully visible from local source alone.

**Basic usage:**
```
npx @servicenow/sdk query <table> -q "<encoded query>" -f "<comma-separated fields>" --output json
```

- `<table>` — the table name (e.g. `sys_user`, `x_<scope>_<app>_task`)
- `-q`/`--query` — an encoded query string (`sysparm_query`), e.g. `active=true^priority<=2`. this is required. a value must be provided even if an empty string.
- `-f`/`--fields` — comma-separated fields to return (`sysparm_fields`); omit to return all fields
- `--output json` — machine-readable JSON envelope (`{ ok, hasMore, nextOffset, records }`)
- Other useful flags: `--limit`, `--offset`, `--display-value`, `-a/--auth` (credential
  alias). Run `npx @servicenow/sdk query --help` for the full list.

### Retrieving a table's schema (data model)

Files under an application's `src/Data Model/Tables/*.table.now` are **stub files**
containing only the table's `sys_db_object` sys_id — they do not contain the schema
itself. To get the actual field/data model:

1. **Resolve the table name** from the stub file's sys_id via `sys_db_object`:
   ```
   npx @servicenow/sdk query sys_db_object -q "sys_id=<sys_id from .table.now file>" -f "name,label,super_class" --output json
   ```
   This returns the real table name (e.g. `x_912467_klf_todo_task`).

2. **Query field definitions** from `sys_dictionary` filtered by that table name:
   ```
   npx @servicenow/sdk query sys_dictionary -q "name=<table_name>" -f "element,column_label,internal_type,max_length,mandatory,reference,default_value,active" --limit 200 --output json
   ```
   Each record is one field (`element`) with its label, type (`internal_type`), max
   length, whether it's mandatory, the referenced table (`reference`, if type is
   `reference`), and default value. Standard `sys_*` audit fields (sys_id,
   sys_created_on/by, sys_updated_on/by, sys_mod_count) are included alongside the
   application-specific fields.

## ServiceNow Development Best Practices

### Type Checking

The `typescript-strict-plugin` in `tsconfig.json` currently applies full strict-mode
checking to Script Includes. Check `tsconfig.json` and the relevant app-specific
instructions file for the exact paths this applies to.

### Script Includes

1. **Use Script Includes for Reusable Code:**
   - Encapsulate reusable logic in Script Includes to promote code reuse and maintainability.
   - Script Includes run on the server side, so ensure that any client-side logic is separated appropriately. Client side code executes in the browser, while server side code runs on the ServiceNow server.
   - When querying the database with GlideRecord use a descriptive variable name for the GlideRecord object, e.g., `const userGR = new GlideRecord('sys_user');`
   - There is a common library that should be used for common operations, avoid duplicating code that already exists in the common library. Its location varies per application — check that application's specific instructions file (e.g. `klf-todo.instructions.md`) for the exact path.
   - Use an immediately invoked function expression (IIFE) that returns an object from
     a Script Include. This keeps private implementation details out of the global
     namespace and lets consumers call public methods without constructing the Script
     Include with `new`.

```javascript
const MyObj = (function () {
    const privateValue = '';

    function privateFunction() {}

    return new (class {
        /**
         * @param {string} message
         * @returns {void}
         */
        log(message) {
            gs.log(message);
        }
    })();
})();

MyObj.log('my test message');
```

Do not use `Class.create()` and prototype-based Script Includes that require callers to
instantiate them with `new`.

### Server-side Logic

- Use `while` loops when iterating `GlideRecord` results.
- Keep implementation code out of UI Actions, Scheduled Jobs, ACLs, and Business Rules.
  Put reusable logic in Script Includes so it can be tested, refactored, and reused.
- Group related table operations in one Script Include rather than creating one Script
  Include per function. Name it `${TableName}Manager`; for example, use
  `TodoTaskManager` for `x_todo_task` operations.
- When a Script Include uses the Table Manager pattern, follow
  [table-manager-pattern.md](table-manager-pattern.md) for its naming, structure, and
  Business Rule, UI Action, and ACL function conventions.
- Minimize Client Scripts and Business Rules that handle the same condition. Consolidate
  that behavior in one component and call multiple functions from it.

### Client-side Behavior

- Prefer UI Policies to Client Scripts for showing or hiding fields and making fields
  mandatory, unless a Client Script is specifically necessary.
- Prefix Business Rule, Client Script, and UI Policy names with the table name they
  apply to, such as `TASK onStateChange`.
