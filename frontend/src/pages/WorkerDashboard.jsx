import React, { useState, useEffect } from 'react';
import { getBookings, getWorkerProfile, updateBookingStatus, updateWorkerProfile, uploadKYC, verifyCompletionOTP } from '../services/api';
import Navbar from '../components/Navbar';
import BookingDetailsModal from '../components/BookingDetailsModal';
import { LayoutDashboard, FileCheck, DollarSign, Briefcase, Star, Clock, AlertCircle, CheckCircle2, Upload, User as UserIcon, XCircle, Key } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { formatInr } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import { fallbackAvatar, withImageFallback } from '../utils/images';

const WorkerDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [kycFiles, setKycFiles] = useState({ idProof: null });
  const [uploading, setUploading] = useState(false);
  const { setUser } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [jobsPagination, setJobsPagination] = useState({ page: 1, pages: 1 });
  const [profileForm, setProfileForm] = useState({ skills: '', experience: 0, bio: '', amount: '', unit: 'hour', availabilityStatus: 'Available' });
  const [otpInput, setOtpInput] = useState({});
  const [savingProfile, setSavingProfile] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    fetchProfile();
    fetchBookings();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data } = await getWorkerProfile();
      setProfile(data.data);
      setProfileForm({
        skills: data.data.skills?.join(', ') || '',
        experience: data.data.experience || 0,
        bio: data.data.bio || '',
        amount: data.data.pricing?.amount || '',
        unit: data.data.pricing?.unit || 'hour',
        availabilityStatus: data.data.availabilityStatus || 'Available'
      });
    } catch {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async (page = 1) => {
    try {
      const { data } = await getBookings({ page });
      setBookings(data.data);
      setJobsPagination(data.pagination);
    } catch {
      toast.error('Failed to load jobs');
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateWorkerProfile({
        skills: profileForm.skills.split(',').map((skill) => skill.trim()).filter(Boolean),
        experience: Number(profileForm.experience),
        bio: profileForm.bio,
        availabilityStatus: profileForm.availabilityStatus,
        pricing: {
          amount: Number(profileForm.amount),
          unit: profileForm.unit
        }
      });
      toast.success('Profile updated');
      fetchProfile();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Profile update failed');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCompletionVerify = async (bookingId) => {
    try {
      if (!otpInput[bookingId]) return toast.error('Please enter OTP');
      await verifyCompletionOTP(bookingId, otpInput[bookingId]);
      toast.success('Job completed successfully!');
      fetchBookings(jobsPagination.page);
      fetchProfile();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid OTP');
    }
  };

  const handleJobStatus = async (bookingId, status) => {
    try {
      await updateBookingStatus(bookingId, status);
      toast.success('Job updated');
      fetchBookings(jobsPagination.page);
      fetchProfile();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update job');
    }
  };

  const handleKycSubmit = async (e) => {
    e.preventDefault();

    if (!kycFiles.idProof) {
      toast.error('Please select an ID Proof');
      return;
    }

    const formData = new FormData();
    formData.append('idProof', kycFiles.idProof);

    setUploading(true);
    try {
      const { data } = await uploadKYC(formData);

      toast.success(data.message || 'KYC submitted successfully!');
      
      // Update local state and context safely
      if (data && data.data) {
        setProfile(data.data);
        setUser(prev => ({ 
          ...prev, 
          kyc: data.data.kyc || { status: 'pending' } 
        }));
      } else {
        fetchProfile(); // Fallback
      }
      
      setActiveSection('overview');
    } catch (error) {
      console.error('KYC Upload Error:', error);
      const message = error.response?.data?.message || 'KYC upload failed. Please check your network and file size.';
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-heading text-slate-400">Loading Dashboard...</div>;

  const completedJobs = bookings.filter((booking) => booking.status === 'completed');
  const estimatedEarnings = completedJobs.reduce((sum, booking) => sum + (Number(booking.totalPrice) || 0), 0);
  const visibleSections = {
    overview: activeSection === 'overview',
    jobs: activeSection === 'jobs',
    kyc: activeSection === 'kyc',
    profile: activeSection === 'profile'
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* Sidebar Nav */}
        <aside className="w-full lg:w-64 space-y-2">
          <nav className="bg-white p-3 sm:p-4 rounded-3xl premium-shadow border border-slate-100 flex lg:flex-col gap-2 overflow-x-auto">
            <button onClick={() => setActiveSection('overview')} className={`flex-1 lg:flex-none flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all whitespace-nowrap ${activeSection === 'overview' ? 'bg-primary-50 text-primary-600' : 'text-slate-500 hover:bg-slate-50'}`}>
              <LayoutDashboard size={20} /> Dashboard
            </button>
            <button onClick={() => setActiveSection('jobs')} className={`flex-1 lg:flex-none flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all whitespace-nowrap ${activeSection === 'jobs' ? 'bg-primary-50 text-primary-600' : 'text-slate-500 hover:bg-slate-50'}`}>
              <Briefcase size={20} /> My Jobs
            </button>
            <button onClick={() => setActiveSection('kyc')} className={`flex-1 lg:flex-none flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all whitespace-nowrap ${activeSection === 'kyc' ? 'bg-primary-50 text-primary-600' : 'text-slate-500 hover:bg-slate-50'}`}>
              <FileCheck size={20} /> KYC Verification
            </button>
            <button onClick={() => setActiveSection('profile')} className={`flex-1 lg:flex-none flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all whitespace-nowrap ${activeSection === 'profile' ? 'bg-primary-50 text-primary-600' : 'text-slate-500 hover:bg-slate-50'}`}>
               <UserIcon size={20} /> Profile Settings
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 space-y-8">
          {/* Status Banner */}
          {profile?.kyc?.status === 'pending' && (
            <div className="bg-amber-50 border border-amber-200 p-4 sm:p-6 rounded-3xl md:rounded-[32px] flex items-start gap-4">
              <Clock className="text-amber-500 mt-1" size={24} />
              <div>
                <h4 className="font-bold text-amber-900 text-lg">Verification in Progress</h4>
                <p className="text-amber-700 font-medium">Our team is reviewing your documents. You will be notified in your panel once approved.</p>
              </div>
            </div>
          )}

          {profile?.kyc?.status === 'rejected' && (
            <div className="bg-rose-50 border border-rose-200 p-4 sm:p-6 rounded-3xl md:rounded-[32px] flex items-start gap-4">
              <XCircle className="text-rose-500 mt-1" size={24} />
              <div>
                <h4 className="font-bold text-rose-900 text-lg">Verification Rejected</h4>
                <p className="text-rose-700 font-medium">Reason: {profile?.kyc?.rejectionReason || 'Documents were unclear'}. Please re-upload valid documents below.</p>
              </div>
            </div>
          )}

          {profile?.approvalStatus === 'pending' && profile?.kyc?.status === 'none' && (
            <div className="bg-primary-50 border border-primary-200 p-4 sm:p-6 rounded-3xl md:rounded-[32px] flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="text-primary-600 mt-1" size={24} />
                <div>
                  <h4 className="font-bold text-primary-900 text-lg">Complete Your KYC</h4>
                  <p className="text-primary-700 font-medium">To start accepting jobs, please upload your verification documents.</p>
                </div>
              </div>
              <button onClick={() => setActiveSection('kyc')} className="bg-primary-600 text-white px-8 py-3 rounded-2xl font-bold premium-shadow hover:bg-primary-700 transition-all">Submit KYC Now</button>
            </div>
          )}

          {profile?.approvalStatus === 'approved' && (
            <div className="bg-emerald-50 border border-emerald-200 p-4 sm:p-6 rounded-3xl md:rounded-[32px] flex items-start gap-4">
              <CheckCircle2 className="text-emerald-500 mt-1" size={24} />
              <div>
                <h4 className="font-bold text-emerald-900 text-lg">Account Verified</h4>
                <p className="text-emerald-700 font-medium">Your profile is live! You can now browse and accept service requests from customers.</p>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          {visibleSections.overview && <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-white p-5 sm:p-6 rounded-3xl md:rounded-[32px] premium-shadow border border-slate-100">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><DollarSign size={24} /></div>
                <span className="text-emerald-500 font-bold flex items-center gap-1 text-sm bg-emerald-50 px-2 py-0.5 rounded-lg">+12.5%</span>
              </div>
              <h3 className="text-3xl font-bold text-slate-900 font-heading tracking-tight">{formatInr(estimatedEarnings)}</h3>
              <p className="text-slate-500 font-bold text-sm">Total Earnings</p>
            </div>
            <div className="bg-white p-5 sm:p-6 rounded-3xl md:rounded-[32px] premium-shadow border border-slate-100">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><Briefcase size={24} /></div>
              </div>
              <h3 className="text-3xl font-bold text-slate-900 font-heading tracking-tight">{completedJobs.length}</h3>
              <p className="text-slate-500 font-bold text-sm">Jobs Completed</p>
            </div>
            <div className="bg-white p-5 sm:p-6 rounded-3xl md:rounded-[32px] premium-shadow border border-slate-100">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><Star size={24} /></div>
              </div>
              <h3 className="text-3xl font-bold text-slate-900 font-heading tracking-tight">{profile?.averageRating?.toFixed(1) || '0.0'}</h3>
              <p className="text-slate-500 font-bold text-sm">Avg. Rating</p>
            </div>
          </div>}

          {/* KYC Upload Panel (Visible only if status is none or rejected) */}
          {visibleSections.kyc && (profile?.kyc?.status === 'none' || profile?.kyc?.status === 'rejected') && (
            <section className="bg-white p-4 sm:p-8 rounded-3xl md:rounded-[40px] premium-shadow border border-slate-100">
              <h3 className="text-2xl font-bold text-slate-900 mb-8 font-heading">KYC Verification Flow</h3>
              <form onSubmit={handleKycSubmit} className="space-y-8">
                 <div className="grid md:grid-cols-1 gap-8">
                    <div className="space-y-4">
                       <p className="font-bold text-slate-700">1. Government ID (Aadhaar/Passport)</p>
                       <label className={`border-2 border-dashed rounded-3xl p-6 sm:p-12 flex flex-col items-center justify-center cursor-pointer transition-all group ${kycFiles.idProof ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-primary-400 hover:bg-primary-50/30'}`}>
                          {kycFiles.idProof ? <CheckCircle2 className="text-emerald-500 mb-4" size={32} /> : <Upload className="text-slate-400 group-hover:text-primary-600 transition-colors mb-4" size={32} />}
                          <span className={`font-bold text-sm ${kycFiles.idProof ? 'text-emerald-700' : 'text-slate-500'}`}>{kycFiles.idProof ? kycFiles.idProof.name : 'Click to Upload ID Proof'}</span>
                          <input type="file" className="hidden" onChange={(e) => setKycFiles({...kycFiles, idProof: e.target.files[0]})} />
                       </label>
                    </div>
                 </div>
                 <button 
                  type="submit" 
                  disabled={uploading}
                  className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold transition-all disabled:opacity-50"
                 >
                   {uploading ? 'Processing Documents...' : 'Submit for Verification'}
                 </button>
              </form>
            </section>
          )}

          {/* Profile Overview (Always visible) */}
          {visibleSections.overview && <section className="bg-white p-4 sm:p-8 rounded-3xl md:rounded-[40px] premium-shadow border border-slate-100">
            <h3 className="text-2xl font-bold text-slate-900 mb-8 font-heading">Public Profile Overview</h3>
            <div className="flex flex-col md:flex-row gap-6 sm:gap-10 items-start">
               <div className="w-32 h-32 rounded-[32px] overflow-hidden border-4 border-slate-50">
                  <img src={profile?.user?.avatar || fallbackAvatar} onError={withImageFallback()} alt="Profile" className="w-full h-full object-cover" />
               </div>
               <div className="flex-1 space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Expertise</p>
                        <div className="flex flex-wrap gap-2">
                          {profile?.skills?.map((skill, i) => (
                            <span key={i} className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-sm font-bold">{skill}</span>
                          )) || <span className="text-slate-400 italic font-medium">No skills listed</span>}
                        </div>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Pricing</p>
                        <p className="text-xl font-bold text-slate-900">{formatInr(profile?.pricing?.amount)}/ {profile?.pricing?.unit || 'hour'}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Bio</p>
                    <p className="text-slate-600 leading-relaxed font-medium">{profile?.bio}</p>
                  </div>
               </div>
            </div>
          </section>}

          {visibleSections.profile && <section className="bg-white p-4 sm:p-8 rounded-3xl md:rounded-[40px] premium-shadow border border-slate-100">
            <h3 className="text-2xl font-bold text-slate-900 mb-8 font-heading">Profile Settings</h3>
            <form onSubmit={handleProfileSubmit} className="grid md:grid-cols-2 gap-5">
              <input value={profileForm.skills} onChange={(e) => setProfileForm({ ...profileForm, skills: e.target.value })} placeholder="Skills separated by commas" className="bg-slate-50 rounded-2xl px-4 py-4 outline-none" />
              <input value={profileForm.experience} onChange={(e) => setProfileForm({ ...profileForm, experience: e.target.value })} type="number" placeholder="Experience in years" className="bg-slate-50 rounded-2xl px-4 py-4 outline-none" />
              <input value={profileForm.amount} onChange={(e) => setProfileForm({ ...profileForm, amount: e.target.value })} type="number" placeholder="Price" className="bg-slate-50 rounded-2xl px-4 py-4 outline-none" />
              <select value={profileForm.unit} onChange={(e) => setProfileForm({ ...profileForm, unit: e.target.value })} className="bg-slate-50 rounded-2xl px-4 py-4 outline-none">
                <option value="hour">Per hour</option>
                <option value="day">Per day</option>
                <option value="job">Per job</option>
              </select>
              <textarea value={profileForm.bio} onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })} placeholder="Bio" className="md:col-span-2 bg-slate-50 rounded-2xl px-4 py-4 outline-none h-28" />
              <select 
                value={profileForm.availabilityStatus} 
                onChange={(e) => setProfileForm({ ...profileForm, availabilityStatus: e.target.value })} 
                className="bg-slate-50 rounded-2xl px-4 py-4 outline-none border border-slate-100 font-bold"
              >
                <option value="Available">Available</option>
                <option value="Busy" disabled>Busy (In Job)</option>
                <option value="Offline">Offline</option>
              </select>
              <button disabled={savingProfile} className="md:col-span-2 py-4 bg-primary-600 text-white rounded-2xl font-bold disabled:opacity-50">
                {savingProfile ? 'Saving...' : 'Save Profile'}
              </button>
            </form>
          </section>}

          {visibleSections.jobs && <section className="bg-white p-4 sm:p-8 rounded-3xl md:rounded-[40px] premium-shadow border border-slate-100">
            <h3 className="text-2xl font-bold text-slate-900 mb-8 font-heading">My Jobs</h3>
            <div className="space-y-4">
              {bookings.length === 0 ? (
                <p className="text-slate-400 font-bold italic">No assigned jobs yet.</p>
              ) : bookings.map((booking) => (
                <div
                  key={booking._id}
                  onClick={() => setSelectedBooking(booking)}
                  className="border border-slate-100 rounded-3xl p-4 sm:p-5 flex flex-col md:flex-row gap-4 md:items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <div>
                    <p className="font-bold text-slate-900">{booking.service}</p>
                    <p className="text-sm text-slate-500">{booking.user?.name} - {format(new Date(booking.scheduledDate), 'PPp')}</p>
                    <p className="text-sm text-slate-500">{booking.address}</p>
                    <p className="text-sm font-bold text-slate-500">{formatInr(booking.totalPrice)} - Payment {booking.paymentStatus}</p>
                    <span className="inline-block mt-2 bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold uppercase">{booking.status}</span>
                  </div>
                  <div className="flex flex-wrap gap-2" onClick={(event) => event.stopPropagation()}>
                    {booking.status === 'pending' && (
                      <>
                        <button onClick={() => handleJobStatus(booking._id, 'accepted')} className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 font-bold">Accept</button>
                        <button onClick={() => handleJobStatus(booking._id, 'rejected')} className="px-4 py-2 rounded-xl bg-rose-50 text-rose-700 font-bold">Reject</button>
                      </>
                    )}
                    {booking.status === 'accepted' && (
                      <div className="flex flex-col items-end gap-2">
                        <div className="bg-primary-50 px-4 py-2 rounded-xl text-center border border-primary-100">
                          <p className="text-[10px] font-bold text-primary-500 uppercase">Tell User this OTP</p>
                          <p className="text-xl font-black text-primary-700 tracking-widest">{booking.startOTP}</p>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 italic">Wait for user to verify</p>
                      </div>
                    )}
                    {booking.status === 'in_progress' && (
                      <div className="flex flex-col sm:flex-row gap-2">
                        <div className="relative">
                          <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input 
                            placeholder="User's OTP" 
                            className="pl-10 pr-4 py-2 rounded-xl border border-slate-200 outline-none w-32 font-bold"
                            value={otpInput[booking._id] || ''}
                            onChange={(e) => setOtpInput({ ...otpInput, [booking._id]: e.target.value })}
                          />
                        </div>
                        <button onClick={() => handleCompletionVerify(booking._id)} className="px-6 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-all">Verify & Finish</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {jobsPagination.pages > 1 && (
                <div className="flex flex-wrap justify-center gap-3 pt-4">
                  <button disabled={jobsPagination.page <= 1} onClick={() => fetchBookings(jobsPagination.page - 1)} className="px-5 py-3 bg-white border border-slate-100 rounded-xl font-bold disabled:opacity-40">Previous</button>
                  <span className="px-5 py-3 text-slate-500 font-bold">Page {jobsPagination.page} of {jobsPagination.pages}</span>
                  <button disabled={jobsPagination.page >= jobsPagination.pages} onClick={() => fetchBookings(jobsPagination.page + 1)} className="px-5 py-3 bg-white border border-slate-100 rounded-xl font-bold disabled:opacity-40">Next</button>
                </div>
              )}
            </div>
          </section>}
        </main>
      </div>
      <BookingDetailsModal
        booking={selectedBooking}
        viewerRole="worker"
        onClose={() => setSelectedBooking(null)}
      />
    </div>
  );
};

export default WorkerDashboard;
