-- Expand the garages table to handle personalizing the garage owner identity
ALTER TABLE garages 
ADD COLUMN IF NOT EXISTS owner_name TEXT,
ADD COLUMN IF NOT EXISTS owner_dp_url TEXT;

-- Expand the moderation staging table to handle the two new variables securely
ALTER TABLE garage_updates 
ADD COLUMN IF NOT EXISTS new_owner_name TEXT,
ADD COLUMN IF NOT EXISTS new_owner_dp_url TEXT;
