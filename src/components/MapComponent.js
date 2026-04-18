import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";

// Fix for default Leaflet marker icons disappearing in React apps
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

// Custom Mechanic Icon
const mechanicIcon = L.divIcon({
  className: "custom-mechanic-icon",
  html: `<div style="background-color: #EAB308; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 16px;">🔧</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16]
});

// Component to dynamically center map when user location updates
function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center.length === 2) {
      map.setView(center, zoom);
    } else if (center && center.lat && center.lng) {
      map.setView([center.lat, center.lng], zoom);
    }
  }, [center, map, zoom]);
  return null;
}

export default function MapComponent({ userCoords, mechanics, showRoute = false, className = "h-60" }) {
  const validMechanic = mechanics?.find(m => m.lat && m.lng);
  const center = userCoords && userCoords.lat && userCoords.lng
    ? [userCoords.lat, userCoords.lng]
    : validMechanic
      ? [validMechanic.lat, validMechanic.lng]
      : [20.5937, 78.9629]; // Default to center of India

  return (
    <div className={`w-full z-0 ${className}`}>
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={false}
        className="h-full w-full object-cover"
        style={{ zIndex: 0 }}
      >
        <ChangeView center={center} zoom={13} />
        
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* User's Location Marker */}
        {userCoords && userCoords.lat && userCoords.lng && (
          <Marker position={[userCoords.lat, userCoords.lng]}>
            <Popup>
              <div className="text-center font-semibold text-blue-600">
                You are here
              </div>
            </Popup>
          </Marker>
        )}

        {/* Mechanics Markers */}
        {mechanics &&
          mechanics.map((mechanic, index) => {
            if (!mechanic || !mechanic.lat || !mechanic.lng) return null;
            return (
              <Marker key={index} position={[mechanic.lat, mechanic.lng]} icon={mechanicIcon}>
                <Popup>
                  <div className="font-semibold text-gray-800">{mechanic.name}</div>
                  <div className="text-sm text-gray-500">{mechanic.rating} ⭐</div>
                </Popup>
              </Marker>
            );
          })}
          
        {/* Tracker Route */}
        {showRoute && userCoords?.lat && userCoords?.lng && mechanics?.map((m, idx) => {
           if (!m.lat || !m.lng) return null;
           return (
             <Polyline 
                key={`route-${idx}`}
                positions={[[userCoords.lat, userCoords.lng], [m.lat, m.lng]]} 
                color="#3B82F6" 
                weight={5} 
                dashArray="10, 10" 
                opacity={0.8}
                className="animate-pulse"
             />
           );
        })}
      </MapContainer>
    </div>
  );
}
