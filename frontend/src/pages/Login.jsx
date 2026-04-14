import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import BrandLogo from '../components/BrandLogo';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await loginUser(formData);
      if (data.success) {
        toast.success('Welcome back!');
        login(data.user, data.token);
        
        // Redirect based on role
        if (data.user.role === 'worker') {
          navigate('/worker/dashboard');
        } else if (data.user.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/');
        }
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
            <Link to="/" className="inline-flex justify-center mb-8" aria-label="HyperlocalMarket home">
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

          <div className="mt-10 relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
            <div className="relative flex justify-center text-sm"><span className="px-4 bg-white text-slate-400 font-medium uppercase tracking-widest text-[10px]">Or continue with</span></div>
          </div>

          <div className="mt-8 grid sm:grid-cols-2 gap-4">
            <button className="flex-1 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 text-slate-600 font-bold text-sm">
              <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="currentColor" d="M12 .5a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.49.99.11-.78.42-1.3.76-1.6-2.66-.3-5.46-1.33-5.46-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23A11.5 11.5 0 0 1 12 5.8c1.02 0 2.04.14 3 .4 2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.61-2.8 5.63-5.48 5.93.43.37.81 1.1.81 2.22v3.29c0 .32.22.69.83.57A12 12 0 0 0 12 .5Z" />
              </svg>
              Github
            </button>
            <button className="flex-1 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 text-slate-600 font-bold text-sm">
              <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M21.35 11.1h-9.17v2.73h5.14c-.22 1.15-.87 2.11-1.85 2.76v2.29h2.99c1.75-1.61 2.76-3.98 2.76-6.73c0-.65-.06-1.32-.17-1.05zM12.18 16.48c-1.57 0-2.91-1.06-3.38-2.48H5.7v2.33c1.01 2.01 3.09 3.4 5.51 3.4c1.61 0 3.12-.55 4.31-1.53l-2.99-2.29c-.37.24-.84.39-1.35.39zM8.8 14c-.11-.34-.17-.71-.17-1.1s.06-.75.17-1.1V9.47H5.7c-.37.74-.58 1.57-.58 2.45s.21 1.71.58 2.45L8.8 14zM12.18 8.16c.86 0 1.63.3 2.24.87l1.68-1.68C15.01 6.55 13.72 6 12.18 6c-2.42 0-4.5 1.39-5.51 3.4l2.45 2.45c.47-1.42 1.81-2.48 3.38-2.48z"/></svg> Google
            </button>
          </div>

          <p className="mt-10 text-center text-slate-500 font-medium">
            New here? <Link to="/signup" className="text-primary-600 font-bold hover:underline">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
