---
description: 'Application-specific facts for the KLF Todo scoped app in this workspace'
applyTo: 'KLF Todo/**, lib/**'
---

# KLF Todo Application

This workspace currently contains a single ServiceNow scoped application, **KLF Todo**,
whose source lives in `KLF Todo/src/`.

## Identity

- **Application name:** KLF Todo
- **Scope:** `x_912467_klf_todo`
- **sys_id:** `8e18843f97a02550b2e1f97e6253af64`
- **Synced instance build:** Xanadu (see `system/sn-workspace.json` for current values —
  it is the source of truth and can change as the app is synced/upgraded)

## Shared library

Common, reusable server-side helpers for this app live in `lib/dts/`:

- `klf.js` — scoped-app (`x_912467_klf_todo`) common utilities
- `g_klf.js` — global-scope common utilities

Check both files before writing new helper logic — avoid duplicating functionality
that already exists there.

## Type declarations

`lib/dts/serverAPI.d.ts` / `clientAPI.d.ts` (and their `updated*` counterparts) provide
Glide API typings used by `tsc`. `tsconfig.json`'s `typescript-strict-plugin` currently
scopes strict checking to
`KLF Todo/src/Server Development/Script Includes`.
