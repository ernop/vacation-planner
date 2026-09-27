# vacation-planner — Project Index for Agents

Start here. This file is both the instructive guide (how to work in this repo)
and the index into all documentation. Every doc in this repo is reachable from
here; when you add a doc, link it here.

## What This Is

A private-use vacation planning web app for Ernest and his wife: a fullscreen
exploration calendar where flexible candidate trips (variable lengths, preferred
seasons) are moved around against both partners' real calendars, whose events
are classified vital vs flexible. HTML/JS frontend, Python backend, served
locally via Caddy on the homepage (meh-tabs). **Public repo; all personal data
stays in gitignored local datafiles.**

Read [docs/requirements.md](docs/requirements.md) before changing behavior —
it is the authoritative statement of intent.

## Documentation Index

| Doc | What it covers |
|---|---|
| [docs/requirements.md](docs/requirements.md) | The app at UX level: purpose, users, candidate trips, vital/flexible events, data ownership, non-goals. **Authoritative.** |
| [docs/calendar-ux.md](docs/calendar-ux.md) | The calendar interaction model in detail: views, layers, drag/length-cycling semantics, keyboard, persistence feel |
| [docs/data-model.md](docs/data-model.md) | Local datafile formats (trips, event classifications, settings), backup and write discipline |
| [docs/architecture.md](docs/architecture.md) | Server/frontend structure, endpoints, port, how to run |
| [docs/integrations.md](docs/integrations.md) | Wiring into the household systems: Caddy + meh-tabs registration, calendar access (his + hers), OpenStreetMap stack, personal spellcheck |

Requirements are documented at the level of user experience and desired
properties. When new requirements arrive: put them in `requirements.md` if
core, or grow the hierarchy under `docs/` for finer detail — and always index
new files in the table above.

## Rules for this repo

- **Public repo discipline:** nothing personal in commits — no calendar IDs,
  emails, event contents, trip data, tokens. `data/`, `config.local.json`,
  and credential files are gitignored; keep it that way. Check what you're
  committing.
- **Datafiles are the source of truth** and must stay hand-editable. The app
  reads external edits; a DB may only cache. Never make the DB master.
- **Never write to the real calendars as a side effect.** Exploration is
  local-only; calendar writes happen only on explicit user action.
- Config goes in gitignored files, not env vars.
- No try/except fallbacks or retry loops — fix the single upstream source.
- Record any local-system change (Caddy config, systemd, ports) in
  `~/proj/mybrowser/` per the standing rule in `~/proj/agents.md`, and mirror
  the app-side facts in [docs/integrations.md](docs/integrations.md).

## Writing conventions for agents

Mirrored from `~/proj/mybrowser/AGENTS.md` (canonical: `mybrowser/.cursor/rules/`):

- Speech acts that manage the agent–user relationship instead of conveying
  task content are banned as a class — praise, validation, verdicts on the
  user's statements, reassurance, servile offers, self-presentation. Never
  open by grading a statement ("You're right"); agreement is a conclusion,
  not an opening. Preserve the epistemic status of the user's words — no
  upgrades or downgrades ("instinct", "hunch").
- Banned words/framings: "wrinkle", "honest(ly)" as framing, "heads-up",
  "lands"/"land" for "is done", "say the word", "walk you through",
  smell/status words ("footgun", "cruft", "hacky", "bloat", "elegant",
  "clean" as praise, "overengineered", "best practice" as authority). State
  concrete pros/cons instead. No decorative metaphors; no empty intensifiers
  ("genuinely", "really", "actually" as filler).
- Present alternatives as terse labeled options, not padded conditional prose.
- Don't over-offer follow-up actions: do the task, report, stop. Do obvious
  housekeeping (doc updates after a change) without asking.
- Check drafts against these rules by reading them; replies are not run
  through a tool.

## Layout

```
server/    Python backend (serves API + static files)
static/    Frontend: HTML/CSS/JS
docs/      Documentation hierarchy (indexed above)
data/      Personal datafiles — gitignored, created on first run
```

## Running

See [docs/architecture.md](docs/architecture.md).
