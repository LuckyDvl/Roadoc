import { useState } from "react";
import { Edit } from "lucide-react";

export default function Header({ location, setLocation }) {
  const [editLocation, setEditLocation] = useState(false);

  return (
    <div className="bg-yellow-400 p-4 shadow-md flex justify-between items-start sticky top-0 z-50">
      <div>
        <h1 className="font-bold text-2xl text-black tracking-wide">ROADOC</h1>
        <p className="text-sm text-gray-700 mt-1">Your on the go vehicle partner</p>
      </div>

      <div className="text-right text-xs text-black max-w-[120px]">
        {editLocation ? (
          <input
            type="text"
            placeholder="Enter location"
            className="border rounded p-1 text-xs w-full"
            onBlur={(e) => {
              setLocation(e.target.value || location);
              setEditLocation(false);
            }}
          />
        ) : (
          <div className="flex items-start gap-1">
            <span className="truncate">{location}</span>
            <Edit size={14} onClick={() => setEditLocation(true)} className="cursor-pointer" />
          </div>
        )}
      </div>
    </div>
  );
}
