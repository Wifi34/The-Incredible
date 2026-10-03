import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Sparkles,
  MapPin,
  TrendingUp,
  Cpu,
  Layers,
  ArrowRight,
  CheckCircle2,
  AlertOctagon,
  Users,
  Building2,
  Activity,
  Flame,
  Clock,
  PlayCircle
} from 'lucide-react';
import { InteractiveMap } from '../components/InteractiveMap';
import { useAuth } from '../context/AuthContext';

export function LandingPage({ setCurrentTab, onOpenDemo }) {
  const { switchRole } = useAuth();
  const [masterIssues, setMasterIssues] = useState([]);
  const [selectedIssue, setSelectedIssue] = useState(null);

  useEffect(() => {
    fetch('/api/authority/master-issues')
      .then(res => res.json())
      .then(data => {
        if (data.success) setMasterIssues(data.masterIssues);
      })
      .catch(err => console.error('Error loading master issues:', err));
  }, []);

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative pt-12 pb-8 overflow-hidden">
        {/* Subtle background light tint */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-r from-blue-100 via-indigo-50 to-cyan-100 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center space-y-6 px-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold shadow-xs animate-fadeIn">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Next-Generation AI Civic Infrastructure Management</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 leading-tight">
            Fix Civic Problems{' '}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 bg-clip-text text-transparent">
              Before They Become Disasters
            </span>
          </h1>

          <p className="max-w-3xl mx-auto text-base sm:text-lg text-slate-600 font-normal leading-relaxed">
            CivicLens empowers citizens with instant AI image classification, spatial duplicate clustering, automated municipal authority dispatch, real-time 0–100% work progress tracking, and mandatory citizen resolution verification.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={() => {
                switchRole('CITIZEN');
                setCurrentTab('report_issue');
              }}
              className="px-6 py-3.5 rounded-2xl font-extrabold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
            >
              <span>Report an Issue (Citizen)</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenDemo}
              className="px-6 py-3.5 rounded-2xl font-extrabold text-sm bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
            >
              <PlayCircle className="w-4 h-4 text-blue-600" />
              <span>Watch 20-Report Live Demo</span>
            </button>
          </div>

          {/* Real-time System Metrics Ticker */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 text-left max-w-4xl mx-auto">
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Road Clusters</div>
              <div className="text-2xl font-black text-blue-600 mt-1">84 Active</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Across 4 Municipal Wards</div>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">AI Clustering Rate</div>
              <div className="text-2xl font-black text-indigo-600 mt-1">68.4%</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Duplicates Aggregated</div>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Avg Resolution Time</div>
              <div className="text-2xl font-black text-emerald-600 mt-1">19.4 Hours</div>
              <div className="text-[11px] text-slate-500 mt-0.5">vs 7+ Days Traditional</div>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Citizen Verification</div>
              <div className="text-2xl font-black text-amber-600 mt-1">94.2%</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Satisfaction Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Interactive Map Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider">
              <MapPin className="w-4 h-4" />
              <span>Real-Time Civic Telemetry</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              Live City-Wide Issue & Road Density Map
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Color-coded by AI priority. Click any high-density master hub to inspect linked complaints and work progress.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                switchRole('AUTHORITY');
                setCurrentTab('authority_dashboard');
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-all flex items-center gap-1.5 shadow-xs"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Open Authority Dispatch View</span>
            </button>
          </div>
        </div>

        <InteractiveMap
          masterIssues={masterIssues}
          onSelectIssue={(issue) => setSelectedIssue(issue)}
        />
      </section>

      {/* 3 User Roles Cards Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Engineered for Citizens, Authorities & City Admins
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            Complete role-based security enforced at backend API layer with fine-grained ward and department permissions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Citizen Card */}
          <div className="p-7 rounded-3xl bg-white border border-slate-200 hover:border-blue-300 shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Citizens</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Report issues in seconds with AI camera analysis & multilingual speech/text. Track transparent timelines and verify fixes with Before/After inspection.
              </p>
              <ul className="text-xs text-slate-600 space-y-1.5 pt-1">
                <li className="flex items-center gap-2">✓ AI classification & severity detection</li>
                <li className="flex items-center gap-2">✓ Automatic duplicate report linking</li>
                <li className="flex items-center gap-2">✓ Final resolution approval authority</li>
              </ul>
            </div>

            <button
              onClick={() => {
                switchRole('CITIZEN');
                setCurrentTab('citizen_dashboard');
              }}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 transition-all text-center mt-2"
            >
              Access Citizen Portal →
            </button>
          </div>

          {/* Authority Card */}
          <div className="p-7 rounded-3xl bg-white border border-slate-200 hover:border-amber-300 shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Zonal Authorities</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Smart priority queues rank critical roads first. Recommended field teams matched by distance and workload. Update live work progress 0–100%.
              </p>
              <ul className="text-xs text-slate-600 space-y-1.5 pt-1">
                <li className="flex items-center gap-2">✓ Master Road Issues with 20+ grouped reports</li>
                <li className="flex items-center gap-2">✓ AI-recommended squad dispatch</li>
                <li className="flex items-center gap-2">✓ SLA breach countdown warnings</li>
              </ul>
            </div>

            <button
              onClick={() => {
                switchRole('AUTHORITY');
                setCurrentTab('authority_dashboard');
              }}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-600 text-amber-800 hover:text-white border border-amber-200 transition-all text-center mt-2"
            >
              Access Authority Queue →
            </button>
          </div>

          {/* Admin Card */}
          <div className="p-7 rounded-3xl bg-white border border-slate-200 hover:border-purple-300 shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">City Administrators</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Work Monitoring Center tracking all active tasks, delayed jobs, hotspot surges (+59%), authority officer performance metrics, and emergency escalations.
              </p>
              <ul className="text-xs text-slate-600 space-y-1.5 pt-1">
                <li className="flex items-center gap-2">✓ Live Work Monitoring Center table</li>
                <li className="flex items-center gap-2">✓ Emerging Hotspot trend analytics</li>
                <li className="flex items-center gap-2">✓ Immutable system-wide audit logs</li>
              </ul>
            </div>

            <button
              onClick={() => {
                switchRole('ADMIN');
                setCurrentTab('admin_dashboard');
              }}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-purple-50 hover:bg-purple-600 text-purple-800 hover:text-white border border-purple-200 transition-all text-center mt-2"
            >
              Access Admin Center →
            </button>
          </div>
        </div>
      </section>

      {/* Emerging Civic Hotspots Alert Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-rose-50 via-white to-amber-50 border border-rose-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-200 text-xs font-extrabold">
              <Flame className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
              <span>EMERGING CIVIC HOTSPOT DETECTED</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              WHC Road, Dharampeth — Pothole Reports Surged +59% This Month
            </h3>
            <p className="text-xs text-slate-600">
              43 complaints registered vs 27 last month. AI Spatial Cluster automatically elevated Road Priority to 98/100 (CRITICAL) and dispatched Road Maintenance Team #3.
            </p>
          </div>

          <button
            onClick={() => {
              switchRole('AUTHORITY');
              setCurrentTab('authority_dashboard');
            }}
            className="px-5 py-3 rounded-2xl text-xs font-extrabold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 transition-all whitespace-nowrap"
          >
            Inspect Dharampeth Cluster →
          </button>
        </div>
      </section>
    </div>
  );
}
