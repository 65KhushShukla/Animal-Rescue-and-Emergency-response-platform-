import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  AlertTriangle,
  Bell,
  Heart,
  MapPin,
  Menu,
  X,
  User,
  LogOut,
  Shield,
  Stethoscope,
  Home,
  CheckCircle2,
  Users,
} from 'lucide-react';

export const Navbar = () => {
  const { user, isAuthenticated, logout, getDashboardRoute } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
    setProfileDropdownOpen(false);
  };

  const roleLabels = {
    citizen: { title: 'Citizen', icon: User, color: 'bg-emerald-100 text-emerald-800' },
    rescue_team: { title: 'Rescue Team', icon: Shield, color: 'bg-blue-100 text-blue-800' },
    veterinarian: { title: 'Veterinarian', icon: Stethoscope, color: 'bg-cyan-100 text-cyan-800' },
    shelter: { title: 'Shelter Manager', icon: Home, color: 'bg-amber-100 text-amber-800' },
    volunteer: { title: 'Volunteer', icon: Users, color: 'bg-purple-100 text-purple-800' },
    admin: { title: 'Admin', icon: Shield, color: 'bg-rose-100 text-rose-800' },
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center shadow-md shadow-brand-500/20 text-white">
                <span className="text-xl">🐾</span>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-extrabold text-slate-900 tracking-tight leading-none">
                  Pawsome<span className="text-brand-600">Rescue</span>
                </span>
                <span className="text-[10px] text-slate-500 font-medium tracking-wide uppercase">
                  Emergency & Care
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <Link
              to="/"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                location.pathname === '/'
                  ? 'bg-slate-100 text-brand-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Home
            </Link>

            <Link
              to="/rescues"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center space-x-1 ${
                location.pathname === '/rescues'
                  ? 'bg-slate-100 text-brand-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>Live Map</span>
            </Link>

            <Link
              to="/adoptions"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center space-x-1 ${
                location.pathname === '/adoptions'
                  ? 'bg-slate-100 text-brand-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Heart className="w-4 h-4 text-rose-500" />
              <span>Adopt</span>
            </Link>

            <Link
              to="/volunteer"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center space-x-1 ${
                location.pathname === '/volunteer'
                  ? 'bg-slate-100 text-brand-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Users className="w-4 h-4 text-purple-600" />
              <span>Volunteer</span>
            </Link>

            {isAuthenticated && (
              <Link
                to={getDashboardRoute(user?.role)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
                  location.pathname.startsWith('/dashboard')
                    ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-300'
                    : 'text-brand-600 hover:bg-brand-50'
                }`}
              >
                Dashboard
              </Link>
            )}
          </nav>

          {/* Right Action Icons & Auth */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Report Emergency Button */}
            <Link
              to="/report-emergency"
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emergency-600 hover:bg-emergency-700 text-white rounded-xl text-sm font-bold shadow-md shadow-emergency-500/25 transition transform active:scale-95"
            >
              <AlertTriangle className="w-4 h-4 animate-bounce" />
              <span>Report Emergency</span>
            </Link>

            {/* Notifications Bell */}
            {isAuthenticated && (
              <div className="relative">
                <button
                  onClick={() => {
                    setNotifDropdownOpen(!notifDropdownOpen);
                    setProfileDropdownOpen(false);
                  }}
                  className="relative p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-emergency-600 text-[10px] font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown Panel */}
                {notifDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden">
                    <div className="flex items-center justify-between p-3.5 bg-slate-50 border-b border-slate-100">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-slate-800">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded-full">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-400">
                          No notifications yet.
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n._id}
                            onClick={() => {
                              markAsRead(n._id);
                              if (n.link) {
                                navigate(n.link);
                                setNotifDropdownOpen(false);
                              }
                            }}
                            className={`p-3.5 hover:bg-slate-50 cursor-pointer transition flex items-start space-x-3 ${
                              !n.isRead ? 'bg-brand-50/40' : ''
                            }`}
                          >
                            <span className="text-base mt-0.5">
                              {n.type === 'EMERGENCY_ALERT' ? '🚨' : n.type === 'MEDICAL_UPDATE' ? '🩺' : '🔔'}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs ${!n.isRead ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                                {n.title}
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                              <span className="text-[10px] text-slate-400 mt-1 block">
                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            {!n.isRead && (
                              <span className="w-2 h-2 rounded-full bg-brand-500 mt-1.5 flex-shrink-0" />
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Profile Dropdown or Login Buttons */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => {
                    setProfileDropdownOpen(!profileDropdownOpen);
                    setNotifDropdownOpen(false);
                  }}
                  className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-slate-100 transition border border-slate-200"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-900 text-white font-bold flex items-center justify-center text-sm">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="text-left hidden lg:block pr-1">
                    <p className="text-xs font-bold text-slate-800 leading-tight">{user?.name}</p>
                    <span className="text-[10px] text-slate-500 capitalize">
                      {user?.role?.replace('_', ' ')}
                    </span>
                  </div>
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 py-2">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-800">{user?.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                      {user?.role && (
                        <span className={`mt-1.5 inline-block px-2 py-0.5 text-[10px] font-bold rounded-md ${roleLabels[user.role]?.color || 'bg-slate-100 text-slate-700'}`}>
                          {roleLabels[user.role]?.title || user.role}
                        </span>
                      )}
                    </div>

                    <Link
                      to={getDashboardRoute(user?.role)}
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center space-x-2 px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 font-medium"
                    >
                      <Home className="w-4 h-4 text-slate-400" />
                      <span>My Dashboard</span>
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-2 px-4 py-2.5 text-xs text-rose-600 hover:bg-rose-50 font-semibold text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow transition"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu hamburger */}
          <div className="flex md:hidden items-center space-x-2">
            <Link
              to="/report-emergency"
              className="px-3 py-1.5 bg-emergency-600 text-white rounded-lg text-xs font-bold"
            >
              🚨 Report
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 rounded-lg hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-2">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Home
          </Link>
          <Link
            to="/rescues"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Live Emergency Map
          </Link>
          <Link
            to="/adoptions"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Adopt a Pet
          </Link>
          <Link
            to="/volunteer"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Volunteer Tasks
          </Link>
          {isAuthenticated ? (
            <>
              <Link
                to={getDashboardRoute(user?.role)}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-bold text-brand-600 bg-brand-50"
              >
                Dashboard ({user?.role?.replace('_', ' ')})
              </Link>
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm font-semibold text-rose-600 rounded-lg hover:bg-rose-50"
              >
                Log Out
              </button>
            </>
          ) : (
            <div className="pt-3 flex flex-col space-y-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2 text-sm font-semibold text-slate-700 border border-slate-300 rounded-xl"
              >
                Log In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2 text-sm font-semibold text-white bg-slate-900 rounded-xl"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
