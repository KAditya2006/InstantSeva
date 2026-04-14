import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { createBooking, getWorkerDetails, initiateChat } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CalendarDays, MapPin, MessageSquare, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatInr } from '../utils/formatters';

const WorkerProfile = () => {
  const { workerId } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [worker, setWorker] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [booking, setBooking] = useState({ service: '', scheduledDate: '', address: '', additionalNotes: '' });

  useEffect(() => {
    const fetchWorker = async () => {
      try {
        const { data } = await getWorkerDetails(workerId);
        setWorker(data.data.worker);
        setReviews(data.data.reviews);
        setBooking((current) => ({ ...current, service: data.data.worker.skills?.[0] || '' }));
      } catch {
        toast.error('Worker profile not found');
      }
    };

    fetchWorker();
  }, [workerId]);

  const handleChat = async () => {
    if (!token) return navigate('/login');
    try {
      await initiateChat({ recipientId: worker.user._id });
      navigate('/messages');
    } catch {
      toast.error('Could not start chat');
    }
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!token) return navigate('/login');
    if (user?.role !== 'user') return toast.error('Only customers can book workers');

    try {
      await createBooking({
        workerId: worker.user._id,
        service: booking.service || worker.skills?.[0] || 'General service',
        scheduledDate: booking.scheduledDate,
        address: booking.address,
        additionalNotes: booking.additionalNotes
      });
      toast.success('Booking request sent');
      setBooking({ service: worker.skills?.[0] || '', scheduledDate: '', address: '', additionalNotes: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not create booking');
    }
  };

  if (!worker) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400 font-bold">Loading worker profile...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 grid lg:grid-cols-[minmax(0,1fr)_380px] gap-6 lg:gap-8">
        <section className="space-y-6 min-w-0">
          <div className="bg-white border border-slate-100 premium-shadow rounded-3xl p-4 sm:p-8">
            <div className="flex flex-col md:flex-row gap-5 sm:gap-6">
              <img src={worker.user?.avatar} alt={worker.user?.name} className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl sm:rounded-3xl object-cover" />
              <div className="space-y-3 min-w-0">
                <h1 className="text-3xl sm:text-4xl font-bold font-heading text-slate-900 break-words">{worker.user?.name}</h1>
                <p className="flex items-center gap-2 text-amber-500 font-bold"><Star fill="currentColor" size={18} /> {worker.averageRating?.toFixed(1) || '0.0'} ({worker.totalReviews || 0} reviews)</p>
                <p className="flex items-start gap-2 text-slate-500"><MapPin size={18} className="mt-0.5 shrink-0" /> <span className="break-words">{worker.user?.location?.address || 'Nearby'}</span></p>
                <p className="text-xl font-bold text-slate-900">{formatInr(worker.pricing?.amount)}/{worker.pricing?.unit || 'hour'}</p>
              </div>
            </div>
            <p className="mt-8 text-slate-600 leading-relaxed">{worker.bio}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {worker.skills?.map((skill) => <span key={skill} className="bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-sm font-bold">{skill}</span>)}
            </div>
          </div>

          <div className="bg-white border border-slate-100 premium-shadow rounded-3xl p-4 sm:p-8">
            <h2 className="text-2xl font-bold font-heading text-slate-900 mb-6">Reviews</h2>
            {reviews.length === 0 ? (
              <p className="text-slate-400 font-bold italic">No reviews yet.</p>
            ) : reviews.map((review) => (
              <div key={review._id} className="py-5 border-b border-slate-50 last:border-0">
                <p className="font-bold text-slate-900">{review.user?.name || 'Customer'} - {review.rating} stars</p>
                {review.comment && <p className="text-slate-600 mt-1">{review.comment}</p>}
              </div>
            ))}
          </div>
        </section>

        <aside className="bg-white border border-slate-100 premium-shadow rounded-3xl p-4 sm:p-6 h-fit space-y-5">
          <button onClick={handleChat} className="w-full border border-slate-200 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50">
            <MessageSquare size={18} /> Chat
          </button>
          <form onSubmit={handleBooking} className="space-y-3">
            <h2 className="text-xl font-bold font-heading text-slate-900">Book this worker</h2>
            <input required value={booking.service} onChange={(e) => setBooking({ ...booking, service: e.target.value })} placeholder="Service" className="w-full bg-slate-50 rounded-2xl px-4 py-3 outline-none" />
            <input required value={booking.scheduledDate} onChange={(e) => setBooking({ ...booking, scheduledDate: e.target.value })} type="datetime-local" className="w-full bg-slate-50 rounded-2xl px-4 py-3 outline-none" />
            <input required value={booking.address} onChange={(e) => setBooking({ ...booking, address: e.target.value })} placeholder="Service address" className="w-full bg-slate-50 rounded-2xl px-4 py-3 outline-none" />
            <textarea value={booking.additionalNotes} onChange={(e) => setBooking({ ...booking, additionalNotes: e.target.value })} placeholder="Notes" className="w-full h-24 bg-slate-50 rounded-2xl px-4 py-3 outline-none" />
            <button className="w-full bg-primary-600 text-white py-3 rounded-2xl font-bold flex items-center justify-center gap-2">
              <CalendarDays size={18} /> Send Request
            </button>
          </form>
        </aside>
      </main>
    </div>
  );
};

export default WorkerProfile;
