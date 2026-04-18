-- Step 1: Expand the bookings table to accept rich diagnostic data
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS vehicle_type TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS vehicle_model TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS problem TEXT;

-- Step 2: Allow bookings to lock in the GPS coordinates where the user is stranded
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS user_lat NUMERIC;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS user_lng NUMERIC;
