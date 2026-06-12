"""
CampusSense AI — Smart Campus Navigation System for BIET
Main Flask Application

Serves HTML templates and provides REST API endpoints for:
  - Campus locations and route data
  - Dijkstra shortest-path navigation
  - AI-powered campus assistant (Hugging Face)
"""

import os
from flask import Flask, jsonify, request, render_template
from flask_cors import CORS

try:
    from dotenv import load_dotenv
    load_dotenv(override=True)
except ImportError:
    pass

from dijkstra import dijkstra
from database import get_locations, get_routes, build_graph, save_route_history, get_route_history, get_analytics
from ai_assistant import get_ai_response

# ---------------------------------------------------------------------------
# Flask application setup
# ---------------------------------------------------------------------------

app = Flask(
    __name__,
    static_folder="static",
    template_folder="templates",
)
CORS(app)


# ---------------------------------------------------------------------------
# Page routes — render HTML templates
# ---------------------------------------------------------------------------

@app.route("/")
def index():
    """Home page with hero section and features."""
    return render_template("index.html")


@app.route("/campus-map")
def campus_map():
    """Interactive campus map with route finder."""
    return render_template("campus_map.html")


@app.route("/about")
def about():
    """About the project — methodology and complexity analysis."""
    return render_template("about.html")


@app.route("/assistant")
def assistant():
    """AI and voice assistant page."""
    return render_template("assistant.html")


# ---------------------------------------------------------------------------
# API endpoints
# ---------------------------------------------------------------------------

@app.route("/api/locations", methods=["GET"])
def api_locations():
    """Return all campus locations from Supabase."""
    locations = get_locations()
    return jsonify(locations)


@app.route("/api/routes", methods=["GET"])
def api_routes():
    """Return all route connections between locations."""
    routes = get_routes()
    return jsonify(routes)


@app.route("/api/history", methods=["GET"])
def api_history():
    """Return recent route search history."""
    history = get_route_history()
    return jsonify(history)

@app.route("/api/analytics", methods=["GET"])
def api_analytics():
    """Return route search analytics."""
    analytics = get_analytics()
    return jsonify(analytics)


@app.route("/api/find-route", methods=["POST"])
def api_find_route():
    """
    Find the shortest route between two campus locations.
    """
    data = request.get_json() or {}
    source = data.get("source")
    destination = data.get("destination")
    mode = data.get("mode", "walking")

    if not source or not destination:
        return jsonify({"error": "source and destination are required"}), 400

    # Dynamically build graph from Supabase for every request
    graph = build_graph()
    accessible_only = mode == "accessible"
    result = dijkstra(graph, source, destination, accessible_only=accessible_only)

    if not result["path"]:
        return jsonify({"error": "No path found between the specified locations"}), 404

    # Log to Supabase history
    save_route_history(
        source=source,
        destination=destination,
        calculated_path=result["path"],
        distance=result["distance"],
        walking_time=result.get("walking_time")
    )

    return jsonify(result)


@app.route("/api/chat", methods=["POST"])
def api_chat():
    """
    AI campus assistant endpoint.

    Request JSON:
        { "message": "Where is the CSE Department?" }

    Response JSON:
        { "reply": "The CSE Department is located near the Central Library..." }
    """
    data = request.get_json() or {}
    message = data.get("message", "").strip()

    if not message:
        return jsonify({"error": "message is required"}), 400

    reply = get_ai_response(message)
    return jsonify({"reply": reply})


# ---------------------------------------------------------------------------
# Run the application
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    print(f"\n  [CampusSense AI] Smart Campus Navigation System")
    print(f"  [*] Running on http://localhost:{port}")
    print(f"  [*] Debug mode enabled\n")
    app.run(host="0.0.0.0", port=port, debug=True)
