import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useState } from "react";

// Fix for default Leaflet marker icons disappearing in React apps
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

// Component to dynamically center map initially
function InitialCenter({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center.lat && center.lng) {
      map.setView([center.lat, center.lng], zoom);
    }
  }, [center, map, zoom]);
  return null;
}

function LocationMarker({ position, setPosition, onChange }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      if (onChange) onChange(e.latlng);
    },
  });

  return position === null ? null : <Marker position={position} />;
}

export default function MapPicker({ userCoords, onLocationSelect }) {
  // Center defaults to India if no userCoords are available
  const center = userCoords && userCoords.lat && userCoords.lng
    ? [userCoords.lat, userCoords.lng]
    : [20.5937, 78.9629]; 

  const [position, setPosition] = useState(
    userCoords && userCoords.lat && userCoords.lng 
      ? { lat: userCoords.lat, lng: userCoords.lng } 
      : null
  );

  return (
    <div className="w-full h-64 z-0 rounded-xl overflow-hidden border border-gray-300">
      <MapContainer
        center={center}
        zoom={userCoords ? 15 : 5}
        scrollWheelZoom={true}
        className="h-full w-full object-cover"
        style={{ zIndex: 0 }}
      >
        <InitialCenter center={userCoords} zoom={userCoords ? 15 : 5} />
        
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <LocationMarker position={position} setPosition={setPosition} onChange={onLocationSelect} />
      </MapContainer>
    </div>
  );
}
