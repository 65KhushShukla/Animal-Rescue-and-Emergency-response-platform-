import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { LocationPickerMap } from '../components/maps/LocationPickerMap';
import {
  AlertTriangle,
  Camera,
  MapPin,
  Sparkles,
  Upload,
  X,
  CheckCircle2,
  Info,
  ShieldAlert,
  Loader2,
} from 'lucide-react';

const COMMON_SYMPTOMS = [
  'Active Bleeding',
  'Broken / Limping Leg',
  'Hit by Vehicle / Accident',
  'Unconscious / Unresponsive',
  'Trapped in Drain / Structure',
  'Severely Malnourished',
  'Mange / Severe Skin Infection',
  'Poison / Seizure Suspected',
  'Abandoned Puppies / Kittens',
  'Severe Burns',
  'Choking / Breathing Difficulty',
];

const ANIMAL_SPECIES = [
  { id: 'Dog', label: 'Dog', icon: '🐶' },
  { id: 'Cat', label: 'Cat', icon: '🐱' },
  { id: 'Bird', label: 'Bird / Raptor', icon: '🦅' },
  { id: 'Cattle', label: 'Cattle / Cow', icon: '🐮' },
  { id: 'Wildlife', label: 'Wildlife / Fox', icon: '🦊' },
  { id: 'Other', label: 'Other Species', icon: '🐾' },
];

