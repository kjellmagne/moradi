# Office Chores Planner

A full-stack starter app for office departments that need:

- recurring chores (daily, every N days, weekly, etc.)
- optional specific-weekday chores (Mon/Tue/etc.)
- full-week ownership (one person owns all chores for a selected week)
- weekly responsibility plans per chore
- day-level override assignments
- deadline-based overdue alerts
- check-off workflows on admin, iPad, and mobile views

## Views

- `/admin/overview`: administration/planning overview (PC/browser)
- `/admin/schedule`: week ownership + weekly instance plan
- `/admin/team`: team member management
- `/admin/chores`: chore management (including alert settings per chore)
- `/admin/overrides`: day-level assignment overrides
- `/admin/board`: daily completion board
- `/employee/ipad`: employee iPad day view (previous/next day navigation + checkoff)
- `/employee/mobile`: employee mobile day view (previous/next day navigation + checkoff)
- `/admin`: redirects to `/admin/overview`
- `/dashboard`: redirects to `/admin/overview`
- `/`: redirects to `/admin/overview`

UI data refreshes automatically in the background; manual refresh buttons are intentionally minimized.

## Tech Stack

- Node.js + Express
- SQLite (`better-sqlite3`)
- `node-cron` for periodic overdue alert scanning
- Static HTML/CSS/JS frontend

## Run locally

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Data model (core)

- `people`
- `chores` with `interval_days`, `start_date`, optional `due_time`, optional `weekday_mask`
- `week_owners` per week (Monday start) to assign one person to all chores
- `day_overrides` for one-off date changes
- `chore_instance_overrides` for one-day per-instance edits/disable
- `completions` per chore/date
- `alerts` for missed deadlines (`deadline_missed`)
- `app_settings` for language and notification transport settings
- `weekly_owner_notifications` to dedupe Monday 08:00 reminders

## Alert behavior

A scheduler runs every minute and creates an alert when:

- a chore has a deadline (`due_time`)
- current time is past deadline
- the chore is still not completed
- global deadline alerts are enabled in app settings

Alerts are deduplicated per `chore + date + alert_type`.

Weekly owner reminder:

- when enabled in settings, a reminder is sent at 08:00 every Monday
- reminder goes to the person assigned as week owner for that week
- reminders are deduplicated per week

Assignment precedence in daily plans:

1. `chore_instance_overrides` (person override)
2. `day_overrides`
3. `week_owners`
4. unassigned (no fallback assignment)

Per-chore alerts:

- each chore has an `alert_enabled` setting controlled in chore create/edit
- missed-deadline alerts are only generated when `alert_enabled = 1`

App settings (via left sidebar cog in admin UI):

- notification language: English or Norwegian
- global switches for deadline alerts and weekly owner reminders
- webhook URL
- SMS gateway URL
- SMTP host/port/account/password/from for email notifications

Team member deletion behavior:

- if a person has historical records (completions, alerts, or past ownership/override records), delete will disable and hide the person instead of removing history
- disabled people are removed from active planning selections

Set `ALERT_WEBHOOK_URL` to forward each new alert to an external messaging workflow (Slack, Teams, SMS gateway, etc.). Without a webhook, alerts are logged in server output and shown in the UI.

## Notes

- Database file is `data/chores.db` and is ignored in git.
- First run seeds sample people, chores, and week owners.
