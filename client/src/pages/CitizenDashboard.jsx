import React, { useState, useEffect } from 'react';
import {
  FilePlus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Eye,
  MapPin,
  ShieldCheck,
  Bell,
  Star
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BeforeAfterSlider } from '../components/BeforeAfterSlider';

export function CitizenDashboard({ setCurrentTab, onSelectComplaint }) {
  const { user, showToast } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingVerificationComplaint, setPendingVerificationComplaint] = useState(null);

  const fetchMyComplaints = async () => {
    try {
      const res = await fetch('/api/complaints/my', {
        headers: { Authorization: `Bearer ${localStorage.getItem('civicsense_token')}` }
      });
      const data = await res.json();
      if (data.success) {
        setComplaints(data.complaints);
        // Find if any complaint is awaiting citizen verification
        const pending = data.complaints.find(c => c.status === 'RESOLUTION SUBMITTED');
        setPendingVerificationComplaint(pending || null);
      }
    } catch (err) {
      console.error('Error fetching complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyComplaints();
  }, []);

  const total = complaints.length;
  const inProgress = complaints.filter(c => c.status === 'IN PROGRESS' || c.status === 'ASSIGNED').length;
  const resolved = complaints.filter(c => c.status === 'COMPLETED' || c.status === 'RESOLUTION SUBMITTED').length;
  const reopened = complaints.filter(c => c.status === 'REOPENED').length;
  const pending = complaints.filter(c => c.status === 'REPORTED' || c.status === 'NOT STARTED').length;

  const handleVerifySuccess = async (complaintId) => {
    try {
      const res = await fetch(`/api/complaints/${complaintId}/verify-resolution`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('civicsense_token')}`
        },
        body: JSON.stringify({ isFixed: true })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Resolution confirmed! Complaint closed.', 'success');
        fetchMyComplaints();
      }
    } catch (err) {
      showToast('Verification failed', 'error');
    }
  };

  const handleRejectFix = async (complaintId, reason) => {
    try {
      const res = await fetch(`/api/complaints/${complaintId}/verify-resolution`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('civicsense_token')}`
        },
        body: JSON.stringify({ isFixed: false, rejectionReason: reason })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Complaint reopened! Authority notified for re-inspection.', 'error');
        fetchMyComplaints();
      }
    } catch (err) {
      showToast('Reopen failed', 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner with Quick Report CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border border-slate-800 shadow-2xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
              Citizen Portal • {user?.wardId ? `Ward ${user.wardId.replace('ward_', '')}` : 'Ward 12'}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Welcome, {user?.name || 'Citizen'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300">
            Track your civic submissions, live field repairs, and verify completed works.
          </p>
        </div>

        <button
          onClick={() => setCurrentTab('report_issue')}
          className="px-5 py-3 rounded-2xl font-extrabold text-xs bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-xl shadow-cyan-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <FilePlus className="w-4 h-4" />
          <span>Report New Problem</span>
        </button>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
          <div className="text-[11px] font-bold text-slate-400 uppercase">Total Filed</div>
          <div className="text-2xl font-black text-white mt-1">{total}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">My submissions</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
          <div className="text-[11px] font-bold text-amber-400 uppercase">Pending</div>
          <div className="text-2xl font-black text-amber-400 mt-1">{pending}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Awaiting assignment</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
          <div className="text-[11px] font-bold text-cyan-400 uppercase">In Progress</div>
          <div className="text-2xl font-black text-cyan-400 mt-1">{inProgress}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Active field squad</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
          <div className="text-[11px] font-bold text-emerald-400 uppercase">Resolved</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">{resolved}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Repairs completed</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
          <div className="text-[11px] font-bold text-rose-400 uppercase">Reopened</div>
          <div className="text-2xl font-black text-rose-400 mt-1">{reopened}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Citizen rejected</div>
        </div>
      </div>

      {/* Urgent Citizen Resolution Verification Box (Section 25) */}
      {pendingVerificationComplaint && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-emerald-950/40 border border-amber-500/40 shadow-2xl space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                Action Required: Verify Authority Resolution
              </span>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Complaint #{pendingVerificationComplaint.id}
            </span>
          </div>

          <p className="text-xs text-slate-300">
            The municipal authority has marked your reported issue at <strong className="text-white">{pendingVerificationComplaint.roadName}</strong> as resolved. Please review the before/after images below to confirm or reopen.
          </p>

          <BeforeAfterSlider
            beforeImage={pendingVerificationComplaint.images?.[0]}
            afterImage={pendingVerificationComplaint.masterIssue?.afterImage}
            aiConfidence={pendingVerificationComplaint.masterIssue?.aiVerificationScore || 94}
            onVerifyFix={() => handleVerifySuccess(pendingVerificationComplaint.id)}
            onRejectFix={(reason) => handleRejectFix(pendingVerificationComplaint.id, reason)}
            canVerify={true}
          />
        </div>
      )}

      {/* Complaints List Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>My Submitted Complaints & Live Status</span>
            <span className="text-xs font-mono text-cyan-400 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20">
              {complaints.length} Total
            </span>
          </h3>
        </div>

        {complaints.length === 0 && !loading ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <p className="text-slate-400 text-sm">You haven't filed any civic complaints yet.</p>
            <button
              onClick={() => setCurrentTab('report_issue')}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl"
            >
              Report Your First Problem
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {complaints.map((item) => {
              const master = item.masterIssue;
              return (
                <div
                  key={item.id}
                  className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all shadow-xl space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase bg-slate-800 text-cyan-300 border border-slate-700">
                        {item.category} • #{item.id}
                      </span>
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase border ${
                          item.status === 'COMPLETED'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : item.status === 'RESOLUTION SUBMITTED'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                            : item.status === 'IN PROGRESS'
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-white leading-snug flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>{item.roadName}</span>
                      </h4>
                      <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                        {item.description}
                      </p>
                    </div>

                    {/* Smart Duplicate Master Link Badge (Section 10 & 12) */}
                    {master && (
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-cyan-400 font-bold">
                            🔗 Merged into {master.masterCode}
                          </span>
                          <span className="text-slate-400">
                            {master.complaintCount} Reports on Road
                          </span>
                        </div>
                        {master.progress > 0 && (
                          <div>
                            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                              <span>Repair Progress</span>
                              <span className="text-cyan-400 font-bold">{master.progress}%</span>
                            </div>
                            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-cyan-500 to-emerald-500 h-1.5 rounded-full"
                                style={{ width: `${master.progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">
                      Filed on {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => {
                        if (onSelectComplaint) onSelectComplaint(item);
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-cyan-300 hover:text-white bg-cyan-950/50 hover:bg-cyan-900 border border-cyan-700/40 flex items-center gap-1 transition-all"
                    >
                      <span>Track Timeline</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
