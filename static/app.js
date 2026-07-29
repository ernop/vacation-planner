/* Vacation Planner frontend v1.
   Year-strip calendar; trips from /api/trips, written back on every change.
   Interaction spec: docs/calendar-ux.md. */

const DAY_PX = 6;                       // pixels per day at the default zoom
const MONTHS_SHOWN = 16;
const MS_DAY = 86400000;

let trips = [];
let selected = null;                    // trip id
let spellwell = null;
const spellCtls = [];

const timeline = document.getElementById("timeline");
const calendarEl = document.getElementById("calendar");
const parkingLot = document.getElementById("parking-lot");
const details = document.getElementById("details");
const form = document.getElementById("trip-form");

// Timeline origin: first of last month.
const now = new Date();
const origin = new Date(now.getFullYear(), now.getMonth() - 1, 1);

function dateToX(date) { return Math.round((date - origin) / MS_DAY) * DAY_PX; }
function xToDate(x) { return new Date(origin.getTime() + Math.round(x / DAY_PX) * MS_DAY); }
function iso(date) { return date.toISOString().slice(0, 10); }
function parseISO(s) { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); }

function allowedLengthsDays(trip) {
  const l = trip.lengths || {};
  const unit = l.unit === "week" ? 7 : 1;
  if (l.allowed) return l.allowed.map(n => n * unit);
  if (l.range) {
    const out = [];
    for (let n = l.range[0]; n <= l.range[1]; n++) out.push(n * unit);
    return out;
  }
  return [7];
}

// ---------- rendering ----------

function renderMonths() {
  timeline.querySelectorAll(".month, .today-line").forEach(e => e.remove());
  let cursor = new Date(origin);
  for (let i = 0; i < MONTHS_SHOWN; i++) {
    const next = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    const el = document.createElement("div");
    el.className = "month";
    el.style.left = dateToX(cursor) + "px";
    el.style.width = (dateToX(next) - dateToX(cursor)) + "px";
    el.innerHTML = `<div class="month-label">${cursor.toLocaleString("en", { month: "short" })} ${cursor.getFullYear()}</div>`;
    timeline.appendChild(el);
    cursor = next;
  }
  timeline.style.width = dateToX(cursor) + "px";
  const today = document.createElement("div");
  today.className = "today-line";
  today.style.left = dateToX(new Date(now.getFullYear(), now.getMonth(), now.getDate())) + "px";
  timeline.appendChild(today);
}

function renderSeasonBands(trip) {
  timeline.querySelectorAll(".season-band").forEach(e => e.remove());
  if (!trip || !trip.preferredSeasons) return;
  for (let year = origin.getFullYear(); year <= origin.getFullYear() + 2; year++) {
    for (const win of trip.preferredSeasons) {
      const from = parseISO(`${year}-${win.from.replace(/^--/, "")}`);
      let to = parseISO(`${year}-${win.to.replace(/^--/, "")}`);
      if (to < from) to = new Date(to.getFullYear() + 1, to.getMonth(), to.getDate());
      const band = document.createElement("div");
      band.className = "season-band";
      band.style.left = dateToX(from) + "px";
      band.style.width = Math.max(0, dateToX(to) - dateToX(from)) + "px";
      band.title = win.label || "preferred window";
      timeline.appendChild(band);
    }
  }
}

function renderTrips() {
  timeline.querySelectorAll(".trip-bar").forEach(e => e.remove());
  parkingLot.innerHTML = "";
  let lane = 0;
  for (const trip of trips) {
    if (trip.placement) {
      const el = document.createElement("div");
      el.className = `trip-bar ${trip.status}` + (trip.id === selected ? " selected" : "");
      el.style.left = dateToX(parseISO(trip.placement.start)) + "px";
      el.style.width = trip.placement.lengthDays * DAY_PX + "px";
      el.style.top = 40 + (lane++ % 12) * 40 + "px";
      el.innerHTML = `${trip.title}<span class="len">${trip.placement.lengthDays}d</span>`;
      el.dataset.id = trip.id;
      makeDraggable(el, trip);
      el.addEventListener("click", e => { e.stopPropagation(); select(trip.id); });
      timeline.appendChild(el);
    } else {
      const el = document.createElement("div");
      el.className = `parked-trip ${trip.status}`;
      el.textContent = trip.title;
      el.dataset.id = trip.id;
      el.addEventListener("click", () => select(trip.id));
      makeParkedDraggable(el, trip);
      parkingLot.appendChild(el);
    }
  }
  renderSeasonBands(trips.find(t => t.id === selected));
}

// ---------- drag ----------

function makeDraggable(el, trip) {
  el.addEventListener("pointerdown", down => {
    if (down.button !== 0) return;
    down.preventDefault();
    select(trip.id);
    const startX = down.clientX;
    const origLeft = parseInt(el.style.left);
    let moved = false;
    el.classList.add("dragging");
    el.setPointerCapture(down.pointerId);
    const onMove = mv => {
      const dx = mv.clientX - startX;
      if (Math.abs(dx) > 3) moved = true;
      el.style.left = origLeft + dx + "px";
    };
    const onUp = async () => {
      el.classList.remove("dragging");
      el.removeEventListener("pointermove", onMove);
      if (moved) {
        trip.placement.start = iso(xToDate(parseInt(el.style.left)));
        await saveTrip(trip);
      }
      renderTrips();
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp, { once: true });
  });
}

