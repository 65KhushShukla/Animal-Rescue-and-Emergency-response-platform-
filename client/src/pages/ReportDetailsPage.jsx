import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, UrgencyBadge } from '../components/common/StatusBadge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import {
  MapPin,
  Calendar,
  User,
  Shield,
  Stethoscope,
  Home,
  CheckCircle2,
  Clock,
  Camera,
  MessageSquare,
  AlertTriangle,
  Upload,
  ArrowLeft,
  Utensils,
  Footprints,
  Pill,
} from 'lucide-react';

const STATUS_STEPS = [
  { key: 'REPORTED', label: 'Reported' },
  { key: 'ACCEPTED', label: 'Accepted' },
  { key: 'EN_ROUTE', label: 'En Route' },
  { key: 'ARRIVED', label: 'Arrived' },
  { key: 'RESCUED', label: 'Rescued' },
  { key: 'TRANSFERRED_VET', label: 'At Hospital' },
  { key: 'TRANSFERRED_SHELTER', label: 'In Shelter' },
  { key: 'RESOLVED', label: 'Resolved' },
];

export const ReportDetailsPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [emergency, setEmergency] = useState(null);
  const [medicalRecord, setMedicalRecord] = useState(null);
  const [shelterRecord, setShelterRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Add timeline update state
  const [updateNote, setUpdateNote] = useState('');
  const [updateStatus, setUpdateStatus] = useState('');
  const [updatePhoto, setUpdatePhoto] = useState(null);
  const [submittingUpdate, setSubmittingUpdate] = useState(false);

  useEffect(() => {
    fetchEmergencyDetails();
  }, [id]);

  const fetchEmergencyDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/emergencies/${id}`);
      if (res.data.success) {
        setEmergency(res.data.emergency);
        setUpdateStatus(res.data.emergency.status);

        if (res.data.medicalRecord) {
          setMedicalRecord(res.data.medicalRecord);
        }
        if (res.data.shelterRecord) {
          setShelterRecord(res.data.shelterRecord);
        }

        // Fallback fetch medical record if not embedded
        if (!res.data.medicalRecord) {
          try {
            const medRes = await api.get(`/medical/record/${id}`);
            if (medRes.data.success && medRes.data.record) {
              setMedicalRecord(medRes.data.record);
            }
          } catch (e) {}
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load report details.');
    } finally {
      setLoading(false);
    }
  };

  const handleTimelineSubmit = async (e) => {
    e.preventDefault();
    if (!updateNote) return;

    setSubmittingUpdate(true);
    try {
      const formData = new FormData();
      formData.append('note', updateNote);
      if (updateStatus) formData.append('status', updateStatus);
      if (updatePhoto) formData.append('photo', updatePhoto);

      const res = await api.post(`/emergencies/${id}/timeline`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        setEmergency(res.data.emergency);
        setUpdateNote('');
        setUpdatePhoto(null);
        fetchEmergencyDetails();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add update.');
    } finally {
      setSubmittingUpdate(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Fetching emergency case details..." size="large" />;
  }

  if (error || !emergency) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 text-center">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-800">Report Not Found</h2>
        <p className="text-sm text-slate-500 mt-1">{error || 'This emergency report does not exist.'}</p>
        <Link
          to="/rescues"
          className="mt-4 inline-flex items-center space-x-1 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Live Rescues</span>
        </Link>
      </div>
    );
  }

  const currentStepIndex = STATUS_STEPS.findIndex((s) => s.key === emergency.status);
  const assignedVetObj = emergency.assignedVet || medicalRecord?.vetId;
  const assignedShelterObj = emergency.assignedShelter || shelterRecord?.shelterId || medicalRecord?.referredShelterId;

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Top Breadcrumb & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to="/rescues"
          className="inline-flex items-center space-x-1 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Map / Feed</span>
        </Link>

        <div className="flex items-center space-x-2">
          <UrgencyBadge urgency={emergency.urgency} />
          <StatusBadge status={emergency.status} />
        </div>
      </div>

      {/* Case Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {emergency.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
              <span className="flex items-center space-x-1">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>{emergency.location?.address}</span>
              </span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>{new Date(emergency.createdAt).toLocaleString()}</span>
              </span>
              <span>•</span>
              <span>Animal: <strong className="text-slate-700">{emergency.animalType} ({emergency.breed})</strong></span>
            </div>
          </div>
        </div>

        {/* Workflow Progression Stepper */}
        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-xs font-bold text-slate-700 uppercase mb-4 tracking-wider">
            Rescue Workflow Status Tracker
          </h3>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {STATUS_STEPS.map((step, idx) => {
              const isPast = idx <= currentStepIndex;
              const isCurrent = idx === currentStepIndex;

              return (
                <div
                  key={step.key}
                  className={`p-2.5 rounded-xl border text-center flex flex-col items-center justify-center transition ${
                    isCurrent
                      ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-800 font-bold'
                      : isPast
                      ? 'bg-slate-50 border-slate-300 text-slate-700 font-medium'
                      : 'bg-white border-dashed border-slate-200 text-slate-400 opacity-60'
                  }`}
                >
                  <span className="text-xs mb-1">
                    {isCurrent ? '📍' : isPast ? '✓' : '○'}
                  </span>
                  <span className="text-[11px] leading-tight">{step.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid: Media, Location & Assigned Personnel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Media, Clinical Chart & Activity Timeline (8 cols) */}
        <div className="lg:col-span-8 space-y-8">
          {/* Incident Media */}
          {emergency.media && emergency.media.length > 0 && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Field Photos & Evidence
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {emergency.media.map((item, idx) => (
                  <div key={idx} className="h-60 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                    <img
                      src={item.url}
                      alt={`Emergency evidence ${idx + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition duration-300"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description & Symptoms */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Distress Details & Symptoms
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
              {emergency.description}
            </p>

            {emergency.symptoms && emergency.symptoms.length > 0 && (
              <div>
                <span className="text-xs font-semibold text-slate-600 block mb-2">Reported Symptoms:</span>
                <div className="flex flex-wrap gap-1.5">
                  {emergency.symptoms.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-medium"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Veterinary Clinical Chart if available */}
          {medicalRecord && (
            <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-3xl p-6 sm:p-8 border border-cyan-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-cyan-900 font-bold">
                  <Stethoscope className="w-5 h-5 text-cyan-600" />
                  <h3 className="text-base">Veterinary Medical Record</h3>
                </div>
                {medicalRecord.vetId?.name && (
                  <span className="text-xs font-semibold text-cyan-800 bg-white/80 px-2.5 py-1 rounded-full border border-cyan-200">
                    Attending: Dr. {medicalRecord.vetId.name}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/80 p-3.5 rounded-2xl border border-cyan-100 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Patient Name</span>
                  <span className="font-bold text-slate-800">{medicalRecord.animalName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Weight</span>
                  <span className="font-bold text-slate-800">{medicalRecord.vitals?.weightKg || 'N/A'} kg</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Temp</span>
                  <span className="font-bold text-slate-800">{medicalRecord.vitals?.temperatureC || 'N/A'} °C</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Clinical Status</span>
                  <span className="font-bold text-cyan-700">{medicalRecord.status}</span>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="font-bold text-slate-800">Diagnosis: </span>
                  <span className="text-slate-700">{medicalRecord.diagnosis}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-800">Treatment Plan: </span>
                  <span className="text-slate-700">{medicalRecord.treatmentPlan}</span>
                </div>
                {medicalRecord.dischargeNotes && (
                  <div>
                    <span className="font-bold text-slate-800">Discharge Notes: </span>
                    <span className="text-slate-700">{medicalRecord.dischargeNotes}</span>
                  </div>
                )}
              </div>

              {medicalRecord.medications?.length > 0 && (
                <div className="bg-white/80 p-3.5 rounded-2xl border border-cyan-100">
                  <span className="text-xs font-bold text-slate-800 block mb-2">Prescribed Medications:</span>
                  <ul className="space-y-1.5 text-xs text-slate-600">
                    {medicalRecord.medications.map((m, i) => (
                      <li key={i} className="flex items-center justify-between border-b border-slate-100 pb-1">
                        <span className="font-medium text-slate-800">{m.name} ({m.dosage})</span>
                        <span className="text-slate-500">{m.frequency} • {m.duration}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Shelter Rehabilitation & Housing Card if available */}
          {shelterRecord && (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-6 sm:p-8 border border-amber-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-amber-900 font-bold">
                  <Home className="w-5 h-5 text-amber-600" />
                  <h3 className="text-base">Shelter Housing & Rehabilitation</h3>
                </div>
                <StatusBadge status={shelterRecord.adoptionStatus} />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-white/80 p-3.5 rounded-2xl border border-amber-100 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Kennel / Enclosure</span>
                  <span className="font-bold text-slate-800">#{shelterRecord.kennelNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Dietary Plan</span>
                  <span className="font-bold text-slate-800">{shelterRecord.dietaryPlan}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Adoption Status</span>
                  <span className="font-bold text-amber-800">{shelterRecord.adoptionStatus.replace('_', ' ')}</span>
                </div>
              </div>

              {shelterRecord.dailyCareLogs?.length > 0 && (
                <div className="bg-white/80 p-3.5 rounded-2xl border border-amber-100 space-y-2">
                  <span className="text-xs font-bold text-slate-800 block">Recent Care Logs:</span>
                  <div className="space-y-2 text-xs">
                    {shelterRecord.dailyCareLogs.slice(0, 3).map((log, i) => (
                      <div key={i} className="p-2 bg-amber-50/50 rounded-xl border border-amber-100 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-slate-800">{log.notes || 'Routine daily care complete.'}</p>
                          <p className="text-[10px] text-slate-400">{log.caregiverName} • {new Date(log.date).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center space-x-2 text-[11px] text-slate-600">
                          {log.fed && <span>🍲 Fed</span>}
                          {log.walked && <span>🦮 Walked</span>}
                          {log.medicationGiven && <span>💊 Meds</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Activity Timeline Stream */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Chronological Incident Timeline
            </h3>

            <div className="relative pl-6 space-y-6 border-l-2 border-slate-200">
              {emergency.timeline?.map((entry, idx) => (
                <div key={idx} className="relative space-y-1.5">
                  <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-brand-500 border-2 border-white ring-2 ring-brand-100"></div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{entry.updatedByName || 'Platform System'}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(entry.timestamp).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {entry.note}
                  </p>

                  {entry.photoUrl && (
                    <div className="h-36 w-48 rounded-xl overflow-hidden border border-slate-200 mt-2">
                      <img src={entry.photoUrl} alt="Timeline progress" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Timeline Update Form (for teams/admin/vets/shelters) */}
            {user && (
              <form onSubmit={handleTimelineSubmit} className="pt-4 border-t border-slate-100 space-y-3">
                <span className="text-xs font-bold text-slate-700">Add Field Update / Progress Note</span>
                <textarea
                  rows={2}
                  required
                  value={updateNote}
                  onChange={(e) => setUpdateNote(e.target.value)}
                  placeholder="Enter update note (e.g. Arrived on scene, animal secured in ambulance carrier)..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-brand-500"
                />

                <div className="flex items-center justify-between gap-3">
                  <label className="cursor-pointer text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center space-x-1">
                    <Camera className="w-4 h-4 text-slate-400" />
                    <span>{updatePhoto ? updatePhoto.name : 'Attach Photo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setUpdatePhoto(e.target.files[0])}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="submit"
                    disabled={submittingUpdate}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
                  >
                    {submittingUpdate ? 'Posting...' : 'Post Update'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Right Column: Key Contacts & Assignment Cards (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Rescue Team Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
              <Shield className="w-4 h-4 text-blue-600" />
              <span>Assigned Rescue Team</span>
            </div>

            {emergency.assignedTeam ? (
              <div className="space-y-1 text-xs">
                <p className="font-bold text-slate-800 text-sm">{emergency.assignedTeam.name}</p>
                <p className="text-slate-500">{emergency.assignedTeam.organizationName || 'Field Rescue Unit'}</p>
                {emergency.assignedTeam.phone && (
                  <p className="text-brand-600 font-medium pt-1">📞 {emergency.assignedTeam.phone}</p>
                )}
                {emergency.assignedTeam.badgeNumber && (
                  <p className="text-slate-400 text-[10px]">Badge: {emergency.assignedTeam.badgeNumber}</p>
                )}
              </div>
            ) : (
              <p className="text-xs text-amber-600 font-medium">
                ⏳ Waiting for nearby rescue team to accept dispatch.
              </p>
            )}
          </div>

          {/* Veterinarian Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
              <Stethoscope className="w-4 h-4 text-cyan-600" />
              <span>Assigned Vet Hospital</span>
            </div>

            {assignedVetObj ? (
              <div className="space-y-1 text-xs">
                <p className="font-bold text-slate-800 text-sm">Dr. {assignedVetObj.name}</p>
                <p className="text-slate-500">{assignedVetObj.organizationName || 'Veterinary Trauma Hospital'}</p>
                {assignedVetObj.phone && (
                  <p className="text-cyan-700 font-medium pt-1">📞 {assignedVetObj.phone}</p>
                )}
                {assignedVetObj.address && (
                  <p className="text-slate-400 text-[11px]">📍 {assignedVetObj.address}</p>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                Will be assigned upon rescue team handover.
              </p>
            )}
          </div>

          {/* Shelter Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
              <Home className="w-4 h-4 text-amber-600" />
              <span>Shelter & Rehabilitation</span>
            </div>

            {assignedShelterObj ? (
              <div className="space-y-1 text-xs">
                <p className="font-bold text-slate-800 text-sm">{assignedShelterObj.name}</p>
                <p className="text-slate-500">{assignedShelterObj.organizationName || 'Animal Rehabilitation Sanctuary'}</p>
                {assignedShelterObj.phone && (
                  <p className="text-amber-700 font-medium pt-1">📞 {assignedShelterObj.phone}</p>
                )}
                {assignedShelterObj.address && (
                  <p className="text-slate-400 text-[11px]">📍 {assignedShelterObj.address}</p>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                To be admitted post veterinary stabilization.
              </p>
            )}
          </div>

          {/* Reporter Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
              <User className="w-4 h-4 text-slate-600" />
              <span>Reported By</span>
            </div>
            <div className="space-y-1 text-xs">
              <p className="font-bold text-slate-800">{emergency.reporter?.name || 'Concerned Citizen'}</p>
              {emergency.reporter?.phone && <p className="text-slate-500">📞 {emergency.reporter.phone}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
