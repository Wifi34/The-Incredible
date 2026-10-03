import React, { useState, useEffect, useRef } from 'react';
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
  ArrowRight,
  Image as ImageIcon,
  RefreshCw,
  X,
  FlipHorizontal,
  Trash2,
  Video,
  Check
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
  const [imageSource, setImageSource] = useState('preset'); // 'camera', 'gallery', 'preset', 'url'
  const [loading, setLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [showPresets, setShowPresets] = useState(false);

  // Live Camera states & refs
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' (back) or 'user' (front)
  const [cameraError, setCameraError] = useState(null);
  const [cameraLoading, setCameraLoading] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);
  const nativeCameraInputRef = useRef(null);

  // Sample preset images for quick testing
  const SAMPLE_IMAGES = [
    { label: 'Pothole Defect', url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80', cat: 'Pothole' },
    { label: 'Garbage Dump', url: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=800&q=80', cat: 'Garbage' },
    { label: 'Broken Streetlight', url: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=800&q=80', cat: 'Broken Streetlight' },
    { label: 'Open Drain / Sewage', url: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=800&q=80', cat: 'Open Drain' }
  ];

  // Multilingual quick sample prompts
  const SAMPLE_PROMPTS = [
    { lang: 'English', text: 'Deep hazardous pothole on main transit curve near Model Colony junction.' },
    { lang: 'Hindi (हिंदी)', text: 'Road pe bada gaddha hai aur raat ko street light bhi nahi chalti.' },
    { lang: 'Marathi (मराठी)', text: 'इथे रस्त्यावर मोठा खड्डा पडला आहे आणि पाण्याचा निचरा होत नाही.' }
  ];

  // 1. Live Camera Stream Management
  const startCamera = async (mode = facingMode) => {
    setIsCameraOpen(true);
    setCameraLoading(true);
    setCameraError(null);

    // Stop any existing stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported on this browser/device');
      }

      const constraints = {
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setFacingMode(mode);
    } catch (err) {
      console.warn('Live webcam error, falling back to native camera input:', err);
      setCameraError('Direct camera stream failed. You can use native mobile camera.');
      // If permission is denied or desktop without camera, trigger native camera file input
      if (nativeCameraInputRef.current) {
        nativeCameraInputRef.current.click();
      }
    } finally {
      setCameraLoading(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const toggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    startCamera(nextMode);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // Scale canvas to video frame dimensions
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to compressed JPEG Data URL
    const photoDataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setImageUrl(photoDataUrl);
    setImageSource('camera');
    stopCamera();
    showToast('Photo captured successfully! AI is analyzing defect...', 'success');
  };

  // 2. Gallery / File Upload Handler
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (JPG, PNG, WebP)', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target.result;
      // Compress image via off-screen canvas if > 800px
      const img = new Image();
      img.onload = () => {
        const maxDim = 1200;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);

        setImageUrl(compressedDataUrl);
        setImageSource('gallery');
        showToast('Image uploaded from Gallery! AI analyzing...', 'success');
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

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
      {/* Hidden File Inputs for Camera & Gallery */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      <input
        ref={nativeCameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Hidden Canvas for Frame Capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Live Camera Modal */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-slate-900 rounded-3xl overflow-hidden border border-cyan-500/40 shadow-2xl space-y-4">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                <span className="text-sm font-bold text-white">Live Camera Capture</span>
              </div>
              <button
                type="button"
                onClick={stopCamera}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Viewport with Targeting Overlay */}
            <div className="relative aspect-[4/3] bg-black overflow-hidden flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Viewfinder Target Guidelines */}
              <div className="absolute inset-8 border-2 border-dashed border-cyan-400/40 rounded-2xl pointer-events-none flex items-center justify-center">
                <div className="w-8 h-8 border-t-2 border-l-2 border-cyan-400 absolute top-0 left-0 -mt-1 -ml-1" />
                <div className="w-8 h-8 border-t-2 border-r-2 border-cyan-400 absolute top-0 right-0 -mt-1 -mr-1" />
                <div className="w-8 h-8 border-b-2 border-l-2 border-cyan-400 absolute bottom-0 left-0 -mb-1 -ml-1" />
                <div className="w-8 h-8 border-b-2 border-r-2 border-cyan-400 absolute bottom-0 right-0 -mb-1 -mr-1" />
                <span className="text-[11px] font-semibold text-cyan-300/80 bg-slate-950/80 px-2.5 py-1 rounded-full border border-cyan-500/30">
                  Align defect in center frame
                </span>
              </div>

              {cameraLoading && (
                <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center text-cyan-400 text-xs gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Accessing camera...</span>
                </div>
              )}
            </div>

            {/* Camera Controls */}
            <div className="p-4 flex items-center justify-around bg-slate-950/80 border-t border-slate-800">
              {/* Flip Camera */}
              <button
                type="button"
                onClick={toggleFacingMode}
                className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all flex flex-col items-center gap-1 text-[10px] font-semibold"
                title="Switch Camera (Front/Back)"
              >
                <FlipHorizontal className="w-5 h-5 text-cyan-400" />
                <span>Flip</span>
              </button>

              {/* Shutter / Capture Button */}
              <button
                type="button"
                onClick={capturePhoto}
                className="w-16 h-16 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 p-1 shadow-lg shadow-cyan-500/40 hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
              >
                <div className="w-full h-full rounded-full border-4 border-white/80 flex items-center justify-center bg-cyan-400/20">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              </button>

              {/* Close */}
              <button
                type="button"
                onClick={stopCamera}
                className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all flex flex-col items-center gap-1 text-[10px] font-semibold"
              >
                <X className="w-5 h-5 text-rose-400" />
                <span>Cancel</span>
              </button>
            </div>
          </div>
        </div>
      )}

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
          Capture a photo directly with your camera or select from your gallery. CivicSense AI with Gemini classifies and routes automatically.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Upload Photo / Take Live Camera Photo */}
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-white flex items-center gap-2">
              <Camera className="w-4 h-4 text-cyan-400" />
              <span>1. Issue Photo (Live Camera or Gallery)</span>
            </label>
            <span className="text-xs text-slate-400">Camera / JPG / PNG / WebP</span>
          </div>

          {/* Action Choice Buttons: Camera vs Gallery */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Live Camera Button */}
            <button
              type="button"
              onClick={() => startCamera('environment')}
              className="p-4 rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/50 to-blue-950/40 hover:border-cyan-400 hover:from-cyan-900/60 hover:to-blue-900/50 transition-all text-left flex items-center gap-3.5 group shadow-lg"
            >
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-all">
                <Camera className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm font-extrabold text-white group-hover:text-cyan-200 transition-colors flex items-center gap-1.5">
                  <span>Take Live Photo</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">Camera</span>
                </div>
                <div className="text-xs text-slate-400">
                  Open device camera & capture defect on spot
                </div>
              </div>
            </button>

            {/* Gallery Upload Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-4 rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/50 to-purple-950/40 hover:border-indigo-400 hover:from-indigo-900/60 hover:to-purple-900/50 transition-all text-left flex items-center gap-3.5 group shadow-lg"
            >
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                <ImageIcon className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm font-extrabold text-white group-hover:text-indigo-200 transition-colors flex items-center gap-1.5">
                  <span>Choose from Gallery</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">Files</span>
                </div>
                <div className="text-xs text-slate-400">
                  Select existing photo from phone or computer
                </div>
              </div>
            </button>
          </div>

          {/* Photo Preview & Options */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            {/* Image Preview Box */}
            <div className="relative sm:col-span-1 h-48 rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 flex items-center justify-center group shadow-inner">
              {imageUrl ? (
                <>
                  <img src={imageUrl} alt="Uploaded Civic Defect" className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2 flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="p-1.5 rounded-xl bg-slate-900/80 hover:bg-rose-900 text-slate-300 hover:text-white border border-slate-700 transition-all"
                      title="Remove image"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    </button>
                  </div>
                  <div className="absolute bottom-2 left-2 bg-slate-900/90 text-cyan-300 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                    <span>{imageSource === 'camera' ? 'Camera Captured' : imageSource === 'gallery' ? 'Gallery Selected' : 'Sample Selected'}</span>
                  </div>
                </>
              ) : (
                <div className="text-center p-4 text-slate-500 text-xs space-y-1">
                  <Camera className="w-7 h-7 mx-auto opacity-40 text-slate-400" />
                  <div>No photo selected</div>
                  <div className="text-[10px] text-slate-600">Click Take Live Photo or Gallery</div>
                </div>
              )}
            </div>

            {/* Presets / URL Toggle Section */}
            <div className="sm:col-span-2 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300 font-semibold">
                  Or use sample demo defect:
                </span>
                <button
                  type="button"
                  onClick={() => setShowPresets(!showPresets)}
                  className="text-xs text-cyan-400 hover:underline font-semibold"
                >
                  {showPresets ? 'Hide presets' : 'Show presets'}
                </button>
              </div>

              {showPresets && (
                <div className="grid grid-cols-2 gap-2 animate-fadeIn">
                  {SAMPLE_IMAGES.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setImageUrl(sample.url);
                        setImageSource('preset');
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
              )}

              <input
                type="text"
                value={imageUrl}
                onChange={(e) => {
                  setImageUrl(e.target.value);
                  setImageSource('url');
                }}
                placeholder="Or paste direct image URL here..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
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
            <span className="text-xs text-slate-400">Gemini AI NLP Intelligence</span>
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
                    Gemini AI Classification: {aiAnalysis.classification?.category}
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
                <span>Calculated Severity: <strong className="text-rose-400">{aiAnalysis.priority?.score}/100 ({aiAnalysis.priority?.priorityLevel})</strong></span>
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
