import React from 'react';
import { CalendarDays, Clock, CreditCard, FileText, Mail, MapPin, Phone, User, X } from 'lucide-react';
import { format } from 'date-fns';
import { formatInr } from '../utils/formatters';

const statusStyles = {
  pending: 'bg-amber-50 text-amber-700 border-amber-100',
  accepted: 'bg-blue-50 text-blue-700 border-blue-100',
  in_progress: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  rejected: 'bg-rose-50 text-rose-700 border-rose-100',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  cancelled: 'bg-slate-100 text-slate-600 border-slate-200'
};

const paymentStyles = {
  pending: 'bg-amber-50 text-amber-700 border-amber-100',
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  failed: 'bg-rose-50 text-rose-700 border-rose-100',
  refunded: 'bg-slate-100 text-slate-600 border-slate-200'
};

const formatDate = (date) => {
  if (!date) return 'Not available';
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? 'Not available' : format(parsed, 'PPp');
};

const DetailRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
    {React.createElement(Icon, { size: 18, className: 'text-primary-600 mt-0.5 shrink-0' })}
    <div className="min-w-0">
      <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className="text-sm font-bold text-slate-800 break-words">{value || 'Not available'}</p>
    </div>
  </div>
);

const PersonCard = ({ title, person }) => (
  <div className="rounded-2xl border border-slate-100 p-4 bg-white">
    <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">{title}</p>
    <div className="space-y-2">
      <p className="flex items-center gap-2 font-bold text-slate-900">
        <User size={16} className="text-primary-600" /> {person?.name || 'Not available'}
      </p>
      <p className="flex items-start gap-2 text-sm text-slate-500 break-all">
        <Mail size={15} className="text-slate-400 mt-0.5 shrink-0" /> {person?.email || 'Email not available'}
      </p>
      <p className="flex items-center gap-2 text-sm text-slate-500">
        <Phone size={15} className="text-slate-400 shrink-0" /> {person?.phone || 'Phone visible after acceptance'}
      </p>
    </div>
  </div>
);

const BookingDetailsModal = ({ booking, viewerRole = 'user', onClose }) => {
  if (!booking) return null;

  const isWorker = viewerRole === 'worker';
  const statusClass = statusStyles[booking.status] || statusStyles.pending;
  const paymentClass = paymentStyles[booking.paymentStatus] || paymentStyles.pending;

  return (
    <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <section className="bg-white w-full max-w-4xl rounded-3xl premium-shadow max-h-[92vh] overflow-hidden flex flex-col">
        <header className="p-4 sm:p-6 border-b border-slate-100 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-bold uppercase tracking-widest text-primary-600">Booking Details</p>
            <h2 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 mt-1 break-words">{booking.service}</h2>
            <p className="text-xs font-bold text-slate-400 mt-1 break-all">ID: {booking._id}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-50 text-slate-400 hover:text-slate-700" aria-label="Close booking details">
            <X size={24} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          <div className="flex flex-wrap gap-2">
            <span className={`px-3 py-1.5 rounded-full text-xs font-black uppercase border ${statusClass}`}>{booking.status}</span>
            <span className={`px-3 py-1.5 rounded-full text-xs font-black uppercase border ${paymentClass}`}>Payment {booking.paymentStatus}</span>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <DetailRow icon={CalendarDays} label="Scheduled Time" value={formatDate(booking.scheduledDate)} />
            <DetailRow icon={CreditCard} label="Service Price" value={formatInr(booking.totalPrice)} />
            <DetailRow icon={MapPin} label="Service Address" value={booking.address} />
            <DetailRow icon={Clock} label="Requested On" value={formatDate(booking.createdAt)} />
            <DetailRow icon={Clock} label="Last Updated" value={formatDate(booking.updatedAt)} />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <PersonCard title="Customer" person={booking.user} />
            <PersonCard title="Worker" person={booking.worker} />
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
              <FileText size={15} /> Notes
            </p>
            <p className="text-sm font-medium text-slate-700 whitespace-pre-wrap">{booking.additionalNotes || 'No additional notes were added.'}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-100 p-4">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">OTP Progress</p>
              <div className="space-y-2 text-sm font-bold text-slate-700">
                <p>Start OTP: {booking.startOTPVerified ? 'Verified' : 'Not verified yet'}</p>
                <p>Completion OTP: {booking.completionOTPVerified ? 'Verified' : 'Not verified yet'}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 p-4">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">Current Action</p>
              {isWorker && booking.status === 'accepted' && (
                <p className="text-sm font-bold text-primary-700">Share the start OTP with the customer from your job card.</p>
              )}
              {isWorker && booking.status === 'in_progress' && (
                <p className="text-sm font-bold text-emerald-700">Ask the customer for their completion OTP, then verify it from your job card.</p>
              )}
              {!isWorker && booking.status === 'accepted' && (
                <p className="text-sm font-bold text-primary-700">Enter the worker OTP from your booking card to start the job.</p>
              )}
              {!isWorker && booking.status === 'in_progress' && (
                <p className="text-sm font-bold text-emerald-700">Give your completion OTP to the worker after the service is done.</p>
              )}
              {!['accepted', 'in_progress'].includes(booking.status) && (
                <p className="text-sm font-bold text-slate-600">No OTP action is needed for this booking right now.</p>
              )}
            </div>
          </div>

          {(booking.paymentMethod || booking.paymentReference || booking.review) && (
            <div className="grid md:grid-cols-2 gap-4">
              {(booking.paymentMethod || booking.paymentReference) && (
                <div className="rounded-2xl border border-slate-100 p-4">
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">Payment Info</p>
                  <p className="text-sm font-bold text-slate-700">Method: {booking.paymentMethod || 'Not available'}</p>
                  <p className="text-sm font-bold text-slate-700 break-all">Reference: {booking.paymentReference || 'Not available'}</p>
                </div>
              )}
              {booking.review && (
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                  <p className="text-[11px] font-black uppercase tracking-widest text-emerald-500 mb-3">Customer Review</p>
                  <p className="text-sm font-bold text-emerald-800">{booking.review.rating} stars</p>
                  {booking.review.comment && <p className="text-sm font-medium text-emerald-700 mt-1">{booking.review.comment}</p>}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default BookingDetailsModal;
