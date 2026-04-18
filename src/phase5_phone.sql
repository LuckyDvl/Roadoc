-- 1. Add Phone Number support to Garages
ALTER TABLE garages ADD COLUMN IF NOT EXISTS phone TEXT;

-- 2. Add Phone Number support to the Admin Verification Pipeline
ALTER TABLE garage_updates ADD COLUMN IF NOT EXISTS new_phone TEXT;
