import React, { useState } from 'react';
import { ShieldCheck, UserPlus, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function RegisterPage({ setCurrentTab }) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Pune');
  const [wardId, setWardId] = useState('ward_12');
  const [loading, setLoading] = useState(false);

  // Password strength calculation
  const getPasswordStrength = () => {
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 6) strength += 25;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9!@#$%^&*]/.test(password)) strength += 25;
    return strength;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await register({
      name,
      email,
      phone,
      password,
      confirmPassword,
      address,
      city,
      wardId
    });
    setLoading(false);
    if (res.success) {
      setCurrentTab('citizen_dashboard');
    }
  };

  const strength = getPasswordStrength();

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-6 animate-fadeIn">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-cyan-50 border border-cyan-200 text-cyan-600 flex items-center justify-center mx-auto shadow-sm">
          <UserPlus className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-black text-slate-900">Citizen Registration</h2>
        <p className="text-xs text-slate-500">
          Join CivicSense to report civic hazards, track road repairs, and verify city resolutions.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-xl space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-700 font-bold block mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              required
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-cyan-500 transition-all"
            />
          </div>

          <div>
            <label className="text-xs text-slate-700 font-bold block mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. rahul@example.com"
              required
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-cyan-500 transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-700 font-bold block mb-1">Mobile Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              required
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-cyan-500 transition-all"
            />
          </div>

          <div>
            <label className="text-xs text-slate-700 font-bold block mb-1">Residential Ward</label>
            <select
              value={wardId}
              onChange={(e) => setWardId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-cyan-500 transition-all font-medium"
            >
              <option value="ward_12">Ward 12 (Shivaji Nagar)</option>
              <option value="ward_8">Ward 8 (Laxmi Road Market)</option>
              <option value="ward_7">Ward 7 (Kalyani Nagar IT)</option>
              <option value="ward_5">Ward 5 (Kasba Peth)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-700 font-bold block mb-1">Street Address</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. Flat 402, Green Avenue, FC Road"
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-cyan-500 transition-all"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-700 font-bold block mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-cyan-500 transition-all"
            />
          </div>

          <div>
            <label className="text-xs text-slate-700 font-bold block mb-1">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-cyan-500 transition-all"
            />
          </div>
        </div>

        {/* Password strength meter */}
        {password && (
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
              <span>Password Security Strength</span>
              <span className={strength >= 75 ? 'text-emerald-600' : strength >= 50 ? 'text-amber-600' : 'text-rose-600'}>
                {strength >= 75 ? 'Strong' : strength >= 50 ? 'Moderate' : 'Weak'}
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  strength >= 75 ? 'bg-emerald-500' : strength >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${strength}%` }}
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-cyan-600/20 transition-all flex items-center justify-center gap-2 active:scale-98"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{loading ? 'Creating Citizen Profile...' : 'Complete Citizen Registration'}</span>
        </button>

        <div className="text-center pt-2">
          <span className="text-xs text-slate-500">Already registered? </span>
          <button
            type="button"
            onClick={() => setCurrentTab('login')}
            className="text-xs font-bold text-cyan-600 hover:text-cyan-700 hover:underline"
          >
            Sign In Here
          </button>
        </div>
      </form>
    </div>
  );
}
