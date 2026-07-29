# Integrations — Household Systems Wiring

How this app connects to the machine-level and household-standard components.
Facts here were verified against the sibling repos on 2026-07-29; the sibling
repos stay authoritative for their own systems.

## Caddy + homepage (meh-tabs)

The homepage is the meh-tabs Firefox new-tab extension. It auto-lists every
locally served app in its **Local Services** section by fetching
`http://home.localhost/projects.json`, which Caddy serves out of the mybrowser
repo. There is no group literally named "meh-tabs" — registering with Caddy is
what puts the app on the homepage.

- Live Caddyfile: `~/proj/mybrowser/utilities/caddy/linux/Caddyfile`, run by
  the system unit `caddy-proxy.service` (binds :80, loopback only).
- Registration lives in `~/proj/mybrowser/utilities/caddy/projects.json` —
  the single owner of port assignments. This app's entry:
  `{ "name": "vacation-planner", "hostname": "vacation-planner.localhost", "port": 8003 }`.
- Derived files (route blocks in both Caddyfiles + `site/projects.json`) are
  regenerated with `python3 ~/proj/mybrowser/utilities/caddy/generate.py`;
  never hand-edit between the GENERATED ROUTES markers.
- Apply: `sudo systemctl reload caddy-proxy`.
- Per-machine start command: `~/proj/mybrowser/utilities/caddy/machines/PC.json`
  (dashboard Start button).
- Result: `http://vacation-planner.localhost` → `127.0.0.1:8003`.

Any change here is a local-system change: record it in mybrowser (commit) per
the standing rule in `~/proj/agents.md`.

## Calendars (his + hers)

Household standard: **Google Calendar API v3 over OAuth 2.0**, Desktop-app
(installed) flow. Reference implementations:

- Read side (multi-account, official client libs):
  `~/proj/matthoom/core/getters/gcalendar.py` — OAuth with refresh,
  `calendarList.list`, `events.list` with sync tokens, per-account token files
  keyed by an `account_id` string. Docs: `matthoom/docs/getters/GOOGLE-CALENDAR.md`.
- Write side (stdlib REST): `~/proj/mybrowser/calendar/sync_world_cup_to_google_calendar.py`
  — `POST /calendars/{id}/events`, `PUT` on conflict; scope `calendar.events`.

Plan for this app:

- Two accounts, `ernest` and `wife`, each with its own OAuth grant (she
  consents in her own Google login). Tokens in `secrets/<account>_token.json`
  (gitignored). Client id/secret in `config.local.json` (gitignored; config
  in files, not env vars). Scope `calendar.events` (read now, explicit
  publish later).
- Calendar-lane selection (which calendar id is "his lane" / "hers lane")
  stored in `data/settings.json`.
- Reads feed `GET /api/events`; classifications key on
  `<calendarId>/<eventId>` ([data-model.md](data-model.md)).
- Writes happen only via an explicit "publish booked trip" action — never as
  a side effect of exploration (rule in [AGENTS.md](../AGENTS.md)).

Status: no OAuth client or tokens exist yet for this app; needs Ernest to
supply/reuse a Google Cloud OAuth client and both grants to be run once.

## Map (OpenStreetMap)

Household standard, settled in fuseki4_ai after a Leaflet→MapLibre migration:

- **MapLibre GL JS v5.24.0**, vendored (copy from
  `~/proj/fuseki4_ai/static/vendor/maplibre/`), rendering **OpenFreeMap**
  vector styles built from OSM: `https://tiles.openfreemap.org/styles/<name>`,
  default style `liberty`; no API key.
- Canonical wrapper to crib from: `~/proj/fuseki4_ai/static/js/photo-map.js`
  (`baseMap()` factory — nav/scale controls, style switcher, optional
  Terrarium terrain from AWS Open Data, 3D buildings, tile-cache service
  worker). All client-side; the Python server only serves statics.
- This app's use: destination pins for trips, opened from a trip's details.
  Secondary to the calendar.

## Spellcheck (SpellWell)

The personal spellcheck system is **SpellWell**, canonical at
`~/proj/multi-image-client/MultiImageClient/Ui/wwwroot/spellwell/` (the
fuseki4_ai editor has the older prototype it grew from). Client-side only,
offline, no build step: typo-js + Hunspell en_US dictionary, a mirrored
backdrop div behind each textarea (pink = misspelled, blue = unknown-shaped,
yellow = double space), `localFix()` for one-click conservative corrections,
and a per-user custom dictionary in localStorage.

Integration here (required on **all** free-text inputs, per requirements):

- The `spellwell/` folder is copied into `static/spellwell/` (js, css,
  `vendor/typo/` with `typo.min.js` + `en_US.aff` + `en_US.dic`).
- Load order: `typo.min.js`, then `spellwell.js`; then
  `SpellWell.create({ affUrl, dicUrl, customDictStorageKey: "vacation-planner_spellwell" })`
  once, and `sw.attach(el)` on every textarea (call `ctl.refresh()` after
  programmatic value writes).
- Trip jargon (place names recur) goes in `extraWords` and the custom dict.

When SpellWell improves upstream, re-copy the folder; it is versioned by its
source project, not here.
