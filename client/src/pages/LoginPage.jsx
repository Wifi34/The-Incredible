import React, { useState } from 'react';
import { ShieldAlert, LogIn, Eye, EyeOff, AlertCircle, Sparkles, UserCheck, Building2, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function LoginPage({ setCurrentTab }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('citizen@civicsense.gov');
  const [password, setPassword] = useState('Citizen@123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (res.success) {
      if (res.user.role === 'ADMIN') setCurrentTab('admin_dashboard');
      else if (res.user.role === 'AUTHORITY') setCurrentTab('authority_dashboard');
      else setCurrentTab('citizen_dashboard');
    } else {
      setErrorMessage(res.message || 'Login failed. Please check your credentials.');
    }
  };

  const handleQuickLogin = (testEmail, testPass, targetTab) => {
    setErrorMessage('');
    setEmail(testEmail);
    setPassword(testPass);
    login(testEmail, testPass).then(res => {
      if (res.success) {
        setCurrentTab(targetTab);
      } else {
        setErrorMessage(res.message || 'Login failed.');
      }
    });
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 space-y-6 animate-fadeIn">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center mx-auto shadow-md shadow-blue-500/20">
          <ShieldAlert className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-2xl font-black text-slate-900">Sign In to CivicSense</h2>
        <p className="text-xs text-slate-500">
          Access your role-specific dashboard (Citizen, Authority, or Administrator)
        </p>
      </div>

      {/* Quick Test Credentials Box */}
      <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          ⚡ 1-Click Fast Persona Login
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleQuickLogin('citizen@civicsense.gov', 'Citizen@123', 'citizen_dashboard')}
            className="p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold transition-all text-center"
          >
            Citizen
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin('authority.roads@civicsense.gov', 'Authority@123', 'authority_dashboard')}
            className="p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-xs font-bold transition-all text-center"
          >
            Authority
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin('admin@civicsense.gov', 'Admin@123', 'admin_dashboard')}
            className="p-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 text-xs font-bold transition-all text-center"
          >
            Admin
          </button>
        </div>
      </div>

      {/* Standard Login Form */}
      <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
        )}

        <div>
          <label className="text-xs text-slate-700 font-semibold block mb-1">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errorMessage) setErrorMessage('');
            }}
            placeholder="citizen@civicsense.gov"
            required
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500"
          />
        </div>

        <div>
          <label className="text-xs text-slate-700 font-semibold block mb-1">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              placeholder="••••••••"
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 pr-10 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <span>Signing In...</span>
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              <span>Sign In to Dashboard</span>
            </>
          )}
        </button>

        <div className="text-center pt-2">
          <p className="text-xs text-slate-500">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={() => setCurrentTab('register')}
              className="text-blue-600 font-bold hover:underline"
            >
              Register as Citizen
            </button>
          </p>
        </div>
      </form>
    </div>
  );
}
