# notion-sync

CLI that collects daily Codex sessions and terminal logs, masks common secrets, stores sync state encrypted, and uploads a daily report to a Notion database.

## Install

```bash
npm install -g @joseftmson/notion-sync
```

## Setup

1. Copy `.env.example` to `.env`.
2. Fill in your Notion token, database ID, and encryption key.
3. Run:

```bash
notion-sync dry-run
notion-sync run
```

Default input paths:

- Codex sessions: `~/.codex/sessions`
- Terminal logs: `~/terminal-logs`
- Shell history: auto-detected from the current shell

Override them with:

- `CODEX_SESSIONS_DIR`
- `TERMINAL_LOG_DIR`
- `SHELL_HISTORY_FILE`
- `NOTION_SYNC_STATE_FILE`
- `NOTION_SYNC_API_URL`
- `NOTION_SYNC_USER_LABEL`
- `NOTION_SYNC_SOURCE`

## Scheduling

Example cron entry:

```cron
55 23 * * * /usr/bin/env notion-sync run >> "$HOME/.local/state/notion-sync/upload.log" 2>&1
```

## Security model

- Local sync state is encrypted with AES-256-GCM using `ENCRYPTION_KEY`.
- Uploads to Notion use HTTPS/TLS.
- Common secrets are masked before upload.
- Raw source logs are never modified.

## Commands

```bash
notion-sync init
notion-sync doctor
notion-sync help
notion-sync status
notion-sync report
notion-sync open
notion-sync dry-run
notion-sync run
notion-sync remote
```

## Remote upload mode

If you want users to send their local logs into your hosted Vercel app instead of writing directly to Notion from the CLI:

```bash
export NOTION_SYNC_API_URL="https://your-app.vercel.app/api/sync"
export NOTION_SYNC_USER_LABEL="alice"
notion-sync remote
```

This sends the current collected report to the remote API. The Vercel app can then create the Notion page centrally.
