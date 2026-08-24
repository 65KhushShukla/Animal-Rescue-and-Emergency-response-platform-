import React from 'react';

export const StatusBadge = ({ status }) => {
  const getBadgeStyle = () => {
    switch (status) {
      case 'REPORTED':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'ACCEPTED':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'EN_ROUTE':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300 animate-pulse';
      case 'ARRIVED':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'RESCUED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold';
      case 'TRANSFERRED_VET':
        return 'bg-cyan-100 text-cyan-800 border-cyan-300';
      case 'TRANSFERRED_SHELTER':
        return 'bg-teal-100 text-teal-800 border-teal-300';
      case 'RESOLVED':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'CANCELLED':
        return 'bg-slate-100 text-slate-600 border-slate-300';
      // Shelter / Medical status
      case 'UNDER_TREATMENT':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'CRITICAL_CARE':
        return 'bg-red-100 text-red-800 border-red-300 animate-pulse';
      case 'IN_RECOVERY':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'READY_FOR_ADOPTION':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'ADOPTED':
        return 'bg-purple-100 text-purple-800 border-purple-300 font-bold';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getBadgeStyle()}`}
    >
      {status ? status.replace('_', ' ') : 'UNKNOWN'}
    </span>
  );
};

export const UrgencyBadge = ({ urgency }) => {
  const getStyle = () => {
    switch (urgency) {
      case 'CRITICAL':
        return 'bg-red-600 text-white shadow-sm shadow-red-200 animate-pulse';
      case 'HIGH':
        return 'bg-orange-500 text-white';
      case 'MEDIUM':
        return 'bg-amber-500 text-white';
      case 'LOW':
        return 'bg-slate-500 text-white';
      default:
        return 'bg-slate-600 text-white';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${getStyle()}`}
    >
      {urgency === 'CRITICAL' && <span className="mr-1">⚠️</span>}
      {urgency || 'MEDIUM'}
    </span>
  );
};
