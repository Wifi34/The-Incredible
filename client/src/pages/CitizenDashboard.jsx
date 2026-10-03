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
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredComplaints = complaints.filter(item => {
    const matchesCat = selectedCategory === 'ALL' || item.category === selectedCategory;
    const matchesSearch = !searchTerm ||
      item.roadName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

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

  const [verificationReward, setVerificationReward] = useState(null);
  const [cashConversionModal, setCashConversionModal] = useState(null);
  const [converting, setConverting] = useState(false);

  const handleConvertCoins = async (blocks = 1) => {
    setConverting(true);
    try {
      const res = await fetch('/api/complaints/convert-coins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('civicsense_token')}`
        },
        body: JSON.stringify({ blocks })
      });
      const data = await res.json();
      if (data.success) {
        updateCoins(data.remainingCoins);
        setCashConversionModal(data);
      } else {
        showToast(data.message || 'Conversion failed', 'error');
      }
    } catch (err) {
      showToast('Error converting coins to rupees', 'error');
    } finally {
      setConverting(false);
    }
  };

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
          setVerificationReward(data.reward);
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
              Track your civic submissions, live field repairs, and earn 20 to 50 coins per report!
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => setCurrentTab('report_issue')}
              className="px-6 py-3.5 rounded-2xl font-extrabold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
            >
              <FilePlus className="w-4 h-4" />
              <span>Report New Problem (+20–50 Coins)</span>
            </button>
          </div>
        </div>

        {/* 🪙 Civic Karma Rewards Wallet Tile */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-50 via-white to-yellow-50 border border-amber-200 shadow-sm flex flex-col justify-between space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black uppercase tracking-wider border border-amber-300">
              Civic Karma Wallet
            </span>
            <span className="text-xs font-bold text-amber-800">
              {user?.coins >= 200 ? '🥇 Gold Guardian' : user?.coins >= 100 ? '🥈 Silver Inspector' : '🥉 Bronze Reporter'}
            </span>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-amber-400/25 border-2 border-amber-300 flex items-center justify-center text-3xl shadow-inner animate-pulse">
              🪙
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 leading-none">
                  {user?.coins || 0}
                </span>
                <span className="text-xs font-black text-amber-700 uppercase tracking-wide">Coins</span>
              </div>
              <div className="text-xs font-extrabold text-emerald-700 mt-1 flex items-center gap-1">
                <span>≈ ₹{(((user?.coins || 0) / 200) * 5).toFixed(2)} INR Value</span>
              </div>
            </div>
          </div>

          {/* 200 Coins = 5 Rupees Rate Badge */}
          <div className="px-3 py-1.5 rounded-xl bg-amber-100/90 border border-amber-300 text-center text-[11px] font-black text-amber-950 flex items-center justify-center gap-1.5 shadow-2xs">
            <span>💰 Exchange Rate:</span>
            <span className="bg-amber-300 px-2 py-0.5 rounded-md text-slate-950 font-black">200 Coins = ₹5 Rupees</span>
          </div>

          {/* 200 Coins Milestone Progress / Instant Convert Button */}
          {(user?.coins || 0) >= 200 ? (
            <button
              type="button"
              disabled={converting}
              onClick={() => handleConvertCoins(1)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-md shadow-emerald-600/20 hover:scale-102 active:scale-98 transition-all flex items-center justify-center gap-1.5 animate-bounce"
            >
              <span>{converting ? 'Converting...' : '💸 Convert 200 Coins ➔ ₹5.00 Rupees Cash'}</span>
            </button>
          ) : (
            <div className="space-y-1 bg-white/80 p-2.5 rounded-xl border border-amber-200">
              <div className="flex justify-between text-[10px] font-bold text-slate-600">
                <span>Next ₹5.00 Rupees Milestone:</span>
                <span className="text-amber-800 font-black">{(user?.coins || 0)} / 200 Coins</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                <div
                  className="bg-amber-400 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, ((user?.coins || 0) / 200) * 100)}%` }}
                />
              </div>
              <div className="text-[9px] text-slate-500 text-center font-semibold">
                Submit {Math.ceil((200 - (user?.coins || 0)) / 50)} more report(s) to reach 200 Coins (₹5 Rupees)!
              </div>
            </div>
          )}

          <button
            onClick={() => setShowRedeemModal(true)}
            className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm transition-all hover:scale-101 flex items-center justify-center gap-1.5"
          >
            <span>🎁 Redeem Other City Perks</span>
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

      {/* Complaints List Section with Dynamic Filters & Search */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>My Submitted Complaints & Live Status</span>
            <span className="text-xs font-mono text-blue-700 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 font-bold">
              {complaints.length} Total
            </span>
          </h3>

          {/* Quick Search */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by road or category..."
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-xs"
            />
          </div>
        </div>

        {/* Dynamic Category & Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-1 pb-2">
          {['ALL', 'Pothole', 'Broken Streetlight', 'Garbage', 'Open Drain', 'Water Leakage'].map((cat) => {
            const count = cat === 'ALL'
              ? complaints.length
              : complaints.filter(c => c.category === cat).length;
            if (count === 0 && cat !== 'ALL') return null;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <span>{cat === 'ALL' ? '🌟 All Categories' : cat === 'Pothole' ? '🚧 Pothole' : cat === 'Broken Streetlight' ? '💡 Streetlight' : cat === 'Garbage' ? '🗑️ Garbage' : cat === 'Open Drain' ? '💧 Open Drain' : '🚿 Water'}</span>
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${selectedCategory === cat ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {filteredComplaints.length === 0 && !loading ? (
          <div className="p-12 text-center rounded-3xl bg-white border border-slate-200 space-y-3 shadow-xs">
            <p className="text-slate-500 text-sm">No complaints found matching selected filters.</p>
            <button
              onClick={() => {
                setSelectedCategory('ALL');
                setSearchTerm('');
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredComplaints.map((item) => {
              const master = item.masterIssue;
              const progress = master ? (master.progress || 0) : (item.status === 'COMPLETED' ? 100 : item.status === 'RESOLUTION SUBMITTED' ? 90 : item.status === 'IN PROGRESS' ? 50 : 0);
              
              const catEmoji = item.category === 'Pothole' ? '🚧' : item.category === 'Broken Streetlight' ? '💡' : item.category === 'Garbage' ? '🗑️' : item.category === 'Open Drain' ? '💧' : '📍';

              return (
                <div
                  key={item.id}
                  className="p-6 rounded-3xl bg-white border border-slate-200 hover:border-blue-300 transition-all shadow-xs hover:shadow-md space-y-4 flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    {/* Top Row: Category + ID + Dynamic Status Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2.5 py-1 rounded-xl text-[10px] font-extrabold uppercase bg-slate-100 text-slate-800 border border-slate-200 flex items-center gap-1">
                          <span>{catEmoji}</span>
                          <span>{item.category}</span>
                          <span className="text-slate-400">• #{item.id}</span>
                        </span>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border ${
                          item.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-2xs'
                            : item.status === 'RESOLUTION SUBMITTED'
                            ? 'bg-amber-100 text-amber-950 border-amber-300 animate-pulse shadow-xs font-black'
                            : item.status === 'IN PROGRESS'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {item.status === 'RESOLUTION SUBMITTED' ? '⚡ Action: Verify Fix' : item.status}
                      </span>
                    </div>

                    {/* Complaint Main Info & Thumbnail */}
                    <div className="flex gap-3">
                      {item.images && item.images[0] && (
                        <div className="w-16 h-16 rounded-2xl overflow-hidden border border-slate-200 shrink-0 bg-slate-100">
                          <img
                            src={item.images[0]}
                            alt={item.category}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                      )}

                      <div className="space-y-1 flex-1 min-w-0">
                        <h4 className="text-sm font-extrabold text-slate-900 leading-snug flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span className="truncate">{item.roadName}</span>
                        </h4>
                        <p className="text-xs text-slate-600 line-clamp-2">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    {/* Dynamic Master Road Cluster & Real-time Progress Bar */}
                    {master ? (
                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-blue-700 font-bold flex items-center gap-1">
                            <span>🔗</span>
                            <span>{master.masterCode}</span>
                          </span>
                          <span className="text-slate-600 font-bold bg-white px-2 py-0.5 rounded-md border border-slate-200">
                            {master.complaintCount} Reports on Road
                          </span>
                        </div>

                        <div>
                          <div className="flex justify-between text-[10px] text-slate-600 mb-1 font-bold">
                            <span>Dynamic Repair Progress</span>
                            <span className={progress === 100 ? 'text-emerald-600 font-black' : progress >= 75 ? 'text-blue-600 font-black' : 'text-amber-700 font-black'}>
                              {progress}% {progress === 100 ? 'Complete' : progress === 0 ? 'Pending' : 'Underway'}
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-2 rounded-full transition-all duration-700 ${
                                progress === 100
                                  ? 'bg-emerald-500'
                                  : progress >= 70
                                  ? 'bg-gradient-to-r from-blue-600 to-emerald-500'
                                  : progress >= 30
                                  ? 'bg-gradient-to-r from-blue-500 to-indigo-500'
                                  : 'bg-amber-400'
                              }`}
                              style={{ width: `${Math.max(5, progress)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex justify-between items-center">
                        <span>Status: <strong>{item.status}</strong></span>
                        <span>Priority: <strong className="text-rose-600">{item.priorityScore || 50}/100</strong></span>
                      </div>
                    )}
                  </div>

                  {/* Card Footer: Timestamp & Action */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-semibold">
                      Filed on {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                    
                    <div className="flex items-center gap-2">
                      {item.status === 'RESOLUTION SUBMITTED' ? (
                        <button
                          onClick={() => {
                            if (onSelectComplaint) onSelectComplaint(item);
                          }}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-black text-amber-950 bg-amber-300 hover:bg-amber-400 border border-amber-400 flex items-center gap-1 transition-all shadow-xs"
                        >
                          <span>Verify Fix ➔</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            if (onSelectComplaint) onSelectComplaint(item);
                          }}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold text-blue-700 hover:text-white bg-blue-50 hover:bg-blue-600 border border-blue-200 flex items-center gap-1 transition-all"
                        >
                          <span>Track Timeline</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
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
                  Current Balance: <strong className="text-amber-800 font-black">🪙 {user?.coins || 0} Coins</strong> (≈ <strong className="text-emerald-700 font-bold">₹{(((user?.coins || 0) / 200) * 5).toFixed(2)} INR</strong>)
                </p>
              </div>
              <button
                onClick={() => setShowRedeemModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-xs"
              >
                ✕
              </button>
            </div>

            {/* Exchange rate banner inside store */}
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-center text-xs font-bold text-amber-900 flex items-center justify-center gap-2">
              <span>💰 Coin Exchange Rate:</span>
              <span className="bg-amber-300 text-slate-950 px-2 py-0.5 rounded-md font-black">200 Coins = ₹5 Rupees</span>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {/* Voucher 1 */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 hover:border-amber-400 transition-all">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🚇</span>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Pune Metro Daily Pass</div>
                    <div className="text-[11px] text-slate-500">Free 1-Day unlimited metro rides • Worth ₹3.75 (150 🪙)</div>
                  </div>
                </div>
                <button
                  onClick={() => showToast('🎉 Pune Metro Pass voucher code sent to your registered email!', 'success')}
                  disabled={(user?.coins || 0) < 150}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white font-extrabold text-xs shadow-sm transition-all text-right"
                >
                  <div>150 🪙</div>
                  <div className="text-[9px] opacity-90">(₹3.75)</div>
                </button>
              </div>

              {/* Voucher 2 */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 hover:border-amber-400 transition-all">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🏛️</span>
                  <div>
                    <div className="text-xs font-bold text-slate-900">PMC Property Tax Rebate</div>
                    <div className="text-[11px] text-slate-500">₹250 rebate on annual assessment • 300 🪙</div>
                  </div>
                </div>
                <button
                  onClick={() => showToast('🎉 Tax rebate coupon registered under your Citizen ID!', 'success')}
                  disabled={(user?.coins || 0) < 300}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white font-extrabold text-xs shadow-sm transition-all text-right"
                >
                  <div>300 🪙</div>
                  <div className="text-[9px] opacity-90">(₹7.50)</div>
                </button>
              </div>

              {/* Voucher 3 */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 hover:border-amber-400 transition-all">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🌳</span>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Smart City Green Hero Certificate</div>
                    <div className="text-[11px] text-slate-500">Municipal Tree Plantation in your honor • 100 🪙</div>
                  </div>
                </div>
                <button
                  onClick={() => showToast('🎉 Green Citizen certificate generated & tree tagged in Shivaji Nagar!', 'success')}
                  disabled={(user?.coins || 0) < 100}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white font-extrabold text-xs shadow-sm transition-all text-right"
                >
                  <div>100 🪙</div>
                  <div className="text-[9px] opacity-90">(₹2.50)</div>
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

      {/* 🎉 Full-Screen Center Verification Celebration Popup (200 Coins = ₹5) */}
      {verificationReward && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 animate-fadeIn overflow-hidden">
          {/* Floating Coin Shower */}
          {[...Array(16)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-coin-float pointer-events-none select-none text-2xl sm:text-3xl"
              style={{
                left: `${(i * 6.2) + 2}%`,
                bottom: `${4 + (i % 4) * 12}%`,
                animationDelay: `${i * 0.1}s`,
                animationDuration: `${2.2 + (i % 3) * 0.3}s`
              }}
            >
              🪙
            </div>
          ))}

          <div className="bg-white border-2 border-emerald-400 rounded-3xl max-w-lg w-full p-6 sm:p-8 text-slate-900 shadow-2xl space-y-5 text-center relative overflow-hidden animate-coin-pop z-10">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-400/25 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative mx-auto w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-400 via-teal-300 to-yellow-200 flex items-center justify-center shadow-2xl shadow-emerald-500/40 border-4 border-white animate-bounce">
              <span className="text-5xl select-none">🏆</span>
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-950 text-xs font-black uppercase tracking-wider border border-emerald-300 shadow-xs">
                <span>🎉 Citizen Resolution Verified!</span>
              </div>
              
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Congratulations! You Got +{verificationReward.coinsEarned} Coins!
              </h3>
              
              <p className="text-xs sm:text-sm text-slate-600 font-medium">
                You successfully verified and confirmed the municipal field repair.
              </p>
            </div>

            {/* 200 COINS = ₹5 RUPEES BANNER */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-amber-400/20 to-teal-500/10 border-2 border-emerald-300 text-center space-y-1.5 shadow-sm">
              <div className="flex items-center justify-center gap-2">
                <span className="text-xs font-extrabold text-slate-700">Conversion Value:</span>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500 text-white font-black text-xs shadow-xs border border-emerald-600 flex items-center gap-1">
                  <span>🪙 200 Coins</span>
                  <span>=</span>
                  <span className="text-sm font-black">₹5 Rupees</span>
                </span>
              </div>
              <div className="text-xs font-bold text-slate-700 pt-1 flex items-center justify-center gap-4">
                <span>Reward: <strong className="text-emerald-700 font-black text-sm">₹{((verificationReward.coinsEarned / 200) * 5).toFixed(2)}</strong></span>
                <span className="text-slate-300">•</span>
                <span>Total Balance: <strong className="text-amber-900 font-black text-sm">₹{((verificationReward.totalCoins / 200) * 5).toFixed(2)}</strong></span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2">
              <div className="flex justify-between items-center text-xs font-black text-slate-900">
                <span>New Wallet Balance:</span>
                <span className="text-amber-800 text-sm font-black">
                  🪙 {verificationReward.totalCoins} Coins (₹{((verificationReward.totalCoins / 200) * 5).toFixed(2)})
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setVerificationReward(null)}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-lg shadow-emerald-600/25 transition-all hover:scale-102 flex items-center justify-center gap-2"
            >
              <span>Great! Continue to Dashboard (₹{((verificationReward.totalCoins / 200) * 5).toFixed(2)}) ➔</span>
            </button>
          </div>
        </div>
      )}

      {/* 💸 Cash Conversion Success Center Modal (200 Coins = ₹5) */}
      {cashConversionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 animate-fadeIn overflow-hidden">
          <div className="bg-white border-2 border-emerald-400 rounded-3xl max-w-lg w-full p-6 sm:p-8 text-slate-900 shadow-2xl space-y-5 text-center relative overflow-hidden animate-coin-pop z-10">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-400/25 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative mx-auto w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-500 via-teal-400 to-green-300 flex items-center justify-center shadow-2xl shadow-emerald-500/40 border-4 border-white animate-bounce">
              <span className="text-5xl select-none">💵</span>
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-950 text-xs font-black uppercase tracking-wider border border-emerald-300 shadow-xs">
                <span>🎉 Cash Converted Successfully!</span>
              </div>
              
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                +{cashConversionModal.rupeesEarned}.00 Rupees Credited!
              </h3>
              
              <p className="text-xs sm:text-sm text-slate-600 font-medium">
                {cashConversionModal.coinsDeducted} Civic Coins converted at the official rate (<strong>200 Coins = ₹5 Rupees</strong>).
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-left space-y-2 text-xs">
              <div className="flex justify-between items-center font-bold text-slate-700">
                <span>Coins Redeemed:</span>
                <span className="text-rose-600 font-extrabold">-{cashConversionModal.coinsDeducted} 🪙</span>
              </div>
              <div className="flex justify-between items-center font-bold text-slate-700">
                <span>Cash Credited:</span>
                <span className="text-emerald-700 font-black text-sm">+₹{cashConversionModal.rupeesEarned}.00 INR</span>
              </div>
              <div className="pt-2 border-t border-emerald-200 flex justify-between items-center font-black text-slate-900">
                <span>Remaining Coins:</span>
                <span className="text-amber-800 text-sm">🪙 {cashConversionModal.remainingCoins} Coins</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setCashConversionModal(null)}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-lg shadow-emerald-600/25 transition-all hover:scale-102 flex items-center justify-center gap-2"
            >
              <span>Awesome! Back to Dashboard ➔</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
