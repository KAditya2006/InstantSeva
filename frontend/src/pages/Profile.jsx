import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { createReview, getBookings, updateBookingPayment, updateBookingStatus } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CalendarDays, CheckCircle2, Clock, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { formatInr } from '../utils/formatters';

const statusStyles = {
  pending: 'bg-amber-50 text-amber-700',
  accepted: 'bg-blue-50 text-blue-700',
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

  const submitReview = async (bookingId) => {
    const review = reviewForms[bookingId] || {};
    try {
      await createReview(bookingId, {
        rating: review.rating || 5,
        comment: review.comment || ''
      });
      toast.success('Review submitted');
      setReviewForms((current) => ({ ...current, [bookingId]: { rating: 5, comment: '' } }));
      fetchBookings(pagination.page);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not submit review');
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
                {user?.phone && <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">{user.phone}</span>}
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
                  <p className="flex items-start gap-2 text-sm font-bold text-slate-500">
                    <Clock size={16} className="mt-0.5 shrink-0" /> <span>{format(new Date(booking.scheduledDate), 'PPp')}</span>
                  </p>
                  <p className="text-sm font-bold text-slate-500">
                    {formatInr(booking.totalPrice)} - Payment {booking.paymentStatus}
                  </p>
                  {booking.additionalNotes && <p className="text-slate-600">{booking.additionalNotes}</p>}
                </div>

                <div className="flex flex-wrap gap-2 lg:justify-end">
                  {user?.role === 'worker' && booking.status === 'pending' && (
                    <>
                      <button onClick={() => changeStatus(booking._id, 'accepted')} className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 font-bold flex items-center gap-2"><CheckCircle2 size={18} /> Accept</button>
                      <button onClick={() => changeStatus(booking._id, 'rejected')} className="px-4 py-2 rounded-xl bg-rose-50 text-rose-700 font-bold flex items-center gap-2"><XCircle size={18} /> Reject</button>
                    </>
                  )}
                  {user?.role === 'worker' && booking.status === 'accepted' && (
                    <button onClick={() => changeStatus(booking._id, 'completed')} className="px-4 py-2 rounded-xl bg-primary-600 text-white font-bold">Mark Completed</button>
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
