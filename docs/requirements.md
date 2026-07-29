# Vacation Planner — Requirements

The authoritative statement of what this app is and how it should feel to use.
Written at the level of user experience and desired properties; implementation
details live in [architecture.md](architecture.md) and [integrations.md](integrations.md).

## Purpose

A private planning tool for Ernest and his wife to explore vacation options
together: move candidate trips around a shared calendar, test scenarios against
real commitments, and converge on plans. No ads, no discovery/recommendation
features — the users already know where they want to go. The tool's job is
scheduling, comparison, and shared exploration.

## Users

Two: Ernest and his wife, usually sitting together (one screen) or each on their
own machine on the home network. No accounts, no auth beyond being on the local
network / homepage. Nothing here is multi-tenant.

## Core object: the candidate trip

The central novel idea. A candidate trip is not a fixed calendar event — it is a
*flexible* object with degrees of freedom that the calendar UI lets you explore:

- **Flexible length.** A trip declares the durations that make sense for it,
  e.g. "1, 2, or 3 weeks", or "4–6 days", or "exactly 10 days". Switching a
  placed trip between its allowed lengths is a first-class, instant interaction
  — not an edit dialog.
- **Preferred seasons / times of year.** A trip can declare when it wants to
  happen ("Sep–Oct", "winter", "cherry blossom window", "school holidays").
  The calendar shows visually whether a placement is inside, near, or outside
  the preferred window.
- **Lifecycle status.** Ideation → planned → booked (and: rejected/parked).
  Ideations are cheap and plentiful; the UI must make it effortless to keep
  many of them around without clutter.
- Ordinary fields: title, destination(s), notes, participants, rough budget,
  links.

## Existing calendar events: vital vs. movable

The app reads both personal calendars (see [integrations.md](integrations.md)).
For each existing event the users can classify it:

- **Vital** — cannot be missed; trips must not overlap it.
- **Flexible** — fine to skip or move; overlapping it is allowed and shown
  gently, not as an error.
- Unclassified events sit in between: visible, warn on overlap, but don't block.

Classifications are the users' judgments and are stored in the local datafiles,
never written back to the source calendars.

## The calendar is the product

The main screen is a fullscreen calendar built for exploration, not for
appointment-keeping. Desired properties:

- **Smooth repositioning.** Drag a candidate trip along the timeline and it
  slides fluidly; conflicts with vital events highlight live as you drag.
  Dropping it saves immediately to the local datafiles.
- **Length play.** With a trip selected (or while dragging), flip through its
  allowed lengths and watch it grow/shrink in place.
- **Season awareness.** Preferred windows render as background tinting or
  bands, so "this trip wants to be in autumn" is visible at a glance while
  you drag it around.
- **Multiple zoom levels.** Year-at-a-glance (the primary planning view: see
  all candidate trips across 12–18 months), quarter, month. Zooming keeps
  context — you zoom into the thing you were looking at.
- **Scenario feel.** It must be cheap to try things: move a trip, look, move
  it back. Every change is undoable. Nothing you do in exploration touches
  the real calendars.
- **Two-calendar overlay.** Both personal calendars visible, visually
  distinct, individually toggleable.
- Various tools and interaction modes are expected to accrete here over time;
  the layout should reserve room for a toolbar/sidebar without redesign.

Details of interactions, keyboard model, and visual language:
[calendar-ux.md](calendar-ux.md).

## Data ownership

- All planning data (trips, classifications, settings) lives in **local
  datafiles** under `data/`, which is gitignored — the repo is public, the
  data is private. Format: see [data-model.md](data-model.md).
- The datafiles are the source of truth and must remain hand-editable: the
  users may add/update/modify them directly in a text editor, and the app
  picks up external edits. Every change made in the UI is written back to the
  same files. A local DB is acceptable only as a cache/index, never as the
  master copy.
- Source calendars are read; the app writes to them only as an explicit,
  deliberate action (e.g. "publish this booked trip"), never as a side effect
  of exploration.

## Mapping

An OpenStreetMap-based map view for trips (destinations as pins, possibly
routes). Secondary to the calendar; uses the household-standard map stack —
see [integrations.md](integrations.md).

## Text input

Every free-text input in the app runs the personal spellcheck system (shared
household component) — see [integrations.md](integrations.md).

## Distribution & serving

- Public GitHub repo; code only, no data.
- Served locally: static HTML frontend + Python backend, registered in the
  machine's Caddy so it appears on the homepage under meh-tabs.
  Wiring: [integrations.md](integrations.md).

## Non-goals

- No ads, no destination discovery/recommendations, no social features.
- No accounts/auth/multi-tenancy.
- No mobile-first design (desktop fullscreen is the target; usable on a
  laptop screen).
- Not a general calendar client — it never aims to replace the real
  calendars.
