import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import confetti from 'canvas-confetti';
import {
  Heart,
  Search,
  Filter,
  CheckCircle2,
  Home,
  User,
  Phone,
  Mail,
  Sparkles,
  X,
} from 'lucide-react';

export const AdoptionPortalPage = () => {
  const { user, isAuthenticated } = useAuth();
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [animalType, setAnimalType] = useState('ALL');
  const [search, setSearch] = useState('');
  const [goodWithKids, setGoodWithKids] = useState(false);
  const [goodWithPets, setGoodWithPets] = useState(false);

  // Adoption Inquiry Modal
  const [inquiryModalOpen, setInquiryModalOpen] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [inquiryForm, setInquiryForm] = useState({
    housingType: 'House with Yard',
    hasOtherPets: false,
    petExperienceYears: '2',
    phone: user?.phone || '',
    address: user?.address || '',
    message: '',
  });
  const [submittingInquiry, setSubmittingInquiry] = useState(false);

  useEffect(() => {
    loadAdoptions();
  }, [animalType, goodWithKids, goodWithPets]);

  const loadAdoptions = async () => {
    setLoading(true);
    try {
      let query = `/shelter/adoptions?animalType=${animalType}`;
      if (goodWithKids) query += '&goodWithKids=true';
      if (goodWithPets) query += '&goodWithPets=true';
      if (search) query += `&search=${encodeURIComponent(search)}`;

      const res = await api.get(query);
      if (res.data.success) {
        setAnimals(res.data.animals || []);
      }
    } catch (err) {
      console.warn('Adoption portal load error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadAdoptions();
  };

  const handleOpenInquiry = (animal) => {
    if (!isAuthenticated) {
      alert('Please log in or register to submit an adoption application.');
      window.location.href = '/login';
      return;
    }
    setSelectedAnimal(animal);
    setInquiryModalOpen(true);
  };

  const handleInquirySubmit = async (e) => {
    e.preventDefault();
    if (!selectedAnimal) return;

    setSubmittingInquiry(true);
    try {
      const res = await api.post(`/shelter/adoptions/${selectedAnimal._id}/inquire`, inquiryForm);
      if (res.data.success) {
        // Trigger celebratory confetti!
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });

        alert(`Application for ${selectedAnimal.animalName} submitted successfully! The shelter team will get in touch with you.`);
        setInquiryModalOpen(false);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit application.');
    } finally {
      setSubmittingInquiry(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 text-white rounded-3xl p-8 sm:p-12 shadow-xl relative overflow-hidden text-center space-y-4">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-white/20 backdrop-blur text-xs font-bold">
          <span>💖 Give a Rescued Animal a Forever Home</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
          Adopt a Rescued Companion
        </h1>
        <p className="text-sm sm:text-base text-pink-100 max-w-2xl mx-auto font-light">
          Every animal below was rescued from emergency distress, clinically treated by veterinarians, and rehabilitated in caring shelters.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by name, breed, or story..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={animalType}
            onChange={(e) => setAnimalType(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
          >
            <option value="ALL">All Species</option>
            <option value="Dog">Dogs</option>
            <option value="Cat">Cats</option>
            <option value="Bird">Birds</option>
            <option value="Other">Other</option>
          </select>

          <label className="flex items-center space-x-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={goodWithKids}
              onChange={(e) => setGoodWithKids(e.target.checked)}
              className="w-3.5 h-3.5 text-rose-600 rounded"
            />
            <span>Good with Kids</span>
          </label>

          <label className="flex items-center space-x-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={goodWithPets}
              onChange={(e) => setGoodWithPets(e.target.checked)}
              className="w-3.5 h-3.5 text-rose-600 rounded"
            />
            <span>Good with Pets</span>
          </label>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Finding lovely adoptable pets..." />
      ) : animals.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="No Animals Found"
          description="Try adjusting your search criteria or check back soon as more rescued animals complete rehabilitation."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {animals.map((animal) => (
            <div
              key={animal._id}
              className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-lg transition"
            >
              <div>
                <div className="h-56 bg-slate-100 relative overflow-hidden">
                  <img
                    src={animal.adoptionProfile?.photos?.[0] || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=600&q=80'}
                    alt={animal.animalName}
                    className="w-full h-full object-cover hover:scale-105 transition duration-300"
                  />
                  <div className="absolute top-3 right-3 px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-full shadow">
                    Available
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-extrabold text-slate-900">{animal.animalName}</h3>
                    <span className="text-xs font-medium text-slate-500">{animal.estimatedAge}</span>
                  </div>

                  <p className="text-xs text-brand-600 font-bold">
                    {animal.breed} • {animal.animalType} ({animal.gender})
                  </p>

                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {animal.adoptionProfile?.bio || animal.behaviorNotes}
                  </p>

                  {/* Compatibility Tags */}
                  <div className="flex flex-wrap gap-1.5 text-[10px]">
                    {animal.adoptionProfile?.isGoodWithKids && (
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md font-semibold border border-emerald-200">
                        ✓ Kid Friendly
                      </span>
                    )}
                    {animal.adoptionProfile?.isGoodWithPets && (
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md font-semibold border border-blue-200">
                        ✓ Pet Friendly
                      </span>
                    )}
                    {animal.adoptionProfile?.isSpayedNeutered && (
                      <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-md font-semibold border border-purple-200">
                        ✓ Spayed / Neutered
                      </span>
                    )}
                    {animal.adoptionProfile?.isVaccinated && (
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-md font-semibold border border-amber-200">
                        ✓ Vaccinated
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 pt-0">
                <button
                  onClick={() => handleOpenInquiry(animal)}
                  className="w-full py-3 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white rounded-2xl text-xs font-bold shadow-md transition flex items-center justify-center space-x-2"
                >
                  <Heart className="w-4 h-4 fill-white" />
                  <span>Apply to Adopt {animal.animalName}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Adoption Inquiry Application Modal */}
      {inquiryModalOpen && selectedAnimal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2 text-rose-600 font-bold">
                <Heart className="w-5 h-5 fill-rose-600" />
                <h3 className="text-base text-slate-900">
                  Adoption Application: {selectedAnimal.animalName}
                </h3>
              </div>
              <button
                onClick={() => setInquiryModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInquirySubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Housing Type
                  </label>
                  <select
                    value={inquiryForm.housingType}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, housingType: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="House with Yard">House with Yard</option>
                    <option value="Apartment">Apartment</option>
                    <option value="Farm / Rural Property">Farm / Rural Property</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Years of Pet Experience
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={inquiryForm.petExperienceYears}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, petExperienceYears: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="hasPets"
                  checked={inquiryForm.hasOtherPets}
                  onChange={(e) => setInquiryForm({ ...inquiryForm, hasOtherPets: e.target.checked })}
                  className="w-4 h-4 text-rose-600 rounded"
                />
                <label htmlFor="hasPets" className="text-xs font-medium text-slate-700">
                  I currently have other pets in the household
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Why would you like to adopt {selectedAnimal.animalName}? <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={inquiryForm.message}
                  onChange={(e) => setInquiryForm({ ...inquiryForm, message: e.target.value })}
                  placeholder="Share a bit about your home environment, daily routine, and love for animals..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setInquiryModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingInquiry}
                  className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow disabled:opacity-50"
                >
                  {submittingInquiry ? 'Submitting Application...' : 'Send Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
