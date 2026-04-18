import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bell, Menu, Search, LogOut, X } from 'lucide-react';
import { io } from 'socket.io-client';
import { getNotifications, markNotificationsRead } from '../services/api';
import BrandLogo from './BrandLogo';
import { fallbackAvatar, withImageFallback } from '../utils/images';
import { getDashboardPath } from '../utils/onboarding';
import { enablePushNotifications, getPushNotificationStatus } from '../utils/pushNotifications';
import toast from 'react-hot-toast';

const Navbar = () => {
  const { user, token, logout } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pushStatus, setPushStatus] = useState('checking');

  useEffect(() => {
    if (!token) return;

    const fetchNotifications = async () => {
      try {
        const { data } = await getNotifications({ limit: 5 });
        setNotifications(data.data);
        setUnread(data.unread);
      } catch {
        setNotifications([]);
      }
    };

    fetchNotifications();
    getPushNotificationStatus()
      .then(setPushStatus)
      .catch(() => setPushStatus('available'));

    // Socket for real-time notifications
    const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || window.location.origin;
    const socket = io(API_URL, {
      auth: { token }
    });

    socket.on('new_notification', (notification) => {
      setNotifications(prev => [notification, ...prev.slice(0, 4)]);
      setUnread(prev => prev + 1);
      toast(() => (
        <span className="flex items-center gap-2">
          <Bell size={18} className="text-primary-600" />
          <b>{notification.title}:</b> {notification.text}
        </span>
      ), { duration: 4000 });
    });

    return () => socket.disconnect();
  }, [token]);

  const handleEnablePushNotifications = async () => {
    setPushStatus('checking');
    try {
      const status = await enablePushNotifications();
      setPushStatus(status);

      if (status === 'enabled') {
        toast.success('Phone alerts enabled');
      } else if (status === 'blocked') {
        toast.error('Notifications are blocked in your browser settings');
      } else if (status === 'not-configured') {
        toast.error('Push notification keys are not configured on the server');
      } else {
        toast.error('Could not enable phone alerts');
      }
    } catch (error) {
      setPushStatus('available');
      toast.error(error.response?.data?.message || 'Could not enable phone alerts');
    }
  };

  const handleNotificationOpen = async () => {
    const nextOpen = !open;
    setOpen(nextOpen);
    if (nextOpen && unread > 0) {
      await markNotificationsRead();
      setUnread(0);
    }
  };

  return (
    <nav className="glass sticky top-0 z-50 w-full border-b border-gray-100">
      <div className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
        <Link to="/" className="shrink-0" aria-label="InstantSeva home">
          <BrandLogo />
        </Link>

        <div className="hidden lg:flex items-center gap-8 text-sm font-medium text-slate-600">
          <Link to="/search" className="hover:text-primary-600 flex items-center gap-2">
            <Search size={18} /> Search Services
          </Link>
          {!token && (
            <Link to="/signup" className="hover:text-primary-600">
              Become a Worker
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {token ? (
            <div className="flex items-center gap-2 sm:gap-4">
            <div className="relative">
              <button onClick={handleNotificationOpen} className="p-2 text-slate-400 hover:text-primary-600 transition-colors relative" title="Notifications">
                <Bell size={20} />
                {unread > 0 && <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] rounded-full min-w-5 h-5 flex items-center justify-center font-bold">{unread}</span>}
              </button>
              {open && (
                <div className="fixed left-4 right-4 top-16 sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-3 sm:w-80 bg-white border border-slate-100 rounded-2xl premium-shadow overflow-hidden">
                  {pushStatus !== 'unsupported' && (
                    <div className="p-3 border-b border-slate-50 bg-slate-50/70">
                      {pushStatus === 'enabled' && (
                        <p className="text-xs font-bold text-emerald-700">Phone alerts are on.</p>
                      )}
                      {pushStatus === 'available' && (
                        <button
                          type="button"
                          onClick={handleEnablePushNotifications}
                          className="w-full rounded-xl bg-primary-600 px-3 py-2 text-xs font-bold text-white hover:bg-primary-700"
                        >
                          Enable phone alerts
                        </button>
                      )}
                      {pushStatus === 'checking' && (
                        <p className="text-xs font-bold text-slate-400">Checking phone alerts...</p>
                      )}
                      {pushStatus === 'blocked' && (
                        <p className="text-xs font-bold text-rose-600">Notifications are blocked in browser settings.</p>
                      )}
                      {pushStatus === 'not-configured' && (
                        <p className="text-xs font-bold text-amber-700">Push keys are not configured on the server.</p>
                      )}
                    </div>
                  )}
                  {notifications.length === 0 ? (
                    <p className="p-4 text-sm text-slate-400 font-bold">No notifications yet.</p>
                  ) : notifications.map((notification) => (
                    <div key={notification._id} className="p-4 border-b border-slate-50 last:border-0">
                      <p className="font-bold text-slate-900 text-sm">{notification.title}</p>
                      <p className="text-xs text-slate-500 mt-1">{notification.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
             {user?.role === 'worker' && (
              <Link to={user?.canAccessDashboard ? getDashboardPath(user) : '/profile'} className="hidden sm:inline-flex text-xs bg-primary-50 text-primary-700 px-3 py-1 rounded-full font-semibold border border-primary-100 hover:bg-primary-100 transition-colors">
                {user?.canAccessDashboard ? 'Worker Panel' : 'Complete Profile'}
              </Link>
            )}
            {user?.role === 'user' && user?.canAccessDashboard && (
              <Link to="/dashboard" className="hidden sm:inline-flex text-xs bg-primary-50 text-primary-700 px-3 py-1 rounded-full font-semibold border border-primary-100 hover:bg-primary-100 transition-colors">
                Dashboard
              </Link>
            )}
            {user?.role === 'user' && !user?.canAccessDashboard && (
              <Link to="/profile" className="hidden sm:inline-flex text-xs bg-amber-50 text-amber-700 px-3 py-1 rounded-full font-semibold border border-amber-100 hover:bg-amber-100 transition-colors">
                Complete Profile
              </Link>
            )}
            {user?.role === 'admin' && (
              <Link to="/admin/dashboard" className="hidden sm:inline-flex text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-semibold border border-emerald-100 hover:bg-emerald-100 transition-colors">
                Admin Panel
              </Link>
            )}
            <button onClick={logout} className="p-2 text-slate-400 hover:text-rose-500 transition-colors" title="Logout">
              <LogOut size={20} />
            </button>
            <Link to="/profile" className="w-10 h-10 rounded-full border-2 border-primary-100 overflow-hidden hover:scale-105 transition-transform">
              <img src={user?.avatar || fallbackAvatar} onError={withImageFallback()} alt="Avatar" className="w-full h-full object-cover" />
            </Link>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-3">
              <Link to="/login" className="px-4 py-2 text-slate-600 hover:text-primary-600 font-medium tracking-wide">
              Login
              </Link>
              <Link to="/signup" className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold premium-shadow transition-all hover:translate-y-[-2px]">
              Get Started
              </Link>
            </div>
          )}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2 text-slate-500 hover:text-primary-600" title="Menu">
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden px-4 pb-4 grid gap-2 text-sm font-bold text-slate-600">
          <Link onClick={() => setMobileOpen(false)} to="/search" className="flex items-center gap-2 rounded-xl bg-white/70 px-4 py-3">
            <Search size={18} /> Search Services
          </Link>
          {!token && <Link onClick={() => setMobileOpen(false)} to="/signup" className="rounded-xl bg-white/70 px-4 py-3">Become a Worker</Link>}
          {!token && <Link onClick={() => setMobileOpen(false)} to="/login" className="rounded-xl bg-white/70 px-4 py-3">Login</Link>}
          {!token && <Link onClick={() => setMobileOpen(false)} to="/signup" className="rounded-xl bg-primary-600 text-white px-4 py-3">Get Started</Link>}
          {user?.role === 'worker' && <Link onClick={() => setMobileOpen(false)} to={user?.canAccessDashboard ? getDashboardPath(user) : '/profile'} className="rounded-xl bg-white/70 px-4 py-3">{user?.canAccessDashboard ? 'Worker Panel' : 'Complete Profile'}</Link>}
          {user?.role === 'user' && <Link onClick={() => setMobileOpen(false)} to={user?.canAccessDashboard ? '/dashboard' : '/profile'} className="rounded-xl bg-white/70 px-4 py-3">{user?.canAccessDashboard ? 'Dashboard' : 'Complete Profile'}</Link>}
          {user?.role === 'admin' && <Link onClick={() => setMobileOpen(false)} to="/admin/dashboard" className="rounded-xl bg-white/70 px-4 py-3">Admin Panel</Link>}
          {token && <Link onClick={() => setMobileOpen(false)} to="/profile" className="rounded-xl bg-white/70 px-4 py-3">Profile</Link>}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
