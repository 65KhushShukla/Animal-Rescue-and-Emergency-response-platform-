import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { LiveRescueMap } from '../components/maps/LiveRescueMap';
import { StatusBadge, UrgencyBadge } from '../components/common/StatusBadge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Filter,
  Eye,
  AlertTriangle,
  CheckCircle2,
  List,
  Layers,
} from 'lucide-react';

export const LiveRescuesPage = () => {
  const { user } = useAuth();
  const [emergencies, setEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [urgencyFilter, setUrgencyFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [speciesFilter, setSpeciesFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('split'); // 'split' | 'map' | 'list'

  useEffect(() => {
    loadEmergencies();
  }, [urgencyFilter, statusFilter, speciesFilter]);

  const loadEmergencies = async () => {
    setLoading(true);
    try {
      let query = `/emergencies?urgency=${urgencyFilter}&status=${statusFilter}&animalType=${speciesFilter}`;
      const res = await api.get(query);
      if (res.data.success) {
        setEmergencies(res.data.emergencies || []);
      }
    } catch (err) {
      console.warn('Emergencies load error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRescue = async (reportId) => {
    try {
      const res = await api.put(`/rescues/${reportId}/accept`);
      if (res.data.success) {
        alert('Rescue request accepted!');
        loadEmergencies();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to accept rescue.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center space-x-2">
            <span>🗺️ Live Emergency Dispatch Map & Feed</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time geospatial incidents feed across metropolitan rescue jurisdictions
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center space-x-2">
          <div className="p-1 bg-slate-200 rounded-xl flex items-center text-xs font-bold">
            <button
              onClick={() => setViewMode('split')}
              className={`px-3 py-1.5 rounded-lg transition ${
                viewMode === 'split' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              Split View
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1.5 rounded-lg transition ${
                viewMode === 'map' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              Map Only
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg transition ${
                viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              List Only
            </button>
          </div>

          <Link
            to="/report-emergency"
            className="px-4 py-2 bg-emergency-600 hover:bg-emergency-700 text-white rounded-xl text-xs font-bold shadow transition flex items-center space-x-1"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Report Animal</span>
          </Link>
        </div>
      </div>

      {/* Filter Ribbon */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-3">
        <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700">
          <Filter className="w-4 h-4 text-slate-400" />
          <span>Filters:</span>
        </div>

        <select
          value={urgencyFilter}
          onChange={(e) => setUrgencyFilter(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
        >
          <option value="ALL">All Urgencies</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
        >
          <option value="ALL">All Statuses</option>
          <option value="REPORTED">Reported (Open)</option>
          <option value="ACCEPTED">Accepted / En Route</option>
          <option value="RESCUED">Rescued</option>
          <option value="TRANSFERRED_VET">In Vet Hospital</option>
          <option value="TRANSFERRED_SHELTER">In Shelter</option>
          <option value="RESOLVED">Resolved</option>
        </select>

        <select
          value={speciesFilter}
          onChange={(e) => setSpeciesFilter(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
        >
          <option value="ALL">All Species</option>
          <option value="Dog">Dogs</option>
          <option value="Cat">Cats</option>
          <option value="Bird">Birds</option>
          <option value="Cattle">Cattle</option>
          <option value="Wildlife">Wildlife</option>
        </select>

        <span className="ml-auto text-xs text-slate-500 font-medium">
          Showing <strong>{emergencies.length}</strong> active cases
        </span>
      </div>

      {loading ? (
        <LoadingSpinner text="Rendering live incidents..." />
      ) : (
        <div className="space-y-6">
          {/* Map View */}
          {(viewMode === 'map' || viewMode === 'split') && (
            <div>
              <LiveRescueMap
                emergencies={emergencies}
                onAcceptRescue={handleAcceptRescue}
                userRole={user?.role}
                className={viewMode === 'map' ? 'h-[650px] w-full' : 'h-[460px] w-full'}
              />
            </div>
          )}

          {/* List Feed View */}
          {(viewMode === 'list' || viewMode === 'split') && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {emergencies.map((em) => (
                <div
                  key={em._id}
                  className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between space-y-3 hover:shadow-md transition"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-1">
                      <h3 className="text-sm font-bold text-slate-900 leading-snug">{em.title}</h3>
                      <UrgencyBadge urgency={em.urgency} />
                    </div>

                    <div className="flex items-center space-x-2">
                      <StatusBadge status={em.status} />
                      <span className="text-xs text-slate-500">{em.animalType} ({em.breed})</span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 bg-slate-50 p-2.5 rounded-xl">
                      {em.description}
                    </p>

                    <div className="flex items-center space-x-1.5 text-xs text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      <span className="truncate">{em.location?.address}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">
                      {new Date(em.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>

                    <Link
                      to={`/reports/${em._id}`}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Live Case</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
