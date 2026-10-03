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
  const { user, token, showToast, updateCoins } = useAuth();
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
  const [showPresets, setShowPresets] = useState(true); // Toggle sample preset cards
  const [rewardModal, setRewardModal] = useState(null); // Reward modal after submission
  const [countdown, setCountdown] = useState(3); // 3-second coin showcase timer

  // 3-second countdown timer for coin showcase & auto-store in Civic Karma Wallet
  useEffect(() => {
    let timer;
    let interval;
    if (rewardModal) {
      setCountdown(4);
      interval = setInterval(() => {
        setCountdown(prev => (prev > 1 ? prev - 1 : 1));
      }, 1000);

      timer = setTimeout(() => {
        setRewardModal(null);
        setCurrentTab('citizen_dashboard');
      }, 4000);
    }
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [rewardModal]);

  // Live Camera states & refs
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [facingMode, setFacingMode] = useState('environment');
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

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

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

      if (onComplaintSubmitted) onComplaintSubmitted(data.complaint);

      if (data.reward) {
        updateCoins(data.reward.totalCoins);
        setRewardModal(data.reward);
        // Center modal pops up with full celebration and rupees conversion
      } else {
        showToast(data.message || 'Complaint submitted successfully!', 'success');
        setCurrentTab('citizen_dashboard');
      }
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
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-2xl space-y-4">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                <span className="text-sm font-bold text-slate-900">Live Camera Capture</span>
              </div>
              <button
                type="button"
                onClick={stopCamera}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-all"
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
              <div className="absolute inset-8 border-2 border-dashed border-white/50 rounded-2xl pointer-events-none flex items-center justify-center">
                <div className="w-8 h-8 border-t-2 border-l-2 border-white absolute top-0 left-0 -mt-1 -ml-1" />
                <div className="w-8 h-8 border-t-2 border-r-2 border-white absolute top-0 right-0 -mt-1 -mr-1" />
                <div className="w-8 h-8 border-b-2 border-l-2 border-white absolute bottom-0 left-0 -mb-1 -ml-1" />
                <div className="w-8 h-8 border-b-2 border-r-2 border-white absolute bottom-0 right-0 -mb-1 -mr-1" />
                <span className="text-[11px] font-semibold text-white bg-slate-900/80 px-3 py-1 rounded-full shadow-md">
                  Align defect in center frame
                </span>
              </div>

              {cameraLoading && (
                <div className="absolute inset-0 bg-white/90 flex items-center justify-center text-blue-600 text-xs gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Accessing camera...</span>
                </div>
              )}
            </div>

            {/* Camera Controls */}
            <div className="p-4 flex items-center justify-around bg-slate-50 border-t border-slate-100">
              {/* Flip Camera */}
              <button
                type="button"
                onClick={toggleFacingMode}
                className="p-3 rounded-2xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 transition-all flex flex-col items-center gap-1 text-[10px] font-bold shadow-xs"
                title="Switch Camera (Front/Back)"
              >
                <FlipHorizontal className="w-5 h-5 text-blue-600" />
                <span>Flip</span>
              </button>

              {/* Shutter / Capture Button */}
              <button
                type="button"
                onClick={capturePhoto}
                className="w-16 h-16 rounded-full bg-blue-600 p-1 shadow-lg shadow-blue-600/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
              >
                <div className="w-full h-full rounded-full border-4 border-white flex items-center justify-center bg-blue-500">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              </button>

              {/* Close */}
              <button
                type="button"
                onClick={stopCamera}
                className="p-3 rounded-2xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 transition-all flex flex-col items-center gap-1 text-[10px] font-bold shadow-xs"
              >
                <X className="w-5 h-5 text-rose-600" />
                <span>Cancel</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Assisted Civic Intake</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Report a Public Civic Issue
        </h2>
        <p className="text-xs sm:text-sm text-slate-500">
          Capture a photo directly with your camera or select from your gallery. CivicSense AI with Gemini classifies and routes automatically.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Upload Photo / Take Live Camera Photo */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Camera className="w-4 h-4 text-blue-600" />
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
              className="p-4 rounded-2xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100/80 hover:border-blue-300 transition-all text-left flex items-center gap-3.5 group shadow-xs"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center group-hover:scale-105 transition-all shadow-sm">
                <Camera className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm font-extrabold text-slate-900 group-hover:text-blue-700 transition-colors flex items-center gap-1.5">
                  <span>Take Live Photo</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-blue-700 border border-blue-200 font-bold">Camera</span>
                </div>
                <div className="text-xs text-slate-500">
                  Open device camera & capture defect on spot
                </div>
              </div>
            </button>

            {/* Gallery Upload Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-4 rounded-2xl border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100/80 hover:border-indigo-300 transition-all text-left flex items-center gap-3.5 group shadow-xs"
            >
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center group-hover:scale-105 transition-all shadow-sm">
                <ImageIcon className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm font-extrabold text-slate-900 group-hover:text-indigo-700 transition-colors flex items-center gap-1.5">
                  <span>Choose from Gallery</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold">Files</span>
                </div>
                <div className="text-xs text-slate-500">
                  Select existing photo from phone or computer
                </div>
              </div>
            </button>
          </div>

          {/* Photo Preview & Options */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            {/* Image Preview Box */}
            <div className="relative sm:col-span-1 h-48 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center group shadow-xs">
              {imageUrl ? (
                <>
                  <img src={imageUrl} alt="Uploaded Civic Defect" className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2 flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="p-1.5 rounded-xl bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 shadow-xs transition-all"
                      title="Remove image"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="absolute bottom-2 left-2 bg-white/95 text-slate-800 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-blue-600" />
                    <span>{imageSource === 'camera' ? 'Camera Captured' : imageSource === 'gallery' ? 'Gallery Selected' : 'Sample Selected'}</span>
                  </div>
                </>
              ) : (
                <div className="text-center p-4 text-slate-400 text-xs space-y-1">
                  <Camera className="w-7 h-7 mx-auto opacity-40 text-slate-400" />
                  <div className="font-semibold text-slate-600">No photo selected</div>
                  <div className="text-[10px] text-slate-400">Click Take Live Photo or Gallery</div>
                </div>
              )}
            </div>

            {/* Presets / URL Toggle Section */}
            <div className="sm:col-span-2 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600 font-semibold">
                  Or use sample demo defect:
                </span>
                <button
                  type="button"
                  onClick={() => setShowPresets(!showPresets)}
                  className="text-xs text-blue-600 hover:underline font-bold"
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
                          ? 'bg-blue-50 border-blue-300 text-blue-800 shadow-xs font-bold'
                          : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-bold">{sample.label}</div>
                      <div className="text-[10px] text-slate-400">{sample.cat}</div>
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
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Step 2: Description & Multilingual Input */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 space-y-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-blue-600" />
              <span>2. Problem Description (English, Hindi or Marathi)</span>
            </label>
            <span className="text-xs text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">Gemini AI NLP Powered</span>
          </div>

          {/* Quick Multilingual Prompts */}
          <div className="flex flex-wrap gap-2">
            {SAMPLE_PROMPTS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setDescription(p.text)}
                className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[11px] text-slate-700 transition-all text-left shadow-xs"
              >
                <span className="text-blue-700 font-bold">{p.lang}: </span>
                <span className="italic truncate">{p.text.slice(0, 35)}...</span>
              </button>
            ))}
          </div>

          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the issue (e.g. 'Road pe bada gaddha hai', 'खड्डा खूप खोल आहे', 'Deep pothole causing vehicle breakdown')..."
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500"
          />

          {/* Live AI Real-time Detection Box */}
          {aiAnalysis && (
            <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 space-y-2.5 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-blue-900">
                    Gemini AI Classification: {aiAnalysis.classification?.category}
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[11px] font-extrabold shadow-xs">
                  Confidence: {aiAnalysis.aiConfidence}%
                </span>
              </div>

              <p className="text-xs text-slate-700 font-medium">
                {aiAnalysis.classification?.detectedSummary}
              </p>

              {aiAnalysis.multiIssueDetected && (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>
                    Multiple civic issues detected: {aiAnalysis.classification?.category} + {aiAnalysis.secondaryCategories?.join(', ')}. Linked sub-tasks will be created.
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                <span>Calculated Severity: <strong className="text-rose-600">{aiAnalysis.priority?.score}/100 ({aiAnalysis.priority?.priorityLevel})</strong></span>
                <span>Category: <strong className="text-slate-900">{category}</strong></span>
              </div>
            </div>
          )}
        </div>

        {/* Step 3: Location & Ward */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 space-y-4 shadow-sm">
          <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span>3. Affected Road & Ward Location</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-600 font-semibold mb-1 block">Road / Landmark Name</label>
              <input
                type="text"
                value={roadName}
                onChange={(e) => setRoadName(e.target.value)}
                placeholder="e.g. Ward 12 Main Road, Laxmi Market Road"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 font-semibold mb-1 block">Municipal Ward</label>
              <select
                value={wardId}
                onChange={(e) => setWardId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500"
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
            <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200 text-xs text-orange-900 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900">Smart Duplicate Hub Active: </span>
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
              className="w-4 h-4 rounded text-blue-600 focus:ring-0 bg-slate-100 border-slate-300"
            />
            <label htmlFor="anonToggle" className="text-xs text-slate-700 font-semibold cursor-pointer">
              Report anonymously (hides personal name & contact info from public records)
            </label>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          {/* Potential Reward Incentive Hint */}
          <div className="flex items-center gap-2 text-xs font-bold text-amber-800 bg-amber-50 px-3.5 py-2 rounded-2xl border border-amber-200 shadow-xs">
            <span className="text-base select-none">🪙</span>
            <span>Reward Bounty: <strong>+{50 + (imageUrl ? 25 : 0) + (description.length >= 20 ? 25 : 0)} Civic Coins</strong> on submission</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => setCurrentTab('citizen_dashboard')}
              className="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-extrabold text-xs shadow-lg shadow-blue-600/25 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
            >
              {loading ? (
                <span>AI Processing & Submitting...</span>
              ) : (
                <>
                  <span className="text-sm select-none">🪙</span>
                  <span>Submit Complaint to Authority (+{50 + (imageUrl ? 25 : 0) + (description.length >= 20 ? 25 : 0)} Coins)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* 🎉 Full-Screen Celebratory Center Modal with Coins & Real Rupees Value (200 Coins = ₹5) */}
      {rewardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 animate-fadeIn overflow-hidden">
          {/* Floating Golden Coin Particles across the screen */}
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

          <div className="bg-white border-2 border-amber-300 rounded-3xl max-w-lg w-full p-6 sm:p-8 text-slate-900 shadow-2xl space-y-5 text-center relative overflow-hidden animate-coin-pop z-10">
            {/* Glowing background halo */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-400/25 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />

            {/* Big Animated Coin Icon with sparkles */}
            <div className="relative mx-auto w-24 h-24 rounded-full bg-gradient-to-tr from-amber-400 via-amber-300 to-yellow-200 flex items-center justify-center shadow-2xl shadow-amber-500/40 border-4 border-white animate-bounce">
              <span className="text-5xl select-none">🪙</span>
            </div>

            {/* Center Congratulations Title & Badges */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-100 text-amber-950 text-xs font-black uppercase tracking-wider border border-amber-300 shadow-xs">
                <span>🎉 Congratulations!</span>
              </div>
              
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                You Got +{rewardModal.coinsEarned} Civic Karma Coins!
              </h3>
              
              <p className="text-xs sm:text-sm text-slate-600 font-medium">
                Thank you for being an active responsible citizen and reporting this civic defect.
              </p>
            </div>

            {/* 💎 200 COINS = ₹5 RUPEES PROMINENT VALUE BOX */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-yellow-400/20 to-emerald-500/10 border-2 border-amber-300 text-center space-y-1.5 shadow-sm">
              <div className="flex items-center justify-center gap-2">
                <span className="text-xs font-extrabold text-slate-700">Official Conversion Rate:</span>
                <span className="px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 font-black text-xs shadow-xs border border-amber-500 flex items-center gap-1">
                  <span>🪙 200 Coins</span>
                  <span>=</span>
                  <span className="text-sm">₹5 Rupees</span>
                </span>
              </div>
              <div className="text-xs font-bold text-slate-700 pt-1 flex items-center justify-center gap-4">
                <span>This Reward: <strong className="text-emerald-700 font-black text-sm">₹{((rewardModal.coinsEarned / 200) * 5).toFixed(2)}</strong></span>
                <span className="text-slate-300">•</span>
                <span>Total Balance: <strong className="text-amber-900 font-black text-sm">₹{((rewardModal.totalCoins / 200) * 5).toFixed(2)}</strong></span>
              </div>
            </div>

            {/* 3-Second Animated Auto-Store Progress Bar */}
            <div className="space-y-1.5">
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
                <div
                  className="bg-gradient-to-r from-amber-400 via-amber-500 to-emerald-500 h-2.5 rounded-full transition-all duration-1000 ease-linear shadow-sm"
                  style={{ width: `${((5 - countdown) / 4) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] font-bold text-slate-500">
                <span className="flex items-center gap-1 text-emerald-600 font-black">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Credited to Account
                </span>
                <span>Storing in Civic Karma Wallet in <strong className="text-amber-800 text-xs">{countdown}s</strong>...</span>
              </div>
            </div>

            {/* Coins Breakdown Box */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pb-1 border-b border-slate-200 flex justify-between">
                <span>Reward Item</span>
                <span>Coins (Rupees)</span>
              </div>
              {rewardModal.breakdown ? (
                rewardModal.breakdown.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs font-semibold text-slate-700">
                    <span>{item.item}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-600 font-black">+{item.amount} 🪙</span>
                      <span className="text-[10px] text-slate-400">(₹{((item.amount / 200) * 5).toFixed(2)})</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
                  <span>Verified Civic Submission</span>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600 font-black">+{rewardModal.coinsEarned} 🪙</span>
                    <span className="text-[10px] text-slate-400">(₹{((rewardModal.coinsEarned / 200) * 5).toFixed(2)})</span>
                  </div>
                </div>
              )}
              <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs font-black text-slate-900">
                <span>New Wallet Balance:</span>
                <span className="text-amber-800 text-sm font-black">
                  🪙 {rewardModal.totalCoins} Coins (₹{((rewardModal.totalCoins / 200) * 5).toFixed(2)})
                </span>
              </div>
            </div>

            {/* Direct Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  setRewardModal(null);
                  setDescription('');
                  setImageUrl('https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80');
                  setImageSource('preset');
                }}
                className="py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <span>Report Another</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRewardModal(null);
                  setCurrentTab('citizen_dashboard');
                }}
                className="py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black shadow-lg shadow-blue-600/25 transition-all hover:scale-102 flex items-center justify-center gap-1.5"
              >
                <span>Open Wallet (₹{((rewardModal.totalCoins / 200) * 5).toFixed(2)}) ➔</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
