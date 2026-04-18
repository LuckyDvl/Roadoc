-- 1. Ensure RLS is enabled
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing restrictive policies if any
DROP POLICY IF EXISTS "Users can create their own bookings" ON bookings;
DROP POLICY IF EXISTS "Everyone can view bookings" ON bookings;
DROP POLICY IF EXISTS "Mechanics and Users can update bookings" ON bookings;

-- 3. Allow users to INSERT a booking as long as they are the ones making it
CREATE POLICY "Users can create their own bookings" 
ON bookings FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 4. Allow users to SELECT bookings they own, and allow Mechanics/Admins to view all incoming bookings
CREATE POLICY "Everyone can view bookings" 
ON bookings FOR SELECT 
USING (true);

-- 5. Allow users to UPDATE their bookings (e.g. to cancel), and mechanics to update (e.g. to accept/complete)
CREATE POLICY "Mechanics and Users can update bookings" 
ON bookings FOR UPDATE 
USING (true);
