-- This patch forcibly syncs any orphaned auth.users accounts into the profiles table
-- so that if you made an account before we wrote the Auto-Trigger, it gets rescued!

INSERT INTO public.profiles (id, email, role)
SELECT id, email, 'user'
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);
