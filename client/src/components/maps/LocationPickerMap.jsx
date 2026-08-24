import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Navigation, Compass } from 'lucide-react';

// Custom SVG Pin Icon for Leaflet
const createPinIcon = (color = '#dc2626') => {
  return L.divIcon({
    className: 'custom-pin-icon',
    html: `
      <div style="
        position: relative;
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        transform: translate(-18px, -36px);
      ">
        <svg viewBox="0 0 24 24" width="36" height="36" fill="${color}">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
  });
};

// Component to handle map clicks & center updates
function MapEventsHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function CenterMapOnCoord({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords && coords[0] && coords[1]) {
      map.setView(coords, 15, { animate: true });
    }
  }, [coords, map]);
  return null;
}

export const LocationPickerMap = ({
  latitude = 28.6139,
  longitude = 77.2090,
  onLocationChange,
  className = 'h-72 w-full',
}) => {
  const [position, setPosition] = useState([latitude, longitude]);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');

  useEffect(() => {
    if (latitude && longitude) {
      setPosition([latitude, longitude]);
    }
  }, [latitude, longitude]);

  const handleMapClick = (lat, lng) => {
    setPosition([lat, lng]);
    if (onLocationChange) {
      onLocationChange(lat, lng);
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    setGpsLoading(true);
    setGpsError('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setPosition([lat, lng]);
        if (onLocationChange) {
          onLocationChange(lat, lng);
        }
        setGpsLoading(false);
      },
      (err) => {
        setGpsError(`Could not fetch GPS: ${err.message}. Please click map manually.`);
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-300 shadow-inner">
      <div className={className}>
        <MapContainer
          center={position}
          zoom={14}
          scrollWheelZoom={true}
          style={{ width: '100%', height: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker
            position={position}
            icon={createPinIcon('#dc2626')}
            draggable={true}
            eventHandlers={{
              dragend: (e) => {
                const marker = e.target;
                const newPos = marker.getLatLng();
                handleMapClick(newPos.lat, newPos.lng);
              },
            }}
          />
          <MapEventsHandler onLocationSelect={handleMapClick} />
          <CenterMapOnCoord coords={position} />
        </MapContainer>
      </div>

      {/* Floating GPS Button & Info */}
      <div className="absolute top-3 right-3 z-[400] flex flex-col items-end space-y-1.5">
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={gpsLoading}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-white/95 text-slate-800 rounded-xl text-xs font-semibold shadow-md hover:bg-slate-50 border border-slate-200 transition backdrop-blur"
        >
          <Navigation className={`w-3.5 h-3.5 text-brand-600 ${gpsLoading ? 'animate-spin' : ''}`} />
          <span>{gpsLoading ? 'Locating GPS...' : 'Use My GPS'}</span>
        </button>

        <div className="px-2.5 py-1 bg-slate-900/80 text-white text-[11px] rounded-lg shadow backdrop-blur font-mono">
          📍 {position[0].toFixed(5)}, {position[1].toFixed(5)}
        </div>
      </div>

      {gpsError && (
        <div className="absolute bottom-2 left-2 right-2 z-[400] bg-rose-50 text-rose-700 text-xs p-2 rounded-lg border border-rose-200 shadow">
          {gpsError}
        </div>
      )}
    </div>
  );
};
