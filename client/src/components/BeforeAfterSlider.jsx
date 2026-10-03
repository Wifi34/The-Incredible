import React, { useState } from 'react';
import { CheckCircle, XCircle, Sparkles, ShieldCheck, Eye, Layers } from 'lucide-react';

export function BeforeAfterSlider({
  beforeImage,
  afterImage,
  aiConfidence = 96,
  onVerifyFix,
  onRejectFix,
  canVerify = true
}) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const defaultBefore = beforeImage || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80';
  const defaultAfter = afterImage || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80';

  const handleConfirm = () => {
    if (onVerifyFix) onVerifyFix();
  };

  const handleRejectSubmit = () => {
    if (onRejectFix) onRejectFix(rejectionReason);
    setShowRejectionModal(false);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-50 text-cyan-600 border border-cyan-200 shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">AI Resolution Verification Inspection</h4>
            <p className="text-[11px] text-slate-500">
              Interactive Pre-repair vs Post-repair Comparison
            </p>
          </div>
        </div>

        {/* AI Confidence Meter */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-extrabold shadow-sm">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>AI Resolution Confidence: {aiConfidence}%</span>
        </div>
      </div>

      {/* Interactive Visual Comparison Slider */}
      <div className="relative w-full h-72 sm:h-84 rounded-xl overflow-hidden select-none border border-slate-200 shadow-inner bg-slate-100">
        {/* Post-Repair Layer (Background) */}
        <img
          src={defaultAfter}
          alt="After Repair"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute top-3 right-3 bg-white/95 text-emerald-700 font-extrabold text-[10px] uppercase px-2.5 py-1 rounded-md border border-emerald-300 shadow-md">
          AFTER (Restored Surface)
        </div>

        {/* Pre-Repair Layer (Clipped Foreground) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${sliderPosition}%` }}
        >
          <img
            src={defaultBefore}
            alt="Before Repair"
            className="absolute inset-0 w-full h-full object-cover max-w-none"
            style={{ width: '100%', minWidth: '100%' }}
          />
          <div className="absolute top-3 left-3 bg-white/95 text-rose-700 font-extrabold text-[10px] uppercase px-2.5 py-1 rounded-md border border-rose-300 shadow-md">
            BEFORE (Pothole Defect)
          </div>
        </div>

        {/* Slider Handle Divider Line */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize shadow-[0_0_10px_rgba(0,0,0,0.3)]"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-cyan-600 text-white rounded-full flex items-center justify-center shadow-xl border-2 border-white text-xs font-bold">
            ↔
          </div>
        </div>

        {/* Hidden Range Input for smooth drag on touch & mouse */}
        <input
          type="range"
          min="0"
          max="100"
          value={sliderPosition}
          onChange={(e) => setSliderPosition(e.target.value)}
          className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full z-10"
        />
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 font-medium">
        <span>◀ Slide left to inspect repaired surface</span>
        <span>Slide right to inspect original defect ▶</span>
      </div>

      {/* Citizen Verification Action Buttons */}
      {canVerify && (
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3">
          <div className="text-xs font-bold text-slate-700 flex-1">
            Did the authority fix this problem properly?
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setShowRejectionModal(true)}
              className="flex-1 sm:flex-initial px-4 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-98"
            >
              <XCircle className="w-4 h-4 text-rose-600" />
              NO — STILL NOT FIXED
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 sm:flex-initial px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all hover:scale-105 active:scale-98"
            >
              <CheckCircle className="w-4 h-4" />
              YES — ISSUE FIXED
            </button>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-fadeIn">
            <h4 className="text-base font-extrabold text-rose-600 flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              Report Incomplete Resolution
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Please specify why this civic problem is not satisfactorily resolved. The issue will be REOPENED and escalated to authority supervisors.
            </p>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Surface is uneven, edges are loose, debris was left on the road..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-rose-500 transition-all"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowRejectionModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectSubmit}
                className="px-4 py-2 rounded-xl text-xs font-extrabold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20 transition-all"
              >
                Submit Rejection & Reopen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
