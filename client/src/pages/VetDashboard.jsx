import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, UrgencyBadge } from '../components/common/StatusBadge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import {
  Stethoscope,
  Plus,
  Trash2,
  CheckCircle2,
  ClipboardList,
  Home,
  Clock,
  User,
  HeartPulse,
  Pill,
  Save,
  RotateCcw,
  Shield,
  MapPin,
} from 'lucide-react';

export const VetDashboard = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [myRecords, setMyRecords] = useState([]);
  const [sheltersList, setSheltersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [queueFilter, setQueueFilter] = useState('ALL'); // 'ALL' | 'REPORTED' | 'TRANSFERRED_VET' | 'MY_PATIENTS'
  const [refreshing, setRefreshing] = useState(false);

  // Medical Chart Form State
  const [chartForm, setChartForm] = useState({
    animalName: '',
    animalType: 'Dog',
    weightKg: '',
    temperatureC: '',
    heartRateBpm: '',
    hydrationStatus: 'Normal',
    diagnosis: '',
    treatmentPlan: '',
    status: 'UNDER_TREATMENT',
    referToShelter: false,
    referredShelterId: '',
    dischargeNotes: '',
  });

  const [medications, setMedications] = useState([
    { name: '', dosage: '', frequency: 'Twice daily with food', duration: '5 days', instructions: '' },
  ]);

  const [savingChart, setSavingChart] = useState(false);

  useEffect(() => {
    loadVetData();
  }, []);

  const loadVetData = async (keepCurrentId = null) => {
    setLoading(true);
    try {
      const [patientsRes, recordsRes, sheltersRes] = await Promise.all([
        api.get('/medical/patients'),
        api.get('/medical/my-records'),
        api.get('/auth/directory?role=shelter').catch(() => ({ data: { users: [] } })),
      ]);

      if (sheltersRes.data?.users) {
        setSheltersList(sheltersRes.data.users);
      }

      if (recordsRes.data.success) {
        setMyRecords(recordsRes.data.records || []);
      }

      if (patientsRes.data.success) {
        const fetchedPatients = patientsRes.data.patients || [];
        setPatients(fetchedPatients);

        if (fetchedPatients.length > 0) {
          const targetId = keepCurrentId || selectedPatient?._id;
          const found = targetId ? fetchedPatients.find((p) => p._id === targetId) : null;
          handleSelectPatient(found || fetchedPatients[0]);
        } else {
          setSelectedPatient(null);
        }
      }
    } catch (err) {
      console.warn('Vet dashboard error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleManualRefresh = () => {
    setRefreshing(true);
    loadVetData(selectedPatient?._id);
  };

  const handleSelectPatient = async (patient) => {
    if (!patient) return;
    setSelectedPatient(patient);
    // Try to load existing medical record if available
    try {
      const res = await api.get(`/medical/record/${patient._id}`);
      if (res.data.success && res.data.record) {
        const r = res.data.record;
        setChartForm({
          animalName: r.animalName || '',
          animalType: r.animalType || patient.animalType,
          weightKg: r.vitals?.weightKg || '',
          temperatureC: r.vitals?.temperatureC || '',
          heartRateBpm: r.vitals?.heartRateBpm || '',
          hydrationStatus: r.vitals?.hydrationStatus || 'Normal',
          diagnosis: r.diagnosis || '',
          treatmentPlan: r.treatmentPlan || '',
          status: r.status || 'UNDER_TREATMENT',
          referToShelter: Boolean(r.referToShelter),
          referredShelterId: r.referredShelterId?._id || r.referredShelterId || '',
          dischargeNotes: r.dischargeNotes || '',
        });
        setMedications(
          r.medications?.length > 0
            ? r.medications
            : [{ name: '', dosage: '', frequency: 'Twice daily', duration: '5 days', instructions: '' }]
        );
      } else {
        setChartForm({
          animalName: `${patient.animalType} #${patient._id.slice(-4)}`,
          animalType: patient.animalType,
          weightKg: '',
          temperatureC: '',
          heartRateBpm: '',
          hydrationStatus: 'Normal',
          diagnosis: '',
          treatmentPlan: '',
          status: 'UNDER_TREATMENT',
          referToShelter: false,
          referredShelterId: '',
          dischargeNotes: '',
        });
        setMedications([{ name: '', dosage: '', frequency: 'Twice daily with food', duration: '5 days', instructions: '' }]);
      }
    } catch (e) {}
  };

  const handleAddMedicationRow = () => {
    setMedications([...medications, { name: '', dosage: '', frequency: 'Twice daily', duration: '5 days', instructions: '' }]);
  };

  const handleRemoveMedicationRow = (idx) => {
    setMedications(medications.filter((_, i) => i !== idx));
  };

  const handleMedChange = (idx, field, val) => {
    const updated = [...medications];
    updated[idx][field] = val;
    setMedications(updated);
  };

  const handleSaveMedicalChart = async (e) => {
    e.preventDefault();
    if (!selectedPatient) return;

    setSavingChart(true);
    try {
      const validMeds = medications.filter((m) => m.name.trim() !== '');

      const payload = {
        reportId: selectedPatient._id,
        animalName: chartForm.animalName,
        animalType: chartForm.animalType,
        vitals: {
          weightKg: chartForm.weightKg ? parseFloat(chartForm.weightKg) : 0,
          temperatureC: chartForm.temperatureC ? parseFloat(chartForm.temperatureC) : 0,
          heartRateBpm: chartForm.heartRateBpm ? parseInt(chartForm.heartRateBpm) : 0,
          hydrationStatus: chartForm.hydrationStatus,
        },
        diagnosis: chartForm.diagnosis,
        treatmentPlan: chartForm.treatmentPlan,
        medications: validMeds,
        status: chartForm.status,
        dischargeNotes: chartForm.dischargeNotes,
        referToShelter: chartForm.referToShelter,
        referredShelterId: chartForm.referredShelterId || null,
      };

      const res = await api.post('/medical', payload);
      if (res.data.success) {
        alert('Medical chart saved successfully!');
        loadVetData(selectedPatient._id);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save medical chart.');
    } finally {
      setSavingChart(false);
    }
  };

  const filteredPatients = patients.filter((p) => {
    if (queueFilter === 'ALL') return true;
    if (queueFilter === 'REPORTED') return p.status === 'REPORTED';
    if (queueFilter === 'TRANSFERRED_VET') return p.status === 'TRANSFERRED_VET';
    if (queueFilter === 'MY_PATIENTS') return p.assignedVet?._id === user?._id || p.assignedVet === user?._id;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-cyan-600 flex items-center justify-center text-2xl shadow-lg">
            🩺
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-extrabold">Dr. {user?.name}</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-400/30">
                {user?.badgeNumber || 'DVM-LICENSED'}
              </span>
            </div>
            <p className="text-xs text-slate-400">{user?.organizationName || 'Veterinary Trauma Hospital'}</p>
          </div>
        </div>

        <div className="flex items-center space-x-4 text-center">
          <div className="px-4 py-2 bg-white/10 rounded-2xl border border-white/10">
            <p className="text-xl font-extrabold text-cyan-400">{patients.length}</p>
            <p className="text-[10px] text-slate-400">Patients in Queue</p>
          </div>
          <div className="px-4 py-2 bg-white/10 rounded-2xl border border-white/10">
            <p className="text-xl font-extrabold text-emerald-400">{myRecords.length}</p>
            <p className="text-[10px] text-slate-400">Charts Treated</p>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Loading clinical patients queue..." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Patient Intake Queue (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
                <span>🏥 Intake & Trauma Queue</span>
                <span className="px-2 py-0.5 text-xs bg-cyan-100 text-cyan-800 rounded-full font-bold">
                  {filteredPatients.length}
                </span>
              </h2>

              <button
                onClick={handleManualRefresh}
                title="Refresh Intake Queue"
                className="p-1.5 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-xl transition"
              >
                <RotateCcw className={`w-4 h-4 ${refreshing ? 'animate-spin text-cyan-600' : ''}`} />
              </button>
            </div>

            {/* Queue Filter Pills */}
            <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-2xl text-[11px] font-bold">
              <button
                onClick={() => setQueueFilter('ALL')}
                className={`px-2.5 py-1 rounded-xl transition ${
                  queueFilter === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                All ({patients.length})
              </button>
              <button
                onClick={() => setQueueFilter('REPORTED')}
                className={`px-2.5 py-1 rounded-xl transition ${
                  queueFilter === 'REPORTED' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                🚨 New Alerts
              </button>
              <button
                onClick={() => setQueueFilter('TRANSFERRED_VET')}
                className={`px-2.5 py-1 rounded-xl transition ${
                  queueFilter === 'TRANSFERRED_VET' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                🚑 Inbound
              </button>
            </div>

            {filteredPatients.length === 0 ? (
              <div className="p-6 bg-white rounded-3xl border border-slate-200 text-center text-xs text-slate-400">
                No active patients match this filter.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPatients.map((patient) => {
                  const isSelected = selectedPatient?._id === patient._id;
                  return (
                    <div
                      key={patient._id}
                      onClick={() => handleSelectPatient(patient)}
                      className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col space-y-2 ${
                        isSelected
                          ? 'bg-cyan-50 border-cyan-500 ring-2 ring-cyan-500/20 shadow-sm'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className="text-xs font-bold text-slate-900 line-clamp-1">{patient.title}</span>
                        <UrgencyBadge urgency={patient.urgency} />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>{patient.animalType} ({patient.breed || 'Mix'})</span>
                        <StatusBadge status={patient.status} />
                      </div>

                      {patient.assignedTeam && (
                        <div className="text-[10px] text-blue-700 bg-blue-50/80 px-2 py-1 rounded-lg flex items-center space-x-1">
                          <Shield className="w-3 h-3" />
                          <span>Team: {patient.assignedTeam.name}</span>
                        </div>
                      )}

                      <p className="text-[11px] text-slate-600 line-clamp-2 bg-slate-50 p-2 rounded-lg">
                        {patient.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Medical Examination & Prescription Chart (8 cols) */}
          <div className="lg:col-span-8">
            {selectedPatient ? (
              <form onSubmit={handleSaveMedicalChart} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center space-x-2">
                    <HeartPulse className="w-5 h-5 text-cyan-600" />
                    <div>
                      <h2 className="text-base font-bold text-slate-900">
                        Clinical Chart: {selectedPatient.title}
                      </h2>
                      <span className="text-xs text-slate-400">Incident ID: #{selectedPatient._id.slice(-6)}</span>
                    </div>
                  </div>
                  <Link
                    to={`/reports/${selectedPatient._id}`}
                    target="_blank"
                    className="text-xs text-cyan-700 font-semibold hover:underline"
                  >
                    View Emergency Details ↗
                  </Link>
                </div>

                {/* Section: Animal Identity & Vitals */}
                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-700 uppercase">Patient Vitals</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-1">Patient Name</label>
                      <input
                        type="text"
                        value={chartForm.animalName}
                        onChange={(e) => setChartForm({ ...chartForm, animalName: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-1">Weight (kg)</label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="e.g. 14.5"
                        value={chartForm.weightKg}
                        onChange={(e) => setChartForm({ ...chartForm, weightKg: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-1">Temp (°C)</label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="e.g. 38.5"
                        value={chartForm.temperatureC}
                        onChange={(e) => setChartForm({ ...chartForm, temperatureC: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-1">Hydration</label>
                      <select
                        value={chartForm.hydrationStatus}
                        onChange={(e) => setChartForm({ ...chartForm, hydrationStatus: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                      >
                        <option value="Normal">Normal</option>
                        <option value="Mildly Dehydrated">Mildly Dehydrated</option>
                        <option value="Severely Dehydrated">Severely Dehydrated</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section: Diagnosis & Treatment Plan */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Clinical Diagnosis <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Fractured right femur, lacerations staunched, moderate shock"
                      value={chartForm.diagnosis}
                      onChange={(e) => setChartForm({ ...chartForm, diagnosis: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Treatment Plan & Surgical Notes <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      required
                      placeholder="e.g. Splint applied, wound cleaned with antiseptic, antibiotic course initiated..."
                      value={chartForm.treatmentPlan}
                      onChange={(e) => setChartForm({ ...chartForm, treatmentPlan: e.target.value })}
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:bg-white focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                </div>

                {/* Section: Digital Prescriptions */}
                <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800 uppercase">
                      <Pill className="w-4 h-4 text-cyan-600" />
                      <span>Prescriptions & Medications</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddMedicationRow}
                      className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-cyan-700 hover:bg-cyan-50 transition"
                    >
                      + Add Medication
                    </button>
                  </div>

                  {medications.map((med, idx) => (
                    <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-white p-3 rounded-xl border border-slate-200">
                      <div className="sm:col-span-4">
                        <input
                          type="text"
                          placeholder="Drug name (e.g. Amoxicillin)"
                          value={med.name}
                          onChange={(e) => handleMedChange(idx, 'name', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          placeholder="Dosage (250mg)"
                          value={med.dosage}
                          onChange={(e) => handleMedChange(idx, 'dosage', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <input
                          type="text"
                          placeholder="Frequency (Twice daily)"
                          value={med.frequency}
                          onChange={(e) => handleMedChange(idx, 'frequency', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          placeholder="Duration (7 days)"
                          value={med.duration}
                          onChange={(e) => handleMedChange(idx, 'duration', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                      <div className="sm:col-span-1 text-center">
                        {medications.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMedicationRow(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Section: Clinical Status & Shelter Referral */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Clinical Status
                    </label>
                    <select
                      value={chartForm.status}
                      onChange={(e) => setChartForm({ ...chartForm, status: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                    >
                      <option value="UNDER_TREATMENT">Under Treatment / Hospitalized</option>
                      <option value="CRITICAL_CARE">Critical ICU Care</option>
                      <option value="SURGERY_RECOVERY">Surgery Recovery</option>
                      <option value="STABLE">Stable / Ready for Discharge</option>
                      <option value="DISCHARGED">Discharged</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Discharge / Shelter Referral
                    </label>
                    <div className="flex items-center space-x-2 pt-2">
                      <input
                        type="checkbox"
                        id="referToShelter"
                        checked={chartForm.referToShelter}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          setChartForm({
                            ...chartForm,
                            referToShelter: isChecked,
                            referredShelterId:
                              isChecked && !chartForm.referredShelterId && sheltersList.length > 0
                                ? sheltersList[0]._id
                                : chartForm.referredShelterId,
                          });
                        }}
                        className="w-4 h-4 text-cyan-600 rounded cursor-pointer"
                      />
                      <label htmlFor="referToShelter" className="text-xs font-medium text-slate-700 cursor-pointer">
                        Refer to Shelter for Long-term Rehab & Adoption
                      </label>
                    </div>

                    {chartForm.referToShelter && (
                      <select
                        value={chartForm.referredShelterId}
                        onChange={(e) => setChartForm({ ...chartForm, referredShelterId: e.target.value })}
                        className="w-full mt-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                      >
                        <option value="">Select Receiving Shelter...</option>
                        {sheltersList.map((sh) => (
                          <option key={sh._id} value={sh._id}>
                            {sh.name} ({sh.organizationName || 'Sanctuary'})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    type="submit"
                    disabled={savingChart}
                    className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold shadow-md shadow-cyan-600/20 transition flex items-center space-x-2 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{savingChart ? 'Saving Clinical Chart...' : 'Save & Publish Medical Record'}</span>
                  </button>
                </div>
              </form>
            ) : (
              <EmptyState
                icon={Stethoscope}
                title="Select Patient to Open Clinical Chart"
                description="Choose an incoming emergency or rescued patient from the queue to start examination."
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
