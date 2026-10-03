import React, { useState } from 'react';
import { ShieldAlert, LogIn, Sparkles, UserCheck, Building2, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function LoginPage({ setCurrentTab }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('citizen@civicsense.gov');
  const [password, setPassword] = useState('Citizen@123');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (res.success) {
      if (res.user.role === 'ADMIN') setCurrentTab('admin_dashboard');
      else if (res.user.role === 'AUTHORITY') setCurrentTab('authority_dashboard');
      else setCurrentTab('citizen_dashboard');
    }
  };

  const handleQuickLogin = (testEmail, testPass, targetTab) => {
    setEmail(testEmail);
    setPassword(testPass);
    login(testEmail, testPass).then(res => {
      if (res.success) setCurrentTab(targetTab);
    });
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 space-y-6 animate-fadeIn">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center mx-auto shadow-lg shadow-cyan-500/20">
          <ShieldAlert className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-2xl font-black text-white">Sign In to CivicSense</h2>
        <p className="text-xs text-slate-400">
          Access your role-specific dashboard (Citizen, Authority, or Administrator)
        </p>
      </div>

      {/* Quick Test Credentials Box */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          ⚡ 1-Click Fast Persona Login
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleQuickLogin('citizen@civicsense.gov', 'Citizen@123', 'citizen_dashboard')}
            className="p-2 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-700/50 text-cyan-300 text-xs font-bold transition-all text-center"
          >
            Citizen
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin('authority.roads@civicsense.gov', 'Authority@123', 'authority_dashboard')}
            className="p-2 rounded-xl bg-amber-950/60 hover:bg-amber-900/80 border border-amber-700/50 text-amber-300 text-xs font-bold transition-all text-center"
          >
            Authority
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin('admin@civicsense.gov', 'Admin@123', 'admin_dashboard')}
            className="p-2 rounded-xl bg-purple-950/60 hover:bg-purple-900/80 border border-purple-700/50 text-purple-300 text-xs font-bold transition-all text-center"
          >
            Admin
          </button>
        </div>
      </div>

      {/* Standard Login Form */}
      <form onSubmit={handleSubmit} className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-4">
        <div>
          <label className="text-xs text-slate-300 font-semibold block mb-1">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div>
          <label className="text-xs text-slate-300 font-semibold block mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 transition-all flex items-center justify-center gap-2"
        >
          <LogIn className="w-4 h-4" />
          <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
        </button>

        <div className="text-center pt-2">
          <span className="text-xs text-slate-400">New citizen? </span>
          <button
            type="button"
            onClick={() => setCurrentTab('register')}
            className="text-xs font-bold text-cyan-400 hover:underline"
          >
            Create Citizen Account
          </button>
        </div>
      </form>
    </div>
  );
}
