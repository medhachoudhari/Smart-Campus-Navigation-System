"""
Database Module for CampusSense AI
Provides campus location and route data strictly from Supabase.
"""

import json
from supabase_client import get_supabase_client

# ---------------------------------------------------------------------------
# Data access functions
# ---------------------------------------------------------------------------

def get_locations():
    """Fetch all campus locations from Supabase."""
    client = get_supabase_client()
    if client:
        try:
            response = client.table("locations").select("*").execute()
            if response.data:
                return response.data
        except Exception as e:
            print(f"[CampusSense] Failed to fetch locations from Supabase: {e}")

    return []

def get_routes():
    """Fetch all route connections from Supabase."""
    client = get_supabase_client()
    if client:
        try:
            response = client.table("routes").select("*").execute()
            if response.data:
                return response.data
        except Exception as e:
            print(f"[CampusSense] Failed to fetch routes from Supabase: {e}")

    return []

def save_route_history(source, destination, calculated_path, distance, walking_time=None):
    """Save a successfully calculated route to Supabase history table."""
    client = get_supabase_client()
    if client:
        try:
            # Ensure path is stored as a list (JSONB)
            path_data = calculated_path if isinstance(calculated_path, list) else list(calculated_path)
            
            data = {
                "source": source,
                "destination": destination,
                "calculated_path": path_data,
                "distance": distance,
                "walking_time": float(walking_time) if walking_time else None
            }
            client.table("route_history").insert(data).execute()
        except Exception as e:
            print(f"[CampusSense] Failed to save route history: {e}")
            # Do not fail the request if history logging fails
    
    return True

def get_route_history(limit=50):
    """Fetch recent route searches from Supabase."""
    client = get_supabase_client()
    if client:
        try:
            response = client.table("route_history").select("*").order("timestamp", desc=True).limit(limit).execute()
            return response.data
        except Exception as e:
            print(f"[CampusSense] Failed to fetch route history: {e}")
    
    return []

def get_analytics():
    """Fetch analytics on route searches."""
    client = get_supabase_client()
    if not client:
        return {"total_searches": 0, "popular_destinations": [], "recent_searches": []}

    try:
        # Get total count (by fetching all and counting, since simple count API might be restricted based on client)
        # Or better, just select destination to count popular
        response = client.table("route_history").select("destination").execute()
        data = response.data or []
        total_searches = len(data)
        
        # Calculate popular destinations
        dest_counts = {}
        for row in data:
            dst = row.get("destination")
            dest_counts[dst] = dest_counts.get(dst, 0) + 1
            
        popular = [{"destination": k, "count": v} for k, v in sorted(dest_counts.items(), key=lambda item: item[1], reverse=True)[:5]]
        
        # Get recent 5
        recent_res = client.table("route_history").select("source, destination, timestamp").order("timestamp", desc=True).limit(5).execute()
        recent = recent_res.data or []
        
        return {
            "total_searches": total_searches,
            "popular_destinations": popular,
            "recent_searches": recent
        }
    except Exception as e:
        print(f"[CampusSense] Failed to fetch analytics: {e}")
        return {"total_searches": 0, "popular_destinations": [], "recent_searches": []}

def build_graph(routes=None):
    """
    Convert route connections into a bidirectional adjacency list for Dijkstra.

    Returns:
        dict: {node_id: [{to, weight, accessible}, ...]}
    """
    if routes is None:
        routes = get_routes()

    graph = {}

    # Collect all node IDs
    for route in routes:
        src = route["source"]
        dst = route["destination"]
        if src not in graph:
            graph[src] = []
        if dst not in graph:
            graph[dst] = []

    # Add bidirectional edges
    for route in routes:
        src = route["source"]
        dst = route["destination"]
        dist = route["distance"]
        accessible = route.get("wheelchair_accessible", True)

        graph[src].append({"to": dst, "weight": dist, "accessible": accessible})
        graph[dst].append({"to": src, "weight": dist, "accessible": accessible})

    return graph
