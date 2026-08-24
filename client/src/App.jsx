import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { DemoRoleSwitcher } from './components/common/DemoRoleSwitcher';
import { ProtectedRoute, RoleRoute } from './components/common/ProtectedRoute';

// Pages
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { EmergencyReportPage } from './pages/EmergencyReportPage';
import { LiveRescuesPage } from './pages/LiveRescuesPage';
import { ReportDetailsPage } from './pages/ReportDetailsPage';
import { AdoptionPortalPage } from './pages/AdoptionPortalPage';
import { CitizenDashboard } from './pages/CitizenDashboard';
import { RescueTeamDashboard } from './pages/RescueTeamDashboard';
import { VetDashboard } from './pages/VetDashboard';
import { ShelterDashboard } from './pages/ShelterDashboard';
import { VolunteerDashboard } from './pages/VolunteerDashboard';
import { AdminDashboard } from './pages/AdminDashboard';

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans selection:bg-brand-500 selection:text-white">
          <Navbar />

          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/rescues" element={<LiveRescuesPage />} />
              <Route path="/adoptions" element={<AdoptionPortalPage />} />
              <Route path="/report-emergency" element={<EmergencyReportPage />} />
              <Route path="/reports/:id" element={<ReportDetailsPage />} />
              <Route path="/volunteer" element={<VolunteerDashboard />} />

              {/* Role-Protected Dashboards */}
              <Route element={<ProtectedRoute />}>
                {/* Citizen */}
                <Route element={<RoleRoute allowedRoles={['citizen', 'admin']} />}>
                  <Route path="/dashboard/citizen" element={<CitizenDashboard />} />
                </Route>

                {/* Rescue Team */}
                <Route element={<RoleRoute allowedRoles={['rescue_team', 'admin']} />}>
                  <Route path="/dashboard/rescue" element={<RescueTeamDashboard />} />
                </Route>

                {/* Veterinarian */}
                <Route element={<RoleRoute allowedRoles={['veterinarian', 'admin']} />}>
                  <Route path="/dashboard/vet" element={<VetDashboard />} />
                </Route>

                {/* Shelter */}
                <Route element={<RoleRoute allowedRoles={['shelter', 'admin']} />}>
                  <Route path="/dashboard/shelter" element={<ShelterDashboard />} />
                </Route>

                {/* Volunteer */}
                <Route element={<RoleRoute allowedRoles={['volunteer', 'admin']} />}>
                  <Route path="/dashboard/volunteer" element={<VolunteerDashboard />} />
                </Route>

                {/* Admin */}
                <Route element={<RoleRoute allowedRoles={['admin']} />}>
                  <Route path="/dashboard/admin" element={<AdminDashboard />} />
                </Route>
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          <DemoRoleSwitcher />
          <Footer />
        </div>
      </NotificationProvider>
    </AuthProvider>
  );
}
