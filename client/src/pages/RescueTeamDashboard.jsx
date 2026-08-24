import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { LiveRescueMap } from '../components/maps/LiveRescueMap';
import { StatusBadge, UrgencyBadge } from '../components/common/StatusBadge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import {
  ShieldAlert,
  MapPin,
  CheckCircle2,
  Navigation,
  Clock,
  Stethoscope,
  Camera,
  Search,
  Filter,
  Eye,
  AlertTriangle,
} from 'lucide-react';

export const RescueTeamDashboard = () => {
  const { user } = useAuth();
  const [emergencies, setEmergencies] = useState([]);
  const [myAssignments, setMyAssignments] = useState([]);
  const [vetsList, setVetsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterUrgency, setFilterUrgency] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');
  const [activeTab, setActiveTab] = useState('map'); // 'map' | 'dispatch' | 'my-cases'

  // Vet Transfer Modal State
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [selectedCaseForVet, setSelectedCaseForVet] = useState(null);
  const [selectedVetId, setSelectedVetId] = useState('');
  const [transferNote, setTransferNote] = useState('');
  const [transferring, setTransferring] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [filterUrgency, filterType]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [emRes, myRes, vetsRes] = await Promise.all([
        api.get(`/emergencies?urgency=${filterUrgency}&animalType=${filterType}`),
        api.get('/rescues/my-assignments'),
        api.get('/auth/directory?role=veterinarian').catch(() => ({ data: { users: [] } })),
      ]);

      if (emRes.data.success) setEmergencies(emRes.data.emergencies || []);
      if (myRes.data.success) setMyAssignments(myRes.data.assignments || []);
      if (vetsRes.data?.users) setVetsList(vetsRes.data.users || []);
    } catch (err) {
      console.warn('Rescue dashboard load error:', err.message);
    } finally {
      setLoading(false);
    }

  };

  const handleAcceptRescue = async (reportId) => {
    try {
      const res = await api.put(`/rescues/${reportId}/accept`);
      if (res.data.success) {
        alert('Rescue mission accepted! Added to your active assignments.');
        loadDashboardData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to accept rescue.');
    }
  };

  const handleUpdateStatus = async (reportId, nextStatus, note = '') => {
    try {
      const res = await api.put(`/rescues/${reportId}/status`, {
        status: nextStatus,
        note: note || `Status updated to ${nextStatus.replace('_', ' ')} by rescue unit.`,
      });
      if (res.data.success) {
        loadDashboardData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status.');
    }
  };

  const handleOpenTransferModal = (report) => {
    setSelectedCaseForVet(report);
    if (vetsList.length > 0) setSelectedVetId(vetsList[0]._id);
    setTransferModalOpen(true);
  };

  const handleConfirmTransfer = async (e) => {
    e.preventDefault();
    if (!selectedCaseForVet || !selectedVetId) return;

    setTransferring(true);
    try {
      const res = await api.put(`/rescues/${selectedCaseForVet._id}/assign-vet`, {
        vetId: selectedVetId,
        note: transferNote,
      });

      if (res.data.success) {
        alert('Animal successfully transferred to veterinary hospital.');
        setTransferModalOpen(false);
        loadDashboardData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to transfer to vet.');
    } finally {
      setTransferring(false);
    }
  };

  const pendingDispatches = emergencies.filter((e) => e.status === 'REPORTED');

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header Profile Strip */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-2xl shadow-lg">
            🚑
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-extrabold">{user?.name}</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-400/30">
                {user?.badgeNumber || 'RESCUE-UNIT'}
              </span>
            </div>
            <p className="text-xs text-slate-400">{user?.organizationName || 'Rapid Rescue Ambulance'}</p>
          </div>
        </div>

        {/* Quick KPI stats */}
        <div className="flex items-center space-x-4 text-center">
          <div className="px-4 py-2 bg-white/10 rounded-2xl border border-white/10">
            <p className="text-xl font-extrabold text-amber-400">{pendingDispatches.length}</p>
            <p className="text-[10px] text-slate-400">Open Alerts</p>
          </div>
          <div className="px-4 py-2 bg-white/10 rounded-2xl border border-white/10">
            <p className="text-xl font-extrabold text-emerald-400">{myAssignments.length}</p>
            <p className="text-[10px] text-slate-400">My Missions</p>
          </div>
        </div>
      </div>

      {/* Tabs & Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex p-1 bg-slate-200/80 rounded-2xl w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('map')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'map' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🗺️ Live Dispatch Map
          </button>
          <button
            onClick={() => setActiveTab('dispatch')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
              activeTab === 'dispatch' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>🚨 Incoming Queue</span>
            {pendingDispatches.length > 0 && (
              <span className="px-1.5 py-0.2 bg-emergency-600 text-white rounded-full text-[10px]">
                {pendingDispatches.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('my-cases')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'my-cases' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🐾 My Active Missions ({myAssignments.length})
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <select
            value={filterUrgency}
            onChange={(e) => setFilterUrgency(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-brand-500"
          >
            <option value="ALL">All Urgencies</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-brand-500"
          >
            <option value="ALL">All Species</option>
            <option value="Dog">Dog</option>
            <option value="Cat">Cat</option>
            <option value="Bird">Bird</option>
            <option value="Wildlife">Wildlife</option>
          </select>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Refreshing rescue telemetry..." />
      ) : (
        <>
          {/* TAB 1: Map View */}
          {activeTab === 'map' && (
            <div className="space-y-4">
              <LiveRescueMap
                emergencies={emergencies}
                onAcceptRescue={handleAcceptRescue}
                userRole="rescue_team"
                className="h-[550px] w-full"
              />
            </div>
          )}

          {/* TAB 2: Incoming Queue (Open Alerts) */}
          {activeTab === 'dispatch' && (
            <div className="space-y-4">
              {pendingDispatches.length === 0 ? (
                <EmptyState
                  icon={CheckCircle2}
                  title="No Pending Emergency Dispatches"
                  description="All reported incidents in your area have been accepted by rescue units."
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingDispatches.map((em) => (
                    <div
                      key={em._id}
                      className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-base font-bold text-slate-900">{em.title}</h3>
                          <UrgencyBadge urgency={em.urgency} />
                        </div>

                        <div className="flex items-center space-x-2 text-xs text-slate-500">
                          <span className="font-semibold text-slate-700">{em.animalType} ({em.breed})</span>
                          <span>•</span>
                          <span>{new Date(em.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>

                        <p className="text-xs text-slate-600 line-clamp-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                          {em.description}
                        </p>

                        <div className="flex items-center space-x-1.5 text-xs text-slate-600">
                          <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <span className="truncate">{em.location?.address}</span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                        <Link
                          to={`/reports/${em._id}`}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center space-x-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </Link>

                        <button
                          onClick={() => handleAcceptRescue(em._id)}
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold transition shadow flex items-center justify-center space-x-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Accept & Dispatch Ambulance</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: My Active Missions */}
          {activeTab === 'my-cases' && (
            <div className="space-y-4">
              {myAssignments.length === 0 ? (
                <EmptyState
                  icon={ShieldAlert}
                  title="No Assigned Missions"
                  description="Accept open emergencies from the map or incoming queue to manage your active rescues."
                  actionText="View Open Emergencies"
                  onAction={() => setActiveTab('dispatch')}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {myAssignments.map((assignment) => (
                    <div
                      key={assignment._id}
                      className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between space-y-5"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="text-base font-bold text-slate-900">{assignment.title}</h3>
                            <p className="text-xs text-slate-500">
                              {assignment.animalType} ({assignment.breed}) • {assignment.location?.address}
                            </p>
                          </div>
                          <StatusBadge status={assignment.status} />
                        </div>

                        {/* Status Stepper Actions */}
                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                          <span className="text-[11px] font-bold text-slate-700 uppercase">
                            Dispatch Status Controller
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {assignment.status === 'ACCEPTED' && (
                              <button
                                onClick={() => handleUpdateStatus(assignment._id, 'EN_ROUTE')}
                                className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg shadow-sm"
                              >
                                🚑 Mark En Route
                              </button>
                            )}

                            {assignment.status === 'EN_ROUTE' && (
                              <button
                                onClick={() => handleUpdateStatus(assignment._id, 'ARRIVED')}
                                className="px-3 py-1.5 bg-purple-600 text-white text-xs font-bold rounded-lg shadow-sm"
                              >
                                📍 Mark Arrived on Scene
                              </button>
                            )}

                            {assignment.status === 'ARRIVED' && (
                              <button
                                onClick={() => handleUpdateStatus(assignment._id, 'RESCUED')}
                                className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg shadow-sm"
                              >
                                ✅ Mark Animal Rescued
                              </button>
                            )}

                            {assignment.status === 'RESCUED' && (
                              <button
                                onClick={() => handleOpenTransferModal(assignment)}
                                className="px-3 py-1.5 bg-cyan-600 text-white text-xs font-bold rounded-lg shadow-sm"
                              >
                                🏥 Transfer to Vet Hospital
                              </button>
                            )}

                            {['RESCUED', 'TRANSFERRED_VET', 'TRANSFERRED_SHELTER'].includes(assignment.status) && (
                              <button
                                onClick={() => handleUpdateStatus(assignment._id, 'RESOLVED')}
                                className="px-3 py-1.5 bg-green-700 text-white text-xs font-bold rounded-lg shadow-sm"
                              >
                                🏁 Mark Case Resolved
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <Link
                          to={`/reports/${assignment._id}`}
                          className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center space-x-1"
                        >
                          <span>Full Case Record & Timeline</span>
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Vet Hospital Transfer Modal */}
      {transferModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center space-x-2 text-cyan-900 font-bold">
              <Stethoscope className="w-5 h-5 text-cyan-600" />
              <h3 className="text-base">Transfer Animal to Vet Hospital</h3>
            </div>

            <p className="text-xs text-slate-500">
              Select the receiving veterinary trauma center for: <strong>{selectedCaseForVet?.title}</strong>
            </p>

            <form onSubmit={handleConfirmTransfer} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Receiving Veterinarian / Hospital
                </label>
                <select
                  required
                  value={selectedVetId}
                  onChange={(e) => setSelectedVetId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                >
                  {vetsList.map((vet) => (
                    <option key={vet._id} value={vet._id}>
                      Dr. {vet.name} ({vet.organizationName || 'Vet Clinic'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Handover Notes (Injuries, Vitals observed)
                </label>
                <textarea
                  rows={3}
                  value={transferNote}
                  onChange={(e) => setTransferNote(e.target.value)}
                  placeholder="e.g. Animal secured in carrier, bleeding staunched, alert but in shock."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTransferModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={transferring}
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold shadow disabled:opacity-50"
                >
                  {transferring ? 'Transferring...' : 'Confirm Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
