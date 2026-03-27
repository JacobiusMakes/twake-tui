# twake-tui

A split-pane terminal dashboard for [Twake Workplace](https://twake.app) — like htop but for your workspace.

Shows real-time chat messages, inbox, and drive files in a single terminal view.

```
┌─── Chat ──────────────────┬─── Inbox ─────────────────┐
│ #twake-cli-dev            │ ✉ Welcome to Twake        │
│ [10:30] jacob: hello      │ ✉ Security Report         │
│ [10:31] bot: echo hello   │                           │
│                           │                           │
├─── Drive ─────────────────┴───────────────────────────┤
│ 📁 Administrative/  📁 Photos/  📄 test-upload.txt   │
└───────────────────────────────────────────────────────┘
  twake-tui v0.1.0 | Chat: ✓ Mail: ✓ Drive: ✓ | Ctrl+C quit
```

## Features

- **Chat pane** — Real-time messages from all joined Matrix rooms via `/sync` long-polling
- **Inbox pane** — Recent emails fetched via JMAP, polls every 30s
- **Drive pane** — Root directory listing from Cozy, polls every 30s
- **Status bar** — Per-service connection indicators
- **Tab navigation** — Cycle focus between panes with Tab key
- **Zero config** — Reads credentials directly from twake-cli

## Prerequisites

Authenticate with [twake-cli](https://github.com/JacobiusMakes/twake-cli) first:

```bash
npm install -g @linagora/twake-cli
twake auth login          # authenticates all services
twake status              # verify connections
```

## Install & Run

```bash
git clone https://github.com/JacobiusMakes/twake-tui.git
cd twake-tui
npm install
npm start
```

## How It Works

twake-tui reads the twake-cli config file (stored by the `conf` package):

| Platform | Path |
|----------|------|
| macOS    | `~/Library/Preferences/twake-cli-nodejs/config.json` |
| Linux    | `~/.config/twake-cli-nodejs/config.json` |

### API Protocols

| Pane  | Protocol       | Endpoint |
|-------|----------------|----------|
| Chat  | Matrix Client  | `/_matrix/client/v3/sync` (long-poll) |
| Mail  | JMAP (RFC 8621)| `POST /jmap` with `Email/query` |
| Drive | Cozy Files API | `GET /files/{dirId}` |

## Tech Stack

- [ink](https://github.com/vadimdemedes/ink) + React for terminal rendering
- Native `fetch` (Node 18+) for all HTTP requests
- No additional auth — shares twake-cli credentials

## Keyboard Shortcuts

| Key     | Action |
|---------|--------|
| Tab     | Cycle focus between Chat, Inbox, Drive |
| Ctrl+C  | Quit |

## Architecture

```
bin/twake-tui.js          Entry point (ink render)
src/
  app.js                  Main layout (3 panes + status bar)
  config.js               Reads twake-cli config.json
  components/
    ChatPane.js           Matrix messages display
    InboxPane.js          JMAP email list
    DrivePane.js          Cozy file listing
    StatusBar.js          Connection status indicators
  hooks/
    useMatrix.js          Matrix /sync long-poll loop
    useJmap.js            JMAP polling (30s interval)
    useCozy.js            Cozy polling (30s interval)
```

## License

AGPL-3.0 — Same license as Twake.
