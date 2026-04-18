-- 1. Fix Profile Viewing (Allows login role checks to work)
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);

-- 2. Fix Profile Updating (Allows the Admin Panel to change roles)
CREATE POLICY "Profiles can be updated by anyone" ON profiles FOR UPDATE USING (true);

-- 3. Fix Garage Creation (Allows the Admin Panel to add new garages to the map)
CREATE POLICY "Garages can be created by anyone" ON garages FOR INSERT WITH CHECK (true);
