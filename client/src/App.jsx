import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { CitizenDashboard } from './pages/CitizenDashboard';
import { ReportIssuePage } from './pages/ReportIssuePage';
import { CitizenComplaintDetails } from './pages/CitizenComplaintDetails';
import { AuthorityDashboard } from './pages/AuthorityDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DemoScenarioPlayer } from './components/DemoScenarioPlayer';

function MainApp() {
  const { role } = useAuth();
  const [currentTab, setCurrentTab] = useState('landing');
  const [selectedComplaintId, setSelectedComplaintId] = useState(null);
  const [demoOpen, setDemoOpen] = useState(false);

  const handleSelectComplaint = (complaint) => {
    setSelectedComplaintId(complaint.id);
    setCurrentTab('complaint_details');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Top Universal Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenDemo={() => setDemoOpen(true)}
      />

      {/* Main View Body */}
      <main className="flex-1">
        {currentTab === 'landing' && (
          <LandingPage
            setCurrentTab={setCurrentTab}
            onOpenDemo={() => setDemoOpen(true)}
          />
        )}

        {currentTab === 'citizen_dashboard' && (
          <CitizenDashboard
            setCurrentTab={setCurrentTab}
            onSelectComplaint={handleSelectComplaint}
          />
        )}

        {currentTab === 'report_issue' && (
          <ReportIssuePage
            setCurrentTab={setCurrentTab}
            onComplaintSubmitted={(complaint) => {
              setSelectedComplaintId(complaint.id);
              setCurrentTab('complaint_details');
            }}
          />
        )}

        {currentTab === 'complaint_details' && (
          <CitizenComplaintDetails
            complaintId={selectedComplaintId || 'C1001'}
            onBack={() => setCurrentTab('citizen_dashboard')}
          />
        )}

        {currentTab === 'authority_dashboard' && (
          <AuthorityDashboard setCurrentTab={setCurrentTab} />
        )}

        {currentTab === 'admin_dashboard' && (
          <AdminDashboard setCurrentTab={setCurrentTab} />
        )}

        {currentTab === 'login' && (
          <LoginPage setCurrentTab={setCurrentTab} />
        )}

        {currentTab === 'register' && (
          <RegisterPage setCurrentTab={setCurrentTab} />
        )}
      </main>

      {/* 1-Click Interactive End-to-End Simulation Modal (Section 46) */}
      <DemoScenarioPlayer
        isOpen={demoOpen}
        onClose={() => setDemoOpen(false)}
        onStepChange={(step, data) => {
          // If at step 7, switch to admin dashboard to see updated stats
          if (step === 7) {
            // Optional auto switch or feedback
          }
        }}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500 space-y-2">
        <div className="flex items-center justify-center gap-2">
          <span className="font-extrabold text-slate-900">CivicLens</span>
          <span>•</span>
          <span>AI-Powered Smart Civic Issue Reporting, Tracking & Authority Management</span>
        </div>
        <p className="text-slate-500">
          Connecting Citizens, Municipal Authorities, and City Administrators with AI Computer Vision & Spatial Duplicate Clustering.
        </p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
