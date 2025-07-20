-- Migration: Add route_coordinates column to maps table
-- Run this on existing databases to add route storage

-- Add route_coordinates column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'maps' AND column_name = 'route_coordinates'
    ) THEN
        ALTER TABLE maps ADD COLUMN route_coordinates JSONB DEFAULT '[]'::jsonb;
        
        -- Add comment for documentation
        COMMENT ON COLUMN maps.route_coordinates IS 'Calculated route coordinates as array of [lat, lng] points for the polyline';
        
        RAISE NOTICE 'Added route_coordinates column to maps table';
    ELSE
        RAISE NOTICE 'route_coordinates column already exists in maps table';
    END IF;
END $$;