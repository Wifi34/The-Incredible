import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('civicsense_token') || null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [toast, setToast] = useState(null);

  // Show temporary toast notification
  const showToast = (message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Fetch current user on mount or token change
  useEffect(() => {
    const fetchMe = async () => {
      if (!token) {
        // Default guest / seed session for instant preview
        setUser({
          id: 'usr_citizen_1',
          name: 'Rahul Sharma',
          email: 'citizen@civicsense.gov',
          role: 'CITIZEN',
          phone: '+91 98765 43210',
          wardId: 'ward_12',
          city: 'Pune',
          coins: 250,
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'
        });
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setUser(data.user);
        } else {
          localStorage.removeItem('civicsense_token');
          setToken(null);
        }
      } catch (err) {
        console.error('Session restore error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMe();
  }, [token]);

  // Login handler
  const login = async (email, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!data.success) {
        showToast(data.message || 'Login failed', 'error');
        return { success: false, message: data.message };
      }

      localStorage.setItem('civicsense_token', data.token);
      setToken(data.token);
      setUser(data.user);
      showToast(`Welcome back, ${data.user.name}! (${data.user.role})`, 'success');
      return { success: true, user: data.user };
    } catch (err) {
      showToast('Login network error', 'error');
      return { success: false, message: err.message };
    }
  };

  // Register handler (Citizens only)
  const register = async (formData) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!data.success) {
        showToast(data.message || 'Registration failed', 'error');
        return { success: false, message: data.message };
      }

      localStorage.setItem('civicsense_token', data.token);
      setToken(data.token);
      setUser(data.user);
      showToast('Registration successful! Welcome to CivicSense.', 'success');
      return { success: true, user: data.user };
    } catch (err) {
      showToast('Registration error', 'error');
      return { success: false, message: err.message };
    }
  };

  // Logout handler
  const logout = () => {
    localStorage.removeItem('civicsense_token');
    setToken(null);
    setUser(null);
    showToast('Logged out successfully', 'info');
  };

  // Quick Role Switcher for instant testing & demo presentations
  const switchRole = async (targetRole) => {
    if (targetRole === 'CITIZEN') {
      await login('citizen@civicsense.gov', 'Citizen@123');
    } else if (targetRole === 'AUTHORITY') {
      await login('authority.roads@civicsense.gov', 'Authority@123');
    } else if (targetRole === 'ADMIN') {
      await login('admin@civicsense.gov', 'Admin@123');
    }
  };

  const updateCoins = (newCoinCount) => {
    setUser(prev => prev ? { ...prev, coins: newCoinCount } : prev);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        coins: user?.coins || 0,
        token,
        role: user?.role || 'GUEST',
        isAuthenticated: Boolean(user),
        loading,
        login,
        register,
        logout,
        switchRole,
        updateCoins,
        showToast,
        toast
      }}
    >
      {children}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border transition-all transform animate-bounce duration-300 bg-white ${
            toast.type === 'error'
              ? 'text-rose-700 border-rose-200 shadow-rose-500/10'
              : toast.type === 'success'
              ? 'text-emerald-700 border-emerald-200 shadow-emerald-500/10'
              : 'text-slate-800 border-slate-200 shadow-slate-900/10'
          }`}
        >
          <span className="text-xl">
            {toast.type === 'error' ? '⚠️' : toast.type === 'success' ? '✅' : 'ℹ️'}
          </span>
          <span className="text-sm font-bold text-slate-800">{toast.message}</span>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
