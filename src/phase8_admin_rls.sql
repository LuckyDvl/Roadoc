-- Fix Admin Modification Privileges

-- Ensure Admins have explicit permission to UPDATE the garages core table
DROP POLICY IF EXISTS "Admins can update garages" ON public.garages;
CREATE POLICY "Admins can update garages" 
ON public.garages FOR UPDATE 
USING ( (SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1) = 'admin' );

-- Ensure Admins have explicit permission to UPDATE the garage_updates moderation queue
DROP POLICY IF EXISTS "Admins can update garage_updates" ON public.garage_updates;
CREATE POLICY "Admins can update garage_updates" 
ON public.garage_updates FOR UPDATE 
USING ( (SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1) = 'admin' );

-- Ensure Mechanics can INSERT into garage_updates
DROP POLICY IF EXISTS "Mechanics can insert garage_updates" ON public.garage_updates;
CREATE POLICY "Mechanics can insert garage_updates" 
ON public.garage_updates FOR INSERT 
WITH CHECK ( auth.role() = 'authenticated' );
