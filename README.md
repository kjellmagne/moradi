# Moradi

Moradi is an office chore follow-up app with an admin planning interface and dedicated employee views for iPad and mobile.

## What it does

- plans recurring chores (every `N` days or selected weekdays)
- assigns one responsible person per week
- supports per-day/per-instance overrides (rename, description, deadline, assignee, disable)
- tracks daily completion with `completed_by` and timestamp
- sends deadline-missed alerts and weekly owner reminders
- shows performance statistics and leaderboard data
- supports Norwegian and English UI language

## Views and routes

Administration (desktop/browser):

- `/admin/overview`
- `/admin/stats`
- `/admin/team`
- `/admin/chores`
- `/admin/schedule`
- `/admin/board`

Employee views:

- `/employee/mobile` (day-based checkoff + upcoming weeks tab)
- `/employee/ipad` (week board, Monday-Friday)

Convenience redirects:

- `/` -> `/admin/overview`
- `/admin` -> `/admin/overview`
- `/dashboard` -> `/admin/overview`
- `/ipad` -> `/employee/ipad`
- `/mobile` -> `/employee/mobile`

## Tech stack

Backend:

- Node.js + Express
- SQLite (`better-sqlite3`)
- `node-cron` for scheduled jobs
- `nodemailer` for email notifications

Frontend:

- React + Vite (in `web/`)
- Tailwind CSS
- Radix primitives (`@radix-ui/react-dialog`, `@radix-ui/react-tabs`)
- Lucide icons

## Project structure

- `src/server.js`: HTTP server + API routes + SPA route handling
- `src/db.js`: schema, queries, scheduling logic, stats logic
- `src/scheduler.js`: cron jobs + notification dispatching
- `web/`: React application source
- `public/app/`: built frontend assets served by Express
- `data/chores.db`: SQLite database

## Run locally

Install dependencies:

```bash
npm install
```

Run backend (port `3000`):

```bash
npm run dev
```

Run frontend dev server (optional, separate terminal):

```bash
npm run dev:web
```

Production-style run (build frontend first, then start server):

```bash
npm start
```

## Scheduling logic

For a selected date, chores are included when:

- `weekday_mask` is set and date weekday matches, or
- no `weekday_mask` and `(date - start_date) % interval_days === 0`

Assignment precedence:

1. instance override person
2. week owner for that week
3. unassigned

No fallback assignment beyond that precedence is used.

## Alerts and reminders

Deadline alerts:

- scheduler runs every minute
- creates alert only if chore is overdue and alerting is enabled
- deduplicated by `(chore_id, work_date, alert_type)`

Weekly owner reminders:

- scheduler runs Monday at `08:00`
- sends reminder to assigned week owner for current week
- deduplicated by week in `weekly_owner_notifications`

Delivery channels (if configured):

- webhook
- SMS gateway
- SMTP email (authenticated or relay/no-auth)
- fallback to server log when no channel is available

SMS gateway format used by Moradi:

- HTTP `GET` to `sms_gateway_url`
- query params: `username`, `password`, `to`, `message`, `message-type`
- default `message-type` is `sms.automatic`

In Admin settings you can send test email and test SMS with current (unsaved) configuration.

## Core data tables

- `people`
- `chores`
- `week_owners`
- `chore_instance_overrides`
- `completions`
- `alerts`
- `app_settings`
- `weekly_owner_notifications`

## Useful scripts

From repository root:

- `npm run check` - Node syntax checks for backend files
- `npm run build:web` - build frontend into `public/app`
- `npm start` - build frontend and run server

## Docker

Build image:

```bash
docker build -t moradi:latest .
```

Run container:

```bash
docker run --name moradi -p 3000:3000 -v /opt/apps/moradi/data:/app/data moradi:latest
```

`/app/data` contains `chores.db`. Mounting this path keeps data persistent across restarts/redeploys.

Run with Compose (persistent host path `/opt/apps/moradi/data`):

```bash
docker compose up -d
```

Optional host bind mount (data visible on host filesystem):

```bash
docker run --name moradi -p 3000:3000 -v "$(pwd)/data:/app/data" moradi:latest
```
