import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ServiceAddressInput from '../components/ServiceAddressInput';
import { createBooking, getWorkerDetails, initiateChat } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CalendarDays, MapPin, MessageSquare, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatInr } from '../utils/formatters';
import { fallbackAvatar, withImageFallback } from '../utils/images';
import { getOnboardingMessage } from '../utils/onboarding';
import { getUserPresenceClass, getUserPresenceStatus } from '../utils/presence';
import { getWorkerAvailabilityClass, getWorkerAvailabilityStatus } from '../utils/workerAvailability';

const WorkerProfile = () => {
  const { t } = useTranslation();
  const { workerId } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [worker, setWorker] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [booking, setBooking] = useState({ service: '', scheduledDate: '', address: '', additionalNotes: '', coordinates: null });

  useEffect(() => {
    const fetchWorker = async () => {
      try {
        const { data } = await getWorkerDetails(workerId);
        setWorker(data.data.worker);
        setReviews(data.data.reviews);
        setBooking((current) => ({ ...current, service: data.data.worker.skills?.[0] || '' }));
      } catch {
        toast.error(t('workerProfile.notFound'));
      }
    };

    fetchWorker();
  }, [workerId, t]);

  const handleChat = async () => {
    if (!token) return navigate('/login', { state: { message: t('auth.notLoggedIn') } });
    if (user?.role !== 'user') return toast.error(t('search.onlyCustomersChat'));
    if (!user?.canAccessDashboard) return navigate('/profile', { state: { notice: getOnboardingMessage(user) } });

    try {
      await initiateChat({ recipientId: worker.user._id });
      navigate('/messages');
    } catch {
      toast.error(t('search.couldNotStartChat'));
    }
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!token) return navigate('/login', { state: { message: t('auth.notLoggedIn') } });
    if (user?.role !== 'user') return toast.error(t('search.onlyCustomersBook'));
    if (!isAvailable) return toast.error(t('search.workerUnavailable', { status: availabilityStatus.toLowerCase() }));

    try {
      await createBooking({
        workerId: worker.user._id,
        service: booking.service || worker.skills?.[0] || t('workerProfile.generalService'),
        scheduledDate: booking.scheduledDate,
        address: booking.address,
        ...(booking.coordinates ? {
          serviceLocation: {
            coordinates: booking.coordinates,
            address: booking.address
          }
        } : {}),
        additionalNotes: booking.additionalNotes
      });
      toast.success(t('search.bookingSent'));
      setBooking({ service: worker.skills?.[0] || '', scheduledDate: '', address: '', additionalNotes: '', coordinates: null });
    } catch (error) {
      toast.error(error.response?.data?.message || t('search.bookingFailed'));
    }
  };

  if (!worker) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400 font-bold">{t('workerProfile.loading')}</div>;
  }

  const availabilityStatus = getWorkerAvailabilityStatus(worker);
  const isAvailable = availabilityStatus === 'Available';
  const presenceStatus = getUserPresenceStatus(worker.user);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 grid lg:grid-cols-[minmax(0,1fr)_minmax(320px,380px)] gap-6 lg:gap-8 min-w-0">
        <section className="space-y-6 min-w-0">
          <div className="bg-white border border-slate-100 premium-shadow rounded-3xl p-4 sm:p-8">
            <div className="flex flex-col md:flex-row gap-5 sm:gap-6">
              <img src={worker.user?.avatar || fallbackAvatar} onError={withImageFallback()} alt={worker.user?.name} className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-2xl sm:rounded-3xl object-cover" />
              <div className="space-y-3 min-w-0">
                <h1 className="text-3xl sm:text-4xl font-bold font-heading text-slate-900 break-words">{worker.user?.name}</h1>
                <p className="flex items-center gap-2 text-amber-500 font-bold"><Star fill="currentColor" size={18} /> {worker.averageRating?.toFixed(1) || '0.0'} ({t('workerProfile.reviewCount', { count: worker.totalReviews || 0 })})</p>
                <div className="flex flex-wrap gap-2">
                  <span className={`inline-flex text-xs font-black border rounded-full px-3 py-1.5 ${getWorkerAvailabilityClass(availabilityStatus)}`}>
                    {availabilityStatus}
                  </span>
                  <span className={`inline-flex text-xs font-black border rounded-full px-3 py-1.5 ${getUserPresenceClass(worker.user)}`}>
                    {presenceStatus}
                  </span>
                </div>
                <p className="flex items-start gap-2 text-slate-500"><MapPin size={18} className="mt-0.5 shrink-0" /> <span className="break-words">{worker.user?.location?.address || t('common.nearby')}</span></p>
                <p className="text-xl font-bold text-slate-900">{formatInr(worker.pricing?.amount)}/{worker.pricing?.unit || t('workerDashboard.hour')}</p>
              </div>
            </div>
            <p className="mt-8 text-slate-600 leading-relaxed">{worker.bio}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {worker.skills?.map((skill) => <span key={skill} className="bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-sm font-bold">{skill}</span>)}
            </div>
          </div>

          <div className="bg-white border border-slate-100 premium-shadow rounded-3xl p-4 sm:p-8">
            <h2 className="text-2xl font-bold font-heading text-slate-900 mb-6">{t('workerProfile.reviews')}</h2>
            {reviews.length === 0 ? (
              <p className="text-slate-400 font-bold italic">{t('workerProfile.noReviews')}</p>
            ) : reviews.map((review) => (
              <div key={review._id} className="py-5 border-b border-slate-50 last:border-0">
                <p className="font-bold text-slate-900">{review.user?.name || t('bookingDetails.customer')} - {t('bookingDetails.stars', { rating: review.rating })}</p>
                {review.comment && <p className="text-slate-600 mt-1">{review.comment}</p>}
              </div>
            ))}
          </div>
        </section>

        <aside className="bg-white border border-slate-100 premium-shadow rounded-3xl p-4 sm:p-6 h-fit space-y-5 min-w-0">
          <button onClick={handleChat} className="w-full border border-slate-200 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50">
            <MessageSquare size={18} /> {t('common.chat')}
          </button>
          <form onSubmit={handleBooking} className="space-y-3">
            <h2 className="text-xl font-bold font-heading text-slate-900">{t('workerProfile.bookThisWorker')}</h2>
            <input required value={booking.service} onChange={(e) => setBooking({ ...booking, service: e.target.value })} placeholder={t('search.service')} className="w-full bg-slate-50 rounded-2xl px-4 py-3 outline-none" />
            <input required value={booking.scheduledDate} onChange={(e) => setBooking({ ...booking, scheduledDate: e.target.value })} type="datetime-local" className="w-full bg-slate-50 rounded-2xl px-4 py-3 outline-none" />
            <ServiceAddressInput
              value={booking.address}
              onChange={({ address, coordinates }) => setBooking({ ...booking, address, coordinates })}
            />
            <textarea value={booking.additionalNotes} onChange={(e) => setBooking({ ...booking, additionalNotes: e.target.value })} placeholder={t('bookingDetails.notes')} className="w-full h-24 bg-slate-50 rounded-2xl px-4 py-3 outline-none" />
            <button
              disabled={!isAvailable}
              className="w-full bg-primary-600 text-white py-3 rounded-2xl font-bold flex items-center justify-center gap-2 disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed"
            >
              <CalendarDays size={18} /> {isAvailable ? t('common.sendRequest') : t('workerProfile.workerUnavailable')}
            </button>
          </form>
        </aside>
      </main>
    </div>
  );
};

export default WorkerProfile;
