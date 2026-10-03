import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  CheckCircle2,
  AlertTriangle,
  Users,
  ShieldAlert,
  Wrench,
  Sparkles,
  ArrowRight,
  TrendingUp,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function DemoScenarioPlayer({ isOpen, onClose, onStepChange }) {
  const { showToast } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stepData, setStepData] = useState(null);

  const STEPS = [
    {
      step: 1,
      title: '20 Citizens Report Potholes on Same Road',
      actor: 'CITIZENS & AI CLUSTER',
      description: '20 individual citizens in Ward 12 submit pothole reports with photos along Ward 12 Main Road.',
      action: 'AI identifies spatial proximity & creates Master Road Issue #R1028. Priority escalates to 98/100 (CRITICAL).',
      badge: '20 Reports Aggregated',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40'
    },
    {
      step: 2,
      title: 'Top of Authority Priority Queue & Team Assigned',
      actor: 'AUTHORITY (Officer Rajesh)',
      description: 'Issue R1028 appears at the very top of the Authority Priority Queue with 🚨 Critical Civic Alert.',
      action: 'Authority reviews recommendation and assigns Road Maintenance Team #3 (Er. Suresh Kadam, 2.4 km away).',
      badge: 'Team #3 Assigned',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
    },
    {
      step: 3,
      title: 'Field Team Mobilized — 25% Progress',
      actor: 'FIELD SQUAD',
      description: 'Road Maintenance Team #3 arrives with asphalt roller, compactor, and hot-mix machine.',
      action: 'Asphalt milling, perimeter cutting, and road barricading initiated. Work progress updated to 25%.',
      badge: 'Work Started (25%)',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40'
    },
    {
      step: 4,
      title: 'Sub-Base Compaction — 50% Progress',
      actor: 'FIELD SQUAD',
      description: 'Crushed stone aggregate and bitumen emulsion primer laid and compacted to civil code.',
      action: 'Work progress updated to 50%. Admin Work Monitoring Center reflects live progress in real-time.',
      badge: 'Sub-base Done (50%)',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
    },
    {
      step: 5,
      title: 'Asphalt Wearing Course Rolled — 75% Progress',
      actor: 'FIELD SQUAD',
      description: 'Hot-mix asphalt wearing course rolling in progress. Road smoothness and water drainage tested.',
      action: 'Work progress elevated to 75%. Notifications sent to all 20 reporting citizens.',
      badge: 'Hot-mix Paved (75%)',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
    },
    {
      step: 6,
      title: 'Resolution Submitted & AI Verification (96%)',
      actor: 'AUTHORITY & AI ENGINE',
      description: 'Work 100% complete. Authority uploads post-repair photo for quality audit.',
      action: 'CivicLens AI Computer Vision analyzes before/after photos and verifies resolution at 96% confidence. Citizen verification requested.',
      badge: 'AI Verified (96%)',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
    },
    {
      step: 7,
      title: 'Citizen Confirms Fix — MASTER ISSUE COMPLETED',
      actor: 'CITIZEN & ADMIN',
      description: 'Citizen Rahul Sharma inspects restored road surface and clicks [YES — ISSUE FIXED].',
      action: 'Master Issue #R1028 status permanently changes to COMPLETED. Resolution time: 18 hours. System-wide analytics updated.',
      badge: 'Resolved & Closed 🎉',
      badgeColor: 'bg-emerald-500/30 text-emerald-200 border-emerald-500/60'
    }
  ];

  // Execute step on backend
  const executeStep = async (stepNumber) => {
    setLoading(true);
    try {
      const res = await fetch('/api/demo/step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stepIndex: stepNumber })
      });
      const data = await res.json();
      if (data.success) {
        setStepData(data);
        setCurrentStep(stepNumber);
        if (onStepChange) onStepChange(stepNumber, data);
        showToast(data.message, 'success');
      }
    } catch (err) {
      showToast('Simulation step failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Reset demo
  const resetDemo = async () => {
    setIsPlaying(false);
    try {
      await fetch('/api/demo/reset', { method: 'POST' });
      setCurrentStep(1);
      await executeStep(1);
      showToast('Demo state reset to initial 20-complaint stage.', 'info');
    } catch (err) {
      showToast('Reset failed', 'error');
    }
  };

  // Auto-play timer
  useEffect(() => {
    let timer;
    if (isPlaying && currentStep < 7) {
      timer = setTimeout(() => {
        const next = currentStep + 1;
        executeStep(next);
        if (next === 7) setIsPlaying(false);
      }, 4000);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentStep]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-4xl w-full p-6 sm:p-8 text-slate-900 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Glowing backdrop decorative */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-gradient-to-br from-rose-500/10 to-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between relative z-10 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-rose-600 to-orange-600 text-white font-extrabold text-[11px] uppercase tracking-wider shadow-sm">
                End-to-End Simulation
              </span>
              <span className="text-xs font-mono text-slate-500">Section 46 Scenario</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
              Interactive 20-Report Civic Lifecycle Demo
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Watch how 20 citizen complaints merge into Master Road Hub #R1028, assign teams, track 25%-100% progress, and close via citizen confirmation.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progression Visualizer */}
        <div className="grid grid-cols-7 gap-1.5 py-2">
          {STEPS.map((s) => {
            const isDone = s.step < currentStep;
            const isCurrent = s.step === currentStep;
            return (
              <button
                key={s.step}
                onClick={() => executeStep(s.step)}
                className={`p-2 rounded-xl text-center border transition-all ${
                  isCurrent
                    ? 'bg-cyan-50 border-cyan-500 text-cyan-700 shadow-md shadow-cyan-500/10 scale-105 font-bold'
                    : isDone
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-medium'
                    : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300'
                }`}
              >
                <div className="text-[10px] font-bold">
                  {isDone ? '✓' : `Step ${s.step}`}
                </div>
                <div className="text-[9px] font-mono truncate">{s.actor.split(' ')[0]}</div>
              </button>
            );
          })}
        </div>

        {/* Active Step Showcase Card */}
        {STEPS[currentStep - 1] && (
          <div className="p-5 sm:p-6 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className={`px-3 py-1 rounded-xl text-xs font-extrabold border ${STEPS[currentStep - 1].badgeColor}`}>
                {STEPS[currentStep - 1].badge}
              </span>
              <span className="text-xs font-bold text-cyan-700">
                ACTOR: {STEPS[currentStep - 1].actor}
              </span>
            </div>

            <div>
              <h4 className="text-lg font-bold text-slate-900">
                {STEPS[currentStep - 1].title}
              </h4>
              <p className="text-sm text-slate-600 mt-1">
                {STEPS[currentStep - 1].description}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 flex items-start gap-2.5 shadow-sm">
              <Sparkles className="w-4 h-4 text-cyan-600 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold text-slate-900">System Impact: </span>
                {STEPS[currentStep - 1].action}
              </div>
            </div>

            {/* Live Progress Bar for Work Steps */}
            {currentStep >= 3 && currentStep <= 6 && (
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>Ward 12 Road Repair Live Progress</span>
                  <span className="text-cyan-700">
                    {currentStep === 3 ? '25%' : currentStep === 4 ? '50%' : currentStep === 5 ? '75%' : '100%'}
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-500 h-3 rounded-full transition-all duration-700 shadow-sm"
                    style={{
                      width: `${currentStep === 3 ? 25 : currentStep === 4 ? 50 : currentStep === 5 ? 75 : 100}%`
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Player Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <button
            onClick={resetDemo}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-2 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Start
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => executeStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1 || loading}
              className="px-3 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-40 text-xs font-bold transition-all"
            >
              Previous
            </button>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`px-5 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 shadow-md transition-all active:scale-98 ${
                isPlaying
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20'
                  : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-600/20'
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4" />
                  Pause Auto-Play
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Auto-Play Lifecycle
                </>
              )}
            </button>

            <button
              onClick={() => executeStep(Math.min(7, currentStep + 1))}
              disabled={currentStep === 7 || loading}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-orange-600 text-white disabled:opacity-40 text-xs font-bold flex items-center gap-1.5 hover:scale-105 active:scale-98 transition-all shadow-md shadow-rose-600/20"
            >
              <span>Next Step</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
