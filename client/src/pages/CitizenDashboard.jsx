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
  const { user, showToast, updateCoins } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingVerificationComplaint, setPendingVerificationComplaint] = useState(null);
  const [showRedeemModal, setShowRedeemModal] = useState(false);

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
        if (data.reward) {
          updateCoins(data.reward.totalCoins);
          showToast(`✅ Resolution verified! 🪙 +${data.reward.coinsEarned} Civic Coins credited!`, 'success');
        } else {
          showToast('Resolution confirmed! Complaint closed.', 'success');
        }
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
      {/* Top Banner with Quick Report CTA & Civic Coins Wallet */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 flex flex-col justify-between p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-blue-600 font-bold uppercase tracking-wider">
                Citizen Portal • {user?.wardId ? `Ward ${user.wardId.replace('ward_', '')}` : 'Ward 12'}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Welcome, {user?.name || 'Citizen'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Track your civic submissions, live field repairs, and verify completed works.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => setCurrentTab('report_issue')}
              className="px-6 py-3.5 rounded-2xl font-extrabold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
            >
              <FilePlus className="w-4 h-4" />
              <span>Report New Problem (+50–100 Coins)</span>
            </button>
          </div>
        </div>

        {/* 🪙 Civic Karma Rewards Wallet Tile */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-50 via-white to-yellow-50 border border-amber-200 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black uppercase tracking-wider border border-amber-300">
              Civic Karma Wallet
            </span>
            <span className="text-xs font-bold text-amber-800">
              {user?.coins >= 200 ? '🥇 Gold Guardian' : user?.coins >= 100 ? '🥈 Silver Inspector' : '🥉 Bronze Reporter'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-amber-400/20 border border-amber-300 flex items-center justify-center text-3xl shadow-inner">
              🪙
            </div>
            <div>
              <div className="text-3xl font-black text-slate-900 leading-none">
                {user?.coins || 0}
              </div>
              <div className="text-[11px] font-bold text-amber-800 mt-1">
                Available Civic Credit Coins
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowRedeemModal(true)}
            className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs shadow-md shadow-amber-500/20 transition-all hover:scale-102 flex items-center justify-center gap-1.5"
          >
            <span>🎁 Redeem City Perks & Vouchers</span>
          </button>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Total Filed</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{total}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">My submissions</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-amber-600 uppercase">Pending</div>
          <div className="text-2xl font-black text-amber-600 mt-1">{pending}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Awaiting assignment</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-blue-600 uppercase">In Progress</div>
          <div className="text-2xl font-black text-blue-600 mt-1">{inProgress}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Active field squad</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-emerald-600 uppercase">Resolved</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{resolved}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Repairs completed</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-rose-600 uppercase">Reopened</div>
          <div className="text-2xl font-black text-rose-600 mt-1">{reopened}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Citizen rejected</div>
        </div>
      </div>

      {/* Urgent Citizen Resolution Verification Box */}
      {pendingVerificationComplaint && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-50 via-white to-emerald-50 border border-amber-300 shadow-md space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                Action Required: Verify Authority Resolution
              </span>
            </div>
            <span className="text-xs font-mono text-slate-500 font-bold">
              Complaint #{pendingVerificationComplaint.id}
            </span>
          </div>

          <p className="text-xs text-slate-600">
            The municipal authority has marked your reported issue at <strong className="text-slate-900">{pendingVerificationComplaint.roadName}</strong> as resolved. Please review the before/after images below to confirm or reopen.
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
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>My Submitted Complaints & Live Status</span>
            <span className="text-xs font-mono text-blue-700 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 font-bold">
              {complaints.length} Total
            </span>
          </h3>
        </div>

        {complaints.length === 0 && !loading ? (
          <div className="p-12 text-center rounded-3xl bg-white border border-slate-200 space-y-3 shadow-xs">
            <p className="text-slate-500 text-sm">You haven't filed any civic complaints yet.</p>
            <button
              onClick={() => setCurrentTab('report_issue')}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-2xl shadow-xs"
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
                  className="p-6 rounded-3xl bg-white border border-slate-200 hover:border-slate-300 transition-all shadow-xs hover:shadow-md space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="px-2.5 py-1 rounded-xl text-[10px] font-extrabold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                        {item.category} • #{item.id}
                      </span>
                      <span
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold uppercase border ${
                          item.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : item.status === 'RESOLUTION SUBMITTED'
                            ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                            : item.status === 'IN PROGRESS'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-900 leading-snug flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>{item.roadName}</span>
                      </h4>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                        {item.description}
                      </p>
                    </div>

                    {/* Smart Duplicate Master Link Badge */}
                    {master && (
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-blue-700 font-bold">
                            🔗 Merged into {master.masterCode}
                          </span>
                          <span className="text-slate-500 font-medium">
                            {master.complaintCount} Reports on Road
                          </span>
                        </div>
                        {master.progress > 0 && (
                          <div>
                            <div className="flex justify-between text-[10px] text-slate-500 mb-1 font-semibold">
                              <span>Repair Progress</span>
                              <span className="text-blue-600 font-bold">{master.progress}%</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-blue-600 to-emerald-500 h-1.5 rounded-full"
                                style={{ width: `${master.progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-medium">
                      Filed on {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => {
                        if (onSelectComplaint) onSelectComplaint(item);
                      }}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-blue-700 hover:text-white bg-blue-50 hover:bg-blue-600 border border-blue-200 flex items-center gap-1 transition-all"
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

      {/* 🎁 Redeem Rewards & City Perks Modal */}
      {showRedeemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-white border border-amber-200 rounded-3xl max-w-lg w-full p-6 sm:p-8 text-slate-900 shadow-2xl space-y-5 relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black uppercase tracking-wider border border-amber-300">
                  Municipal Reward Store
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-1">
                  Redeem Civic Karma Coins
                </h3>
                <p className="text-xs text-slate-500">
                  Current Balance: <strong className="text-amber-800 font-black">🪙 {user?.coins || 0} Coins</strong>
                </p>
              </div>
              <button
                onClick={() => setShowRedeemModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {/* Voucher 1 */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 hover:border-amber-400 transition-all">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🚇</span>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Pune Metro Daily Pass</div>
                    <div className="text-[11px] text-slate-500">Free 1-Day unlimited metro rides</div>
                  </div>
                </div>
                <button
                  onClick={() => showToast('🎉 Pune Metro Pass voucher code sent to your registered email!', 'success')}
                  disabled={(user?.coins || 0) < 150}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white font-extrabold text-xs shadow-sm transition-all"
                >
                  150 🪙
                </button>
              </div>

              {/* Voucher 2 */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 hover:border-amber-400 transition-all">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🏛️</span>
                  <div>
                    <div className="text-xs font-bold text-slate-900">PMC Property Tax Rebate</div>
                    <div className="text-[11px] text-slate-500">₹250 rebate on annual municipal assessment</div>
                  </div>
                </div>
                <button
                  onClick={() => showToast('🎉 Tax rebate coupon registered under your Citizen ID!', 'success')}
                  disabled={(user?.coins || 0) < 300}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white font-extrabold text-xs shadow-sm transition-all"
                >
                  300 🪙
                </button>
              </div>

              {/* Voucher 3 */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 hover:border-amber-400 transition-all">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🌳</span>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Smart City Green Hero Certificate</div>
                    <div className="text-[11px] text-slate-500">Municipal Tree Plantation named in your honor</div>
                  </div>
                </div>
                <button
                  onClick={() => showToast('🎉 Green Citizen certificate generated & tree tagged in Shivaji Nagar!', 'success')}
                  disabled={(user?.coins || 0) < 100}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white font-extrabold text-xs shadow-sm transition-all"
                >
                  100 🪙
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowRedeemModal(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
              >
                Close Store
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
