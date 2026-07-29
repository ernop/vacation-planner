# Calendar UX — Interaction Model

The obscure-details companion to [requirements.md](requirements.md) § "The
calendar is the product". This file specifies how the calendar behaves at the
interaction level so that any implementation session can build or extend it
without re-deriving intent.

## Views

| View | Purpose | Layout |
|---|---|---|
| Year strip (default) | See all candidate trips across 12–18 months; the main exploration surface | Horizontal timeline of months, weeks as minor ticks; trips as horizontal bars |
| Quarter | Working zoom for placing a specific trip | Same timeline, wider spacing, day ticks appear |
| Month grid | Fine placement, checking specific dates | Classic month grid |

Zoom transitions anchor on the cursor/selection: zooming in centers on what you
were pointing at. Mouse wheel (or pinch) zooms; horizontal scroll/drag pans.

## Layers

Rendered bottom to top:

1. Season preference bands — soft background tint showing the selected trip's
   preferred windows (only while a trip is selected/dragged).
2. Calendar events, one lane per source calendar (his / hers), each with its
   own color, toggleable in the sidebar. Vital events get a strong border;
   flexible events render muted.
3. Candidate trips — bars with title, length label, and status styling
   (ideation = dashed/translucent, planned = solid, booked = filled + lock
   icon).
4. Drag feedback — live conflict highlights, snap guides.

## Trip interactions

- **Drag to move.** Grab anywhere on the bar; it follows smoothly (no cell
  snapping while moving; snaps to day on drop). During drag, overlapped vital
  events flash their borders and the bar edge turns red at the overlap; fully
  clear placements show a green underline.
- **Length cycling.** With a trip selected or mid-drag: `Tab` / scroll-click /
  on-bar `⟷` control cycles through the trip's declared allowed lengths; the
  bar animates growth around its anchor (default: start date fixed; hold a
  modifier to fix the end instead).
- **Edge drag** resizes only to allowed lengths — the edge snaps between
  them, never to arbitrary durations (unless the trip declares a free range,
  in which case it snaps to days within the range).
- **Parking lot.** A tray (sidebar section) holds unplaced ideations. Drag
  from tray to calendar to place; drag off the calendar to unplace. Nothing
  is ever deleted by unplacing.
- **Duplicate to compare.** A trip can be duplicated as a "variant" (e.g.
  same trip in June vs September); variants are visually linked and the group
  can be resolved by picking one (others return to the parking lot as
  rejected variants).
- **Undo/redo** across all of the above, unlimited within a session.

## Existing-event interactions

- Click an event → popover: title, source calendar, time, and the vital /
  flexible / unclassified toggle. One click to classify; classification
  persists in local datafiles keyed by event ID.
- Bulk mode: a list view of upcoming events with keyboard-speed classification
  (j/k to move, v/f/u to classify).

## Selection & keyboard

- Click selects; Esc deselects; arrow keys nudge a selected trip by day
  (Shift = week). Del unplaces (never deletes).
- `/` opens quick search over trips and events.
- `?` shows a shortcut overlay.

## Persistence semantics

- Every completed interaction (drop, resize, classify, edit) writes through to
  the datafiles immediately — there is no Save button.
- External edits to the datafiles are detected (mtime/watch) and reload the
  view, preserving selection where possible.
- Concurrent edits from two browsers: last-write-wins per file is acceptable
  for v1 (two users, one household); the server serializes writes. Revisit
  only if it bites.

## Feel

- 60fps drag; all motion eased and short (<150ms); no modal dialogs on the
  main flow (popovers and inline edits only).
- Fullscreen-first layout: the calendar owns the viewport; sidebar (calendars,
  parking lot, tools) collapses to icons.
