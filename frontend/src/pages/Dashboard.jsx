import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { createReview, getBookings, updateBookingPayment, updateBookingStatus, verifyStartOTP } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  CalendarDays,
  Car,
  Clock,
  Droplets,
  Hammer,
  Key,
  Laptop,
  MapPin,
  Palette,
  Phone,
  Search as SearchIcon,
  Settings,
  Sparkles,
  Utensils,
  Wifi,
  Wind,
  Zap
} from 'lucide-react';
import TrackingMap from '../components/TrackingMap';
import BookingDetailsModal from '../components/BookingDetailsModal';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { formatInr } from '../utils/formatters';
import { CATEGORY_METADATA, PROFESSIONS } from '../constants/professions';
import { getBookingDestination } from '../utils/location';
import VoiceSearchButton from '../components/VoiceSearchButton';
import { normalizeServiceSearch } from '../utils/multilingualSearch';

const ICON_MAP = {
  BookOpen,
  Briefcase,
  Car,
  Droplets,
  Hammer,
  Laptop,
  Palette,
  Settings,
  Sparkles,
  Utensils,
  Wifi,
  Wind,
  Zap
};

const SERVICE_LABELS = {
  'ac repair/service': 'AC Repair / Service',
  'appliances repair/service': 'Appliance Repair / Service',
  carpenters: 'Carpenter',
  'door/lock repair': 'Door / Lock Repair',
  'home tutors': 'Home Tutor',
  'house cleaner': 'House Cleaner',
  'internet technician': 'Internet Technician',
  'laptop/mobile reapir': 'Laptop / Mobile Repair',
  pharamascist: 'Pharmacist',
  plumber: 'Plumber',
  electrician: 'Electrician',
  painters: 'Painter'
};

