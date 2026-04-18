-- 1. Create the Garage Updates Table (For Admin Approvals)
CREATE TABLE garage_updates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  garage_id UUID REFERENCES garages(id) ON DELETE CASCADE NOT NULL,
  new_name TEXT,
  new_description TEXT,
  new_image_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Give everyone permission to interact with it
CREATE POLICY "Updates are readable by all" ON garage_updates FOR SELECT USING (true);
CREATE POLICY "Updates can be inserted" ON garage_updates FOR INSERT WITH CHECK (true);
CREATE POLICY "Updates can be modified" ON garage_updates FOR UPDATE USING (true);
ALTER TABLE garage_updates ENABLE ROW LEVEL SECURITY;

-- 2. Add an Image column to your Garages table if it doesn't already have one
ALTER TABLE garages ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 3. Set up the File Upload Storage Bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('garage_media', 'garage_media', true)
ON CONFLICT (id) DO NOTHING;

-- Allows anyone to view the uploaded images
CREATE POLICY "Public Read Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'garage_media' );

-- Allows mechanics to upload new files
CREATE POLICY "Authenticated users can upload" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'garage_media' AND auth.role() = 'authenticated' );
