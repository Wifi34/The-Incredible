import React, { useState, useEffect } from 'react';
import {
  Camera,
  Upload,
  Sparkles,
  MapPin,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Globe2,
  HelpCircle,
  Eye,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function ReportIssuePage({ setCurrentTab, onComplaintSubmitted }) {
  const { user, showToast } = useAuth();
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Pothole');
  const [roadName, setRoadName] = useState('Ward 12 Main Road');
  const [wardId, setWardId] = useState('ward_12');
  const [anonymous, setAnonymous] = useState(false);
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80');
  const [loading, setLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  // Sample preset images for quick testing
  const SAMPLE_IMAGES = [
    { label: 'Pothole Defect', url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80', cat: 'Pothole' },
    { label: 'Garbage Dump', url: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=800&q=80', cat: 'Garbage' },
    { label: 'Broken Streetlight', url: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=800&q=80', cat: 'Broken Streetlight' },
    { label: 'Open Drain / Sewage', url: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=800&q=80', cat: 'Open Drain' }
  ];

  // Multilingual quick sample prompts (Section 33 & 34)
  const SAMPLE_PROMPTS = [
    { lang: 'English', text: 'Deep hazardous pothole on main transit curve near Model Colony junction.' },
    { lang: 'Hindi (हिंदी)', text: 'Road pe bada gaddha hai aur raat ko street light bhi nahi chalti.' },
    { lang: 'Marathi (मराठी)', text: 'इथे रस्त्यावर मोठा खड्डा पडला आहे आणि पाण्याचा निचरा होत नाही.' }
  ];

  // Trigger AI Real-time analysis whenever text or image changes
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!description && !imageUrl) return;
      setAnalyzing(true);
      try {
        const res = await fetch('/api/complaints/ai-analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('civicsense_token')}`
          },
          body: JSON.stringify({ text: description, imageUrl, userCategory: category })
        });
        const data = await res.json();
        if (data.success) {
          setAiAnalysis(data);
          if (data.classification?.category && !category) {
            setCategory(data.classification.category);
          }
        }
      } catch (err) {
        console.error('AI preview error:', err);
      } finally {
        setAnalyzing(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [description, imageUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description && !imageUrl) {
      showToast('Please provide an issue description or image', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('civicsense_token')}`
        },
        body: JSON.stringify({
          description,
          category,
          roadName,
          wardId,
          anonymous,
          images: [imageUrl],
          location: {
            lat: 18.5314 + (Math.random() - 0.5) * 0.003,
            lng: 73.8446 + (Math.random() - 0.5) * 0.003,
            address: `${roadName}, Pune`
          }
        })
      });

      const data = await res.json();
      if (!data.success) {
        showToast(data.message || 'Submission failed', 'error');
        return;
      }

      showToast(data.message, 'success');
      if (onComplaintSubmitted) onComplaintSubmitted(data.complaint);
      setCurrentTab('citizen_dashboard');
    } catch (err) {
      showToast('Error submitting complaint', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Assisted Civic Intake</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
          Report a Public Civic Issue
        </h2>
        <p className="text-xs sm:text-sm text-slate-300">
          Upload a photo or describe the defect. CivicSense AI classifies, calculates safety priority, and aggregates duplicates automatically.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Upload Photo / Choose Sample */}
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-white flex items-center gap-2">
              <Camera className="w-4 h-4 text-cyan-400" />
              <span>1. Issue Photo (AI Computer Vision Analysis)</span>
            </label>
            <span className="text-xs text-slate-400">JPG, PNG, WebP</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Image Preview Box */}
            <div className="relative sm:col-span-1 h-44 rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 flex items-center justify-center">
              {imageUrl ? (
                <>
                  <img src={imageUrl} alt="Uploaded Civic Defect" className="w-full h-full object-cover" />
                  <div className="absolute bottom-2 left-2 bg-slate-900/90 text-cyan-300 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-700">
                    AI Scanned
                  </div>
                </>
              ) : (
                <div className="text-center p-4 text-slate-500 text-xs">
                  <Upload className="w-6 h-6 mx-auto mb-1 opacity-50" />
                  No image selected
                </div>
              )}
            </div>

            {/* Quick Presets */}
            <div className="sm:col-span-2 space-y-2">
              <div className="text-xs text-slate-300 font-semibold">
                Select a Civic Defect Preset or paste URL:
              </div>
              <div className="grid grid-cols-2 gap-2">
                {SAMPLE_IMAGES.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setImageUrl(sample.url);
                      setCategory(sample.cat);
                    }}
                    className={`p-2.5 rounded-xl text-left border text-xs font-semibold transition-all ${
                      imageUrl === sample.url
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-md'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold">{sample.label}</div>
                    <div className="text-[10px] text-slate-500">{sample.cat}</div>
                  </button>
                ))}
              </div>

              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Or paste direct image URL here..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 mt-2"
              />
            </div>
          </div>
        </div>

        {/* Step 2: Description & Multilingual Input */}
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-sm font-bold text-white flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-cyan-400" />
              <span>2. Problem Description (English, Hindi or Marathi)</span>
            </label>
            <span className="text-xs text-slate-400">Multilingual NLP Support</span>
          </div>

          {/* Quick Multilingual Prompts */}
          <div className="flex flex-wrap gap-2">
            {SAMPLE_PROMPTS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setDescription(p.text)}
                className="px-3 py-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 hover:text-white transition-all text-left"
              >
                <span className="text-cyan-400 font-bold">{p.lang}: </span>
                <span className="italic truncate">{p.text.slice(0, 35)}...</span>
              </button>
            ))}
          </div>

          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the issue (e.g. 'Road pe bada gaddha hai', 'खड्डा खूप खोल आहे', 'Deep pothole causing vehicle breakdown')..."
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
          />

          {/* Live AI Real-time Detection Box */}
          {aiAnalysis && (
            <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/40 space-y-2.5 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
                  <span className="text-xs font-bold text-cyan-200">
                    Live AI Classification: {aiAnalysis.classification?.category}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[11px] font-extrabold">
                  Confidence: {aiAnalysis.aiConfidence}%
                </span>
              </div>

              <p className="text-xs text-slate-300">
                {aiAnalysis.classification?.detectedSummary}
              </p>

              {aiAnalysis.multiIssueDetected && (
                <div className="p-2 rounded-lg bg-amber-950/60 border border-amber-500/40 text-xs text-amber-200 flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>
                    Multiple civic issues detected: {aiAnalysis.classification?.category} + {aiAnalysis.secondaryCategories?.join(', ')}. Linked sub-tasks will be created.
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <span>Calculated Severity Score: <strong className="text-rose-400">{aiAnalysis.priority?.priorityScore}/100 ({aiAnalysis.priority?.priorityLevel})</strong></span>
                <span>Category: <strong>{category}</strong></span>
              </div>
            </div>
          )}
        </div>

        {/* Step 3: Location & Ward */}
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
          <label className="text-sm font-bold text-white flex items-center gap-2">
            <MapPin className="w-4 h-4 text-cyan-400" />
            <span>3. Affected Road & Ward Location</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Road / Landmark Name</label>
              <input
                type="text"
                value={roadName}
                onChange={(e) => setRoadName(e.target.value)}
                placeholder="e.g. Ward 12 Main Road, Laxmi Market Road"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Municipal Ward</label>
              <select
                value={wardId}
                onChange={(e) => setWardId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="ward_12">Ward 12 - Shivaji Nagar & University Area</option>
                <option value="ward_8">Ward 8 - Laxmi Road & Commercial Market</option>
                <option value="ward_7">Ward 7 - Kalyani Nagar & IT Corridor</option>
                <option value="ward_5">Ward 5 - Kasba Peth & Heritage Sector</option>
              </select>
            </div>
          </div>

          {/* Smart Duplicate Warning if Ward 12 Main Road */}
          {roadName.toLowerCase().includes('ward 12') && (
            <div className="p-3.5 rounded-xl bg-orange-950/40 border border-orange-500/40 text-xs text-orange-200 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white">Smart Duplicate Hub Active: </span>
                There are already <strong>20 reports</strong> on Ward 12 Main Road. Submitting here will automatically link your complaint to <strong>Master Issue #R1028</strong>, elevating authority priority!
              </div>
            </div>
          )}

          {/* Anonymous Toggle */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="anonToggle"
              checked={anonymous}
              onChange={(e) => setAnonymous(e.target.checked)}
              className="w-4 h-4 rounded text-cyan-600 focus:ring-0 bg-slate-950 border-slate-700"
            />
            <label htmlFor="anonToggle" className="text-xs text-slate-300 font-semibold cursor-pointer">
              Report anonymously (hides personal name & contact info from public records)
            </label>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => setCurrentTab('citizen_dashboard')}
            className="px-5 py-3 rounded-2xl bg-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-all"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-extrabold text-xs shadow-xl shadow-cyan-600/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
          >
            {loading ? (
              <span>AI Processing & Submitting...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Submit Complaint to Authority</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
