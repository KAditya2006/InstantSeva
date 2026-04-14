import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from '../services/api';
import { User, Mail, Phone, MapPin, Home, ArrowLeft, Save } from 'lucide-react';
import AddressAutocomplete from '../components/AddressAutocomplete';
import toast from 'react-hot-toast';

const EditProfile = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    homeNumber: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        address: user.location?.address || '',
        homeNumber: user.location?.homeNumber || '',
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await updateProfile(formData);
      if (data.success) {
        toast.success('Profile updated successfully');
        setUser(data.user); // Update local auth state
        navigate('/profile');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <button 
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2 text-slate-500 hover:text-primary-600 font-bold mb-8 transition-colors"
        >
          <ArrowLeft size={20} /> Back to Profile
        </button>

        <div className="bg-white rounded-3xl border border-slate-100 premium-shadow p-6 sm:p-10">
          <div className="mb-8">
            <h1 className="text-3xl font-bold font-heading text-slate-900">Edit Profile</h1>
            <p className="text-slate-500 mt-2">Keep your contact and location details up to date.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-100 pl-12 pr-4 py-3.5 rounded-xl outline-none focus:border-primary-500 transition-colors font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="tel" 
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="e.g., +1 234 567 890"
                      className="w-full bg-slate-50 border border-slate-100 pl-12 pr-4 py-3.5 rounded-xl outline-none focus:border-primary-500 transition-colors font-medium"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Street Address</label>
                <AddressAutocomplete 
                  value={formData.address}
                  onChange={({ address, coordinates }) => setFormData({
                    ...formData, 
                    address,
                    coordinates
                  })}
                  placeholder="Enter your street or neighborhood"
                />
              </div>

              {user?.role === 'user' && (
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Home / Apt Number</label>
                  <div className="relative">
                    <Home className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      value={formData.homeNumber}
                      onChange={(e) => setFormData({...formData, homeNumber: e.target.value})}
                      placeholder="e.g., Suite 200, House 42"
                      className="w-full bg-slate-50 border border-slate-100 pl-12 pr-4 py-3.5 rounded-xl outline-none focus:border-primary-500 transition-colors font-medium"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full sm:w-auto px-10 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? 'Saving Changes...' : (
                  <>
                    <Save size={20} /> Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default EditProfile;
