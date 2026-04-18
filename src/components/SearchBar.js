import { useState } from "react";
import { Search } from "lucide-react";

export default function SearchBar() {
  const [showSuggestions, setShowSuggestions] = useState(false);

  return (
    <div className="p-4 bg-white shadow sticky top-[72px] z-40">
      <div className="relative">
        <input
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          type="text"
          placeholder="Search mechanics, parts..."
          className="w-full p-3 pr-10 border rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />
        <Search className="absolute right-3 top-3 text-gray-500" size={20} />

        {showSuggestions && (
          <div className="absolute bg-white w-full mt-2 shadow rounded-xl p-3 z-50">
            <p className="text-xs text-gray-500 mb-2">Trending</p>
            <div className="flex flex-wrap gap-2 mb-2">
              <span className="bg-gray-200 px-2 py-1 rounded">Puncture</span>
              <span className="bg-gray-200 px-2 py-1 rounded">Battery</span>
              <span className="bg-gray-200 px-2 py-1 rounded">Engine</span>
            </div>
            <p className="text-xs text-gray-500 mb-2">Spare Parts</p>
            <div className="flex flex-wrap gap-2">
              <span className="bg-gray-200 px-2 py-1 rounded">Brake Pads</span>
              <span className="bg-gray-200 px-2 py-1 rounded">Oil Filter</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
