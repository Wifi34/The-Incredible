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
      const isExplicitlyLoggedOut = localStorage.getItem('civicsense_logged_out') === 'true';

      if (!token) {
        if (isExplicitlyLoggedOut) {
          setUser(null);
          setLoading(false);
          return;
        }

        // First visit auto-session for instant guest exploration
        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'citizen@civicsense.gov', password: 'Citizen@123' })
          });
          const data = await res.json();
          if (data.success && data.token) {
            localStorage.setItem('civicsense_token', data.token);
            setToken(data.token);
            setUser(data.user);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.warn('Initial demo session note:', e);
        }

        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && data.user) {
          setUser(data.user);
        } else {
          localStorage.removeItem('civicsense_token');
          setToken(null);
          setUser(null);
        }
      } catch (err) {
        console.error('Session restore error:', err);
        setUser(null);
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
        body: JSON.stringify({ email: email.trim(), password })
      });
      const data = await res.json();
      if (!data.success) {
        showToast(data.message || 'Login failed. Please check your credentials.', 'error');
        return { success: false, message: data.message || 'Invalid email or password' };
      }

      localStorage.removeItem('civicsense_logged_out');
      localStorage.setItem('civicsense_token', data.token);
      setToken(data.token);
      setUser(data.user);
      showToast(`Welcome back, ${data.user.name}! (${data.user.role})`, 'success');
      return { success: true, user: data.user };
    } catch (err) {
      showToast('Login network error: ' + err.message, 'error');
      return { success: false, message: 'Server connection error. Please try again.' };
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
        return { success: false, message: data.message || 'Registration failed' };
      }

      localStorage.removeItem('civicsense_logged_out');
      localStorage.setItem('civicsense_token', data.token);
      setToken(data.token);
      setUser(data.user);
      showToast('Registration successful! Welcome to CivicLens.', 'success');
      return { success: true, user: data.user };
    } catch (err) {
      showToast('Registration error: ' + err.message, 'error');
      return { success: false, message: 'Server connection error. Please try again.' };
    }
  };

  // Logout handler
  const logout = () => {
    localStorage.setItem('civicsense_logged_out', 'true');
    localStorage.removeItem('civicsense_token');
    setToken(null);
    setUser(null);
    showToast('Logged out successfully', 'info');
  };

  // Quick Role Switcher for instant testing & demo presentations
  const switchRole = async (targetRole) => {
    localStorage.removeItem('civicsense_logged_out');
    if (targetRole === 'CITIZEN') {
      return await login('citizen@civicsense.gov', 'Citizen@123');
    } else if (targetRole === 'AUTHORITY') {
      return await login('authority.roads@civicsense.gov', 'Authority@123');
    } else if (targetRole === 'ADMIN') {
      return await login('admin@civicsense.gov', 'Admin@123');
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
