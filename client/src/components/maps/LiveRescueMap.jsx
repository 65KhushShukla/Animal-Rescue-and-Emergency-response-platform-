import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import { StatusBadge, UrgencyBadge } from '../common/StatusBadge';
import { MapPin, Navigation, Eye, CheckCircle2, ShieldAlert } from 'lucide-react';

const getMarkerColor = (urgency, status) => {
  if (status === 'RESOLVED') return '#10b981'; // Green
  if (status === 'TRANSFERRED_VET' || status === 'TRANSFERRED_SHELTER') return '#06b6d4'; // Cyan
  if (urgency === 'CRITICAL') return '#dc2626'; // Red
  if (urgency === 'HIGH') return '#ea580c';     // Orange
  if (urgency === 'MEDIUM') return '#f59e0b';   // Amber
  return '#64748b';                            // Slate
};

const createEmergencyIcon = (urgency, status, animalType) => {
  const color = getMarkerColor(urgency, status);
  const isCritical = urgency === 'CRITICAL' && status === 'REPORTED';

  return L.divIcon({
    className: 'custom-emergency-pin',
    html: `
      <div style="
        position: relative;
        width: 38px;
        height: 38px;
        display: flex;
        align-items: center;
        justify-content: center;
        transform: translate(-19px, -38px);
      ">
        ${
          isCritical
            ? `<div style="
                position: absolute;
                width: 50px;
                height: 50px;
                border-radius: 50%;
                background: rgba(220, 38, 38, 0.35);
                animation: pulse-ring 1.8s infinite;
              "></div>`
            : ''
        }
        <div style="
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: ${color};
          border: 3px solid white;
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 14px;
        ">
          ${animalType === 'Cat' ? '🐱' : animalType === 'Bird' ? '🦅' : animalType === 'Wildlife' ? '🦊' : '🐶'}
        </div>
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -36],
  });
};

function ChangeMapView({ center, zoom }) {
  const map = useMap();
  if (center) {
    map.setView(center, zoom || 13, { animate: true });
  }
  return null;
}

export const LiveRescueMap = ({
  emergencies = [],
  center = [28.6139, 77.2090],
  zoom = 12,
  onAcceptRescue,
  userRole = '',
  className = 'h-[550px] w-full',
}) => {
  const [activeCenter, setActiveCenter] = useState(center);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-lg">
      <div className={className}>
        <MapContainer
          center={activeCenter}
          zoom={zoom}
          scrollWheelZoom={true}
          style={{ width: '100%', height: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <ChangeMapView center={activeCenter} zoom={zoom} />

          {emergencies.map((em) => {
            const coords = em.location?.coordinates;
            if (!coords || coords.length < 2) return null;
            // Note: MongoDB GeoJSON is [lng, lat], Leaflet takes [lat, lng]
            const lat = coords[1];
            const lng = coords[0];

            return (
              <Marker
                key={em._id}
                position={[lat, lng]}
                icon={createEmergencyIcon(em.urgency, em.status, em.animalType)}
              >
                <Popup className="emergency-popup" minWidth={260} maxWidth={320}>
                  <div className="overflow-hidden bg-white text-slate-800">
                    {/* Media preview if available */}
                    {em.media && em.media.length > 0 && (
                      <div className="h-32 w-full overflow-hidden bg-slate-100 relative">
                        <img
                          src={em.media[0].url}
                          alt={em.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 left-2">
                          <UrgencyBadge urgency={em.urgency} />
                        </div>
                      </div>
                    )}

                    <div className="p-3.5 space-y-2">
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="text-xs font-bold text-slate-900 leading-tight">
                          {em.title}
                        </h4>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        <StatusBadge status={em.status} />
                        <span className="text-[11px] font-medium text-slate-500">
                          {em.animalType} ({em.breed || 'Mixed'})
                        </span>
                      </div>

                      <div className="flex items-start space-x-1 text-[11px] text-slate-600">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-2">{em.location?.address}</span>
                      </div>

                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100">
                        {em.description}
                      </p>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                        <Link
                          to={`/reports/${em._id}`}
                          className="flex-1 inline-flex items-center justify-center space-x-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Details</span>
                        </Link>

                        {(userRole === 'rescue_team' || userRole === 'admin') && em.status === 'REPORTED' && (
                          <button
                            onClick={() => onAcceptRescue && onAcceptRescue(em._id)}
                            className="flex-1 inline-flex items-center justify-center space-x-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Accept</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-4 left-4 z-[400] bg-white/95 backdrop-blur p-2.5 rounded-xl shadow-md border border-slate-200 text-[11px] space-y-1 hidden sm:block">
        <span className="font-bold text-slate-700 block mb-1">Incident Urgency</span>
        <div className="flex items-center space-x-3 text-slate-600">
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block"></span>
            <span>Critical</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block"></span>
            <span>High</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
            <span>Medium</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            <span>Resolved</span>
          </span>
        </div>
      </div>
    </div>
  );
};