const formatServiceLabel = (service) => {
  if (SERVICE_LABELS[service]) return SERVICE_LABELS[service];
  return service.replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const SERVICE_CARDS = PROFESSIONS.map((service) => {
  const meta = CATEGORY_METADATA[service] || {};
  const Icon = ICON_MAP[meta.iconName] || Briefcase;

  return {
    name: service,
    label: formatServiceLabel(service),
    Icon,
    color: meta.color || 'bg-white',
    iconColor: meta.iconColor || 'text-primary-600'
  };
});

const statusStyles = {
  pending: 'bg-amber-50 text-amber-700',
  accepted: 'bg-blue-50 text-blue-700',
  in_progress: 'bg-indigo-50 text-indigo-700 border border-indigo-100',
  rejected: 'bg-rose-50 text-rose-700',
  completed: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-slate-100 text-slate-600'
};

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewForms, setReviewForms] = useState({});
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [otpInput, setOtpInput] = useState({});
  const [serviceQuery, setServiceQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);

  const openServiceSearch = (service) => {
    navigate(`/search?q=${encodeURIComponent(normalizeServiceSearch(service))}`);
  };

  const handleServiceSearch = (e) => {
    e.preventDefault();
    const query = normalizeServiceSearch(serviceQuery.trim());
    navigate(`/search${query ? `?q=${encodeURIComponent(query)}` : ''}`);
  };

  const fetchBookings = useCallback(async (page = 1) => {
    try {
      const { data } = await getBookings({ page });
      setBookings(data.data);
      setPagination(data.pagination);
    } catch (error) {
      toast.error(error.response?.data?.message || t('dashboard.couldNotLoad'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const changeStatus = async (bookingId, status) => {
    try {
      await updateBookingStatus(bookingId, status);
      toast.success(t('dashboard.bookingUpdated'));
      fetchBookings(pagination.page);
    } catch (error) {
      toast.error(error.response?.data?.message || t('dashboard.couldNotUpdateBooking'));
    }
  };

  const changePayment = async (bookingId, paymentStatus) => {
    try {
      await updateBookingPayment(bookingId, { paymentStatus, paymentMethod: 'manual' });
      toast.success(t('dashboard.paymentUpdated'));
      fetchBookings(pagination.page);
    } catch (error) {
      toast.error(error.response?.data?.message || t('dashboard.couldNotUpdatePayment'));
    }
  };

  const handleStartVerify = async (bookingId) => {
    try {
      if (!otpInput[bookingId]) return toast.error(t('dashboard.pleaseEnterOtp'));
      await verifyStartOTP(bookingId, otpInput[bookingId]);
      toast.success(t('dashboard.jobStarted'));
      fetchBookings(pagination.page);
    } catch (error) {
      toast.error(error.response?.data?.message || t('dashboard.invalidOtp'));
    }
  };

  const submitReview = async (bookingId) => {
    try {
      const form = reviewForms[bookingId];
      if (!form?.rating) return toast.error(t('dashboard.pleaseSelectRating'));
      await createReview(bookingId, { rating: form.rating, comment: form.comment });
      toast.success(t('dashboard.reviewSubmitted'));
      fetchBookings(pagination.page);
    } catch (error) {
      toast.error(error.response?.data?.message || t('dashboard.couldNotSubmitReview'));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6 sm:space-y-8">
        <header className="bg-white rounded-3xl border border-slate-100 premium-shadow p-5 sm:p-8">
          <p className="text-sm font-bold uppercase tracking-widest text-primary-600">{t('dashboard.customerDashboard')}</p>
          <h1 className="text-3xl sm:text-4xl font-bold font-heading text-slate-900 mt-2">{t('dashboard.serviceActivity')}</h1>
          <p className="text-slate-500 font-medium mt-2">{t('dashboard.activitySubtitle')}</p>
        </header>

        <section className="bg-white rounded-3xl border border-slate-100 premium-shadow p-5 sm:p-8 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-primary-600">{t('dashboard.bookService')}</p>
              <h2 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 mt-2">{t('dashboard.needToday')}</h2>
              <p className="text-slate-500 font-medium mt-2">{t('dashboard.compareExperts')}</p>
            </div>
            <form onSubmit={handleServiceSearch} className="w-full lg:max-w-md bg-slate-50 rounded-2xl border border-slate-100 p-2 flex flex-col sm:flex-row gap-2">
              <div className="flex items-center gap-3 flex-1 px-3">
                <SearchIcon size={18} className="text-slate-400 shrink-0" />
                <input
                  value={serviceQuery}
                  onChange={(e) => setServiceQuery(e.target.value)}
                  placeholder={t('dashboard.serviceSearchPlaceholder')}
                  className="w-full min-w-0 bg-transparent py-3 outline-none font-medium"
                />
              </div>
              <VoiceSearchButton
                onTranscript={(text) => setServiceQuery(text)}
                speakText={t('voice.searchingFor', { text: serviceQuery || t('dashboard.serviceSearchPlaceholder') })}
              />
              <button className="px-5 py-3 rounded-xl bg-primary-600 text-white font-bold hover:bg-primary-700 transition-colors">
                {t('common.search')}
              </button>
            </form>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
            {SERVICE_CARDS.map(({ name, label, Icon, color, iconColor }) => (
              <button
                key={name}
                type="button"
                onClick={() => openServiceSearch(name)}
                className={`${color} min-h-36 rounded-2xl border border-slate-100 p-4 text-left flex flex-col justify-between gap-4 hover:-translate-y-1 hover:premium-shadow transition-all`}
              >
                <span className="w-11 h-11 rounded-xl bg-white flex items-center justify-center premium-shadow">
                  {React.createElement(Icon, { size: 24, className: iconColor })}
                </span>
                <span className="flex items-end justify-between gap-2">
                  <span className="text-sm font-black text-slate-800 leading-snug">{t(`services.${name}`, { defaultValue: label })}</span>
                  <ArrowRight size={16} className="text-slate-400 shrink-0" />
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <CalendarDays className="text-primary-600" />
            <h2 className="text-2xl font-bold font-heading text-slate-900">{t('common.bookings')}</h2>
          </div>

          {loading ? (
            <div className="bg-white rounded-3xl p-8 sm:p-12 text-center text-slate-400 font-bold">{t('dashboard.loadingDashboard')}</div>
          ) : bookings.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-slate-100">
              <p className="font-bold text-slate-700">{t('dashboard.noBookings')}</p>
              <p className="text-slate-400 mt-2">{t('dashboard.requestsAppear')}</p>
            </div>
          ) : bookings.map((booking) => {
            const otherPerson = user?.role === 'worker' ? booking.user : booking.worker;
            const destinationLocation = getBookingDestination(booking, user);
            return (
              <article
                key={booking._id}
                onClick={() => setSelectedBooking(booking)}
                className="bg-white rounded-3xl border border-slate-100 premium-shadow p-4 sm:p-6 flex flex-col lg:flex-row gap-5 lg:items-center justify-between cursor-pointer hover:-translate-y-0.5 transition-all"
              >
                <div className="space-y-2 min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 break-words">{booking.service}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${statusStyles[booking.status] || statusStyles.pending}`}>{booking.status}</span>
                  </div>
                  <p className="text-slate-500 break-words">{t('dashboard.withAt', { name: otherPerson?.name, address: booking.address })}</p>
                  {otherPerson?.phone && (
                    <div className="flex items-center gap-2 text-primary-600 font-bold text-sm bg-primary-50/50 w-fit px-3 py-1.5 rounded-lg border border-primary-100 mt-1">
                      <Phone size={14} />
                      <span>{t('dashboard.contact', { phone: otherPerson.phone })}</span>
                    </div>
                  )}
                  <p className="flex items-start gap-2 text-sm font-bold text-slate-500">
                    <Clock size={16} className="mt-0.5 shrink-0" /> <span>{format(new Date(booking.scheduledDate), 'PPp')}</span>
                  </p>
                  <p className="text-sm font-bold text-slate-500">
                    {formatInr(booking.totalPrice)} - {t('dashboard.payment', { status: t(`status.${booking.paymentStatus}`, { defaultValue: booking.paymentStatus }) })}
                  </p>
                  {booking.additionalNotes && <p className="text-slate-600">{booking.additionalNotes}</p>}

                  {(booking.status === 'accepted' || booking.status === 'in_progress') && destinationLocation && (
                    <div className="mt-4" onClick={(event) => event.stopPropagation()}>
                      <div className="flex items-center gap-2 mb-2 text-sm font-bold text-slate-900">
                        <MapPin size={16} className="text-primary-600" />
                        <span>{t('dashboard.liveTracking')}</span>
                      </div>
                      <TrackingMap
                        bookingId={booking._id}
                        destinationLocation={destinationLocation}
                        destinationAddress={booking.address}
                        destinationLabel={t('dashboard.destination')}
                      />
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-3 lg:justify-end" onClick={(event) => event.stopPropagation()}>
                  {booking.status === 'accepted' && (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                          placeholder={t('dashboard.workerOtp')}
                          className="pl-10 pr-4 py-2 rounded-xl border border-slate-200 outline-none w-36 font-bold"
                          value={otpInput[booking._id] || ''}
                          onChange={(e) => setOtpInput({ ...otpInput, [booking._id]: e.target.value })}
                        />
                      </div>
                      <button onClick={() => handleStartVerify(booking._id)} className="px-6 py-2 rounded-xl bg-primary-600 text-white font-bold hover:bg-primary-700 transition-all">{t('dashboard.verifyStart')}</button>
                    </div>
                  )}

                  {booking.status === 'in_progress' && (
                    <div className="bg-emerald-50 px-4 py-2 rounded-xl text-center border border-emerald-100">
                      <p className="text-[10px] font-bold text-emerald-500 uppercase">{t('dashboard.tellWorkerOtp')}</p>
                      <p className="text-xl font-black text-emerald-700 tracking-widest">{booking.completionOTP}</p>
                    </div>
                  )}

                  {['pending', 'accepted'].includes(booking.status) && (
                    <button onClick={() => changeStatus(booking._id, 'cancelled')} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold">{t('common.cancel')}</button>
                  )}
                  {booking.paymentStatus !== 'paid' && ['accepted', 'completed'].includes(booking.status) && (
                    <button onClick={() => changePayment(booking._id, 'paid')} className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 font-bold">{t('dashboard.markPaid')}</button>
                  )}
                </div>

                {booking.status === 'completed' && !booking.review && (
                  <div className="lg:basis-full grid sm:grid-cols-[140px_1fr_auto] gap-3 pt-4 border-t border-slate-100" onClick={(event) => event.stopPropagation()}>
                    <select value={reviewForms[booking._id]?.rating || 5} onChange={(e) => setReviewForms({ ...reviewForms, [booking._id]: { ...reviewForms[booking._id], rating: Number(e.target.value) } })} className="bg-slate-50 rounded-xl px-3 py-2 outline-none">
                      {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} stars</option>)}
                    </select>
                    <input value={reviewForms[booking._id]?.comment || ''} onChange={(e) => setReviewForms({ ...reviewForms, [booking._id]: { ...reviewForms[booking._id], comment: e.target.value } })} placeholder={t('dashboard.shareReview')} className="bg-slate-50 rounded-xl px-3 py-2 outline-none" />
                    <button onClick={() => submitReview(booking._id)} className="px-4 py-2 rounded-xl bg-primary-600 text-white font-bold">{t('dashboard.review')}</button>
                  </div>
                )}
                {booking.review && (
                  <p className="lg:basis-full text-sm font-bold text-emerald-700 bg-emerald-50 rounded-xl px-4 py-3">
                    {t('dashboard.reviewed', { rating: booking.review.rating })}
                  </p>
                )}
              </article>
            );
          })}

          {pagination.pages > 1 && (
            <div className="flex flex-wrap justify-center gap-3 pt-4">
              <button disabled={pagination.page <= 1} onClick={() => fetchBookings(pagination.page - 1)} className="px-5 py-3 bg-white border border-slate-100 rounded-xl font-bold disabled:opacity-40">{t('common.previous')}</button>
              <span className="px-5 py-3 text-slate-500 font-bold">{t('common.page', { page: pagination.page, pages: pagination.pages })}</span>
              <button disabled={pagination.page >= pagination.pages} onClick={() => fetchBookings(pagination.page + 1)} className="px-5 py-3 bg-white border border-slate-100 rounded-xl font-bold disabled:opacity-40">{t('common.next')}</button>
            </div>
          )}
        </section>
      </main>
      <BookingDetailsModal
        booking={selectedBooking}
        viewerRole="user"
        onClose={() => setSelectedBooking(null)}
      />
    </div>
  );
};

export default Dashboard;
