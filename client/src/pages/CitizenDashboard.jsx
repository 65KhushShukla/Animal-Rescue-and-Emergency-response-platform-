import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, UrgencyBadge } from '../components/common/StatusBadge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import {
  AlertTriangle,
  MapPin,
  Clock,
  Heart,
  Plus,
  Eye,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

export const CitizenDashboard = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const res = await api.get('/emergencies/my-reports');
      if (res.data.success) {
        setReports(res.data.reports || []);
      }
    } catch (err) {
      console.warn('Citizen dashboard load error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header Greeting Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">👋</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold">Welcome, {user?.name}</h1>
          </div>
          <p className="text-xs text-emerald-200">
            Citizen Dashboard • Track your reported distress cases and adoption requests
          </p>
        </div>

        <Link
          to="/report-emergency"
          className="px-5 py-3 bg-emergency-600 hover:bg-emergency-700 text-white rounded-2xl text-xs font-extrabold shadow-lg shadow-emergency-600/30 flex items-center space-x-2 transition transform active:scale-95"
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Report New Emergency</span>
        </Link>
      </div>

      {/* Main Content Area */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <span>🚨 My Reported Animal Emergencies</span>
            <span className="px-2 py-0.5 text-xs bg-slate-100 text-slate-700 rounded-full font-semibold">
              {reports.length}
            </span>
          </h2>
        </div>

        {loading ? (
          <LoadingSpinner text="Fetching your reported emergencies..." />
        ) : reports.length === 0 ? (
          <EmptyState
            icon={AlertTriangle}
            title="No Emergencies Reported Yet"
            description="If you come across an animal that is injured, trapped, or in danger, report it immediately to dispatch rescue teams."
            actionText="Report An Emergency"
            onAction={() => window.location.href = '/report-emergency'}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report) => (
              <div
                key={report._id}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <UrgencyBadge urgency={report.urgency} />
                    <StatusBadge status={report.status} />
                  </div>

                  <h3 className="text-base font-bold text-slate-900 line-clamp-1">
                    {report.title}
                  </h3>

                  <div className="flex items-center space-x-1.5 text-xs text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{report.location?.address}</span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {report.description}
                  </p>

                  <div className="text-[11px] text-slate-400 flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Reported on {new Date(report.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <Link
                    to={`/reports/${report._id}`}
                    className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold text-center transition flex items-center justify-center space-x-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Track Live Status Timeline</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
