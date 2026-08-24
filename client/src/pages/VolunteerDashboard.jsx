import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, UrgencyBadge } from '../components/common/StatusBadge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import {
  Users,
  Award,
  Clock,
  CheckCircle2,
  MapPin,
  Calendar,
  AlertTriangle,
  Heart,
  Plus,
} from 'lucide-react';

export const VolunteerDashboard = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [myStats, setMyStats] = useState({
    totalHours: 0,
    completedCount: 0,
    activeCount: 0,
    myTasks: [],
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('board'); // 'board' | 'my-duties'

  // Complete task modal
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [selectedTaskToComplete, setSelectedTaskToComplete] = useState(null);
  const [loggedHours, setLoggedHours] = useState('2');
  const [completionNotes, setCompletionNotes] = useState('');

  useEffect(() => {
    loadVolunteerData();
  }, []);

  const loadVolunteerData = async () => {
    setLoading(true);
    try {
      const [tasksRes, statsRes] = await Promise.all([
        api.get('/volunteers/tasks'),
        api.get('/volunteers/my-stats'),
      ]);

      if (tasksRes.data.success) setTasks(tasksRes.data.tasks || []);
      if (statsRes.data.success) setMyStats(statsRes.data.stats || {});
    } catch (err) {
      console.warn('Volunteer data error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimTask = async (taskId) => {
    try {
      const res = await api.put(`/volunteers/tasks/${taskId}/claim`);
      if (res.data.success) {
        alert('You have claimed this task! Thank you for supporting the rescue.');
        loadVolunteerData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to claim task.');
    }
  };

  const handleCompleteTask = async (e) => {
    e.preventDefault();
    if (!selectedTaskToComplete) return;

    try {
      const res = await api.put(`/volunteers/tasks/${selectedTaskToComplete._id}/complete`, {
        loggedHours,
        completionNotes,
      });

      if (res.data.success) {
        alert('Task completed and hours recorded! Great work.');
        setCompleteModalOpen(false);
        loadVolunteerData();
      }
    } catch (err) {
      alert('Failed to complete task.');
    }
  };

  const openTasks = tasks.filter((t) => t.status === 'OPEN');

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-600 flex items-center justify-center text-2xl shadow-lg">
            🙋
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold">{user?.name}</h1>
            <p className="text-xs text-slate-400">Volunteer Advocate & Animal Caregiver</p>
          </div>
        </div>

        {/* Volunteer Hours & Impact Stats */}
        <div className="flex items-center space-x-4 text-center">
          <div className="px-4 py-2 bg-white/10 rounded-2xl border border-white/10">
            <p className="text-xl font-extrabold text-amber-400">{myStats.totalHours} hrs</p>
            <p className="text-[10px] text-slate-400">Total Contributed</p>
          </div>
          <div className="px-4 py-2 bg-white/10 rounded-2xl border border-white/10">
            <p className="text-xl font-extrabold text-emerald-400">{myStats.completedCount}</p>
            <p className="text-[10px] text-slate-400">Tasks Completed</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-slate-200/80 rounded-2xl w-full sm:w-auto self-start">
        <button
          onClick={() => setActiveTab('board')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'board' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          📋 Available Community Tasks ({openTasks.length})
        </button>
        <button
          onClick={() => setActiveTab('my-duties')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'my-duties' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          ⭐ My Claimed Duties ({myStats.myTasks?.length || 0})
        </button>
      </div>

      {loading ? (
        <LoadingSpinner text="Fetching volunteer opportunities..." />
      ) : (
        <>
          {/* TAB 1: Open Volunteer Tasks */}
          {activeTab === 'board' && (
            <div className="space-y-4">
              {openTasks.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No Open Tasks at the Moment"
                  description="Check back shortly as rescue units and shelters post new community coordination needs."
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {openTasks.map((task) => (
                    <div
                      key={task._id}
                      className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-purple-100 text-purple-800">
                            {task.taskType?.replace('_', ' ')}
                          </span>
                          <UrgencyBadge urgency={task.urgency} />
                        </div>

                        <h3 className="text-base font-bold text-slate-900 leading-snug">
                          {task.title}
                        </h3>

                        <p className="text-xs text-slate-600 line-clamp-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                          {task.description}
                        </p>

                        <div className="text-[11px] text-slate-500 space-y-1">
                          {task.location?.address && (
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              <span className="truncate">{task.location.address}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>Estimated: ~{task.estimatedHours || 2} hours</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100">
                        <button
                          onClick={() => handleClaimTask(task._id)}
                          className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow flex items-center justify-center space-x-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Claim Task & Volunteer</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: My Claimed Tasks */}
          {activeTab === 'my-duties' && (
            <div className="space-y-4">
              {myStats.myTasks?.length === 0 ? (
                <EmptyState
                  icon={Award}
                  title="No Tasks Claimed Yet"
                  description="Explore open tasks on the board to sign up for rescue assistance and dog walking."
                  actionText="Explore Task Board"
                  onAction={() => setActiveTab('board')}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myStats.myTasks.map((task) => (
                    <div
                      key={task._id}
                      className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-800">
                            {task.taskType?.replace('_', ' ')}
                          </span>
                          <StatusBadge status={task.status} />
                        </div>

                        <h3 className="text-base font-bold text-slate-900">{task.title}</h3>
                        <p className="text-xs text-slate-600 line-clamp-2">{task.description}</p>
                      </div>

                      <div className="pt-3 border-t border-slate-100">
                        {task.status !== 'COMPLETED' ? (
                          <button
                            onClick={() => {
                              setSelectedTaskToComplete(task);
                              setCompleteModalOpen(true);
                            }}
                            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow"
                          >
                            Mark Completed & Log Hours
                          </button>
                        ) : (
                          <div className="text-center text-xs font-bold text-emerald-700 bg-emerald-50 py-1.5 rounded-lg border border-emerald-200">
                            ✓ {task.loggedHours || task.estimatedHours} Hours Credited
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Complete Task Modal */}
      {completeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center space-x-2 text-purple-900 font-bold">
              <Award className="w-5 h-5 text-purple-600" />
              <h3 className="text-base">Complete Volunteer Task</h3>
            </div>

            <form onSubmit={handleCompleteTask} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Hours Contributed
                </label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={loggedHours}
                  onChange={(e) => setLoggedHours(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Completion Notes / Feedback
                </label>
                <textarea
                  rows={2}
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  placeholder="e.g. Completed dog walking in North park, animals are calm and happy."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCompleteModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow"
                >
                  Record Impact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
