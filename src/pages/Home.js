import { useState, useEffect } from "react";
import Header from "../components/Header";
import SearchBar from "../components/SearchBar";
import SOSButton from "../components/SOSButton";
import OfferCarousel from "../components/OfferCarousel";
import MechanicCard from "../components/MechanicCard";
import BottomNav from "../components/BottomNav";
import ActiveBookingView from "../components/ActiveBookingView";
import MapComponent from "../components/MapComponent";
import { supabase } from "../supabaseClient";
import { Link } from "react-router-dom";

export default function Home({ userRole, onSelectMechanic, userCoords, setUserCoords }) {
  const [activeTab, setActiveTab] = useState("home");
  const [mockMechanics, setMockMechanics] = useState([]);
  const [locError, setLocError] = useState(null);
  const [activeBooking, setActiveBooking] = useState(null);

  const handleLogout = () => {
    supabase.auth.signOut().catch(err => console.error(err));
    localStorage.clear();
    sessionStorage.clear();
    window.location.replace('/login');
  };

  useEffect(() => {
    const fetchGarages = async () => {
      const { data } = await supabase.from('garages').select('*');
      if (data && data.length > 0) {
        setMockMechanics(data);
      }
    };

    const loadBookingData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase.from('bookings').select('*, garages(name, latitude, longitude, phone, image_url)').eq('user_id', session.user.id).in('status', ['pending', 'accepted']).maybeSingle();
      if (data) setActiveBooking(data);
    };

    const initializeRealtime = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const channelId = `user_bookings_${session.user.id}_${Math.random().toString(36).substring(7)}`;
      const channel = supabase.channel(channelId)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings', filter: `user_id=eq.${session.user.id}` }, (payload) => {
           if (payload.new.status === 'completed' || payload.new.status === 'cancelled') {
             setActiveBooking(null);
           } else {
             loadBookingData(); // Only fetch data, don't re-subscribe!
           }
        }).subscribe();

      return channel;
    };

    let activeChannel;
    
    fetchGarages();
    loadBookingData().then(() => {
      initializeRealtime().then(ch => { activeChannel = ch; });
    });

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserCoords({ lat: latitude, lng: longitude });
        
        // Fallback to real garages fetched from DB, so mock loading is removed
        setLocError(null);
      },
      (err) => {
        console.error("Location unavailable:", err);
        setLocError(err.message + " (Check browser permissions)");
      },
      { timeout: 10000 }
    );

    return () => {
      if (activeChannel) supabase.removeChannel(activeChannel);
    };
  }, [setUserCoords]);

  return (
    <div className="min-h-screen bg-gray-100 pb-24">
      {locError && (
        <div className="bg-red-100 text-red-600 text-xs p-2 text-center border-b border-red-200 z-50">
          ⚠️ Location Error: {locError}
        </div>
      )}
      <Header 
        location={userCoords ? `Lat: ${userCoords.lat.toFixed(2)}, Lng: ${userCoords.lng.toFixed(2)}` : (locError ? "Location Blocked" : "Fetching location...")} 
        setLocation={() => {}} 
      />
      <SearchBar />

      {/* Interactive Map */}
      <MapComponent userCoords={userCoords} mechanics={mockMechanics} />

      <SOSButton location={userCoords ? `Lat: ${userCoords.lat.toFixed(2)}, Lng: ${userCoords.lng.toFixed(2)}` : "Unknown"} />
      <OfferCarousel />

      {/* Top Mechanics */}
      <div className="p-4 space-y-4">
        {mockMechanics.length > 0 ? mockMechanics.map((garage) => {
          const garageData = {
            id: garage.id,
            name: garage.name,
            rating: garage.rating || "New",
            desc: garage.description || "Fast and reliable service near your location",
            image: garage.image_url || `https://placehold.co/600x400?text=${encodeURIComponent(garage.name)}`,
            owner_name: garage.owner_name || "Rahul Sharma",
            owner_dp_url: garage.owner_dp_url || `https://i.pravatar.cc/100?u=${encodeURIComponent(garage.name)}`,
            lat: garage.latitude,
            lng: garage.longitude
          };

          return (
            <MechanicCard key={garage.id} data={garageData} onClick={() => onSelectMechanic(garageData)} />
          );
        }) : <p className="text-gray-500 text-center py-4">Loading garages from network...</p>}
      </div>

      {/* Horizontal Cards */}
      <div className="relative px-4 pb-6">
        <div className="overflow-x-auto flex gap-3 no-scrollbar">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="min-w-[100px] h-24 bg-white rounded-xl shadow flex items-center justify-center hover:scale-105 transition cursor-pointer">
              Shop {item}
            </div>
          ))}
        </div>
        <div className="pointer-events-none absolute right-0 top-0 h-full w-12 bg-gradient-to-l from-gray-100 to-transparent"></div>
      </div>

      <div className="text-center text-gray-500 text-sm pb-6">
        Thank you for choosing ROADOC
      </div>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* Slide-up Menu Overlay */}
      {activeTab === "menu" && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 flex items-end transition-opacity" 
          onClick={() => setActiveTab("home")}
        >
          <div 
            className="bg-white w-full rounded-t-3xl p-6 pb-24 shadow-2xl animate-in slide-in-from-bottom" 
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Menu</h3>
              <button 
                onClick={() => setActiveTab("home")} 
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <Link 
                to="/profile"
                className="w-full flex items-center justify-center bg-blue-50 text-blue-600 py-4 rounded-xl font-bold text-lg border border-blue-100 hover:bg-blue-100 transition shadow-sm"
              >
                👤 My Profile & Records
              </Link>
              
              {(userRole === 'admin' || userRole === 'mechanic') && (
                <Link 
                  to={userRole === 'admin' ? '/admin' : '/mechanic'}
                  className="w-full flex items-center justify-center bg-gray-900 text-yellow-400 py-4 rounded-xl font-bold text-lg hover:bg-black transition shadow-md"
                >
                  Enter {userRole === 'admin' ? 'Admin' : 'Mechanic'} Dashboard
                </Link>
              )}
              <button 
                onClick={handleLogout}
                className="w-full bg-red-50 text-red-600 py-4 rounded-xl font-bold text-lg border border-red-100 hover:bg-red-100 transition shadow-sm"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Booking Fullscreen Component */}
      {activeBooking && (
        <ActiveBookingView booking={activeBooking} userCoords={userCoords} />
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
