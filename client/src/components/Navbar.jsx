import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShieldAlert,
  MapPin,
  Bell,
  UserCheck,
  Building2,
  Users,
  LogOut,
  PlayCircle,
  Menu,
  X,
  FilePlus,
  Compass,
  Activity,
  Award,
  Layers,
  Sparkles
} from 'lucide-react';

export function Navbar({ currentTab, setCurrentTab, onOpenDemo }) {
  const { user, role, switchRole, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const getRoleBadgeColor = () => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'AUTHORITY':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-xl shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentTab('landing')}>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-600 flex items-center justify-center shadow-md shadow-blue-500/20 border border-blue-400/30">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">
                  CivicLens
                </span>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                  AI v2.6
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium tracking-wide">
                Smart Civic Issue & Authority Engine
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1.5">
            {/* Public Tab */}
            <button
              onClick={() => setCurrentTab('landing')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentTab === 'landing'
                  ? 'bg-slate-100 text-blue-700 border border-slate-200 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Overview & Live Map
            </button>

            {/* Role specific links */}
            {role === 'CITIZEN' && (
              <>
                <button
                  onClick={() => setCurrentTab('citizen_dashboard')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    currentTab === 'citizen_dashboard'
                      ? 'bg-slate-100 text-blue-700 border border-slate-200 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  My Dashboard
                </button>
                <button
                  onClick={() => setCurrentTab('report_issue')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    currentTab === 'report_issue'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                  }`}
                >
                  <FilePlus className="w-3.5 h-3.5" />
                  Report Problem
                </button>
              </>
            )}

            {role === 'AUTHORITY' && (
              <>
                <button
                  onClick={() => setCurrentTab('authority_dashboard')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    currentTab === 'authority_dashboard'
                      ? 'bg-amber-50 text-amber-800 border border-amber-200 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Priority Queue & Roads
                </button>
              </>
            )}

            {role === 'ADMIN' && (
              <>
                <button
                  onClick={() => setCurrentTab('admin_dashboard')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    currentTab === 'admin_dashboard'
                      ? 'bg-purple-50 text-purple-800 border border-purple-200 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Work Monitoring Center
                </button>
              </>
            )}

            {/* 1-Click Interactive End-to-End Demo Trigger */}
            <button
              onClick={onOpenDemo}
              className="ml-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 text-white flex items-center gap-1.5 shadow-md shadow-blue-600/20 hover:scale-105 active:scale-95 transition-all"
            >
              <PlayCircle className="w-3.5 h-3.5" />
              Live 20-Report Demo
            </button>
          </div>

          {/* Right Action: Quick Role Switcher + User Profile */}
          <div className="hidden md:flex items-center gap-3">
            {/* Fast Role Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all shadow-xs ${getRoleBadgeColor()}`}
              >
                <span className="w-2 h-2 rounded-full bg-current" />
                <span>Role: {role}</span>
                <span className="text-[10px] opacity-60">▼</span>
              </button>

              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-white border border-slate-200 shadow-xl p-2 z-50 animate-fadeIn">
                  <div className="text-[11px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider">
                    Switch Test Persona
                  </div>
                  <button
                    onClick={() => {
                      switchRole('CITIZEN');
                      setCurrentTab('citizen_dashboard');
                      setShowRoleMenu(false);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-xl text-xs hover:bg-blue-50 text-slate-700 hover:text-blue-700 flex items-center gap-2 transition-colors"
                  >
                    <UserCheck className="w-4 h-4 text-blue-600" />
                    <div>
                      <div className="font-bold">Citizen Rahul Sharma</div>
                      <div className="text-[10px] text-slate-500">Ward 12 Resident</div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      switchRole('AUTHORITY');
                      setCurrentTab('authority_dashboard');
                      setShowRoleMenu(false);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-xl text-xs hover:bg-amber-50 text-slate-700 hover:text-amber-800 flex items-center gap-2 transition-colors"
                  >
                    <Building2 className="w-4 h-4 text-amber-600" />
                    <div>
                      <div className="font-bold">Officer Rajesh Deshmukh</div>
                      <div className="text-[10px] text-slate-500">Road Infra Authority</div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      switchRole('ADMIN');
                      setCurrentTab('admin_dashboard');
                      setShowRoleMenu(false);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-xl text-xs hover:bg-purple-50 text-slate-700 hover:text-purple-800 flex items-center gap-2 transition-colors"
                  >
                    <Users className="w-4 h-4 text-purple-600" />
                    <div>
                      <div className="font-bold">Dr. K. Mehta (Admin)</div>
                      <div className="text-[10px] text-slate-500">Chief Municipal Director</div>
                    </div>
                  </button>

                  <div className="pt-1.5 mt-1.5 border-t border-slate-100 flex flex-col gap-1">
                    <button
                      onClick={() => {
                        setCurrentTab('login');
                        setShowRoleMenu(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-50 text-slate-700 font-semibold"
                    >
                      🔑 Sign In with Credentials
                    </button>
                    <button
                      onClick={() => {
                        setCurrentTab('register');
                        setShowRoleMenu(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-50 text-slate-700 font-semibold"
                    >
                      📝 Register New Account
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Civic Karma Coins Badge for Citizens */}
            {role === 'CITIZEN' && user && (
              <button
                onClick={() => setCurrentTab('citizen_dashboard')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 hover:from-amber-100 hover:to-yellow-100 border border-amber-300 text-amber-950 font-black text-xs shadow-xs transition-all hover:scale-105"
                title="Civic Karma Wallet: 200 Coins = ₹5 Rupees Cash/Rebates"
              >
                <span className="text-sm select-none">🪙</span>
                <span>{user.coins || 0}</span>
                <span className="text-[10px] text-emerald-700 font-extrabold">(₹{(((user.coins || 0) / 200) * 5).toFixed(1)})</span>
              </button>
            )}

            {/* Profile info */}
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <img
                  src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                  alt={user.name}
                  className="w-8 h-8 rounded-full border border-slate-200 object-cover"
                />
                <div className="text-left hidden lg:block">
                  <div className="text-xs font-bold text-slate-800 leading-tight">{user.name}</div>
                  <div className="text-[10px] text-slate-500">{user.city || 'Pune'}</div>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setCurrentTab('login');
                  }}
                  title="Logout"
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentTab('login')}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => setCurrentTab('register')}
                  className="px-3 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs transition-colors"
                >
                  Register
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={onOpenDemo}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-600 text-white"
            >
              Demo
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white p-4 space-y-3 shadow-lg animate-fadeIn">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs text-slate-500">Current Role:</span>
            <span className={`px-2 py-0.5 rounded text-xs font-bold border ${getRoleBadgeColor()}`}>{role}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 py-2">
            <button
              onClick={() => {
                switchRole('CITIZEN');
                setCurrentTab('citizen_dashboard');
                setMobileMenuOpen(false);
              }}
              className="p-2 text-center rounded-xl bg-blue-50 text-xs font-bold text-blue-700 border border-blue-100"
            >
              Citizen
            </button>
            <button
              onClick={() => {
                switchRole('AUTHORITY');
                setCurrentTab('authority_dashboard');
                setMobileMenuOpen(false);
              }}
              className="p-2 text-center rounded-xl bg-amber-50 text-xs font-bold text-amber-800 border border-amber-100"
            >
              Authority
            </button>
            <button
              onClick={() => {
                switchRole('ADMIN');
                setCurrentTab('admin_dashboard');
                setMobileMenuOpen(false);
              }}
              className="p-2 text-center rounded-xl bg-purple-50 text-xs font-bold text-purple-800 border border-purple-100"
            >
              Admin
            </button>
          </div>
          <button
            onClick={() => {
              setCurrentTab('landing');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left py-2 text-sm text-slate-700 font-semibold"
          >
            Overview & Map
          </button>
          {role === 'CITIZEN' && (
            <>
              <button
                onClick={() => {
                  setCurrentTab('citizen_dashboard');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left py-2 text-sm text-slate-700 font-semibold"
              >
                Citizen Dashboard
              </button>
              <button
                onClick={() => {
                  setCurrentTab('report_issue');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left py-2 text-sm text-blue-600 font-bold"
              >
                Report New Problem
              </button>
            </>
          )}
          {role === 'AUTHORITY' && (
            <button
              onClick={() => {
                setCurrentTab('authority_dashboard');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left py-2 text-sm text-amber-700 font-bold"
            >
              Authority Priority Queue
            </button>
          )}
          {role === 'ADMIN' && (
            <button
              onClick={() => {
                setCurrentTab('admin_dashboard');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left py-2 text-sm text-purple-700 font-bold"
            >
              Admin Work Monitoring Center
            </button>
          )}

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => {
                setCurrentTab('login');
                setMobileMenuOpen(false);
              }}
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setCurrentTab('register');
                setMobileMenuOpen(false);
              }}
              className="text-xs font-bold text-cyan-600 hover:underline"
            >
              Register Citizen
            </button>
            {user && (
              <button
                onClick={() => {
                  logout();
                  setCurrentTab('login');
                  setMobileMenuOpen(false);
                }}
                className="text-xs font-bold text-rose-600 hover:underline"
              >
                Sign Out
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
