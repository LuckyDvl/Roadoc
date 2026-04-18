import { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function SOSButton({ location }) {
  const [showSOS, setShowSOS] = useState(false);

  const handleSOS = (type) => {
    if (type === "ambulance") window.location.href = "tel:108";
    if (type === "police") window.location.href = "tel:100";
    if (type === "mechanic") alert("Searching emergency mechanic...");
    if (type === "home") {
      window.location.href = `sms:?body=I need help. My location: ${location}`;
    }
  };

  return (
    <div className="flex justify-center py-6 relative z-30">
      <button
        onClick={() => setShowSOS(!showSOS)}
        className="flex items-center gap-2 px-6 py-4 border-4 border-red-600 text-red-600 font-bold text-lg bg-white rounded-full shadow-lg"
      >
        SOS <ChevronDown />
      </button>

      {showSOS && (
        <div className="absolute top-20 bg-white border-2 border-red-600 text-red-600 rounded-2xl p-3 shadow-xl w-56">
          <p onClick={() => handleSOS("ambulance")} className="py-2 cursor-pointer hover:bg-red-50 rounded px-2">Ambulance</p>
          <p onClick={() => handleSOS("police")} className="py-2 cursor-pointer hover:bg-red-50 rounded px-2">Police</p>
          <p onClick={() => handleSOS("mechanic")} className="py-2 cursor-pointer hover:bg-red-50 rounded px-2">Mechanic</p>
          <p onClick={() => handleSOS("home")} className="py-2 cursor-pointer hover:bg-red-50 rounded px-2">Message Home</p>
        </div>
      )}
    </div>
  );
}
