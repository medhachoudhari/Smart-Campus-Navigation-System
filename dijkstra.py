"""
Dijkstra's Algorithm Module for CampusSense AI
Implements shortest-path navigation for the BIET campus graph.

Time Complexity:  O((V + E) log V)
Space Complexity: O(V)
"""

import heapq

# Average walking speed in meters per second
WALKING_SPEED = 1.4  # ~5 km/h


def dijkstra(graph, start, goal, accessible_only=False):
    """
    Find the shortest path between two campus locations using Dijkstra's algorithm.

    Args:
        graph (dict): Adjacency list — {node_id: [{to, weight, accessible}, ...]}
        start (str): Source location ID
        goal (str): Destination location ID
        accessible_only (bool): If True, only traverse wheelchair-accessible edges

    Returns:
        dict: {
            path: list of node IDs from start to goal,
            distance: total distance in meters,
            walking_time: estimated walking time in minutes,
            nodes: number of nodes traversed
        }
    """
    if start not in graph or goal not in graph:
        return {"path": [], "distance": 0, "walking_time": 0, "nodes": 0}

    if start == goal:
        return {"path": [start], "distance": 0, "walking_time": 0, "nodes": 1}

    # Initialize distances to infinity
    dist = {node: float("inf") for node in graph}
    dist[start] = 0
    prev = {}
    visited = set()

    # Min-heap: (distance, node_id)
    heap = [(0, start)]

    while heap:
        d, u = heapq.heappop(heap)

        if u in visited:
            continue
        visited.add(u)

        # Early exit when goal is reached
        if u == goal:
            break

        for edge in graph.get(u, []):
            # Skip inaccessible edges in wheelchair mode
            if accessible_only and not edge.get("accessible", True):
                continue

            v = edge["to"]
            weight = edge["weight"]
            alt = d + weight

            if alt < dist.get(v, float("inf")):
                dist[v] = alt
                prev[v] = u
                heapq.heappush(heap, (alt, v))

    # No path found
    if dist.get(goal, float("inf")) == float("inf"):
        return {"path": [], "distance": 0, "walking_time": 0, "nodes": 0}

    # Reconstruct path
    path = []
    current = goal
    while current is not None:
        path.append(current)
        if current == start:
            break
        current = prev.get(current)

    path.reverse()

    total_distance = dist[goal]
    walking_time = round(total_distance / WALKING_SPEED / 60, 1)  # minutes

    return {
        "path": path,
        "distance": round(total_distance),
        "walking_time": walking_time,
        "nodes": len(path),
    }
