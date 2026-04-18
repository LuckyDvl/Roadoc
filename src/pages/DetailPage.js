import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import BookingModal from "../components/BookingModal";
import MapComponent from "../components/MapComponent";

export default function DetailPage({ mechanic, userCoords, onBack }) {
  const [showBooking, setShowBooking] = useState(false);

  return (
    <div className="min-h-screen bg-white">

      {/* Header */}
      <div className="p-4 flex items-center gap-3 absolute top-0 left-0 w-full z-50 text-white">
        <ArrowLeft className="cursor-pointer bg-black/30 rounded-full p-1 w-8 h-8 hover:bg-black/50 transition" onClick={onBack} />
        <h2 className="font-semibold text-lg drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">{mechanic.name}</h2>
      </div>

      {/* HERO SECTION */}
      <div className="relative w-full h-64 overflow-hidden bg-gray-900 border-b-4 border-yellow-400">
        <img src={mechanic.image} alt="Storefront Banner" className="w-full h-full object-cover" />

        {/* Fade */}
        <div className="absolute inset-0 bg-gradient-to-l from-black/50 to-transparent"></div>

        {/* Owner Digital Card */}
        <div className="absolute bottom-4 left-4 flex items-center gap-3 z-10 bg-black/40 backdrop-blur-md p-2 pr-4 rounded-full border border-white/20 shadow-lg">
          <img
            src={mechanic.owner_dp_url}
            alt="Owner Avatar"
            className="w-12 h-12 rounded-full border-2 border-white shadow-md object-cover bg-white"
          />
          <div>
            <p className="text-white font-bold drop-shadow-md text-sm">{mechanic.owner_name}</p>
            <p className="text-[10px] text-yellow-300 drop-shadow-md font-bold uppercase tracking-wider">Verified Garage Owner</p>
          </div>
        </div>
      </div>

      {/* DETAILS */}
      <div className="p-4 space-y-4">
        <p className="text-gray-600">{mechanic.desc}</p>

        <div className="bg-gray-100 p-3 rounded-xl border">
          <p className="text-sm font-medium text-gray-700 mb-2">Approx Distance: 2.4 km</p>
          <MapComponent mechanics={[mechanic]} className="h-40 rounded-lg overflow-hidden shadow-inner" />
        </div>

        <div>
          <p className="font-semibold text-lg">Rating: {mechanic.rating} ⭐</p>
          <p className="text-sm text-gray-500">Based on 120+ reviews</p>
        </div>

        <div className="flex gap-3 mt-4">
          <button
            onClick={() => setShowBooking(true)}
            className="flex-1 bg-yellow-400 py-3 rounded-xl font-semibold hover:bg-yellow-500 transition shadow-sm"
          >
            Book Now
          </button>
          <button
            className="flex-1 border border-gray-300 py-3 rounded-xl hover:bg-gray-50 transition shadow-sm font-medium"
            onClick={() => alert("Opening AI Support Chat...")}
          >
            Support
          </button>
        </div>
      </div>

      {/* BOOKING POPUP */}
      {showBooking && <BookingModal onClose={() => setShowBooking(false)} mechanic={mechanic} userCoords={userCoords} />}
      
    </div>
  );
}
