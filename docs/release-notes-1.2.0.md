# notion-sync 1.2.0

`@joseftmson/notion-sync@1.2.0` expands the CLI from a daily sync tool into a stronger export and documentation workflow for Codex sessions.

This release adds readable Codex session exports, batch export support, direct Notion delivery, remote API delivery, and a cleaner modular architecture.

## Highlights

- Added `export-codex` for readable Codex session exports
- Added `export-codex-latest` for automatic newest-session export
- Added `--send-to-notion` for export commands
- Added `--send-remote` for export commands
- Added `--output-dir` for cleaner export destinations
- Added `--latest N` for batch export of recent sessions
- Refactored the CLI into dedicated modules

## Example commands

```bash
notion-sync export-codex-latest --output-dir ./exports
notion-sync export-codex-latest --latest 5 --output-dir ./exports
notion-sync export-codex-latest --latest 2 --send-to-notion
notion-sync export-codex-latest --latest 2 --send-remote
```

## Screenshot copy

### Doctor Check

Validates local Notion credentials, encryption, source paths, and remote API readiness before any sync runs.

### Readable Codex Export

Turns raw Codex `jsonl` session files into clean Markdown with preserved timestamps and readable user/assistant chronology.

### Batch Export Workflow

Exports the latest N Codex sessions into a structured output directory for later review, upload, or team documentation.

### Direct Notion Upload

Sends exported Codex sessions straight into Notion as a formatted page without requiring manual copy/paste.

### Remote API Delivery

Routes local exports through the hosted Vercel intake API for centralized documentation pipelines.
