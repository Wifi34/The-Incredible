import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Star,
  Users,
  Wrench,
  Sparkles,
  Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BeforeAfterSlider } from '../components/BeforeAfterSlider';

export function CitizenComplaintDetails({ complaintId, onBack }) {
  const { user, showToast } = useAuth();
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const fetchDetails = async () => {
    try {
      const res = await fetch(`/api/complaints/${complaintId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('civicsense_token')}` }
      });
      const data = await res.json();
      if (data.success) {
        setDetails(data);
      }
    } catch (err) {
      console.error('Failed to load complaint details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (complaintId) fetchDetails();
  }, [complaintId]);

  const handleVerify = async (isFixed, reason = '') => {
    try {
      const res = await fetch(`/api/complaints/${complaintId}/verify-resolution`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('civicsense_token')}`
        },
        body: JSON.stringify({ isFixed, rejectionReason: reason })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, isFixed ? 'success' : 'error');
        fetchDetails();
      }
    } catch (err) {
      showToast('Verification failed', 'error');
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/complaints/${complaintId}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('civicsense_token')}`
        },
        body: JSON.stringify({ rating, comment })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Thank you for your rating!', 'success');
        setFeedbackSubmitted(true);
      }
    } catch (err) {
      showToast('Feedback submission error', 'error');
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-400 text-sm">Loading complaint trajectory...</div>;
  }

  if (!details || !details.complaint) {
    return (
      <div className="p-8 text-center space-y-3">
        <p className="text-slate-400">Complaint not found or unauthorized.</p>
        <button onClick={onBack} className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs">Go Back</button>
      </div>
    );
  }

  const { complaint, masterIssue, timeline, team, authority } = details;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to My Dashboard</span>
      </button>

      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-xl text-xs font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              Complaint #{complaint.id}
            </span>
            <span
              className={`px-3 py-1 rounded-xl text-xs font-bold uppercase border ${
                complaint.status === 'COMPLETED'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : complaint.status === 'RESOLUTION SUBMITTED'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
              }`}
            >
              {complaint.status}
            </span>
          </div>

          <span className="text-xs text-slate-400">
            Reported on {new Date(complaint.createdAt).toLocaleString()}
          </span>
        </div>

        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-cyan-400" />
            <span>{complaint.roadName} — {complaint.category}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">{complaint.description}</p>
        </div>

        {/* Master Road Issue Hub Badge */}
        {masterIssue && (
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 font-bold">
                {masterIssue.masterCode}
              </div>
              <div>
                <div className="font-bold text-white">Aggregated Road Hub ({masterIssue.complaintCount} Reports)</div>
                <div className="text-[11px] text-slate-400">{masterIssue.affectedCitizens} affected citizens recorded</div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div>
                <div className="text-[10px] text-slate-400">Assigned Field Team</div>
                <div className="font-bold text-cyan-400">{team?.name || 'Road Maintenance Squad'}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">Live Progress</div>
                <div className="font-bold text-emerald-400">{masterIssue.progress}%</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Before / After AI Resolution Slider (Section 25 & 26) */}
      {complaint.status === 'RESOLUTION SUBMITTED' && (
        <div className="space-y-2">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Resolution Inspection & Citizen Confirmation</span>
          </h3>
          <BeforeAfterSlider
            beforeImage={complaint.images?.[0]}
            afterImage={masterIssue?.afterImage}
            aiConfidence={masterIssue?.aiVerificationScore || 96}
            onVerifyFix={() => handleVerify(true)}
            onRejectFix={(reason) => handleVerify(false, reason)}
            canVerify={true}
          />
        </div>
      )}

      {/* Comprehensive Chronological Timeline (Section 27) */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>Lifecycle History & Audit Timeline</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {timeline?.length || 0} Events Recorded
          </span>
        </div>

        <div className="relative pl-6 sm:pl-8 space-y-6 border-l-2 border-slate-800">
          {timeline?.map((evt, idx) => (
            <div key={idx} className="relative group">
              {/* Timeline Marker Dot */}
              <div className="absolute -left-[31px] sm:-left-[39px] top-1 w-4 h-4 rounded-full bg-slate-900 border-2 border-cyan-400 group-hover:bg-cyan-400 transition-all shadow-md" />

              <div className="space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-cyan-300">
                    {evt.action.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(evt.timestamp).toLocaleDateString()}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">By: <strong className="text-slate-200">{evt.actor}</strong></div>
                <p className="text-xs text-slate-300 pt-0.5 leading-relaxed">{evt.details}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Citizen Feedback Rating Box (Section 36) */}
      {complaint.status === 'COMPLETED' && !feedbackSubmitted && (
        <form onSubmit={handleFeedbackSubmit} className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
          <h4 className="text-base font-bold text-white flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>Rate Civic Resolution Quality</span>
          </h4>
          <p className="text-xs text-slate-300">
            How satisfied are you with the municipal response and road repair work?
          </p>

          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                type="button"
                key={s}
                onClick={() => setRating(s)}
                className={`p-2 rounded-xl border text-lg transition-all ${
                  rating >= s
                    ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                    : 'bg-slate-950 border-slate-800 text-slate-600'
                }`}
              >
                ★
              </button>
            ))}
            <span className="text-xs font-bold text-amber-300 ml-2">{rating} out of 5 Stars</span>
          </div>

          <textarea
            rows={2}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add comments on quality of repair (e.g. 'Problem fixed properly and promptly!')..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-500"
          />

          <button
            type="submit"
            className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-md transition-all"
          >
            Submit Feedback Rating
          </button>
        </form>
      )}
    </div>
  );
}
