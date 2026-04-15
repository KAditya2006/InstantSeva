import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { createReview, getBookings, updateBookingPayment, updateBookingStatus, verifyStartOTP } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CalendarDays, CheckCircle2, Clock, XCircle, Key, ShieldCheck, MapPin, Phone } from 'lucide-react';
import TrackingMap from '../components/TrackingMap';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { formatInr } from '../utils/formatters';

const statusStyles = {
  pending: 'bg-amber-50 text-amber-700',
  accepted: 'bg-blue-50 text-blue-700',
  in_progress: 'bg-indigo-50 text-indigo-700 border border-indigo-100',
  rejected: 'bg-rose-50 text-rose-700',
  completed: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-slate-100 text-slate-600'
};

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewForms, setReviewForms] = useState({});
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [otpInput, setOtpInput] = useState({});

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async (page = 1) => {
    try {
      const { data } = await getBookings({ page });
      setBookings(data.data);
      setPagination(data.pagination);
    } catch {
      toast.error('Could not load bookings');
    } finally {
      setLoading(false);
    }
  };

  const changeStatus = async (bookingId, status) => {
    try {
      await updateBookingStatus(bookingId, status);
      toast.success('Booking updated');
      fetchBookings(pagination.page);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update booking');
    }
  };

  const changePayment = async (bookingId, paymentStatus) => {
    try {
      await updateBookingPayment(bookingId, { paymentStatus, paymentMethod: 'manual' });
      toast.success('Payment updated');
      fetchBookings(pagination.page);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update payment');
    }
  };

  const handleStartVerify = async (bookingId) => {
    try {
      if (!otpInput[bookingId]) return toast.error('Please enter OTP');
      await verifyStartOTP(bookingId, otpInput[bookingId]);
      toast.success('Job started!');
      fetchBookings(pagination.page);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid OTP');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6 sm:space-y-8">
        <section className="bg-white rounded-3xl border border-slate-100 premium-shadow p-4 sm:p-8 flex flex-col md:flex-row gap-5 sm:gap-6 md:items-center justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 min-w-0">
            <img src={user?.avatar} alt={user?.name} className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl object-cover" />
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 break-words">{user?.name}</h1>
              <p className="text-slate-500">{user?.email}</p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-xs font-bold uppercase">{user?.role}</span>
                {user?.phone && (
                  <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                    <Phone size={12} /> {user.phone}
                  </span>
                )}
                {user?.location?.city && (
                  <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                    <MapPin size={12} /> {user.location.city} {user.location.pincode && `(${user.location.pincode})`}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button 
            onClick={() => navigate('/profile/edit')}
            className="px-6 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-all premium-shadow"
          >
            Edit Profile
          </button>
        </section>

        <section className="bg-white rounded-3xl border border-slate-100 premium-shadow p-6 sm:p-8">
           <div className="flex items-center gap-3 mb-6">
              <ShieldCheck className="text-primary-600" />
              <h2 className="text-2xl font-bold font-heading text-slate-900">Account Verification</h2>
           </div>
           
           <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-50 p-6 rounded-3xl border border-slate-100">
              <div className="flex items-start gap-4">
                 <div className={`p-3 rounded-2xl ${user?.isAdminApproved ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                    {user?.isAdminApproved ? <CheckCircle2 size={24} /> : <Clock size={24} />}
                 </div>
                 <div>
                    <h4 className="font-bold text-slate-900">{user?.isAdminApproved ? 'Fully Verified' : 'Verification Required'}</h4>
                    <p className="text-sm text-slate-500 font-medium">
                       {user?.isAdminApproved 
                          ? 'Your account is verified. You have full access to all features.' 
                          : 'Please upload your ID proof to start making bookings.'}
                    </p>
                 </div>
              </div>
              {!user?.isAdminApproved && (
                 <button className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold hover:bg-slate-800 transition-all">Upload ID</button>
              )}
           </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <CalendarDays className="text-primary-600" />
            <h2 className="text-2xl font-bold font-heading text-slate-900">Bookings</h2>
          </div>

          {loading ? (
            <div className="bg-white rounded-3xl p-8 sm:p-12 text-center text-slate-400 font-bold">Loading bookings...</div>
          ) : bookings.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-slate-100">
              <p className="font-bold text-slate-700">No bookings yet.</p>
              <p className="text-slate-400 mt-2">Your service requests and assigned jobs will appear here.</p>
            </div>
          ) : bookings.map((booking) => {
            const otherPerson = user?.role === 'worker' ? booking.user : booking.worker;
            return (
              <article key={booking._id} className="bg-white rounded-3xl border border-slate-100 premium-shadow p-4 sm:p-6 flex flex-col lg:flex-row gap-5 lg:items-center justify-between">
                <div className="space-y-2 min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 break-words">{booking.service}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${statusStyles[booking.status] || statusStyles.pending}`}>{booking.status}</span>
                  </div>
                  <p className="text-slate-500 break-words">With {otherPerson?.name} at {booking.address}</p>
                  {otherPerson?.phone && (
                    <div className="flex items-center gap-2 text-primary-600 font-bold text-sm bg-primary-50/50 w-fit px-3 py-1.5 rounded-lg border border-primary-100 mt-1">
                      <Phone size={14} />
                      <span>Contact: {otherPerson.phone}</span>
                    </div>
                  )}
                  <p className="flex items-start gap-2 text-sm font-bold text-slate-500">
                    <Clock size={16} className="mt-0.5 shrink-0" /> <span>{format(new Date(booking.scheduledDate), 'PPp')}</span>
                  </p>
                  <p className="text-sm font-bold text-slate-500">
                    {formatInr(booking.totalPrice)} - Payment {booking.paymentStatus}
                  </p>
                  {booking.additionalNotes && <p className="text-slate-600">{booking.additionalNotes}</p>}
                  
                  {(booking.status === 'accepted' || booking.status === 'in_progress') && (
                    <div className="mt-4">
                       <div className="flex items-center gap-2 mb-2 text-sm font-bold text-slate-900">
                          <MapPin size={16} className="text-primary-600" />
                          <span>Live Worker Tracking</span>
                       </div>
                       <TrackingMap 
                         bookingId={booking._id} 
                         userLocation={[user.location.coordinates[1], user.location.coordinates[0]]} 
                       />
                    </div>
                  )}
                </div>

                  <div className="flex flex-wrap gap-3 lg:justify-end">
                    {booking.status === 'accepted' && (
                      <div className="flex flex-col sm:flex-row gap-2">
                        <div className="relative">
                          <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input 
                            placeholder="Worker's OTP" 
                            className="pl-10 pr-4 py-2 rounded-xl border border-slate-200 outline-none w-36 font-bold"
                            value={otpInput[booking._id] || ''}
                            onChange={(e) => setOtpInput({ ...otpInput, [booking._id]: e.target.value })}
                          />
                        </div>
                        <button onClick={() => handleStartVerify(booking._id)} className="px-6 py-2 rounded-xl bg-primary-600 text-white font-bold hover:bg-primary-700 transition-all">Verify & Start</button>
                      </div>
                    )}

                    {booking.status === 'in_progress' && (
                       <div className="flex flex-col items-end gap-2">
                          <div className="bg-emerald-50 px-4 py-2 rounded-xl text-center border border-emerald-100">
                            <p className="text-[10px] font-bold text-emerald-500 uppercase">Tell Worker this OTP</p>
                            <p className="text-xl font-black text-emerald-700 tracking-widest">{booking.completionOTP}</p>
                          </div>
                      </div>
                    )}

                    {user?.role === 'user' && ['pending', 'accepted'].includes(booking.status) && (
                      <button onClick={() => changeStatus(booking._id, 'cancelled')} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold">Cancel</button>
                    )}
                    {user?.role === 'user' && booking.paymentStatus !== 'paid' && ['accepted', 'completed'].includes(booking.status) && (
                      <button onClick={() => changePayment(booking._id, 'paid')} className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 font-bold">Mark Paid</button>
                    )}
                  </div>

                {user?.role === 'user' && booking.status === 'completed' && !booking.review && (
                  <div className="lg:basis-full grid sm:grid-cols-[140px_1fr_auto] gap-3 pt-4 border-t border-slate-100">
                    <select value={reviewForms[booking._id]?.rating || 5} onChange={(e) => setReviewForms({ ...reviewForms, [booking._id]: { ...reviewForms[booking._id], rating: Number(e.target.value) } })} className="bg-slate-50 rounded-xl px-3 py-2 outline-none">
                      {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} stars</option>)}
                    </select>
                    <input value={reviewForms[booking._id]?.comment || ''} onChange={(e) => setReviewForms({ ...reviewForms, [booking._id]: { ...reviewForms[booking._id], comment: e.target.value } })} placeholder="Share a quick review" className="bg-slate-50 rounded-xl px-3 py-2 outline-none" />
                    <button onClick={() => submitReview(booking._id)} className="px-4 py-2 rounded-xl bg-primary-600 text-white font-bold">Review</button>
                  </div>
                )}
                {booking.review && (
                  <p className="lg:basis-full text-sm font-bold text-emerald-700 bg-emerald-50 rounded-xl px-4 py-3">
                    Reviewed: {booking.review.rating} stars
                  </p>
                )}
              </article>
            );
          })}

          {pagination.pages > 1 && (
            <div className="flex flex-wrap justify-center gap-3 pt-4">
              <button disabled={pagination.page <= 1} onClick={() => fetchBookings(pagination.page - 1)} className="px-5 py-3 bg-white border border-slate-100 rounded-xl font-bold disabled:opacity-40">Previous</button>
              <span className="px-5 py-3 text-slate-500 font-bold">Page {pagination.page} of {pagination.pages}</span>
              <button disabled={pagination.page >= pagination.pages} onClick={() => fetchBookings(pagination.page + 1)} className="px-5 py-3 bg-white border border-slate-100 rounded-xl font-bold disabled:opacity-40">Next</button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Profile;
