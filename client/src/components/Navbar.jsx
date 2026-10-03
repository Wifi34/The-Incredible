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
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'AUTHORITY':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      default:
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
    }
  };

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentTab('landing')}>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-cyan-400/30">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-cyan-100 to-cyan-400 bg-clip-text text-transparent">
                  CivicSense
                </span>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold">
                  AI v2.6
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide">
                Smart Civic Issue & Authority Engine
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            {/* Public Tab */}
            <button
              onClick={() => setCurrentTab('landing')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentTab === 'landing'
                  ? 'bg-slate-800 text-cyan-400 border border-slate-700'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
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
                      ? 'bg-slate-800 text-cyan-400 border border-slate-700'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
                  }`}
                >
                  My Dashboard
                </button>
                <button
                  onClick={() => setCurrentTab('report_issue')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    currentTab === 'report_issue'
                      ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                      : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20'
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
                      ? 'bg-slate-800 text-amber-400 border border-slate-700'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
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
                      ? 'bg-slate-800 text-purple-400 border border-slate-700'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
                  }`}
                >
                  Work Monitoring Center
                </button>
              </>
            )}

            {/* 1-Click Interactive End-to-End Demo Trigger */}
            <button
              onClick={onOpenDemo}
              className="ml-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-rose-500 to-orange-500 text-white flex items-center gap-1.5 shadow-lg shadow-orange-500/25 hover:scale-105 active:scale-95 transition-all"
            >
              <PlayCircle className="w-3.5 h-3.5 animate-pulse" />
              Live 20-Report Demo
            </button>
          </div>

          {/* Right Action: Quick Role Switcher + User Profile */}
          <div className="hidden md:flex items-center gap-3">
            {/* Fast Role Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all ${getRoleBadgeColor()}`}
              >
                <span className="w-2 h-2 rounded-full bg-current animate-ping" />
                <span>Role: {role}</span>
                <span className="text-[10px] text-slate-400">▼</span>
              </button>

              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-2 z-50 animate-fadeIn">
                  <div className="text-[11px] font-semibold text-slate-400 px-2 py-1 uppercase tracking-wider">
                    Switch Test Persona
                  </div>
                  <button
                    onClick={() => {
                      switchRole('CITIZEN');
                      setCurrentTab('citizen_dashboard');
                      setShowRoleMenu(false);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-lg text-xs hover:bg-cyan-500/10 text-cyan-200 flex items-center gap-2"
                  >
                    <UserCheck className="w-4 h-4 text-cyan-400" />
                    <div>
                      <div className="font-bold">Citizen Rahul Sharma</div>
                      <div className="text-[10px] text-slate-400">Ward 12 Resident</div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      switchRole('AUTHORITY');
                      setCurrentTab('authority_dashboard');
                      setShowRoleMenu(false);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-lg text-xs hover:bg-amber-500/10 text-amber-200 flex items-center gap-2"
                  >
                    <Building2 className="w-4 h-4 text-amber-400" />
                    <div>
                      <div className="font-bold">Officer Rajesh Deshmukh</div>
                      <div className="text-[10px] text-slate-400">Road Infra Authority</div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      switchRole('ADMIN');
                      setCurrentTab('admin_dashboard');
                      setShowRoleMenu(false);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-lg text-xs hover:bg-purple-500/10 text-purple-200 flex items-center gap-2"
                  >
                    <Users className="w-4 h-4 text-purple-400" />
                    <div>
                      <div className="font-bold">Dr. K. Mehta (Admin)</div>
                      <div className="text-[10px] text-slate-400">Chief Municipal Director</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Profile info */}
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                <img
                  src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                  alt={user.name}
                  className="w-8 h-8 rounded-full border border-slate-700 object-cover"
                />
                <div className="text-left hidden lg:block">
                  <div className="text-xs font-bold text-slate-200 leading-tight">{user.name}</div>
                  <div className="text-[10px] text-slate-400">{user.city || 'Pune'}</div>
                </div>
                <button
                  onClick={logout}
                  title="Logout"
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentTab('login')}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white"
                >
                  Sign In
                </button>
                <button
                  onClick={() => setCurrentTab('register')}
                  className="px-3 py-1.5 text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg"
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
              className="px-2 py-1 rounded text-xs font-bold bg-orange-500 text-white"
            >
              Demo
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-400 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-slate-900 p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs text-slate-400">Current Role:</span>
            <span className={`px-2 py-0.5 rounded text-xs font-bold border ${getRoleBadgeColor()}`}>{role}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 py-2">
            <button
              onClick={() => {
                switchRole('CITIZEN');
                setCurrentTab('citizen_dashboard');
                setMobileMenuOpen(false);
              }}
              className="p-2 text-center rounded bg-slate-800 text-xs text-cyan-300"
            >
              Citizen
            </button>
            <button
              onClick={() => {
                switchRole('AUTHORITY');
                setCurrentTab('authority_dashboard');
                setMobileMenuOpen(false);
              }}
              className="p-2 text-center rounded bg-slate-800 text-xs text-amber-300"
            >
              Authority
            </button>
            <button
              onClick={() => {
                switchRole('ADMIN');
                setCurrentTab('admin_dashboard');
                setMobileMenuOpen(false);
              }}
              className="p-2 text-center rounded bg-slate-800 text-xs text-purple-300"
            >
              Admin
            </button>
          </div>
          <button
            onClick={() => {
              setCurrentTab('landing');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left py-2 text-sm text-slate-300 font-semibold"
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
                className="w-full text-left py-2 text-sm text-slate-300 font-semibold"
              >
                Citizen Dashboard
              </button>
              <button
                onClick={() => {
                  setCurrentTab('report_issue');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left py-2 text-sm text-cyan-400 font-semibold"
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
              className="w-full text-left py-2 text-sm text-amber-400 font-semibold"
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
              className="w-full text-left py-2 text-sm text-purple-400 font-semibold"
            >
              Admin Work Monitoring Center
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
