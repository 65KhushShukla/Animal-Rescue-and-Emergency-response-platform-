import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import {
  Home,
  Plus,
  CheckCircle2,
  Heart,
  Calendar,
  Utensils,
  Footprints,
  Pill,
  User,
  Upload,
  X,
  Stethoscope,
  ArrowRight,
  Shield,
} from 'lucide-react';

export const ShelterDashboard = () => {
  const { user } = useAuth();
  const [animals, setAnimals] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [incomingReferrals, setIncomingReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('animals'); // 'animals' | 'referrals' | 'admit' | 'inquiries'

  // Admit form state
  const [admitForm, setAdmitForm] = useState({
    reportId: '',
    medicalRecordId: '',
    animalName: '',
    animalType: 'Dog',
    breed: '',
    gender: 'Male',
    estimatedAge: 'Adult',
    kennelNumber: '',
    dietaryPlan: 'Standard high-protein formula',
    behaviorNotes: 'Friendly, enjoys human contact',
    adoptionStatus: 'IN_RECOVERY',
    bio: '',
    isGoodWithKids: true,
    isGoodWithPets: true,
    isSpayedNeutered: false,
    isVaccinated: false,
    adoptionFee: '50',
  });
  const [admitPhotos, setAdmitPhotos] = useState([]);
  const [submittingAdmit, setSubmittingAdmit] = useState(false);

  // Daily Care Log Modal
  const [careModalOpen, setCareModalOpen] = useState(false);
  const [selectedAnimalForCare, setSelectedAnimalForCare] = useState(null);
  const [careLogForm, setCareLogForm] = useState({
    fed: true,
    walked: true,
    medicationGiven: false,
    notes: '',
  });

  useEffect(() => {
    loadShelterData();
  }, []);

  const loadShelterData = async () => {
    setLoading(true);
    try {
      const [animalsRes, inquiriesRes, referralsRes] = await Promise.all([
        api.get('/shelter/my-animals'),
        api.get('/shelter/inquiries'),
        api.get('/shelter/incoming-referrals').catch(() => ({ data: { referrals: [] } })),
      ]);

      if (animalsRes.data.success) setAnimals(animalsRes.data.records || []);
      if (inquiriesRes.data.success) setInquiries(inquiriesRes.data.inquiries || []);
      if (referralsRes.data.success) setIncomingReferrals(referralsRes.data.referrals || []);
    } catch (err) {
      console.warn('Shelter dashboard error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePreFillFromReferral = (referral) => {
    const em = referral.emergency;
    const med = referral.medicalRecord;

    setAdmitForm({
      reportId: em._id,
      medicalRecordId: med?._id || '',
      animalName: med?.animalName || em.title || `${em.animalType} #${em._id.slice(-4)}`,
      animalType: em.animalType || 'Dog',
      breed: em.breed || 'Mixed Breed',
      gender: med?.gender || 'Unknown',
      estimatedAge: em.estimatedAge || 'Adult',
      kennelNumber: '',
      dietaryPlan: med?.treatmentPlan ? `Rehab diet: ${med.treatmentPlan}` : 'Standard high-protein formula',
      behaviorNotes: `Intake from ${em.location?.address}. ${em.description}`,
      adoptionStatus: 'IN_RECOVERY',
      bio: `${em.animalType} rescued from ${em.location?.address}. Clinically stabilized and now recovering nicely at our sanctuary!`,
      isGoodWithKids: true,
      isGoodWithPets: true,
      isSpayedNeutered: false,
      isVaccinated: med?.vaccinations?.length > 0,
      adoptionFee: '50',
    });

    setActiveTab('admit');
  };

  const handleAdmitSubmit = async (e) => {
    e.preventDefault();
    setSubmittingAdmit(true);

    try {
      const formData = new FormData();
      Object.keys(admitForm).forEach((key) => {
        if (admitForm[key] !== undefined && admitForm[key] !== null) {
          formData.append(key, admitForm[key]);
        }
      });

      admitPhotos.forEach((photo) => {
        formData.append('photos', photo);
      });

      const res = await api.post('/shelter/admit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        alert('Animal admitted into shelter successfully!');
        setAdmitForm({
          reportId: '',
          medicalRecordId: '',
          animalName: '',
          animalType: 'Dog',
          breed: '',
          gender: 'Male',
          estimatedAge: 'Adult',
          kennelNumber: '',
          dietaryPlan: 'Standard formula',
          behaviorNotes: '',
          adoptionStatus: 'IN_RECOVERY',
          bio: '',
          isGoodWithKids: true,
          isGoodWithPets: true,
          isSpayedNeutered: false,
          isVaccinated: false,
          adoptionFee: '50',
        });
        setAdmitPhotos([]);
        setActiveTab('animals');
        loadShelterData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to admit animal.');
    } finally {
      setSubmittingAdmit(false);
    }
  };

  const handleUpdateStatus = async (animalId, adoptionStatus) => {
    try {
      const res = await api.put(`/shelter/${animalId}/adoption-status`, { adoptionStatus });
      if (res.data.success) {
        alert(`Status updated to ${adoptionStatus.replace('_', ' ')}!`);
        loadShelterData();
      }
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  const handleLogCare = async (e) => {
    e.preventDefault();
    if (!selectedAnimalForCare) return;

    try {
      const res = await api.post(`/shelter/${selectedAnimalForCare._id}/care-log`, careLogForm);
      if (res.data.success) {
        alert('Daily care log saved!');
        setCareModalOpen(false);
        loadShelterData();
      }
    } catch (err) {
      alert('Failed to record care log.');
    }
  };

  const handleInquiryAction = async (inquiryId, status, notes = '') => {
    try {
      const res = await api.put(`/shelter/inquiries/${inquiryId}`, {
        status,
        shelterNotes: notes || `Application marked as ${status} by shelter management.`,
      });
      if (res.data.success) {
        alert(`Application ${status}!`);
        loadShelterData();
      }
    } catch (err) {
      alert('Failed to update application.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-600 flex items-center justify-center text-2xl shadow-lg">
            🏡
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-extrabold">{user?.name}</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-400/30">
                {user?.badgeNumber || 'SHELTER-HQ'}
              </span>
            </div>
            <p className="text-xs text-slate-400">{user?.organizationName || 'Animal Rehabilitation Sanctuary'}</p>
          </div>
        </div>

        <div className="flex items-center space-x-4 text-center">
          <div className="px-4 py-2 bg-white/10 rounded-2xl border border-white/10">
            <p className="text-xl font-extrabold text-amber-400">{incomingReferrals.length}</p>
            <p className="text-[10px] text-slate-400">Incoming Referrals</p>
          </div>
          <div className="px-4 py-2 bg-white/10 rounded-2xl border border-white/10">
            <p className="text-xl font-extrabold text-emerald-400">{animals.length}</p>
            <p className="text-[10px] text-slate-400">Housed Animals</p>
          </div>
          <div className="px-4 py-2 bg-white/10 rounded-2xl border border-white/10">
            <p className="text-xl font-extrabold text-purple-400">{inquiries.length}</p>
            <p className="text-[10px] text-slate-400">Adoption Inquiries</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap p-1 bg-slate-200/80 rounded-2xl w-full sm:w-auto self-start gap-1">
        <button
          onClick={() => setActiveTab('animals')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'animals' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          🐾 Kennel Roster ({animals.length})
        </button>

        <button
          onClick={() => setActiveTab('referrals')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
            activeTab === 'referrals' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>📥 Incoming Referrals</span>
          {incomingReferrals.length > 0 && (
            <span className="px-1.5 py-0.2 bg-amber-600 text-white rounded-full text-[10px] animate-pulse">
              {incomingReferrals.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('admit')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'admit' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          + Admit New Animal
        </button>

        <button
          onClick={() => setActiveTab('inquiries')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
            activeTab === 'inquiries' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>💌 Adoption Inquiries</span>
          {inquiries.length > 0 && (
            <span className="px-1.5 py-0.2 bg-purple-600 text-white rounded-full text-[10px]">
              {inquiries.length}
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <LoadingSpinner text="Refreshing shelter records..." />
      ) : (
        <>
          {/* TAB 1: Animals Roster */}
          {activeTab === 'animals' && (
            <div className="space-y-6">
              {animals.length === 0 ? (
                <EmptyState
                  icon={Home}
                  title="No Animals Currently in Shelter"
                  description="Admit animals following veterinary stabilization or rescue transfer."
                  actionText="Admit First Animal"
                  onAction={() => setActiveTab('admit')}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {animals.map((animal) => (
                    <div
                      key={animal._id}
                      className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between"
                    >
                      <div>
                        <div className="h-44 bg-slate-100 relative overflow-hidden">
                          <img
                            src={animal.adoptionProfile?.photos?.[0] || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=600&q=80'}
                            alt={animal.animalName}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-3 left-3 px-2.5 py-1 bg-slate-900/80 backdrop-blur text-white text-xs font-mono font-bold rounded-lg">
                            Kennel #{animal.kennelNumber}
                          </div>
                          <div className="absolute top-3 right-3">
                            <StatusBadge status={animal.adoptionStatus} />
                          </div>
                        </div>

                        <div className="p-5 space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-slate-900">{animal.animalName}</h3>
                            <span className="text-xs text-slate-500">{animal.gender} • {animal.estimatedAge}</span>
                          </div>

                          <p className="text-xs text-slate-600 line-clamp-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            {animal.adoptionProfile?.bio || animal.behaviorNotes}
                          </p>

                          <div className="text-[11px] text-slate-500 space-y-1">
                            <p><strong>Diet:</strong> {animal.dietaryPlan}</p>
                            <p><strong>Behavior:</strong> {animal.behaviorNotes}</p>
                          </div>
                        </div>
                      </div>

                      {/* Care & Adoption Action Footer */}
                      <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <button
                            onClick={() => {
                              setSelectedAnimalForCare(animal);
                              setCareModalOpen(true);
                            }}
                            className="flex-1 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1"
                          >
                            <Utensils className="w-3.5 h-3.5" />
                            <span>Log Daily Care</span>
                          </button>

                          <select
                            value={animal.adoptionStatus}
                            onChange={(e) => handleUpdateStatus(animal._id, e.target.value)}
                            className="px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                          >
                            <option value="IN_RECOVERY">In Recovery</option>
                            <option value="READY_FOR_ADOPTION">Ready for Adoption</option>
                            <option value="PENDING_ADOPTION">Pending Adoption</option>
                            <option value="ADOPTED">Adopted</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Incoming Referrals from Vets & Rescue Teams */}
          {activeTab === 'referrals' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Incoming Animal Referrals</h2>
                  <p className="text-xs text-slate-500">
                    Animals transferred to your shelter by Veterinary Hospitals or Rescue Units awaiting admission to a kennel
                  </p>
                </div>
              </div>

              {incomingReferrals.length === 0 ? (
                <EmptyState
                  icon={Home}
                  title="No Pending Referrals"
                  description="When a Veterinarian discharges a patient and selects your sanctuary for rehab, the animal will appear here for intake."
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {incomingReferrals.map((item, idx) => {
                    const em = item.emergency;
                    const med = item.medicalRecord;

                    return (
                      <div
                        key={idx}
                        className="bg-white rounded-3xl p-6 border border-amber-200 shadow-sm space-y-4 flex flex-col justify-between hover:shadow-md transition"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                                Inbound Referral
                              </span>
                              <h3 className="text-base font-bold text-slate-900 mt-1">
                                {med?.animalName || em.title}
                              </h3>
                            </div>
                            <span className="text-xs text-slate-500 font-medium">{em.animalType} ({em.breed})</span>
                          </div>

                          {med && (
                            <div className="bg-cyan-50 p-3 rounded-2xl border border-cyan-100 text-xs space-y-1 text-cyan-950">
                              <div className="flex items-center space-x-1 font-bold text-cyan-800">
                                <Stethoscope className="w-3.5 h-3.5" />
                                <span>Referred by: Dr. {med.vetId?.name || 'Veterinarian'}</span>
                              </div>
                              <p><strong>Diagnosis:</strong> {med.diagnosis}</p>
                              <p><strong>Treatment Notes:</strong> {med.treatmentPlan}</p>
                            </div>
                          )}

                          <p className="text-xs text-slate-600 line-clamp-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            <strong>Incident Description:</strong> {em.description}
                          </p>

                          <div className="text-[11px] text-slate-400">
                            Location: {em.location?.address}
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                          <Link
                            to={`/reports/${em._id}`}
                            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                          >
                            View Case Record
                          </Link>

                          <button
                            onClick={() => handlePreFillFromReferral(item)}
                            className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow flex items-center justify-center space-x-1"
                          >
                            <span>Admit to Kennel</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Admit New Animal Form */}
          {activeTab === 'admit' && (
            <form onSubmit={handleAdmitSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm max-w-3xl mx-auto space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900">
                  Admit Animal into Shelter & Create Adoption Profile
                </h2>
                {admitForm.reportId && (
                  <span className="px-2.5 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-800 rounded-full">
                    Linked to Incident #{admitForm.reportId.slice(-6)}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Animal Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={admitForm.animalName}
                    onChange={(e) => setAdmitForm({ ...admitForm, animalName: e.target.value })}
                    placeholder="e.g. Bella"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Species
                  </label>
                  <select
                    value={admitForm.animalType}
                    onChange={(e) => setAdmitForm({ ...admitForm, animalType: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  >
                    <option value="Dog">Dog</option>
                    <option value="Cat">Cat</option>
                    <option value="Bird">Bird</option>
                    <option value="Cattle">Cattle</option>
                    <option value="Wildlife">Wildlife</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Kennel / Enclosure # <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={admitForm.kennelNumber}
                    onChange={(e) => setAdmitForm({ ...admitForm, kennelNumber: e.target.value })}
                    placeholder="e.g. K-108"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Breed</label>
                  <input
                    type="text"
                    value={admitForm.breed}
                    onChange={(e) => setAdmitForm({ ...admitForm, breed: e.target.value })}
                    placeholder="e.g. Labrador Mix"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Gender</label>
                  <select
                    value={admitForm.gender}
                    onChange={(e) => setAdmitForm({ ...admitForm, gender: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Unknown">Unknown</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Age</label>
                  <input
                    type="text"
                    value={admitForm.estimatedAge}
                    onChange={(e) => setAdmitForm({ ...admitForm, estimatedAge: e.target.value })}
                    placeholder="e.g. 2 years"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Dietary Needs</label>
                  <input
                    type="text"
                    value={admitForm.dietaryPlan}
                    onChange={(e) => setAdmitForm({ ...admitForm, dietaryPlan: e.target.value })}
                    placeholder="e.g. High-protein kibble"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Behavior & Health Notes</label>
                  <input
                    type="text"
                    value={admitForm.behaviorNotes}
                    onChange={(e) => setAdmitForm({ ...admitForm, behaviorNotes: e.target.value })}
                    placeholder="e.g. Calm, friendly"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Adoption Bio & Personality Story
                </label>
                <textarea
                  rows={3}
                  value={admitForm.bio}
                  onChange={(e) => setAdmitForm({ ...admitForm, bio: e.target.value })}
                  placeholder="Describe the animal's temperament, favorite activities, and ideal family..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Upload Photos (Up to 3)
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => setAdmitPhotos(Array.from(e.target.files))}
                  className="w-full text-xs text-slate-500"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={submittingAdmit}
                  className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow disabled:opacity-50"
                >
                  {submittingAdmit ? 'Admitting...' : 'Admit Animal to Sanctuary'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: Adoption Inquiries */}
          {activeTab === 'inquiries' && (
            <div className="space-y-4">
              {inquiries.length === 0 ? (
                <EmptyState
                  icon={Heart}
                  title="No Adoption Applications Received"
                  description="When citizens apply to adopt animals from your shelter, their background forms will appear here."
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {inquiries.map((inq) => (
                    <div
                      key={inq._id}
                      className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-base font-bold text-slate-900">
                            Applicant: {inq.applicantName}
                          </h3>
                          <p className="text-xs text-slate-500">
                            Interested in: <strong>{inq.shelterRecordId?.animalName || 'Animal'}</strong>
                          </p>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
                          {inq.status}
                        </span>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-2xl text-xs space-y-1 text-slate-600">
                        <p><strong>Phone:</strong> {inq.applicantPhone}</p>
                        <p><strong>Email:</strong> {inq.applicantEmail}</p>
                        <p><strong>Housing:</strong> {inq.housingType}</p>
                        <p><strong>Other Pets:</strong> {inq.hasOtherPets ? 'Yes' : 'No'}</p>
                      </div>

                      <p className="text-xs text-slate-700 italic bg-white p-3 rounded-xl border border-slate-100">
                        "{inq.message}"
                      </p>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleInquiryAction(inq._id, 'REJECTED')}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-semibold"
                        >
                          Decline
                        </button>
                        <button
                          onClick={() => handleInquiryAction(inq._id, 'APPROVED')}
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow"
                        >
                          Approve Adoption
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Daily Care Log Modal */}
      {careModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center space-x-2 text-amber-900 font-bold">
              <Utensils className="w-5 h-5 text-amber-600" />
              <h3 className="text-base">Daily Care Checklist: {selectedAnimalForCare?.animalName}</h3>
            </div>

            <form onSubmit={handleLogCare} className="space-y-4">
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={careLogForm.fed}
                    onChange={(e) => setCareLogForm({ ...careLogForm, fed: e.target.checked })}
                    className="w-4 h-4 text-amber-600 rounded"
                  />
                  <span>🍲 Fed according to dietary plan</span>
                </label>

                <label className="flex items-center space-x-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={careLogForm.walked}
                    onChange={(e) => setCareLogForm({ ...careLogForm, walked: e.target.checked })}
                    className="w-4 h-4 text-amber-600 rounded"
                  />
                  <span>🦮 Walked / Exercise time completed</span>
                </label>

                <label className="flex items-center space-x-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={careLogForm.medicationGiven}
                    onChange={(e) => setCareLogForm({ ...careLogForm, medicationGiven: e.target.checked })}
                    className="w-4 h-4 text-amber-600 rounded"
                  />
                  <span>💊 Prescribed medications administered</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Behavior & Health Notes
                </label>
                <textarea
                  rows={2}
                  value={careLogForm.notes}
                  onChange={(e) => setCareLogForm({ ...careLogForm, notes: e.target.value })}
                  placeholder="e.g. Great appetite, played gently with toy, wound healing well."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCareModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
