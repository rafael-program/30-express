// components/maps/LocationPicker.tsx
'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Fix para ícones do Leaflet no Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface LocationPickerProps {
  onLocationSelect: (location: { lat: number; lng: number }) => void;
  initialLocation?: { lat: number; lng: number };
}

function LocationMarker({ onLocationSelect }: { onLocationSelect: (loc: { lat: number; lng: number }) => void }) {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);

  const map = useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition({ lat, lng });
      onLocationSelect({ lat, lng });
    },
    locationfound(e) {
      const { lat, lng } = e.latlng;
      setPosition({ lat, lng });
      onLocationSelect({ lat, lng });
      map.flyTo(e.latlng, 15);
    },
  });

  useEffect(() => {
    map.locate();
  }, [map]);

  return position ? <Marker position={[position.lat, position.lng]} /> : null;
}

export function LocationPicker({ onLocationSelect, initialLocation }: LocationPickerProps) {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(
    initialLocation || null
  );
  const [address, setAddress] = useState('');

  const defaultCenter = { lat: -8.8383, lng: 13.2344 }; // Luanda

  return (
    <div className="w-full space-y-4">
      <div className="h-[400px] w-full rounded-lg overflow-hidden border border-gray-300">
        <MapContainer
          center={[position?.lat || defaultCenter.lat, position?.lng || defaultCenter.lng]}
          zoom={14}
          style={{ height: '100%', width: '100%' }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker onLocationSelect={(loc) => {
            setPosition(loc);
            onLocationSelect(loc);
          }} />
        </MapContainer>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <input
          type="number"
          step="0.000001"
          placeholder="Latitude"
          value={position?.lat || ''}
          onChange={(e) => {
            const lat = parseFloat(e.target.value);
            if (!isNaN(lat) && position) {
              const newPos = { ...position, lat };
              setPosition(newPos);
              onLocationSelect(newPos);
            }
          }}
          className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="number"
          step="0.000001"
          placeholder="Longitude"
          value={position?.lng || ''}
          onChange={(e) => {
            const lng = parseFloat(e.target.value);
            if (!isNaN(lng) && position) {
              const newPos = { ...position, lng };
              setPosition(newPos);
              onLocationSelect(newPos);
            }
          }}
          className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Endereço</label>
        <input
          type="text"
          placeholder="Digite o endereço completo"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {position && (
        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            📍 Localização definida: {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
          </p>
          <a
            href={`https://www.openstreetmap.org/?mlat=${position.lat}&mlon=${position.lng}&zoom=15`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline"
          >
            Ver no OpenStreetMap
          </a>
        </div>
      )}
    </div>
  );
}