-- Run this script in the Supabase SQL Editor to instantly activate Live Sockets for the SOS System!

-- This tells the database to broadcast all inserts and updates from the bookings table instantly back to your React app.
ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