function makeParkedDraggable(el, trip) {
  el.draggable = true;
  el.addEventListener("dragstart", e => e.dataTransfer.setData("text/trip", trip.id));
}

calendarEl.addEventListener("dragover", e => e.preventDefault());
calendarEl.addEventListener("drop", async e => {
  const id = e.dataTransfer.getData("text/trip");
  const trip = trips.find(t => t.id === id);
  if (!trip) return;
  const x = e.clientX - timeline.getBoundingClientRect().left;
  trip.placement = { start: iso(xToDate(x)), lengthDays: allowedLengthsDays(trip)[0] };
  await saveTrip(trip);
  select(id);
});

// ---------- selection, keyboard ----------

function select(id) {
  selected = id;
  const trip = trips.find(t => t.id === id);
  details.classList.toggle("hidden", !trip);
  if (trip) fillForm(trip);
  renderTrips();
}

document.addEventListener("keydown", async e => {
  if (e.target.matches("input, textarea, select")) return;
  const trip = trips.find(t => t.id === selected);
  if (!trip) return;
  if (e.key === "Escape") { select(null); return; }
  if (!trip.placement) return;
  if (e.key === "Tab") {
    e.preventDefault();
    const lengths = allowedLengthsDays(trip);
    const i = lengths.indexOf(trip.placement.lengthDays);
    trip.placement.lengthDays = lengths[(i + 1) % lengths.length];
    await saveTrip(trip); renderTrips();
  } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
    e.preventDefault();
    const days = (e.shiftKey ? 7 : 1) * (e.key === "ArrowLeft" ? -1 : 1);
    trip.placement.start = iso(new Date(parseISO(trip.placement.start).getTime() + days * MS_DAY));
    await saveTrip(trip); renderTrips();
  } else if (e.key === "Delete") {
    trip.placement = null;
    await saveTrip(trip); renderTrips();
  }
});

document.getElementById("calendar").addEventListener("click", () => select(null));

// ---------- details form ----------

function fillForm(trip) {
  document.getElementById("details-title").textContent = trip.title;
  form.title.value = trip.title;
  form.status.value = trip.status;
  form.destinations.value = (trip.destinations || []).join("\n");
  form.lengths.value = allowedLengthsDays(trip).join(", ");
  form.seasons.value = (trip.preferredSeasons || [])
    .map(w => `${w.from.replace(/^--/, "")} to ${w.to.replace(/^--/, "")}${w.label ? " " + w.label : ""}`)
    .join("\n");
  form.notes.value = trip.notes || "";
  spellCtls.forEach(c => c.refresh());
}

form.addEventListener("submit", async e => {
  e.preventDefault();
  const trip = trips.find(t => t.id === selected);
  if (!trip) return;
  trip.title = form.title.value;
  trip.status = form.status.value;
  trip.destinations = form.destinations.value.split("\n").map(s => s.trim()).filter(Boolean);
  trip.lengths = { unit: "day", allowed: form.lengths.value.split(",").map(s => parseInt(s.trim())).filter(n => n > 0) };
  trip.preferredSeasons = form.seasons.value.split("\n").map(s => s.trim()).filter(Boolean).map(line => {
    const m = line.match(/^(\d\d-\d\d)\s+to\s+(\d\d-\d\d)\s*(.*)$/);
    return m ? { from: `--${m[1]}`, to: `--${m[2]}`, label: m[3] || undefined } : null;
  }).filter(Boolean);
  trip.notes = form.notes.value;
  await saveTrip(trip);
  renderTrips();
});

document.getElementById("unplace-trip").addEventListener("click", async () => {
  const trip = trips.find(t => t.id === selected);
  if (!trip) return;
  trip.placement = null;
  await saveTrip(trip); renderTrips();
});

document.getElementById("delete-trip").addEventListener("click", async () => {
  const trip = trips.find(t => t.id === selected);
  if (!trip || !confirm(`Delete "${trip.title}" entirely? (Unplace just removes it from the calendar.)`)) return;
  await fetch(`/api/trips/${trip.id}`, { method: "DELETE" });
  trips = trips.filter(t => t.id !== trip.id);
  select(null);
});

document.getElementById("new-trip").addEventListener("click", async () => {
  const title = prompt("Trip title?");
  if (!title) return;
  const trip = {
    id: title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Date.now().toString(36),
    title, status: "ideation", destinations: [], participants: ["ernest", "wife"],
    lengths: { unit: "week", allowed: [1, 2] }, preferredSeasons: [],
    placement: null, anchor: "start", variantOf: null, notes: "", links: [], budget: null,
  };
  const r = await fetch("/api/trips", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(trip) });
  if (r.ok) { trips.push(trip); select(trip.id); }
});

// ---------- persistence ----------

async function saveTrip(trip) {
  await fetch(`/api/trips/${trip.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(trip) });
}

async function load() {
  trips = await (await fetch("/api/trips")).json();
  renderMonths();
  renderTrips();
}

new EventSource("/api/changes").addEventListener("message", load);

// ---------- spellcheck (SpellWell — household standard, see docs/integrations.md) ----------

async function initSpellwell() {
  spellwell = await SpellWell.create({
    affUrl: "/static/spellwell/vendor/typo/en_US.aff",
    dicUrl: "/static/spellwell/vendor/typo/en_US.dic",
    customDictStorageKey: "vacation-planner_spellwell",
  });
  document.querySelectorAll("#trip-form textarea").forEach(t => spellCtls.push(spellwell.attach(t)));
}

load();
initSpellwell();
