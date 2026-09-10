# nowcode-starter

## Enable project level errors from eslint

The extension is linting an individual file only on typing. If you want to lint the whole workspace set `eslint.lintTask.enable` to `true` and the extension will contribute the eslint: lint whole folder task. There is no need to define a custom task in tasks.json.

## Enable project level typescript errors

Set `typescript.tsserver.experimental.enableProjectDiagnostics` to true to enable project level errors from typescript

```json
"typescript.tsserver.experimental.enableProjectDiagnostics": true
```
