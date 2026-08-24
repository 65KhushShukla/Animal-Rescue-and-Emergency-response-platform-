import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import {
  ShieldCheck,
  Users,
  AlertTriangle,
  Heart,
  Stethoscope,
  Award,
  CheckCircle2,
  Trash2,
  Search,
  Filter,
} from 'lucide-react';

export const AdminDashboard = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics' | 'users'

  useEffect(() => {
    loadAdminData();
  }, [roleFilter]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, usersRes] = await Promise.all([
        api.get('/admin/analytics'),
        api.get(`/admin/users?role=${roleFilter}`),
      ]);

      if (analyticsRes.data.success) setAnalytics(analyticsRes.data.analytics);
      if (usersRes.data.success) setUsersList(usersRes.data.users || []);
    } catch (err) {
      console.warn('Admin load error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVerify = async (userId, currentVal) => {
    try {
      const res = await api.put(`/admin/users/${userId}`, { isVerified: !currentVal });
      if (res.data.success) {
        setUsersList((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, isVerified: !currentVal } : u))
        );
      }
    } catch (err) {
      alert('Failed to update verification status.');
    }
  };

  const handleChangeUserRole = async (userId, newRole) => {
    try {
      const res = await api.put(`/admin/users/${userId}`, { role: newRole });
      if (res.data.success) {
        setUsersList((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
        );
      }
    } catch (err) {
      alert('Failed to change role.');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to permanently delete this user account?')) return;
    try {
      const res = await api.delete(`/admin/users/${userId}`);
      if (res.data.success) {
        setUsersList((prev) => prev.filter((u) => u._id !== userId));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user.');
    }
  };

  const filteredUsers = usersList.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.organizationName && u.organizationName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-600 flex items-center justify-center text-2xl shadow-lg">
            ⚡
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-extrabold">{user?.name}</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-400/30">
                SYSTEM COMMAND
              </span>
            </div>
            <p className="text-xs text-slate-400">City-Wide Animal Rescue Command & Governance Center</p>
          </div>
        </div>

        {/* Global Overview pill */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 rounded-xl font-bold">
            ● Platform Operational
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-slate-200/80 rounded-2xl w-full sm:w-auto self-start">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'analytics' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          📊 Rescue Analytics & KPIs
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
            activeTab === 'users' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>👥 User Governance ({usersList.length})</span>
        </button>
      </div>

      {loading ? (
        <LoadingSpinner text="Compiling platform metrics..." />
      ) : (
        <>
          {/* TAB 1: Analytics & Metrics */}
          {activeTab === 'analytics' && analytics && (
            <div className="space-y-8">
              {/* Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
                    <span>Total Emergencies</span>
                    <AlertTriangle className="w-4 h-4 text-emergency-500" />
                  </div>
                  <p className="text-3xl font-extrabold text-slate-900">{analytics.totalReports}</p>
                  <p className="text-[11px] text-slate-400 mt-1">Logged across network</p>
                </div>

                <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
                    <span>Active Dispatches</span>
                    <span className="flex h-2.5 w-2.5 rounded-full bg-emergency-600 animate-ping"></span>
                  </div>
                  <p className="text-3xl font-extrabold text-emergency-600">{analytics.activeEmergencies}</p>
                  <p className="text-[11px] text-slate-400 mt-1">In field rescue</p>
                </div>

                <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
                    <span>In Clinical Care</span>
                    <Stethoscope className="w-4 h-4 text-cyan-600" />
                  </div>
                  <p className="text-3xl font-extrabold text-cyan-600">{analytics.inTreatment}</p>
                  <p className="text-[11px] text-slate-400 mt-1">Hospitalized / Rehab</p>
                </div>

                <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
                    <span>Successfully Resolved</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="text-3xl font-extrabold text-emerald-600">{analytics.resolvedCases}</p>
                  <p className="text-[11px] text-slate-400 mt-1">Life saved rate 96%</p>
                </div>
              </div>

              {/* Aggregation Breakdowns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Species Distribution */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                    Emergency Volume by Animal Species
                  </h3>
                  <div className="space-y-3">
                    {analytics.speciesBreakdown?.map((sp) => {
                      const pct = Math.round((sp.count / (analytics.totalReports || 1)) * 100);
                      return (
                        <div key={sp._id} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold text-slate-700">
                            <span>{sp._id || 'Other'}</span>
                            <span>{sp.count} cases ({pct}%)</span>
                          </div>
                          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-brand-500 rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Urgency & Shelter Impact */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                    Shelter & Volunteer Impact
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                      <p className="text-2xl font-bold text-amber-900">{analytics.totalShelterAnimals}</p>
                      <p className="text-xs text-amber-700 font-medium mt-0.5">Sheltered Animals</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200">
                      <p className="text-2xl font-bold text-purple-900">{analytics.totalVolunteerHours} hrs</p>
                      <p className="text-xs text-purple-700 font-medium mt-0.5">Community Volunteer Hours</p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <span className="text-xs font-bold text-slate-700 block">Active User Roles Breakdown:</span>
                    <div className="flex flex-wrap gap-2">
                      {analytics.userRoleBreakdown?.map((r) => (
                        <span
                          key={r._id}
                          className="px-3 py-1 bg-slate-100 rounded-xl text-xs font-semibold text-slate-700"
                        >
                          {r._id?.replace('_', ' ')}: <strong>{r.count}</strong>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: User Management Table */}
          {activeTab === 'users' && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  >
                    <option value="ALL">All Roles</option>
                    <option value="citizen">Citizens</option>
                    <option value="rescue_team">Rescue Teams</option>
                    <option value="veterinarian">Veterinarians</option>
                    <option value="shelter">Shelters</option>
                    <option value="volunteer">Volunteers</option>
                    <option value="admin">Admins</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-3">User</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Organization / Badge</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map((u) => (
                      <tr key={u._id} className="hover:bg-slate-50/60 transition">
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-900">{u.name}</p>
                          <p className="text-slate-400 text-[11px]">{u.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={u.role}
                            onChange={(e) => handleChangeUserRole(u._id, e.target.value)}
                            className="px-2 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold"
                          >
                            <option value="citizen">Citizen</option>
                            <option value="rescue_team">Rescue Team</option>
                            <option value="veterinarian">Veterinarian</option>
                            <option value="shelter">Shelter</option>
                            <option value="volunteer">Volunteer</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          <p>{u.organizationName || 'Individual'}</p>
                          {u.badgeNumber && <span className="text-[10px] text-slate-400">ID: {u.badgeNumber}</span>}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleToggleVerify(u._id, u.isVerified)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              u.isVerified
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {u.isVerified ? '✓ Verified' : 'Pending Verification'}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleDeleteUser(u._id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 transition"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
