import React, { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { createBooking, initiateChat, searchWorkers } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CalendarDays, MapPin, MessageSquare, Search as SearchIcon, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatInr } from '../utils/formatters';

const SearchPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const initialQuery = new URLSearchParams(location.search).get('q') || '';
  const [filters, setFilters] = useState({ service: initialQuery, maxPrice: '', minRating: '' });
  const [workers, setWorkers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [booking, setBooking] = useState({ service: initialQuery, scheduledDate: '', address: '', additionalNotes: '' });

  const fetchWorkers = useCallback(async (e) => {
    e?.preventDefault();
    setLoading(true);
    try {
      const { data } = await searchWorkers({ ...filters, page: filters.page || 1 });
      setWorkers(data.data);
      setPagination(data.pagination);
    } catch {
      toast.error('Failed to search workers');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchWorkers();
  }, [fetchWorkers]);

  const handleChat = async (worker) => {
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      await initiateChat({ recipientId: worker.user._id });
      navigate('/messages');
    } catch {
      toast.error('Could not start chat');
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!selectedWorker) return;

    try {
      await createBooking({
        workerId: selectedWorker.user._id,
        service: booking.service || selectedWorker.skills[0] || 'General service',
        scheduledDate: booking.scheduledDate,
        address: booking.address,
        additionalNotes: booking.additionalNotes
      });
      toast.success('Booking request sent');
      setSelectedWorker(null);
      setBooking({ service: filters.service, scheduledDate: '', address: '', additionalNotes: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not create booking');
    }
  };

  const openBooking = (worker) => {
    if (!token) {
      navigate('/login');
      return;
    }

    if (user?.role !== 'user') {
      toast.error('Only customers can book workers');
      return;
    }

    setSelectedWorker(worker);
    setBooking((current) => ({
      ...current,
      service: filters.service || worker.skills[0] || ''
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6 sm:space-y-8">
        <section>
          <h1 className="text-3xl sm:text-4xl font-bold font-heading text-slate-900">Find Local Experts</h1>
          <p className="text-slate-500 mt-2">Search approved professionals and send a booking request in minutes.</p>
        </section>

        <form onSubmit={fetchWorkers} className="bg-white border border-slate-100 premium-shadow rounded-3xl p-3 sm:p-4 grid lg:grid-cols-[1fr_180px_180px_auto] gap-3">
          <div className="flex items-center gap-3 bg-slate-50 rounded-2xl px-4">
            <SearchIcon size={18} className="text-slate-400" />
            <input
              value={filters.service}
              onChange={(e) => setFilters({ ...filters, service: e.target.value, page: 1 })}
              placeholder="Plumber, electrician, tutor..."
              className="w-full min-w-0 bg-transparent py-4 outline-none font-medium"
            />
          </div>
          <input
            value={filters.maxPrice}
            onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value, page: 1 })}
            placeholder="Max price"
            type="number"
            className="bg-slate-50 rounded-2xl px-4 py-4 outline-none font-medium"
          />
          <input
            value={filters.minRating}
            onChange={(e) => setFilters({ ...filters, minRating: e.target.value, page: 1 })}
            placeholder="Min rating"
            type="number"
            min="0"
            max="5"
            step="0.5"
            className="bg-slate-50 rounded-2xl px-4 py-4 outline-none font-medium"
          />
          <button className="bg-primary-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-primary-700">
            Search
          </button>
        </form>

        <section className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {loading ? (
            <div className="md:col-span-2 xl:col-span-3 text-center py-20 text-slate-400 font-bold">Searching workers...</div>
          ) : workers.length === 0 ? (
            <div className="md:col-span-2 xl:col-span-3 bg-white rounded-3xl p-8 sm:p-12 text-center border border-slate-100">
              <p className="font-bold text-slate-700">No approved workers found.</p>
              <p className="text-slate-400 mt-2">Try another service or remove a price/rating filter.</p>
            </div>
          ) : workers.map((worker) => (
            <article key={worker._id} className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-100 premium-shadow flex flex-col gap-5">
              <div className="flex gap-4">
                <img src={worker.user?.avatar} alt={worker.user?.name} className="w-16 h-16 rounded-2xl object-cover" />
                <div className="min-w-0">
                  <Link to={`/workers/${worker.user?._id}`} className="font-bold text-xl text-slate-900 truncate hover:text-primary-600 block">{worker.user?.name}</Link>
                  <p className="flex items-center gap-1 text-sm text-amber-500 font-bold">
                    <Star size={16} fill="currentColor" /> {worker.averageRating?.toFixed(1) || '0.0'} ({worker.totalReviews || 0})
                  </p>
                </div>
              </div>
              <p className="text-slate-600 line-clamp-3">{worker.bio}</p>
              <div className="flex flex-wrap gap-2">
                {worker.skills?.map((skill) => (
                  <span key={skill} className="bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-sm font-bold">{skill}</span>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm text-slate-500">
                <span className="flex items-start gap-1 min-w-0"><MapPin size={16} className="mt-0.5 shrink-0" /> <span className="break-words">{worker.user?.location?.address || 'Nearby'}</span></span>
                <span className="font-bold text-slate-900">{formatInr(worker.pricing?.amount)}/{worker.pricing?.unit || 'hour'}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-auto">
                <button onClick={() => handleChat(worker)} className="border border-slate-200 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50">
                  <MessageSquare size={18} /> Chat
                </button>
                <button onClick={() => openBooking(worker)} className="bg-slate-900 text-white py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800">
                  <CalendarDays size={18} /> Book
                </button>
              </div>
            </article>
          ))}
        </section>

        {pagination.pages > 1 && (
          <div className="flex flex-wrap justify-center gap-3">
            <button disabled={pagination.page <= 1} onClick={() => setFilters({ ...filters, page: pagination.page - 1 })} className="px-5 py-3 bg-white border border-slate-100 rounded-xl font-bold disabled:opacity-40">Previous</button>
            <span className="px-5 py-3 text-slate-500 font-bold">Page {pagination.page} of {pagination.pages}</span>
            <button disabled={pagination.page >= pagination.pages} onClick={() => setFilters({ ...filters, page: pagination.page + 1 })} className="px-5 py-3 bg-white border border-slate-100 rounded-xl font-bold disabled:opacity-40">Next</button>
          </div>
        )}
      </main>

      {selectedWorker && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
          <form onSubmit={handleBookingSubmit} className="bg-white w-full max-w-lg rounded-3xl p-4 sm:p-8 premium-shadow space-y-5 max-h-[92vh] overflow-y-auto">
            <div>
              <h2 className="text-2xl font-bold font-heading text-slate-900">Book {selectedWorker.user?.name}</h2>
              <p className="text-slate-500">Send a request with your preferred schedule.</p>
            </div>
            <input required value={booking.service} onChange={(e) => setBooking({ ...booking, service: e.target.value })} placeholder="Service" className="w-full bg-slate-50 rounded-2xl px-4 py-4 outline-none" />
            <input required value={booking.scheduledDate} onChange={(e) => setBooking({ ...booking, scheduledDate: e.target.value })} type="datetime-local" className="w-full bg-slate-50 rounded-2xl px-4 py-4 outline-none" />
            <input required value={booking.address} onChange={(e) => setBooking({ ...booking, address: e.target.value })} placeholder="Service address" className="w-full bg-slate-50 rounded-2xl px-4 py-4 outline-none" />
            <textarea value={booking.additionalNotes} onChange={(e) => setBooking({ ...booking, additionalNotes: e.target.value })} placeholder="Notes for the worker" className="w-full h-28 bg-slate-50 rounded-2xl px-4 py-4 outline-none" />
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setSelectedWorker(null)} className="border border-slate-200 py-3 rounded-2xl font-bold">Cancel</button>
              <button className="bg-primary-600 text-white py-3 rounded-2xl font-bold">Send Request</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default SearchPage;
