-- Database schema for Riderz app

-- Create database (run manually first)
-- CREATE DATABASE riderz;

-- Maps table for storing ride routes
CREATE TABLE IF NOT EXISTS maps (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  notes TEXT,
  waypoints JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rides table for active/ended rides
CREATE TABLE IF NOT EXISTS rides (
  id SERIAL PRIMARY KEY,
  map_id INTEGER REFERENCES maps(id) ON DELETE CASCADE,
  pin_code TEXT UNIQUE NOT NULL,
  status TEXT CHECK(status IN ('active', 'ended')) DEFAULT 'active',
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rides_pin_code ON rides(pin_code);
CREATE INDEX IF NOT EXISTS idx_rides_status ON rides(status);
CREATE INDEX IF NOT EXISTS idx_maps_created_at ON maps(created_at);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_maps_updated_at BEFORE UPDATE
    ON maps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();