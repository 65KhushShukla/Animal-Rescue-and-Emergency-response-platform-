import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  AlertTriangle,
  MapPin,
  Shield,
  Heart,
  Stethoscope,
  Home,
  Users,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Clock,
  PhoneCall,
  Activity,
} from 'lucide-react';

export const HomePage = () => {
  const { user, isAuthenticated, getDashboardRoute } = useAuth();
  const [stats, setStats] = useState({
    totalReports: 148,
    activeEmergencies: 12,
    resolvedCases: 136,
    adoptedAnimals: 54,
  });
  const [recentEmergencies, setRecentEmergencies] = useState([]);
  const [featuredAdoptions, setFeaturedAdoptions] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const [emRes, adoptRes] = await Promise.all([
          api.get('/emergencies?limit=3'),
          api.get('/shelter/adoptions'),
        ]);

        if (emRes.data.success) {
          setRecentEmergencies(emRes.data.emergencies || []);
        }
        if (adoptRes.data.success) {
          setFeaturedAdoptions(adoptRes.data.animals?.slice(0, 3) || []);
        }
      } catch (err) {
        console.warn('Home data load error:', err.message);
      }
    };

    loadHomeData();
  }, []);

  const workflowSteps = [
    {
      step: '01',
      title: 'Citizen Reports Emergency',
      desc: 'Spot an injured or distressed animal? Drop a GPS pin, upload photo, and get instant AI first-aid advice.',
      icon: '🚨',
    },
    {
      step: '02',
      title: 'Rapid Rescue Dispatch',
      desc: 'Nearest registered rescue ambulance accepts the alert, tracks live routing, and secures the animal.',
      icon: '🚑',
    },
    {
      step: '03',
      title: 'Veterinary Trauma Care',
      desc: 'Expert clinical diagnosis, wound dressing, surgery, vitals monitoring, and digital prescriptions.',
      icon: '🩺',
    },
    {
      step: '04',
      title: 'Shelter Rehab & Adoption',
      desc: 'Sanctuary housing, nutrition care logs, recovery tracking, and loving forever home matching.',
      icon: '🏡',
    },
  ];

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-900 via-slate-900 to-slate-950 text-white pt-16 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]"></div>

        <div className="relative max-w-7xl mx-auto text-center space-y-8">
          {/* Top Pill */}
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold backdrop-blur">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>24/7 AI-Assisted Unified Emergency Dispatch Network</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight">
            Every Animal Deserves a <span className="text-emerald-400">Fighting Chance.</span>
          </h1>

          <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto font-light leading-relaxed">
            Real-time emergency response platform connecting Citizens, Rescue Ambulances, Veterinary Hospitals, and Shelters with GPS live tracking and smart triage.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/report-emergency"
              className="w-full sm:w-auto px-8 py-4 bg-emergency-600 hover:bg-emergency-700 text-white rounded-2xl text-base font-extrabold shadow-xl shadow-emergency-600/30 flex items-center justify-center space-x-2 transition transform active:scale-95"
            >
              <AlertTriangle className="w-5 h-5 animate-bounce" />
              <span>Report Animal Emergency Now</span>
            </Link>

            <Link
              to="/rescues"
              className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-2xl text-base font-bold backdrop-blur flex items-center justify-center space-x-2 transition"
            >
              <MapPin className="w-5 h-5 text-emerald-400" />
              <span>View Live Map Feed</span>
            </Link>
          </div>

          {/* Key Metric Highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-10 border-t border-slate-800/80">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur">
              <p className="text-3xl font-extrabold text-white">{stats.totalReports}+</p>
              <p className="text-xs text-slate-400 mt-1">Distress Calls Handled</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur">
              <p className="text-3xl font-extrabold text-emerald-400">&lt; 18 min</p>
              <p className="text-xs text-slate-400 mt-1">Average Response Time</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur">
              <p className="text-3xl font-extrabold text-cyan-400">100%</p>
              <p className="text-xs text-slate-400 mt-1">Medical Audit Logged</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur">
              <p className="text-3xl font-extrabold text-purple-400">{stats.adoptedAnimals}+</p>
              <p className="text-xs text-slate-400 mt-1">Pets Rehomed</p>
            </div>
          </div>
        </div>
      </section>

      {/* Role-Based Quick Access Strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Unified Role Portals</h2>
          <p className="text-sm text-slate-500">Dedicated operational interfaces tailored to each stakeholder</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Citizen', icon: '👤', path: '/dashboard/citizen', color: 'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/50' },
            { label: 'Rescue Team', icon: '🚑', path: '/dashboard/rescue', color: 'border-blue-200 bg-blue-50/50 hover:bg-blue-100/50' },
            { label: 'Veterinarian', icon: '🩺', path: '/dashboard/vet', color: 'border-cyan-200 bg-cyan-50/50 hover:bg-cyan-100/50' },
            { label: 'Shelter Hub', icon: '🏡', path: '/dashboard/shelter', color: 'border-amber-200 bg-amber-50/50 hover:bg-amber-100/50' },
            { label: 'Volunteer', icon: '🙋', path: '/dashboard/volunteer', color: 'border-purple-200 bg-purple-50/50 hover:bg-purple-100/50' },
            { label: 'Admin Command', icon: '⚡', path: '/dashboard/admin', color: 'border-rose-200 bg-rose-50/50 hover:bg-rose-100/50' },
          ].map((item, idx) => (
            <Link
              key={idx}
              to={isAuthenticated ? item.path : '/login'}
              className={`p-4 rounded-2xl border ${item.color} flex flex-col items-center text-center transition shadow-sm hover:shadow group`}
            >
              <span className="text-2xl mb-2 group-hover:scale-110 transition">{item.icon}</span>
              <span className="text-xs font-bold text-slate-800">{item.label}</span>
              <span className="text-[10px] text-slate-500 mt-0.5 flex items-center">
                Access Portal <ArrowRight className="w-2.5 h-2.5 ml-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* End-to-End Workflow Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden">
          <div className="max-w-2xl mb-10">
            <span className="text-xs font-bold uppercase text-emerald-400 tracking-wider">How It Works</span>
            <h2 className="text-3xl font-extrabold mt-1">From Emergency to Adoption</h2>
            <p className="text-slate-400 text-sm mt-2">
              A transparent, closed-loop rescue pipeline ensuring total accountability and life-saving speed.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
            {workflowSteps.map((step, idx) => (
              <div key={idx} className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur relative space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{step.icon}</span>
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                    {step.step}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white">{step.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Adoptable Pets */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Rescued Animals Ready For Homes</h2>
            <p className="text-sm text-slate-500">Healed, vaccinated, and waiting for their forever families</p>
          </div>
          <Link
            to="/adoptions"
            className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center space-x-1"
          >
            <span>View All Adoptions</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredAdoptions.length > 0 ? (
            featuredAdoptions.map((animal) => (
              <div
                key={animal._id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition flex flex-col"
              >
                <div className="h-48 bg-slate-100 overflow-hidden relative">
                  <img
                    src={animal.adoptionProfile?.photos?.[0] || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=600&q=80'}
                    alt={animal.animalName}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3 px-2.5 py-1 bg-emerald-600 text-white text-xs font-bold rounded-full shadow">
                    Ready to Adopt
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-slate-900">{animal.animalName}</h3>
                      <span className="text-xs text-slate-500">{animal.estimatedAge}</span>
                    </div>
                    <p className="text-xs text-brand-600 font-medium">{animal.breed} • {animal.animalType}</p>
                    <p className="text-xs text-slate-600 mt-2 line-clamp-2">
                      {animal.adoptionProfile?.bio || animal.behaviorNotes}
                    </p>
                  </div>

                  <Link
                    to="/adoptions"
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold text-center transition"
                  >
                    Meet {animal.animalName}
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center py-8 text-slate-400 text-sm">
              Loading featured companions...
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
