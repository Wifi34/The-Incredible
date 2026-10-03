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
    return <div className="p-12 text-center text-slate-500 text-sm">Loading complaint trajectory...</div>;
  }

  if (!details || !details.complaint) {
    return (
      <div className="p-8 text-center space-y-3">
        <p className="text-slate-500">Complaint not found or unauthorized.</p>
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
        className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to My Dashboard</span>
      </button>

      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-xl text-xs font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
              Complaint #{complaint.id}
            </span>
            <span
              className={`px-3 py-1 rounded-xl text-xs font-bold uppercase border ${
                complaint.status === 'COMPLETED'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : complaint.status === 'RESOLUTION SUBMITTED'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}
            >
              {complaint.status}
            </span>
          </div>

          <span className="text-xs text-slate-500">
            Reported on {new Date(complaint.createdAt).toLocaleString()}
          </span>
        </div>

        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            <span>{complaint.roadName} — {complaint.category}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">{complaint.description}</p>
        </div>

        {/* Master Road Issue Hub Badge */}
        {masterIssue && (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold">
                {masterIssue.masterCode}
              </div>
              <div>
                <div className="font-bold text-slate-900">Aggregated Road Hub ({masterIssue.complaintCount} Reports)</div>
                <div className="text-[11px] text-slate-500">{masterIssue.affectedCitizens} affected citizens recorded</div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div>
                <div className="text-[10px] text-slate-500 font-medium">Assigned Field Team</div>
                <div className="font-bold text-blue-700">{team?.name || 'Road Maintenance Squad'}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 font-medium">Live Progress</div>
                <div className="font-bold text-emerald-600">{masterIssue.progress}%</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Before / After AI Resolution Slider */}
      {complaint.status === 'RESOLUTION SUBMITTED' && (
        <div className="space-y-2">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
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

      {/* Comprehensive Chronological Timeline */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 space-y-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span>Lifecycle History & Audit Timeline</span>
          </h3>
          <span className="text-xs text-slate-500 font-mono font-semibold">
            {timeline?.length || 0} Events Recorded
          </span>
        </div>

        <div className="relative pl-6 sm:pl-8 space-y-6 border-l-2 border-slate-200">
          {timeline?.map((evt, idx) => (
            <div key={idx} className="relative group">
              {/* Timeline Marker Dot */}
              <div className="absolute -left-[31px] sm:-left-[39px] top-1 w-4 h-4 rounded-full bg-white border-2 border-blue-600 group-hover:bg-blue-600 transition-all shadow-xs" />

              <div className="space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-blue-700">
                    {evt.action.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(evt.timestamp).toLocaleDateString()}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">By: <strong className="text-slate-800">{evt.actor}</strong></div>
                <p className="text-xs text-slate-600 pt-0.5 leading-relaxed">{evt.details}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Citizen Feedback Rating Box */}
      {complaint.status === 'COMPLETED' && !feedbackSubmitted && (
        <form onSubmit={handleFeedbackSubmit} className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 space-y-4 shadow-sm">
          <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>Rate Civic Resolution Quality</span>
          </h4>
          <p className="text-xs text-slate-600">
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
                    ? 'bg-amber-50 border-amber-300 text-amber-500 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-300'
                }`}
              >
                ★
              </button>
            ))}
            <span className="text-xs font-bold text-amber-700 ml-2">{rating} out of 5 Stars</span>
          </div>

          <textarea
            rows={2}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add comments on quality of repair (e.g. 'Problem fixed properly and promptly!')..."
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500"
          />

          <button
            type="submit"
            className="px-6 py-2.5 rounded-2xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-all"
          >
            Submit Feedback Rating
          </button>
        </form>
      )}
    </div>
  );
}
