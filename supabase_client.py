"""
Supabase Client Module
Handles connection initialization and credential loading from .env
"""

import os
from supabase import create_client, Client

_supabase_client = None

def get_supabase_client() -> Client:
    """
    Initialize and return the Supabase client.
    Returns None if credentials are not configured or connection fails.
    """
    global _supabase_client

    if _supabase_client is not None:
        return _supabase_client

    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_ANON_KEY")

    if not url or not key or url == "your_supabase_url":
        print("[Supabase] Credentials not found in .env - falling back to local data")
        return None

    try:
        _supabase_client = create_client(url, key)
        return _supabase_client
    except Exception as e:
        print(f"[Supabase] Connection failed: {e} - falling back to local data")
        return None
