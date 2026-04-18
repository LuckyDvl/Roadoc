-- WARNING: By default, Supabase Free Tier disables Realtime tracking on all new tables to save bandwidth.
-- This script physically overrides the restriction and turns on the WebSocket streaming layer for your core tables!

-- Turn on Realtime for the SOS dispatch Bookings so Mechanics get pings instantly without refreshing
ALTER PUBLICATION supabase_realtime ADD TABLE bookings;

-- Turn on Realtime for Garage Updates so the Admin gets moderation alerts instantly
ALTER PUBLICATION supabase_realtime ADD TABLE garage_updates;

-- Turn on Realtime for User Management so new Users dynamically appear on the Admin table
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
