-- Migration: Add dual PIN support
-- This migration adds rider_pin and organizer_pin columns and migrates existing data

-- First, add the new columns
ALTER TABLE rides ADD COLUMN IF NOT EXISTS rider_pin TEXT;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS organizer_pin TEXT;

-- Generate new PINs for existing rides (copy existing pin_code to rider_pin, generate new organizer_pin)
UPDATE rides 
SET 
  rider_pin = pin_code,
  organizer_pin = LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0')
WHERE rider_pin IS NULL OR organizer_pin IS NULL;

-- Make the new columns NOT NULL
ALTER TABLE rides ALTER COLUMN rider_pin SET NOT NULL;
ALTER TABLE rides ALTER COLUMN organizer_pin SET NOT NULL;

-- Add unique constraints
ALTER TABLE rides ADD CONSTRAINT rides_rider_pin_unique UNIQUE (rider_pin);
ALTER TABLE rides ADD CONSTRAINT rides_organizer_pin_unique UNIQUE (organizer_pin);

-- Create new indexes
CREATE INDEX IF NOT EXISTS idx_rides_rider_pin ON rides(rider_pin);
CREATE INDEX IF NOT EXISTS idx_rides_organizer_pin ON rides(organizer_pin);

-- Drop the old pin_code column and index
DROP INDEX IF EXISTS idx_rides_pin_code;
ALTER TABLE rides DROP COLUMN IF EXISTS pin_code;