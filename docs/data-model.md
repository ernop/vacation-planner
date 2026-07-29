# Data Model — Local Datafiles

All planning data lives in `data/` (gitignored; the repo is public). Files are
the source of truth, hand-editable, and written back by the app. Format is JSON
with stable, human-readable keys. A local DB may cache/index but never masters.

## Files

| File | Contents |
|---|---|
| `data/trips.json` | All candidate trips (ideation/planned/booked/rejected), placed or parked |
| `data/event-classifications.json` | vital/flexible judgments about existing calendar events, keyed by event ID |
| `data/settings.json` | UI state worth persisting: calendar toggles, default view, colors |

The app creates missing files on first run with empty skeletons. On every
write the previous version is copied to `data/backups/<file>.<timestamp>.json`
(pruned to a sane count) so hand edits and app edits are both recoverable.

## Trip schema

```json
{
  "id": "kyoto-2027",
  "title": "Kyoto",
  "status": "ideation",            // ideation | planned | booked | rejected
  "destinations": ["Kyoto, Japan"],
  "participants": ["ernest", "wife"],
  "lengths": { "unit": "week", "allowed": [1, 2, 3] },
  //   or: { "unit": "day", "range": [4, 6] }
  //   or: { "unit": "day", "allowed": [10] }
  "preferredSeasons": [ { "from": "--03-20", "to": "--04-15", "label": "cherry blossom" } ],
  //   month-day windows (RFC 3339 --MM-DD), year-agnostic; multiple allowed
  "placement": { "start": "2027-03-25", "lengthDays": 14 },  // null when parked
  "anchor": "start",               // which edge stays fixed when length changes
  "variantOf": null,               // trip id when this is a comparison variant
  "notes": "…",
  "links": ["https://…"],
  "budget": null
}
```

## Event-classification schema

```json
{
  "<calendarId>/<eventId>": {
    "classification": "vital",     // vital | flexible
    "note": "optional why",
    "classifiedAt": "2026-07-29"
  }
}
```

Unlisted events are "unclassified". Classifications never propagate to the
source calendars.

## Write discipline

- Server serializes all writes (single writer queue); atomic replace
  (write temp file + rename).
- The server watches `data/` for external modifications and pushes a reload
  signal to connected clients.
