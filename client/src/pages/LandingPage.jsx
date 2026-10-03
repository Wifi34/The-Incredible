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
        {/* Glowing aura lights */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-r from-cyan-600/20 via-blue-600/20 to-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center space-y-6 px-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold shadow-lg shadow-cyan-500/10 animate-fadeIn">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Next-Generation AI Civic Infrastructure Management</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
            Fix Civic Problems{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Before They Become Disasters
            </span>
          </h1>

          <p className="max-w-3xl mx-auto text-base sm:text-lg text-slate-300 font-normal leading-relaxed">
            CivicSense empowers citizens with instant AI image classification, spatial duplicate clustering, automated municipal authority dispatch, real-time 0–100% work progress tracking, and mandatory citizen resolution verification.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={() => {
                switchRole('CITIZEN');
                setCurrentTab('report_issue');
              }}
              className="px-6 py-3.5 rounded-2xl font-extrabold text-sm bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
            >
              <span>Report an Issue (Citizen)</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenDemo}
              className="px-6 py-3.5 rounded-2xl font-extrabold text-sm bg-slate-900 hover:bg-slate-800 text-orange-300 border border-orange-500/40 shadow-xl shadow-orange-500/10 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
            >
              <PlayCircle className="w-4 h-4 text-orange-400" />
              <span>Watch 20-Report Live Demo</span>
            </button>
          </div>

          {/* Real-time System Metrics Ticker */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 text-left max-w-4xl mx-auto">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Road Clusters</div>
              <div className="text-2xl font-black text-cyan-400 mt-1">84 Active</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Across 4 Municipal Wards</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">AI Clustering Rate</div>
              <div className="text-2xl font-black text-indigo-400 mt-1">68.4%</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Duplicates Aggregated</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Avg Resolution Time</div>
              <div className="text-2xl font-black text-emerald-400 mt-1">19.4 Hours</div>
              <div className="text-[11px] text-slate-500 mt-0.5">vs 7+ Days Traditional</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Citizen Verification</div>
              <div className="text-2xl font-black text-amber-400 mt-1">94.2%</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Satisfaction Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Interactive Map Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">
              <MapPin className="w-4 h-4" />
              <span>Real-Time Civic Telemetry</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              Live City-Wide Issue & Road Density Map
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Color-coded by AI priority. Click any high-density master hub to inspect linked complaints and work progress.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                switchRole('AUTHORITY');
                setCurrentTab('authority_dashboard');
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition-all flex items-center gap-1.5"
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
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Engineered for Citizens, Authorities & City Admins
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            Complete role-based security enforced at backend API layer with fine-grained ward and department permissions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Citizen Card */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 shadow-xl transition-all space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Citizens</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Report issues in seconds with AI camera analysis & multilingual speech/text. Track transparent timelines and verify fixes with Before/After inspection.
              </p>
              <ul className="text-xs text-slate-400 space-y-1.5">
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
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-cyan-600/20 hover:bg-cyan-600 text-cyan-200 hover:text-white border border-cyan-500/40 transition-all text-center"
            >
              Access Citizen Portal →
            </button>
          </div>

          {/* Authority Card */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 shadow-xl transition-all space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Zonal Authorities</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Smart priority queues rank critical roads first. Recommended field teams matched by distance and workload. Update live work progress 0–100%.
              </p>
              <ul className="text-xs text-slate-400 space-y-1.5">
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
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-amber-600/20 hover:bg-amber-600 text-amber-200 hover:text-white border border-amber-500/40 transition-all text-center"
            >
              Access Authority Queue →
            </button>
          </div>

          {/* Admin Card */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/40 shadow-xl transition-all space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">City Administrators</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Work Monitoring Center tracking all active tasks, delayed jobs, hotspot surges (+59%), authority officer performance metrics, and emergency escalations.
              </p>
              <ul className="text-xs text-slate-400 space-y-1.5">
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
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-purple-600/20 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-500/40 transition-all text-center"
            >
              Access Admin Center →
            </button>
          </div>
        </div>
      </section>

      {/* Emerging Civic Hotspots Alert Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-rose-950/40 via-slate-900 to-amber-950/40 border border-rose-600/30 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-extrabold">
              <Flame className="w-3.5 h-3.5 animate-pulse" />
              <span>EMERGING CIVIC HOTSPOT DETECTED</span>
            </div>
            <h3 className="text-xl font-bold text-white">
              Ward 12 Main Road — Pothole Reports Surged +59% This Month
            </h3>
            <p className="text-xs text-slate-300">
              43 complaints registered vs 27 last month. AI Spatial Cluster automatically elevated Road Priority to 98/100 (CRITICAL) and dispatched Road Maintenance Team #3.
            </p>
          </div>

          <button
            onClick={() => {
              switchRole('AUTHORITY');
              setCurrentTab('authority_dashboard');
            }}
            className="px-5 py-3 rounded-xl text-xs font-extrabold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition-all whitespace-nowrap"
          >
            Inspect Ward 12 Cluster →
          </button>
        </div>
      </section>
    </div>
  );
}