export const EmergencyReportPage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    animalType: 'Dog',
    breed: '',
    estimatedAge: 'Adult',
    urgency: 'HIGH',
    description: '',
    address: 'Central Park North Gate, Metropolis',
    city: 'Metropolis',
    landmark: '',
    latitude: 28.6139,
    longitude: 77.2090,
    reporterName: user?.name || '',
    reporterPhone: user?.phone || '',
    reporterEmail: user?.email || '',
  });

  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaPreviews, setMediaPreviews] = useState([]);

  // AI Triage State
  const [aiTriage, setAiTriage] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleSymptom = (symptom) => {
    if (selectedSymptoms.includes(symptom)) {
      setSelectedSymptoms(selectedSymptoms.filter((s) => s !== symptom));
    } else {
      setSelectedSymptoms([...selectedSymptoms, symptom]);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + mediaFiles.length > 5) {
      alert('You can upload a maximum of 5 images/videos.');
      return;
    }

    setMediaFiles((prev) => [...prev, ...files]);

    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setMediaPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeMedia = (index) => {
    setMediaFiles(mediaFiles.filter((_, i) => i !== index));
    setMediaPreviews(mediaPreviews.filter((_, i) => i !== index));
  };

  const handleLocationChange = (lat, lng) => {
    setFormData((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
    }));
  };

  // Run AI Triage
  const triggerAiTriage = async () => {
    if (!formData.description && selectedSymptoms.length === 0) {
      alert('Please enter a brief description or select symptoms to run AI Triage.');
      return;
    }

    setAiLoading(true);
    try {
      const res = await api.post('/ai/triage', {
        description: formData.description,
        animalType: formData.animalType,
        symptoms: selectedSymptoms,
      });

      if (res.data.success && res.data.triage) {
        setAiTriage(res.data.triage);
        if (res.data.triage.severity) {
          setFormData((prev) => ({ ...prev, urgency: res.data.triage.severity }));
        }
      }
    } catch (err) {
      console.warn('AI Triage error:', err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.description) {
      setError('Please provide details about the animal distress condition.');
      return;
    }

    setSubmitting(true);

    try {
      const submitData = new FormData();
      submitData.append('title', formData.title || `${formData.animalType} in Distress`);
      submitData.append('animalType', formData.animalType);
      submitData.append('breed', formData.breed || 'Unknown');
      submitData.append('estimatedAge', formData.estimatedAge);
      submitData.append('urgency', formData.urgency);
      submitData.append('description', formData.description);
      submitData.append('address', formData.address);
      submitData.append('city', formData.city);
      submitData.append('landmark', formData.landmark);
      submitData.append('latitude', formData.latitude);
      submitData.append('longitude', formData.longitude);
      submitData.append('symptoms', JSON.stringify(selectedSymptoms));
      submitData.append('reporterName', formData.reporterName || 'Concerned Citizen');
      submitData.append('reporterPhone', formData.reporterPhone || '');
      submitData.append('reporterEmail', formData.reporterEmail || '');

      mediaFiles.forEach((file) => {
        submitData.append('media', file);
      });

      const res = await api.post('/emergencies', submitData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        navigate(`/reports/${res.data.emergency._id}`, {
          state: { newlyCreated: true },
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit emergency report. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emergency-600 to-rose-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl mb-8">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-white/20 rounded-2xl backdrop-blur">
            <AlertTriangle className="w-8 h-8 text-white animate-bounce" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Report Animal in Distress
            </h1>
            <p className="text-sm text-white/90 mt-0.5">
              Submit location, symptoms & photo. Nearest rescue teams and ambulances will be dispatched immediately.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center space-x-2 shadow-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Animal Species & Details */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 text-sm font-bold flex items-center justify-center">
              1
            </span>
            <h2 className="text-base font-bold text-slate-900">Animal Identification & Urgency</h2>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
              Animal Species
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {ANIMAL_SPECIES.map((sp) => (
                <button
                  key={sp.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, animalType: sp.id })}
                  className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center ${
                    formData.animalType === sp.id
                      ? 'bg-brand-50 border-brand-500 ring-2 ring-brand-500/20 font-bold text-slate-900'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <span className="text-2xl mb-1">{sp.icon}</span>
                  <span className="text-xs">{sp.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Breed / Appearance
              </label>
              <input
                type="text"
                name="breed"
                value={formData.breed}
                onChange={handleInputChange}
                placeholder="e.g. Golden Retriever mix, White fur"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Estimated Age
              </label>
              <select
                name="estimatedAge"
                value={formData.estimatedAge}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-brand-500"
              >
                <option value="Puppy/Kitten">Puppy / Kitten</option>
                <option value="Young">Young</option>
                <option value="Adult">Adult</option>
                <option value="Senior">Senior</option>
                <option value="Unknown">Unknown</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Urgency Level
              </label>
              <select
                name="urgency"
                value={formData.urgency}
                onChange={handleInputChange}
                className={`w-full px-3.5 py-2.5 border rounded-xl text-sm font-bold focus:outline-none ${
                  formData.urgency === 'CRITICAL'
                    ? 'bg-red-50 border-red-300 text-red-700'
                    : formData.urgency === 'HIGH'
                    ? 'bg-orange-50 border-orange-300 text-orange-700'
                    : 'bg-amber-50 border-amber-300 text-amber-700'
                }`}
              >
                <option value="CRITICAL">🔴 CRITICAL (Immediate Life Threat)</option>
                <option value="HIGH">🟠 HIGH (Severe Injury / High Distress)</option>
                <option value="MEDIUM">🟡 MEDIUM (Injured / Needs Care)</option>
                <option value="LOW">⚪ LOW (Welfare Check / Stray)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Symptoms & AI Triage Assistant */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 text-sm font-bold flex items-center justify-center">
                2
              </span>
              <h2 className="text-base font-bold text-slate-900">Symptoms & Situation</h2>
            </div>

            <button
              type="button"
              onClick={triggerAiTriage}
              disabled={aiLoading}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-xs font-bold shadow hover:from-purple-700 hover:to-indigo-700 transition"
            >
              <Sparkles className={`w-3.5 h-3.5 ${aiLoading ? 'animate-spin' : ''}`} />
              <span>{aiLoading ? 'Analyzing...' : 'AI Triage & First-Aid'}</span>
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
              Select Observed Symptoms (Check all that apply)
            </label>
            <div className="flex flex-wrap gap-2">
              {COMMON_SYMPTOMS.map((symptom) => {
                const isSelected = selectedSymptoms.includes(symptom);
                return (
                  <button
                    key={symptom}
                    type="button"
                    onClick={() => toggleSymptom(symptom)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                      isSelected
                        ? 'bg-rose-50 border-rose-400 text-rose-700 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {isSelected && <span className="mr-1">✓</span>}
                    {symptom}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Detailed Description of Animal & Circumstances <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe the animal condition, exact behavior, visible wounds, or how the injury occurred..."
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:bg-white focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* AI Triage First-Aid Card */}
          {aiTriage && (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-indigo-900 font-bold text-sm">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>AI Triage Assessment</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase bg-indigo-600 text-white">
                  {aiTriage.severity} Priority
                </span>
              </div>

              {aiTriage.detectedInjuries?.length > 0 && (
                <div className="text-xs text-indigo-900 font-medium">
                  <span className="font-bold">Detected Flags: </span>
                  {aiTriage.detectedInjuries.join(', ')}
                </div>
              )}

              <div className="bg-white/80 rounded-xl p-3.5 border border-indigo-100 space-y-1.5">
                <p className="text-xs font-bold text-slate-800 flex items-center space-x-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Immediate On-Site Citizen Instructions:</span>
                </p>
                <ul className="list-disc list-inside text-xs text-slate-600 space-y-1">
                  {aiTriage.immediateAdvice?.map((advice, i) => (
                    <li key={i}>{advice}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Media Upload */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 text-sm font-bold flex items-center justify-center">
              3
            </span>
            <h2 className="text-base font-bold text-slate-900">Photos & Videos (Up to 5)</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {mediaPreviews.map((preview, idx) => (
              <div key={idx} className="relative h-28 rounded-2xl overflow-hidden border border-slate-200 group">
                <img src={preview} alt={`upload-${idx}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeMedia(idx)}
                  className="absolute top-1.5 right-1.5 p-1 bg-black/60 text-white rounded-full hover:bg-black transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {mediaFiles.length < 5 && (
              <label className="h-28 border-2 border-dashed border-slate-300 hover:border-brand-500 rounded-2xl flex flex-col items-center justify-center cursor-pointer bg-slate-50 hover:bg-brand-50/40 transition text-center p-2">
                <Upload className="w-6 h-6 text-slate-400 mb-1" />
                <span className="text-xs font-semibold text-slate-700">Add Photo / Video</span>
                <span className="text-[10px] text-slate-400">JPG, PNG, MP4</span>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {/* Section 4: Location & OpenStreetMap GPS Picker */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 text-sm font-bold flex items-center justify-center">
              4
            </span>
            <h2 className="text-base font-bold text-slate-900">Incident Location & GPS Coordinates</h2>
          </div>

          <p className="text-xs text-slate-500">
            Click anywhere on the map below or drag the marker to pinpoint the exact location. You can also click "Use My GPS".
          </p>

          <LocationPickerMap
            latitude={formData.latitude}
            longitude={formData.longitude}
            onLocationChange={handleLocationChange}
            className="h-80 w-full"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Street Address / Area Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="e.g. 5th Cross Road, Near Green Park Metro"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Landmark / Specific Spot
              </label>
              <input
                type="text"
                name="landmark"
                value={formData.landmark}
                onChange={handleInputChange}
                placeholder="e.g. Behind tea kiosk, under bridge"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
        </div>

        {/* Section 5: Reporter Contact */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 text-sm font-bold flex items-center justify-center">
              5
            </span>
            <h2 className="text-base font-bold text-slate-900">Your Contact Info (For Rescue Team Coordination)</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Your Name
              </label>
              <input
                type="text"
                name="reporterName"
                value={formData.reporterName}
                onChange={handleInputChange}
                placeholder="John Doe"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                name="reporterPhone"
                value={formData.reporterPhone}
                onChange={handleInputChange}
                placeholder="+1 555-0182"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Email
              </label>
              <input
                type="email"
                name="reporterEmail"
                value={formData.reporterEmail}
                onChange={handleInputChange}
                placeholder="reporter@email.com"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
        </div>

        {/* Submit Action */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-emergency-600 hover:bg-emergency-700 text-white rounded-2xl text-base font-extrabold shadow-xl shadow-emergency-600/30 flex items-center justify-center space-x-2 transition disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Broadcasting Emergency Dispatch...</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-5 h-5" />
                <span>Submit & Dispatch Rescue Teams</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
