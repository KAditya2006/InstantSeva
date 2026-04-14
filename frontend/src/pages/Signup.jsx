import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../services/api';
import { User, Mail, Lock, Briefcase, ArrowRight, Home, Clock } from 'lucide-react';
import AddressAutocomplete from '../components/AddressAutocomplete';
import toast from 'react-hot-toast';
import BrandLogo from '../components/BrandLogo';

const Signup = () => {
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    role: 'user',
    address: '',
    homeNumber: '',
    professions: [],
    experience: '',
    bio: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await registerUser(formData);
      if (data.success) {
        toast.success(data.message);
        navigate('/verify-otp', { state: { email: formData.email } });
      }
    } catch (error) {
      console.error('Registration error detail:', error);
      const msg = error.response?.data?.message || error.message || 'Registration failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Left Decoration */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary-600 p-10 xl:p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-[-20%] right-[-20%] w-[600px] h-[600px] bg-white/10 rounded-full blur-[100px]" />
        <div className="relative z-10">
          <Link to="/" className="inline-flex" aria-label="HyperlocalMarket home">
            <BrandLogo light />
          </Link>
          <div className="mt-24 max-w-lg">
            <h2 className="text-4xl xl:text-5xl font-bold text-white font-heading leading-tight mb-6">
              Empowering local experts to grow.
            </h2>
            <p className="text-primary-100 text-xl leading-relaxed">
              Join thousands of workers who have found success through our platform. Secure, reliable, and built for you.
            </p>
          </div>
        </div>
        <div className="relative z-10 flex gap-8">
          <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20">
            <h4 className="text-white font-bold text-2xl">5000+</h4>
            <p className="text-primary-100/80 text-sm">Verified Workers</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20">
            <h4 className="text-white font-bold text-2xl">10k+</h4>
            <p className="text-primary-100/80 text-sm">Happy Customers</p>
          </div>
        </div>
      </div>

      {/* Right Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="mb-8 sm:mb-10 text-center lg:text-left">
            <h3 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 mb-2">Create an Account</h3>
            <p className="text-slate-500">Join the marketplace and discover talented pros.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 bg-white p-1 rounded-xl border border-slate-200 gap-1">
              <button 
                type="button"
                onClick={() => setFormData({...formData, role: 'user'})}
                className={`py-2 px-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${formData.role === 'user' ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                I'm a Customer
              </button>
              <button 
                type="button"
                onClick={() => setFormData({...formData, role: 'worker'})}
                className={`py-2 px-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${formData.role === 'worker' ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                I'm a Worker
              </button>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Full Name" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-white border border-slate-200 pl-12 pr-4 py-3.5 rounded-xl outline-none focus:border-primary-500 transition-colors font-medium"
                />
              </div>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="email" 
                  placeholder="Email Address" 
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-white border border-slate-200 pl-12 pr-4 py-3.5 rounded-xl outline-none focus:border-primary-500 transition-colors font-medium"
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
                  className="w-full bg-white border border-slate-200 pl-12 pr-4 py-3.5 rounded-xl outline-none focus:border-primary-500 transition-colors font-medium"
                />
              </div>

              <div className="relative">
                <AddressAutocomplete 
                  value={formData.address}
                  onChange={({ address, coordinates }) => setFormData({
                    ...formData, 
                    address,
                    location: { ...formData.location, coordinates: coordinates || [0,0] }
                  })}
                  placeholder="Street Address / Location"
                />
              </div>

              {formData.role === 'user' && (
                <div className="relative">
                  <Home className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Home Number (e.g., Apt 4B, House 12)" 
                    required={formData.role === 'user'}
                    value={formData.homeNumber}
                    onChange={(e) => setFormData({...formData, homeNumber: e.target.value})}
                    className="w-full bg-white border border-slate-200 pl-12 pr-4 py-3.5 rounded-xl outline-none focus:border-primary-500 transition-colors font-medium"
                  />
                </div>
              )}

              {formData.role === 'worker' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="relative">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="Your Professions (e.g., Plumber, Electrician)" 
                      required={formData.role === 'worker'}
                      value={formData.professions.join(', ')}
                      onChange={(e) => setFormData({...formData, professions: e.target.value.split(',').map(p => p.trim()).filter(Boolean)})}
                      className="w-full bg-white border border-slate-200 pl-12 pr-4 py-3.5 rounded-xl outline-none focus:border-primary-500 transition-colors font-medium"
                    />
                    <p className="text-[10px] text-slate-400 mt-1 ml-1 font-bold">Separate multiple professions with commas</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="number" 
                        placeholder="Years Exp." 
                        required={formData.role === 'worker'}
                        value={formData.experience}
                        onChange={(e) => setFormData({...formData, experience: e.target.value})}
                        className="w-full bg-white border border-slate-200 pl-12 pr-4 py-3.5 rounded-xl outline-none focus:border-primary-500 transition-colors font-medium"
                      />
                    </div>
                  </div>

                  <div className="relative">
                    <textarea 
                      placeholder="Tell us about your services..." 
                      required={formData.role === 'worker'}
                      value={formData.bio}
                      onChange={(e) => setFormData({...formData, bio: e.target.value})}
                      rows={3}
                      className="w-full bg-white border border-slate-200 p-4 rounded-xl outline-none focus:border-primary-500 transition-colors font-medium resize-none"
                    />
                  </div>
                </div>
              )}
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 group"
            >
              {loading ? 'Creating Account...' : (
                <>
                  Register Now <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-slate-500">
            Already have an account? <Link to="/login" className="text-primary-600 font-bold hover:underline">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
