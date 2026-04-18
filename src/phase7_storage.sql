-- 1. Ensure the garage_media bucket exists and is physically set to PUBLIC
INSERT INTO storage.buckets (id, name, public)
VALUES ('garage_media', 'garage_media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Drop any existing restrictive policies on this bucket to prevent conflicts
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Auth Uploads" ON storage.objects;

-- 3. Create a strict policy allowing ANYONE on the internet to view the Garage Images (required for the Home Page to render them)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'garage_media' );

-- 4. Create a strict policy allowing ONLY logged-in users (Mechanics) to upload images to the bucket
CREATE POLICY "Auth Uploads"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'garage_media' AND auth.role() = 'authenticated' );
