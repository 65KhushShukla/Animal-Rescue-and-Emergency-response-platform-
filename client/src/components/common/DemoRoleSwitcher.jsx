import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, demoAccounts } from '../../context/AuthContext';
import { Sparkles, Check, ChevronDown, ChevronUp, UserCheck } from 'lucide-react';

export const DemoRoleSwitcher = () => {
  const { user, switchDemoRole, getDashboardRoute } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const navigate = useNavigate();

  const handleSwitch = async (roleKey) => {
    try {
      setSwitching(true);
      await switchDemoRole(roleKey);
      setIsOpen(false);
      navigate(getDashboardRoute(roleKey));
    } catch (err) {
      console.error('Failed to switch demo role:', err);
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen && (
        <div className="mb-2 p-3 bg-white/95 backdrop-blur border border-slate-200 rounded-2xl shadow-2xl w-80 sm:w-96 text-slate-800 transition-all">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <span className="p-1 rounded-md bg-amber-100 text-amber-700 text-xs font-bold">DEMO MODE</span>
              <h4 className="text-xs font-semibold text-slate-700">Instant Role Switcher</h4>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 text-xs"
            >
              Close
            </button>
          </div>

          <p className="text-xs text-slate-500 mb-2.5">
            Switch identities in 1-click to test end-to-end rescue workflows:
          </p>

          <div className="grid grid-cols-2 gap-1.5">
            {Object.entries(demoAccounts).map(([key, info]) => {
              const isCurrent = user?.role === key;
              return (
                <button
                  key={key}
                  onClick={() => handleSwitch(key)}
                  disabled={switching}
                  className={`flex flex-col items-start p-2 rounded-xl border text-left transition ${
                    isCurrent
                      ? 'bg-brand-50 border-brand-500 ring-1 ring-brand-500'
                      : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-base">{info.icon}</span>
                    {isCurrent && <Check className="w-3.5 h-3.5 text-brand-600 font-bold" />}
                  </div>
                  <span className="text-xs font-semibold text-slate-800 mt-1">{info.label}</span>
                  <span className="text-[10px] text-slate-500 line-clamp-1">{info.desc}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3.5 py-2 bg-slate-900 text-white rounded-full shadow-lg hover:bg-slate-800 transition hover:shadow-xl text-xs font-medium border border-slate-700"
      >
        <Sparkles className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
        <span>Switch Demo Role ({user ? user.role.replace('_', ' ') : 'Guest'})</span>
        {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
};
