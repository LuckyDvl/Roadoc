-- Please go to your Supabase Dashboard -> SQL Editor
-- Paste and run this entire file to set up your tables!

-- 1. Create the PROFILES table (tied to Supabase Auth)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  email TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'mechanic', 'user')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Turn on Row Level Security for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. Create the GARAGES table
CREATE TABLE garages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  rating NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Turn on Row Level Security for garages
ALTER TABLE garages ENABLE ROW LEVEL SECURITY;

-- 3. Create the BOOKINGS table
CREATE TABLE bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  garage_id UUID REFERENCES garages(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'completed', 'cancelled')),
  total_price NUMERIC,
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Turn on Row Level Security for bookings
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- 4. Automatically create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- NOTE: To ensure anyone can read garages but only admins can create them, you would add security policies. 
-- For now, during development, we'll allow public reads of garages:
CREATE POLICY "Garages are viewable by everyone" ON garages FOR SELECT USING (true);
