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
    <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-5 shadow-2xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">AI Resolution Verification Inspection</h4>
            <p className="text-[11px] text-slate-400">
              Interactive Pre-repair vs Post-repair Comparison
            </p>
          </div>
        </div>

        {/* AI Confidence Meter */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-extrabold shadow-lg shadow-emerald-950/50">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>AI Resolution Confidence: {aiConfidence}%</span>
        </div>
      </div>

      {/* Interactive Visual Comparison Slider */}
      <div className="relative w-full h-72 sm:h-84 rounded-xl overflow-hidden select-none border border-slate-700 shadow-inner bg-slate-950">
        {/* Post-Repair Layer (Background) */}
        <img
          src={defaultAfter}
          alt="After Repair"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute top-3 right-3 bg-emerald-950/90 text-emerald-300 font-extrabold text-[10px] uppercase px-2.5 py-1 rounded-md border border-emerald-600/60 shadow-lg">
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
          <div className="absolute top-3 left-3 bg-rose-950/90 text-rose-300 font-extrabold text-[10px] uppercase px-2.5 py-1 rounded-md border border-rose-600/60 shadow-lg">
            BEFORE (Pothole Defect)
          </div>
        </div>

        {/* Slider Handle Divider Line */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize shadow-[0_0_10px_rgba(255,255,255,0.8)]"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-cyan-500 text-white rounded-full flex items-center justify-center shadow-xl border-2 border-white text-xs font-bold">
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

      <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
        <span>◀ Slide left to inspect repaired surface</span>
        <span>Slide right to inspect original defect ▶</span>
      </div>

      {/* Citizen Verification Action Buttons */}
      {canVerify && (
        <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row items-center gap-3">
          <div className="text-xs font-semibold text-slate-300 flex-1">
            Did the authority fix this problem properly?
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setShowRejectionModal(true)}
              className="flex-1 sm:flex-initial px-4 py-2 bg-rose-950/70 hover:bg-rose-900 border border-rose-600/50 text-rose-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md"
            >
              <XCircle className="w-4 h-4 text-rose-400" />
              NO — STILL NOT FIXED
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 sm:flex-initial px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/30 transition-all hover:scale-105"
            >
              <CheckCircle className="w-4 h-4" />
              YES — ISSUE FIXED
            </button>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 max-w-md w-full space-y-3 shadow-2xl animate-fadeIn">
            <h4 className="text-base font-bold text-rose-400 flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              Report Incomplete Resolution
            </h4>
            <p className="text-xs text-slate-300">
              Please specify why this civic problem is not satisfactorily resolved. The issue will be REOPENED and escalated to authority supervisors.
            </p>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Surface is uneven, edges are loose, debris was left on the road..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowRejectionModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectSubmit}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white"
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
