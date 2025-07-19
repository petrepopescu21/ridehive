-- Development seed data for RideHive

-- Insert sample maps for development
INSERT INTO maps (title, notes, waypoints) VALUES 
(
  'Downtown Coffee Tour',
  'A tour of the best coffee shops in downtown',
  '[
    {"lat": 40.7128, "lng": -74.0060, "name": "Start - City Hall"},
    {"lat": 40.7168, "lng": -74.0058, "name": "Blue Bottle Coffee"},
    {"lat": 40.7177, "lng": -74.0073, "name": "Stumptown Coffee"},
    {"lat": 40.7185, "lng": -74.0085, "name": "Joe Coffee"},
    {"lat": 40.7158, "lng": -74.0075, "name": "End - Central Park"}
  ]'::jsonb
),
(
  'Brooklyn Bridge Ride',
  'Scenic ride across the Brooklyn Bridge',
  '[
    {"lat": 40.7061, "lng": -73.9969, "name": "Start - South Street Seaport"},
    {"lat": 40.7071, "lng": -73.9969, "name": "Brooklyn Bridge Entrance"},
    {"lat": 40.7038, "lng": -73.9903, "name": "Brooklyn Bridge"},
    {"lat": 40.6982, "lng": -73.9822, "name": "DUMBO"},
    {"lat": 40.7022, "lng": -73.9837, "name": "End - Brooklyn Heights"}
  ]'::jsonb
),
(
  'Central Park Loop',
  'Classic loop around Central Park',
  '[
    {"lat": 40.7677, "lng": -73.9807, "name": "Start - Bethesda Fountain"},
    {"lat": 40.7712, "lng": -73.9765, "name": "Bow Bridge"},
    {"lat": 40.7794, "lng": -73.9632, "name": "Conservatory Garden"},
    {"lat": 40.7851, "lng": -73.9581, "name": "Harlem Meer"},
    {"lat": 40.7677, "lng": -73.9807, "name": "End - Bethesda Fountain"}
  ]'::jsonb
);

-- Note: We don't insert rides here as they should be created dynamically
-- through the application for testing