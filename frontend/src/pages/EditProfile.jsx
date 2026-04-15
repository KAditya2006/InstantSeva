import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { updateProfile, updateAvatar } from '../services/api';
import { User, Mail, Phone, MapPin, Home, ArrowLeft, Save, Camera, Loader2 } from 'lucide-react';
import AddressAutocomplete from '../components/AddressAutocomplete';
import toast from 'react-hot-toast';

const EditProfile = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    area: '',
    landmark: '',
    pincode: '',
    homeNumber: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        address: user.location?.address || '',
        city: user.location?.city || '',
        area: user.location?.area || '',
        landmark: user.location?.landmark || '',
        pincode: user.location?.pincode || '',
        homeNumber: user.location?.homeNumber || '',
      });
    }
  }, [user]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB');
      return;
    }

    setUploading(true);
    const uploadData = new FormData();
    uploadData.append('avatar', file);

    try {
      const { data } = await updateAvatar(uploadData);
      if (data.success) {
        toast.success('Profile picture updated');
        setUser({ ...user, avatar: data.avatar });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

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
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold font-heading text-slate-900">Edit Profile</h1>
              <p className="text-slate-500 mt-1">Update your personal and location details.</p>
            </div>

            {/* Avatar Section */}
            <div className="relative group self-center sm:self-auto">
              <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-slate-50 premium-shadow bg-white flex items-center justify-center relative">
                <img 
                  src={user?.avatar || '/avatar.svg'} 
                  alt={user?.name}
                  className={`w-full h-full object-cover transition-opacity ${uploading ? 'opacity-30' : 'opacity-100'}`}
                />
                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="text-primary-600 animate-spin" size={24} />
                  </div>
                )}
              </div>
              <label 
                className="absolute -bottom-2 -right-2 p-2 bg-primary-600 text-white rounded-lg cursor-pointer hover:bg-primary-700 transition-all premium-shadow group-hover:scale-110 active:scale-95"
                title="Change Photo"
              >
                <Camera size={16} />
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleAvatarChange}
                  disabled={uploading}
                />
              </label>
            </div>
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

              <div className="space-y-4">
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

                <div className="grid sm:grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                   <div className="space-y-2 col-span-2">
                     <label className="text-xs font-bold text-slate-500 ml-1">Area / Landmark</label>
                     <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                          placeholder="e.g. Near Central Park" 
                          value={formData.landmark}
                          onChange={(e) => setFormData({...formData, landmark: e.target.value})}
                          className="w-full bg-white border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none focus:border-primary-500 transition-colors"
                        />
                     </div>
                   </div>
                   <div className="space-y-2">
                     <label className="text-xs font-bold text-slate-500 ml-1">City</label>
                     <input 
                       placeholder="e.g. Mumbai" 
                       value={formData.city}
                       onChange={(e) => setFormData({...formData, city: e.target.value})}
                       className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm outline-none focus:border-primary-500 transition-colors"
                     />
                   </div>
                   <div className="space-y-2">
                     <label className="text-xs font-bold text-slate-500 ml-1">Pincode</label>
                     <input 
                       placeholder="e.g. 400001" 
                       value={formData.pincode}
                       onChange={(e) => setFormData({...formData, pincode: e.target.value})}
                       className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm outline-none focus:border-primary-500 transition-colors"
                     />
                   </div>
                </div>
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
