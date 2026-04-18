import { useState, useEffect } from "react";
import { ArrowDown, Maximize2, MapPin, Truck } from "lucide-react";
import MapComponent from "./MapComponent";

export default function ActiveBookingView({ booking, userCoords }) {
  const [minimized, setMinimized] = useState(false);
  const [distance, setDistance] = useState(null);
  const [eta, setEta] = useState(null);

  useEffect(() => {
    // Haversine formula to calculate mock distance
    if (userCoords && booking?.garages) {
      const R = 6371; // Earth strictly in km
      const lat1 = userCoords.lat * Math.PI / 180;
      const lat2 = booking.garages.latitude * Math.PI / 180;
      const dLat = lat2 - lat1;
      const dLng = (booking.garages.longitude - userCoords.lng) * Math.PI / 180;
      
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1) * Math.cos(lat2) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const dist = R * c;
      
      setDistance(dist.toFixed(1));
      
      // Psychological Cap: Never show more than 46 minutes so the user doesn't panic.
      // As the distance mathematically shrinks, the ETA will naturally un-cap and drop dynamically!
      const rawEta = Math.round(dist * 3);
      setEta(Math.min(46, Math.max(2, rawEta))); 
    }
  }, [userCoords, booking]);

  if (minimized) {
    return (
      <div 
        onClick={() => setMinimized(false)}
        className="fixed bottom-20 right-4 bg-gray-900 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-4 z-[90] cursor-pointer hover:bg-black transition border-2 border-yellow-400 animate-in slide-in-from-bottom"
      >
        <div className="w-10 h-10 bg-yellow-400 text-yellow-900 rounded-full flex items-center justify-center font-bold">
          <Truck size={20} />
        </div>
        <div>
          <p className="font-bold text-sm">Mechanic Dispatched</p>
          <p className="text-yellow-400 text-xs font-bold font-mono">ETA: {eta ? `${eta} MINS` : 'CALCULATING'}</p>
        </div>
        <Maximize2 size={16} className="text-gray-400 ml-2" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white z-[100] flex flex-col animate-in fade-in zoom-in-95 duration-300">
      
      <div className="flex-1 relative bg-gray-100 flex items-center justify-center overflow-hidden">
         {/* Live Map Engine */}
         <MapComponent 
           userCoords={userCoords} 
           mechanics={[{ 
             lat: booking.garages?.latitude, 
             lng: booking.garages?.longitude, 
             name: booking.garages?.name 
           }]} 
           showRoute={true}
           className="absolute inset-0 w-full h-full z-0" 
         />

         <button 
           onClick={() => setMinimized(true)}
           className="absolute top-12 left-6 bg-white w-12 h-12 flex items-center justify-center rounded-full shadow-lg z-20 hover:scale-105 transition border border-gray-100"
         >
           <ArrowDown size={24} className="text-gray-600" />
         </button>

         <div className="absolute top-12 right-6 bg-white px-4 py-2 rounded-full shadow border font-bold text-gray-800 text-sm z-20">
           {booking.status === 'pending' ? 'Connecting...' : 'En Route'}
         </div>
      </div>

      {/* TRACKER DATA BOARD */}
      <div className="bg-white min-h-[300px] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] rounded-t-3xl relative z-20 p-6 flex flex-col">
        <div className="w-16 h-1.5 bg-gray-200 rounded-full mx-auto mb-6"></div>
        
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-3xl font-black text-gray-900 mb-1">{eta ? `${eta} min` : 'Locating'}</h2>
            <p className="text-gray-500 font-bold text-sm tracking-wide uppercase">Arrival Time</p>
          </div>
          <div className="text-right">
            <h3 className="text-2xl font-black text-yellow-500">{distance ? `${distance} km` : '...'}</h3>
            <p className="text-gray-400 font-bold text-sm uppercase">Distance</p>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 border border-gray-100 rounded-2xl flex items-center gap-4 mb-6">
          <img src={booking.garages?.image_url || `https://placehold.co/100?text=${booking.garages?.name[0]}`} alt="Garage" className="w-14 h-14 rounded-xl shadow-sm object-cover" />
          <div className="flex-1">
            <h4 className="font-bold text-gray-800 tracking-tight">{booking.garages?.name}</h4>
            <p className="text-xs text-gray-500 font-medium">Verified Roadoc Unit • {booking.vehicle_model}</p>
          </div>
          <a href={`tel:${booking.garages?.phone || ''}`} className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold hover:bg-green-200 transition shadow">📞</a>
        </div>

        {booking.status === 'pending' && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-xl text-center text-sm font-bold flex flex-col gap-2">
            <div className="w-8 h-8 rounded-full border-4 border-yellow-300 border-t-yellow-600 animate-spin mx-auto"></div>
             Transmission sent! Awaiting physical mechanic confirmation...
          </div>
        )}

        {booking.status === 'accepted' && (
           <div className="w-full h-12 bg-gray-900 rounded-xl relative overflow-hidden flex items-center shadow-inner">
             <div className="absolute top-0 left-0 h-full w-[40%] bg-blue-500 rounded-r-xl shadow-[0_0_20px_rgba(59,130,246,0.5)]"></div>
             <span className="relative z-10 w-full text-center text-white font-bold tracking-widest text-sm">HANG TIGHT • HELP IS ON THE WAY</span>
           </div>
        )}
      </div>

    </div>
  );
}
