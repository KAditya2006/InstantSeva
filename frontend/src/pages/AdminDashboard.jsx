import React, { useState, useEffect } from 'react';
import { getAdminStats, getAuditLogs, getPendingWorkers, approveWorker } from '../services/api';
import Navbar from '../components/Navbar';
import { ShieldAlert, Users, CheckCircle, XCircle, Eye, Search, TrendingUp, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [pendingWorkers, setPendingWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [auditLogs, setAuditLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, workersRes] = await Promise.all([
        getAdminStats(),
        getPendingWorkers()
      ]);
      setStats(statsRes.data.data);
      setPendingWorkers(workersRes.data.data);
      const logsRes = await getAuditLogs();
      setAuditLogs(logsRes.data.data);
    } catch {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (workerId, status) => {
    if (status === 'rejected' && !rejectionReason) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    try {
      const { data } = await approveWorker({ 
        workerId, 
        status, 
        rejectionReason,
        type: selectedWorker?.type || pendingWorkers.find(w => w._id === workerId)?.type
      });
      toast.success(data.message);
      setSelectedWorker(null);
      setRejectionReason('');
      fetchData();
    } catch {
      toast.error('Action failed');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-heading text-slate-400">Loading Admin Dashboard...</div>;

  const filteredWorkers = pendingWorkers.filter((worker) => {
    const haystack = `${worker.user?.name || ''} ${worker.user?.email || ''}`.toLowerCase();
    return haystack.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8 sm:space-y-10">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold font-heading text-slate-900 tracking-tight">Platform Control</h1>
            <p className="text-slate-500 font-medium">Overview of your marketplace health and approvals.</p>
          </div>
          <div className="flex w-full sm:w-auto bg-white p-1 rounded-2xl premium-shadow border border-slate-100">
             <button onClick={() => setActiveTab('overview')} className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'overview' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900'}`}>Overview</button>
             <button onClick={() => setActiveTab('audit')} className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'audit' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900'}`}>Audit Logs</button>
          </div>
        </header>

        {/* Stats Grid */}
        {activeTab === 'overview' && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard icon={<Users className="text-blue-500" />} label="Total Users" value={stats?.totalUsers} change="+4%" color="bg-blue-50" />
          <StatCard icon={<TrendingUp className="text-emerald-500" />} label="Total Workers" value={stats?.totalWorkers} change="+12%" color="bg-emerald-50" />
          <StatCard icon={<ShieldAlert className="text-amber-500" />} label="Pending KYC" value={stats?.pendingApprovals} change={pendingWorkers.length > 5 ? 'High' : 'Normal'} color="bg-amber-50" />
          <StatCard icon={<CheckCircle className="text-indigo-500" />} label="Paid Bookings" value={stats?.paidBookings} change={`${stats?.totalBookings || 0} total`} color="bg-indigo-50" />
        </div>}

        {/* Pending Approvals Table */}
        {activeTab === 'overview' && <section className="bg-white rounded-3xl md:rounded-[40px] premium-shadow border border-slate-100 overflow-hidden">
          <div className="p-4 sm:p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
             <h3 className="text-2xl font-bold text-slate-900 font-heading">Verification Queue</h3>
             <div className="relative w-full md:w-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search by name or email..." className="w-full md:w-80 bg-slate-50 border border-slate-100 pl-11 pr-4 py-3 rounded-2xl outline-none focus:border-primary-500 focus:bg-white transition-all text-sm font-medium" />
             </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[11px] uppercase tracking-[0.2em] font-bold">
                  <th className="px-8 py-5">Applicant Details</th>
                  <th className="px-8 py-5">Type</th>
                  <th className="px-8 py-5">Applied Date</th>
                  <th className="px-8 py-5">Documents</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredWorkers.length > 0 ? filteredWorkers.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-4">
                          <img src={item.user?.avatar} alt="" className="w-12 h-12 rounded-2xl object-cover border border-slate-100" />
                          <div>
                             <p className="font-bold text-slate-900">{item.user?.name}</p>
                             <p className="text-xs font-semibold text-slate-400">{item.user?.email}</p>
                          </div>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${item.type === 'worker' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                          {item.type}
                       </span>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-2 text-slate-600 font-bold text-sm">
                          <Clock size={16} /> {new Date(item.createdAt).toLocaleDateString()}
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <button 
                        onClick={() => setSelectedWorker(item)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 transition-all"
                       >
                         <Eye size={14} /> Review KYC
                       </button>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleApproval(item._id, 'approved')}
                            className="p-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl transition-all"
                            title="Approve"
                          >
                             <CheckCircle size={20} />
                          </button>
                          <button 
                            onClick={() => setSelectedWorker(item)}
                            className="p-2.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl transition-all"
                            title="Reject"
                          >
                             <XCircle size={20} />
                          </button>
                       </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" className="px-8 py-20 text-center">
                       <div className="max-w-xs mx-auto space-y-2">
                          <p className="font-bold text-slate-300 text-lg italic">The verification queue is clear.</p>
                          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Good job! Check back later.</p>
                       </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>}

        {activeTab === 'audit' && (
          <section className="bg-white rounded-3xl md:rounded-[40px] premium-shadow border border-slate-100 overflow-hidden">
            <div className="p-4 sm:p-8 border-b border-slate-50">
              <h3 className="text-2xl font-bold text-slate-900 font-heading">Audit Logs</h3>
              <p className="text-slate-500">Recent admin, booking, payment, and review activity.</p>
            </div>
            <div className="divide-y divide-slate-50">
              {auditLogs.length === 0 ? (
                <p className="p-8 text-slate-400 font-bold italic">No audit events yet.</p>
              ) : auditLogs.map((log) => (
                <div key={log._id} className="p-4 sm:p-6 flex flex-col md:flex-row gap-3 md:items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900">{log.action}</p>
                    <p className="text-sm text-slate-500">{log.actor?.name || 'System'} - {log.entityType}</p>
                  </div>
                  <span className="text-xs font-bold text-slate-400 uppercase">{new Date(log.createdAt).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* KYC Review Modal */}
        {selectedWorker && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
             <div className="bg-white w-full max-w-5xl rounded-3xl md:rounded-[40px] premium-shadow overflow-hidden flex flex-col max-h-[92vh]">
                <div className="p-4 sm:p-8 border-b border-slate-50 flex justify-between items-center gap-4">
                   <div>
                    <h3 className="text-lg sm:text-2xl font-bold font-heading text-slate-900">Review Identity: {selectedWorker.user?.name}</h3>
                    <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-500 text-[10px] uppercase font-black">{selectedWorker.type} Account</span>
                   </div>
                   <button onClick={() => setSelectedWorker(null)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><XCircle className="text-slate-400" size={24} /></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 sm:p-10 grid md:grid-cols-2 gap-6 sm:gap-10">
                   <div className="space-y-4">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Uploaded ID Proof</p>
                      <div className="aspect-4/3 rounded-3xl overflow-hidden border-4 border-slate-50 bg-slate-100 flex items-center justify-center">
                         {selectedWorker.kyc?.idProof?.url ? (
                           <img src={selectedWorker.kyc.idProof.url} className="w-full h-full object-contain" alt="ID Proof" />
                         ) : <span className="text-slate-300 font-bold italic">No document uploaded</span>}
                      </div>
                   </div>
                   
                   {selectedWorker.type === 'worker' && (
                     <div className="space-y-4">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Uploaded Selfie</p>
                        <div className="aspect-4/3 rounded-3xl overflow-hidden border-4 border-slate-50 bg-slate-100 flex items-center justify-center">
                           {selectedWorker.kyc?.selfie?.url ? (
                             <img src={selectedWorker.kyc.selfie.url} className="w-full h-full object-contain" alt="Selfie" />
                           ) : <span className="text-slate-300 font-bold italic">No document uploaded</span>}
                        </div>
                     </div>
                   )}
                   
                   <div className="md:col-span-2 space-y-4 pt-6 border-t border-slate-50">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Rejection Reason (If applicable)</p>
                      <textarea 
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Explain why this application is being rejected..."
                        className="w-full h-32 bg-slate-50 border border-slate-100 p-6 rounded-3xl outline-none focus:border-primary-500 focus:bg-white transition-all font-medium text-slate-900"
                      />
                   </div>
                </div>

                <div className="p-4 sm:p-10 bg-slate-50/50 flex flex-col md:flex-row gap-4 border-t border-slate-100">
                   <button 
                    onClick={() => handleApproval(selectedWorker._id, 'approved')}
                    className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold transition-all premium-shadow"
                   >
                     Approve Identity
                   </button>
                   <button 
                    onClick={() => handleApproval(selectedWorker._id, 'rejected')}
                    className="flex-1 py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-bold transition-all premium-shadow"
                   >
                     Reject Identity
                   </button>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, change, color }) => (
  <div className="bg-white p-5 sm:p-8 rounded-3xl md:rounded-[40px] premium-shadow border border-slate-100">
    <div className="flex justify-between items-start mb-6">
      <div className={`p-4 ${color} rounded-2xl`}>{icon}</div>
      <span className="text-emerald-500 font-bold text-xs bg-emerald-50 px-3 py-1 rounded-full">{change}</span>
    </div>
    <h3 className="text-4xl font-bold text-slate-900 font-heading tracking-tight mb-1">{value || 0}</h3>
    <p className="text-slate-500 font-bold text-sm tracking-wide">{label}</p>
  </div>
);

export default AdminDashboard;
