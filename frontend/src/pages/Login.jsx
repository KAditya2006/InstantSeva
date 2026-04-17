import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { loginUser } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import BrandLogo from '../components/BrandLogo';
import { getPostAuthRedirect } from '../utils/onboarding';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  React.useEffect(() => {
    if (location.state?.message) {
      toast.error(location.state.message);
      // Clear the state to prevent message from repeating on refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await loginUser(formData);
      if (data.success) {
        toast.success('Welcome back!');
        login(data.user, data.token);
        
        const redirectPath = getPostAuthRedirect(data.user);
        navigate(redirectPath, { state: redirectPath === '/profile' ? { onboarding: true } : undefined });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 bg-auth-pattern">
      <div className="w-full max-w-md">
        <div className="bg-white p-6 sm:p-8 md:p-12 rounded-3xl md:rounded-[40px] premium-shadow border border-slate-100">
          <div className="text-center mb-8 sm:mb-10">
            <Link to="/" className="inline-flex justify-center mb-8" aria-label="InstantSeva home">
              <BrandLogo />
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 mb-2">Welcome Back</h1>
            <p className="text-slate-500 font-medium">Please enter your details to sign in.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="email" 
                  placeholder="Email Address" 
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-100 pl-12 pr-4 py-4 rounded-2xl outline-none focus:border-primary-500 focus:bg-white transition-all font-medium"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="password" 
                  placeholder="Password" 
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-100 pl-12 pr-4 py-4 rounded-2xl outline-none focus:border-primary-500 focus:bg-white transition-all font-medium"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm">
              <label className="flex items-center gap-2 text-slate-600 font-medium cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded accent-primary-600" /> Remember me
              </label>
              <Link to="/forgot-password" size="sm" className="text-primary-600 font-bold hover:underline">Forgot password?</Link>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 group tracking-wide"
            >
              {loading ? 'Signing in...' : (
                <>
                  Sign In <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>


          <p className="mt-10 text-center text-slate-500 font-medium">
            New here? <Link to="/signup" className="text-primary-600 font-bold hover:underline">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
