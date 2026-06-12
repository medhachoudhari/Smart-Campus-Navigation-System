-- CampusSense AI - Supabase Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table (Optional, for future auth)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Locations Table
CREATE TABLE IF NOT EXISTS locations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    x INTEGER NOT NULL DEFAULT 0,
    y INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Routes Table (Graph Edges)
CREATE TABLE IF NOT EXISTS routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source TEXT NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    destination TEXT NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    distance INTEGER NOT NULL CHECK (distance > 0),
    wheelchair_accessible BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Prevent duplicate bidirectional edges from being added incorrectly, though we handle bidirectional in app logic
    UNIQUE(source, destination)
);

-- 4. Route History Table
CREATE TABLE IF NOT EXISTS route_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    source TEXT NOT NULL,
    destination TEXT NOT NULL,
    calculated_path JSONB NOT NULL,
    distance INTEGER NOT NULL,
    walking_time NUMERIC,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Setup Row Level Security (RLS)
-- Allow public read access to locations and routes
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read locations" ON locations FOR SELECT USING (true);

ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read routes" ON routes FOR SELECT USING (true);

-- Allow public insert to route history (for anonymous tracking)
ALTER TABLE route_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public insert route history" ON route_history FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read route history" ON route_history FOR SELECT USING (true);
