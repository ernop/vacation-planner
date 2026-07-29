"""Vacation Planner backend.

Serves the static frontend and a JSON API over the local datafiles.
Datafiles under data/ are the source of truth (hand-editable, gitignored);
every write goes through the serialized writer in datastore.py.
"""

import json
from pathlib import Path

from flask import Flask, Response, jsonify, request, send_from_directory

from datastore import DataStore

ROOT = Path(__file__).resolve().parent.parent
STATIC = ROOT / "static"

app = Flask(__name__, static_folder=None)
store = DataStore(ROOT / "data")


@app.get("/")
def index():
    return send_from_directory(STATIC, "index.html")


@app.get("/static/<path:name>")
def static_files(name):
    return send_from_directory(STATIC, name)


@app.get("/api/trips")
def list_trips():
    return jsonify(store.read("trips"))


@app.post("/api/trips")
def create_trip():
    trip = request.get_json(force=True)
    trips = store.read("trips")
    if any(t["id"] == trip["id"] for t in trips):
        return jsonify({"error": f"trip id {trip['id']!r} already exists"}), 409
    trips.append(trip)
    store.write("trips", trips)
    return jsonify(trip), 201


@app.put("/api/trips/<trip_id>")
def update_trip(trip_id):
    trip = request.get_json(force=True)
    trips = store.read("trips")
    for i, t in enumerate(trips):
        if t["id"] == trip_id:
            trips[i] = trip
            store.write("trips", trips)
            return jsonify(trip)
    return jsonify({"error": f"no trip {trip_id!r}"}), 404


@app.delete("/api/trips/<trip_id>")
def delete_trip(trip_id):
    trips = store.read("trips")
    remaining = [t for t in trips if t["id"] != trip_id]
    if len(remaining) == len(trips):
        return jsonify({"error": f"no trip {trip_id!r}"}), 404
    store.write("trips", remaining)
    return "", 204


@app.get("/api/classifications")
def list_classifications():
    return jsonify(store.read("event-classifications"))


@app.put("/api/classifications/<path:key>")
def set_classification(key):
    body = request.get_json(force=True)
    cls = store.read("event-classifications")
    if body is None or body.get("classification") is None:
        cls.pop(key, None)
    else:
        cls[key] = body
    store.write("event-classifications", cls)
    return jsonify({key: cls.get(key)})


@app.get("/api/settings")
def get_settings():
    return jsonify(store.read("settings"))


@app.put("/api/settings")
def put_settings():
    settings = request.get_json(force=True)
    store.write("settings", settings)
    return jsonify(settings)


@app.get("/api/events")
def list_events():
    # Calendar integration pending — see docs/integrations.md.
    return jsonify([])


@app.get("/api/changes")
def changes():
    def stream():
        for mtimes in store.watch():
            yield f"data: {json.dumps(mtimes)}\n\n"
    return Response(stream(), mimetype="text/event-stream")


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=8003)
