import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv(override=True)
url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_ANON_KEY")
client = create_client(url, key)

new_locations = [
    {
        "id": "mechanical_dept",
        "name": "Mechanical Department",
        "type": "department",
        "description": "Mechanical Engineering",
        "x": 400,
        "y": 500
    },
    {
        "id": "civil_dept",
        "name": "Civil Department",
        "type": "department",
        "description": "Civil Engineering",
        "x": 300,
        "y": 450
    },
    {
        "id": "mba_dept",
        "name": "MBA Department",
        "type": "department",
        "description": "Master of Business Administration",
        "x": 200,
        "y": 350
    },
    {
        "id": "mca_dept",
        "name": "MCA Department",
        "type": "department",
        "description": "Master of Computer Applications",
        "x": 350,
        "y": 300
    }
]

new_routes = [
    {"source": "mechanical_dept", "destination": "canteen", "distance": 80, "wheelchair_accessible": True},
    {"source": "mechanical_dept", "destination": "civil_dept", "distance": 100, "wheelchair_accessible": True},
    {"source": "civil_dept", "destination": "ece_dept", "distance": 150, "wheelchair_accessible": True},
    {"source": "mba_dept", "destination": "mca_dept", "distance": 60, "wheelchair_accessible": True},
    {"source": "mca_dept", "destination": "central_library", "distance": 110, "wheelchair_accessible": True},
    {"source": "mba_dept", "destination": "admin_block", "distance": 130, "wheelchair_accessible": True}
]

print("Inserting locations...")
try:
    for loc in new_locations:
        client.table("locations").upsert(loc).execute()
    print("Locations inserted.")
except Exception as e:
    print(f"Error inserting locations: {e}")

print("Inserting routes...")
try:
    for route in new_routes:
        client.table("routes").insert(route).execute()
        
        # Add reverse route since the graph expects undirected edges (or one way edges explicitly)
        rev_route = route.copy()
        rev_route["source"] = route["destination"]
        rev_route["destination"] = route["source"]
        client.table("routes").insert(rev_route).execute()
    print("Routes inserted.")
except Exception as e:
    print(f"Error inserting routes: {e}")
