import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Phone, Mail, MapPin, ShieldAlert, Sparkles } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Mission */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white text-lg">
                🐾
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                Pawsome<span className="text-emerald-400">Rescue</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              A unified emergency dispatch and care network connecting citizens, rescue ambulances, veterinary hospitals, and shelters to save every animal in distress.
            </p>
            <div className="flex items-center space-x-2 text-xs text-emerald-400 font-medium">
              <ShieldAlert className="w-4 h-4 text-emerald-400" />
              <span>24/7 Rapid Emergency Response Network</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Platform Modules
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/report-emergency" className="hover:text-white transition">
                  🚨 Citizen Emergency Dispatch
                </Link>
              </li>
              <li>
                <Link to="/rescues" className="hover:text-white transition">
                  🗺️ Live OpenStreetMap Feed
                </Link>
              </li>
              <li>
                <Link to="/adoptions" className="hover:text-white transition">
                  🏡 Pet Rehabilitation & Adoption
                </Link>
              </li>
              <li>
                <Link to="/volunteer" className="hover:text-white transition">
                  🙋 Volunteer Community Tasks
                </Link>
              </li>
            </ul>
          </div>

          {/* User Roles */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Role Workflows
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/login" className="hover:text-white transition">
                  🚑 Rapid Rescue Teams
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition">
                  🩺 Veterinary Hospitals
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition">
                  🏠 Animal Shelters & Sanctuaries
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition">
                  ⚡ Administrator Command
                </Link>
              </li>
            </ul>
          </div>

          {/* Emergency Helpline */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Emergency Hotlines
            </h4>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center space-x-2 text-slate-300">
                <Phone className="w-4 h-4 text-emergency-500 flex-shrink-0" />
                <span className="font-semibold text-white">1-800-PAWS-911 (Toll Free)</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-slate-500 flex-shrink-0" />
                <span>dispatch@pawsomerescue.org</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-slate-500 flex-shrink-0" />
                <span>Central Operations & Wildlife Bureau</span>
              </div>
              <div className="pt-2">
                <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-800 text-[11px] text-slate-300 border border-slate-700">
                  <Sparkles className="w-3 h-3 text-amber-400 mr-1" />
                  AI Triage & Live Geo-Routing Enabled
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between">
          <p>© {new Date().getFullYear()} PawsomeRescue Platform. Dedicated to animal welfare.</p>
          <div className="flex items-center space-x-4 mt-2 sm:mt-0">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Emergency Guidelines</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
