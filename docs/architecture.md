# Architecture

## Shape

- **Backend:** Python (stdlib + minimal deps), one process, binds
  `127.0.0.1:8003`. Serves the static frontend and a JSON API over the
  datafiles and calendar sources.
- **Frontend:** static HTML/CSS/JS in `static/` — no build step. The calendar
  is custom-rendered (canvas or absolutely-positioned DOM) because the
  interaction model (smooth drag, length cycling, season bands — see
  [calendar-ux.md](calendar-ux.md)) doesn't fit off-the-shelf calendar
  widgets.
- **Serving:** Caddy reverse-proxies `http://vacation-planner.localhost` →
  `127.0.0.1:8003`; the app auto-appears in the meh-tabs homepage "Local
  Services" section. Registration details: [integrations.md](integrations.md).

## Port

**8003** — assigned in `mybrowser/utilities/caddy/projects.json` (the single
owner of port assignments; check it before ever changing this).

## API sketch

| Endpoint | Purpose |
|---|---|
| `GET /api/trips` / `PUT /api/trips/<id>` / `POST /api/trips` | Trips CRUD, write-through to `data/trips.json` |
| `GET /api/events?from=&to=` | Merged events from both source calendars, annotated with classifications |
| `PUT /api/classifications/<key>` | Set vital/flexible on an event |
| `GET /api/settings` / `PUT /api/settings` | UI settings |
| `GET /api/changes` (SSE) | Push reload signal on external datafile edits |

All writes go through a single serialized writer with atomic replace and
timestamped backups — see [data-model.md](data-model.md).

## Running

```
cd ~/proj/vacation-planner
./venv/bin/python server/app.py     # binds 127.0.0.1:8003
```

First run creates `venv` via `python3 -m venv venv && ./venv/bin/pip install -r requirements.txt`
and empty `data/` skeletons. Start command is also registered in
`mybrowser/utilities/caddy/machines/PC.json` for the dashboard Start button.
