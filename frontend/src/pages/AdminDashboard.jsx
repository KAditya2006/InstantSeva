import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { approveWorker, createAdminUser, createAdminWorker, deleteAdminUser, deleteAdminWorker, getAdminBookings, getAdminStats, getAdminUsers, getAdminWorkers, getAuditLogs, getPendingWorkers } from '../services/api';
import Navbar from '../components/Navbar';
import { ShieldAlert, Users, CheckCircle, XCircle, Eye, Search, TrendingUp, Clock, Briefcase, CalendarDays, Plus, Trash2, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { fallbackAvatar, getInlineDocumentPreviewUrl, isPdfAsset, resolveAssetUrl, withImageFallback } from '../utils/images';
import { formatInr } from '../utils/formatters';
import { PROFESSIONS } from '../constants/professions';

const LIST_TABS = ['users', 'workers', 'bookings'];

const EMPTY_MANAGED_ACCOUNT_FORM = {
  name: '',
  email: '',
  password: '',
  phone: '',
  address: '',
  city: '',
  pincode: '',
  skills: '',
  experience: '0',
  bio: '',
  amount: '',
  unit: 'hour'
};

const getStatusBadgeClass = (status) => {
  const styles = {
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    verified: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    paid: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    pending: 'bg-amber-50 text-amber-700 border-amber-100',
    in_progress: 'bg-blue-50 text-blue-700 border-blue-100',
    accepted: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    rejected: 'bg-rose-50 text-rose-700 border-rose-100',
    cancelled: 'bg-slate-100 text-slate-600 border-slate-200',
    failed: 'bg-rose-50 text-rose-700 border-rose-100'
  };

  return styles[status] || 'bg-slate-100 text-slate-600 border-slate-200';
};

const StatusBadge = ({ children, status }) => (
  <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${getStatusBadgeClass(status)}`}>
    {children}
  </span>
);

const AdminDashboard = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [pendingWorkers, setPendingWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [auditLogs, setAuditLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [directorySearch, setDirectorySearch] = useState('');
  const [directoryLoading, setDirectoryLoading] = useState(false);
  const [directories, setDirectories] = useState({
    users: [],
    workers: [],
    bookings: []
  });
  const [directoryPagination, setDirectoryPagination] = useState({
    users: { page: 1, pages: 1 },
    workers: { page: 1, pages: 1 },
    bookings: { page: 1, pages: 1 }
  });
  const [createModal, setCreateModal] = useState(null);
  const [createForm, setCreateForm] = useState(EMPTY_MANAGED_ACCOUNT_FORM);
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const fetchData = useCallback(async () => {
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
      toast.error(t('admin.failedLoadData'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!LIST_TABS.includes(activeTab)) return;

    const fetchInitialDirectory = async () => {
      setDirectoryLoading(true);
      try {
        const endpoint = activeTab === 'users'
          ? getAdminUsers
          : activeTab === 'workers'
            ? getAdminWorkers
            : getAdminBookings;
        const { data } = await endpoint({ page: 1, limit: 20 });
        setDirectories((current) => ({ ...current, [activeTab]: data.data }));
        setDirectoryPagination((current) => ({ ...current, [activeTab]: data.pagination }));
      } catch {
        toast.error(t('admin.failedLoadList'));
      } finally {
        setDirectoryLoading(false);
      }
    };

    setDirectorySearch('');
    fetchInitialDirectory();
  }, [activeTab, t]);

  const fetchDirectory = async (tab = activeTab, page = 1, search = directorySearch) => {
    if (!LIST_TABS.includes(tab)) return;

    setDirectoryLoading(true);
    try {
      const endpoint = tab === 'users' ? getAdminUsers : tab === 'workers' ? getAdminWorkers : getAdminBookings;
      const { data } = await endpoint({ page, limit: 20, search });
      setDirectories((current) => ({ ...current, [tab]: data.data }));
      setDirectoryPagination((current) => ({ ...current, [tab]: data.pagination }));
    } catch {
      toast.error(t('admin.failedLoadList'));
    } finally {
      setDirectoryLoading(false);
    }
  };

  const openDirectory = (tab) => {
    setDirectorySearch('');
    setActiveTab(tab);
  };

  const openCreateModal = (tab) => {
    setCreateModal(tab);
    setCreateForm(EMPTY_MANAGED_ACCOUNT_FORM);
  };

  const handleCreateSubmit = async (event) => {
    event.preventDefault();
    if (!createModal) return;

    setCreatingAccount(true);
    try {
      const payload = {
        ...createForm,
        skills: createForm.skills,
        experience: Number(createForm.experience) || 0,
        amount: Number(createForm.amount) || 0
      };

      const { data } = createModal === 'users'
        ? await createAdminUser(payload)
        : await createAdminWorker(payload);

      toast.success(data.message);
      setCreateModal(null);
      setCreateForm(EMPTY_MANAGED_ACCOUNT_FORM);
      await fetchData();
      await fetchDirectory(createModal, 1, '');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not add account');
    } finally {
      setCreatingAccount(false);
    }
  };

  const handleDeleteAccount = async ({ tab, id, name }) => {
    setPendingDelete({ tab, id, name });
  };

  const confirmDeleteAccount = async () => {
    if (!pendingDelete) return;
    const { tab, id } = pendingDelete;
    const label = tab === 'users' ? 'user' : 'worker';

    setDeletingAccount(true);
    try {
      const { data } = tab === 'users'
        ? await deleteAdminUser(id)
        : await deleteAdminWorker(id);

      toast.success(data.message);
      setPendingDelete(null);
      await fetchData();
      await fetchDirectory(tab, directoryPagination[tab]?.page || 1, directorySearch);
    } catch (error) {
      toast.error(error.response?.data?.message || t('admin.deleteFailed', { label }));
    } finally {
      setDeletingAccount(false);
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
             <button onClick={() => openDirectory('users')} className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'users' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900'}`}>Users</button>
             <button onClick={() => openDirectory('workers')} className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'workers' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900'}`}>Workers</button>
             <button onClick={() => openDirectory('bookings')} className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'bookings' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900'}`}>Bookings</button>
             <button onClick={() => setActiveTab('audit')} className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'audit' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900'}`}>Audit Logs</button>
          </div>
        </header>

        {/* Stats Grid */}
        {activeTab === 'overview' && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard icon={<Users className="text-blue-500" />} label="Total Users" value={stats?.totalUsers} change="View list" color="bg-blue-50" onClick={() => openDirectory('users')} />
          <StatCard icon={<TrendingUp className="text-emerald-500" />} label="Total Workers" value={stats?.totalWorkers} change="View list" color="bg-emerald-50" onClick={() => openDirectory('workers')} />
          <StatCard icon={<ShieldAlert className="text-amber-500" />} label="Pending KYC" value={stats?.pendingApprovals} change={pendingWorkers.length > 5 ? 'High' : 'Normal'} color="bg-amber-50" onClick={() => document.getElementById('verification-queue')?.scrollIntoView({ behavior: 'smooth' })} />
          <StatCard icon={<CheckCircle className="text-indigo-500" />} label="Paid Bookings" value={stats?.paidBookings} change={`${stats?.totalBookings || 0} total`} color="bg-indigo-50" onClick={() => openDirectory('bookings')} />
        </div>}

        {/* Pending Approvals Table */}
        {activeTab === 'overview' && <section id="verification-queue" className="bg-white rounded-3xl md:rounded-[40px] premium-shadow border border-slate-100 overflow-hidden">
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
                          <img src={item.user?.avatar || fallbackAvatar} onError={withImageFallback()} alt="" className="w-12 h-12 rounded-2xl object-cover border border-slate-100" />
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

        {LIST_TABS.includes(activeTab) && (
          <AdminDirectory
            activeTab={activeTab}
            data={directories[activeTab]}
            loading={directoryLoading}
            pagination={directoryPagination[activeTab]}
            searchTerm={directorySearch}
            setSearchTerm={setDirectorySearch}
            onSearch={(event) => {
              event.preventDefault();
              fetchDirectory(activeTab, 1, directorySearch);
            }}
            onPageChange={(page) => fetchDirectory(activeTab, page, directorySearch)}
            onCreate={() => openCreateModal(activeTab)}
            onDelete={handleDeleteAccount}
          />
        )}

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
                         <DocumentPreview url={selectedWorker.kyc?.idProof?.url} label="ID Proof" />
                      </div>
                   </div>
                   
                   {selectedWorker.type === 'worker' && (
                     <div className="space-y-4">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Uploaded Selfie</p>
                        <div className="aspect-4/3 rounded-3xl overflow-hidden border-4 border-slate-50 bg-slate-100 flex items-center justify-center">
                           <DocumentPreview url={selectedWorker.kyc?.selfie?.url} label="Selfie" />
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

        {createModal && (
          <ManagedAccountModal
            type={createModal}
            form={createForm}
            setForm={setCreateForm}
            saving={creatingAccount}
            onSubmit={handleCreateSubmit}
            onClose={() => setCreateModal(null)}
          />
        )}

        {pendingDelete && (
          <DeleteAccountModal
            item={pendingDelete}
            saving={deletingAccount}
            onCancel={() => setPendingDelete(null)}
            onConfirm={confirmDeleteAccount}
          />
        )}
      </div>
    </div>
  );
};

const DocumentPreview = ({ url, label }) => {
  const [failedPreviewUrl, setFailedPreviewUrl] = useState('');
  const documentUrl = resolveAssetUrl(url);
  const previewUrl = getInlineDocumentPreviewUrl(documentUrl);
  const previewFailed = failedPreviewUrl === previewUrl;
  const shouldRenderPdfFrame = isPdfAsset(documentUrl) && previewUrl === documentUrl;

  if (!documentUrl) {
    return <span className="text-slate-300 font-bold italic">No document uploaded</span>;
  }

  if (previewFailed) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center text-slate-500">
        <FileText size={46} className="text-primary-500" />
        <span className="text-sm font-black uppercase tracking-widest">{label}</span>
        <span className="max-w-xs text-xs font-bold text-slate-400">
          This document could not be previewed inline. Please upload a clear JPG, PNG, or PDF file.
        </span>
      </div>
    );
  }

  if (shouldRenderPdfFrame) {
    return (
      <object
        data={documentUrl}
        type="application/pdf"
        className="h-full w-full bg-white"
        aria-label={label}
      >
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center text-slate-500">
          <FileText size={46} className="text-primary-500" />
          <span className="text-sm font-black uppercase tracking-widest">{label}</span>
          <span className="max-w-xs text-xs font-bold text-slate-400">
            Preview is not available for this document type on this browser.
          </span>
        </div>
      </object>
    );
  }

  return (
    <img
      src={previewUrl}
      className="h-full w-full object-contain"
      alt={label}
      onError={() => setFailedPreviewUrl(previewUrl)}
    />
  );
};

const AdminDirectory = ({ activeTab, data, loading, pagination, searchTerm, setSearchTerm, onSearch, onPageChange, onCreate, onDelete }) => {
  const titles = {
    users: 'Registered Users',
    workers: 'Registered Workers',
    bookings: 'Platform Bookings'
  };
  const placeholders = {
    users: 'Search users by name, email, or phone...',
    workers: 'Search workers by name, email, phone, skill...',
    bookings: 'Search bookings by service, customer, worker...'
  };

  return (
    <section className="bg-white rounded-3xl md:rounded-[40px] premium-shadow border border-slate-100 overflow-hidden">
      <div className="p-4 sm:p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h3 className="text-2xl font-bold text-slate-900 font-heading">{titles[activeTab]}</h3>
          <p className="text-sm font-medium text-slate-500">Click a count card or tab to inspect the matching records.</p>
        </div>
        <div className="flex w-full md:w-auto flex-col sm:flex-row gap-3">
          {activeTab !== 'bookings' && (
            <button
              type="button"
              onClick={onCreate}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary-600 px-5 py-3 text-sm font-bold text-white hover:bg-primary-700"
            >
              <Plus size={18} /> Add {activeTab === 'users' ? 'User' : 'Worker'}
            </button>
          )}
          <form onSubmit={onSearch} className="relative w-full md:w-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={placeholders[activeTab]}
              className="w-full md:w-96 bg-slate-50 border border-slate-100 pl-11 pr-4 py-3 rounded-2xl outline-none focus:border-primary-500 focus:bg-white transition-all text-sm font-medium"
            />
          </form>
        </div>
      </div>

      <div className="overflow-x-auto">
        {loading ? (
          <div className="px-8 py-20 text-center text-slate-400 font-bold">Loading records...</div>
        ) : activeTab === 'users' ? (
          <UsersTable users={data} onDelete={onDelete} />
        ) : activeTab === 'workers' ? (
          <WorkersTable workers={data} onDelete={onDelete} />
        ) : (
          <BookingsTable bookings={data} />
        )}
      </div>

      {pagination?.pages > 1 && (
        <div className="flex flex-wrap justify-center gap-3 border-t border-slate-50 p-4">
          <button disabled={pagination.page <= 1} onClick={() => onPageChange(pagination.page - 1)} className="px-5 py-3 bg-white border border-slate-100 rounded-xl font-bold disabled:opacity-40">Previous</button>
          <span className="px-5 py-3 text-slate-500 font-bold">Page {pagination.page} of {pagination.pages}</span>
          <button disabled={pagination.page >= pagination.pages} onClick={() => onPageChange(pagination.page + 1)} className="px-5 py-3 bg-white border border-slate-100 rounded-xl font-bold disabled:opacity-40">Next</button>
        </div>
      )}
    </section>
  );
};

const UsersTable = ({ users, onDelete }) => (
  <table className="w-full text-left">
    <thead>
      <tr className="bg-slate-50/50 text-slate-400 text-[11px] uppercase tracking-[0.2em] font-bold">
        <th className="px-8 py-5">User</th>
        <th className="px-8 py-5">Contact</th>
        <th className="px-8 py-5">Verification</th>
        <th className="px-8 py-5">Location</th>
        <th className="px-8 py-5">Joined</th>
        <th className="px-8 py-5 text-right">Actions</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-slate-50">
      {users.length ? users.map((user) => (
        <tr key={user._id} className="hover:bg-slate-50/30">
          <td className="px-8 py-6">
            <div className="flex items-center gap-4">
              <img src={user.avatar || fallbackAvatar} onError={withImageFallback()} alt="" className="w-12 h-12 rounded-2xl object-cover border border-slate-100" />
              <div>
                <p className="font-bold text-slate-900">{user.name}</p>
                <p className="text-xs font-semibold text-slate-400">{user.email}</p>
              </div>
            </div>
          </td>
          <td className="px-8 py-6 text-sm font-bold text-slate-600">{user.phone || 'Not added'}</td>
          <td className="px-8 py-6">
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={user.isVerified ? 'verified' : 'pending'}>{user.isVerified ? 'Email Verified' : 'Email Pending'}</StatusBadge>
              <StatusBadge status={user.isAdminApproved ? 'approved' : user.kyc?.status || 'pending'}>{user.isAdminApproved ? 'Admin Approved' : user.kyc?.status || 'KYC Pending'}</StatusBadge>
            </div>
          </td>
          <td className="px-8 py-6 text-sm font-medium text-slate-500 max-w-xs break-words">{user.location?.address || user.location?.city || 'Not added'}</td>
          <td className="px-8 py-6 text-sm font-bold text-slate-500">{new Date(user.createdAt).toLocaleDateString()}</td>
          <td className="px-8 py-6 text-right">
            <button
              type="button"
              onClick={() => onDelete({ tab: 'users', id: user._id, name: user.name })}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-600 hover:text-white"
            >
              <Trash2 size={14} /> Delete
            </button>
          </td>
        </tr>
      )) : (
        <EmptyTable colSpan={6} message="No users found." />
      )}
    </tbody>
  </table>
);

const WorkersTable = ({ workers, onDelete }) => (
  <table className="w-full text-left">
    <thead>
      <tr className="bg-slate-50/50 text-slate-400 text-[11px] uppercase tracking-[0.2em] font-bold">
        <th className="px-8 py-5">Worker</th>
        <th className="px-8 py-5">Skills</th>
        <th className="px-8 py-5">Status</th>
        <th className="px-8 py-5">Availability</th>
        <th className="px-8 py-5">Rating</th>
        <th className="px-8 py-5 text-right">Actions</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-slate-50">
      {workers.length ? workers.map((worker) => (
        <tr key={worker._id} className="hover:bg-slate-50/30">
          <td className="px-8 py-6">
            <div className="flex items-center gap-4">
              <img src={worker.user?.avatar || fallbackAvatar} onError={withImageFallback()} alt="" className="w-12 h-12 rounded-2xl object-cover border border-slate-100" />
              <div>
                <p className="font-bold text-slate-900">{worker.user?.name || 'Unknown worker'}</p>
                <p className="text-xs font-semibold text-slate-400">{worker.user?.email}</p>
              </div>
            </div>
          </td>
          <td className="px-8 py-6">
            <div className="flex flex-wrap gap-2 max-w-md">
              {worker.skills?.slice(0, 4).map((skill) => (
                <span key={skill} className="rounded-full bg-primary-50 px-3 py-1 text-xs font-bold text-primary-700">{skill}</span>
              ))}
            </div>
          </td>
          <td className="px-8 py-6"><StatusBadge status={worker.approvalStatus}>{worker.approvalStatus}</StatusBadge></td>
          <td className="px-8 py-6"><StatusBadge status={worker.availabilityStatus}>{worker.availabilityStatus || 'Available'}</StatusBadge></td>
          <td className="px-8 py-6 text-sm font-bold text-slate-600">{worker.averageRating?.toFixed(1) || '0.0'} ({worker.totalReviews || 0})</td>
          <td className="px-8 py-6 text-right">
            <button
              type="button"
              onClick={() => onDelete({ tab: 'workers', id: worker._id, name: worker.user?.name })}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-600 hover:text-white"
            >
              <Trash2 size={14} /> Delete
            </button>
          </td>
        </tr>
      )) : (
        <EmptyTable colSpan={6} message="No workers found." />
      )}
    </tbody>
  </table>
);

const BookingsTable = ({ bookings }) => (
  <table className="w-full text-left">
    <thead>
      <tr className="bg-slate-50/50 text-slate-400 text-[11px] uppercase tracking-[0.2em] font-bold">
        <th className="px-8 py-5">Service</th>
        <th className="px-8 py-5">Customer</th>
        <th className="px-8 py-5">Worker</th>
        <th className="px-8 py-5">Status</th>
        <th className="px-8 py-5">Payment</th>
        <th className="px-8 py-5">Schedule</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-slate-50">
      {bookings.length ? bookings.map((booking) => (
        <tr key={booking._id} className="hover:bg-slate-50/30">
          <td className="px-8 py-6">
            <div className="flex items-start gap-3">
              <Briefcase className="mt-1 text-primary-500" size={18} />
              <div>
                <p className="font-bold text-slate-900">{booking.service}</p>
                <p className="text-xs font-semibold text-slate-400">{formatInr(booking.totalPrice)}</p>
              </div>
            </div>
          </td>
          <td className="px-8 py-6 text-sm font-bold text-slate-600">{booking.user?.name || 'Unknown'}</td>
          <td className="px-8 py-6 text-sm font-bold text-slate-600">{booking.worker?.name || 'Unknown'}</td>
          <td className="px-8 py-6"><StatusBadge status={booking.status}>{booking.status}</StatusBadge></td>
          <td className="px-8 py-6"><StatusBadge status={booking.paymentStatus}>{booking.paymentStatus}</StatusBadge></td>
          <td className="px-8 py-6">
            <div className="flex items-center gap-2 text-slate-600 font-bold text-sm">
              <CalendarDays size={16} /> {new Date(booking.scheduledDate).toLocaleString()}
            </div>
          </td>
        </tr>
      )) : (
        <EmptyTable colSpan={6} message="No bookings found." />
      )}
    </tbody>
  </table>
);

const EmptyTable = ({ colSpan, message }) => (
  <tr>
    <td colSpan={colSpan} className="px-8 py-20 text-center text-slate-300 font-bold italic">{message}</td>
  </tr>
);

const DeleteAccountModal = ({ item, saving, onCancel, onConfirm }) => {
  const { t } = useTranslation();
  const [confirmation, setConfirmation] = useState('');
  const label = item.tab === 'users' ? t('admin.user') : t('admin.worker');
  const targetName = item.name || t('admin.thisAccount', { label });
  const canConfirm = confirmation.trim().toUpperCase() === 'DELETE';

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-start gap-4">
          <div className="rounded-lg bg-rose-50 p-3 text-rose-600">
            <Trash2 size={24} />
          </div>
          <div>
            <h3 className="font-heading text-2xl font-bold text-slate-900">
              {t('admin.deleteTitle', { label })}
            </h3>
            <p className="mt-2 text-sm font-medium text-slate-500">
              {t('admin.deleteWarning', { name: targetName })}
            </p>
          </div>
        </div>

        <label className="block text-xs font-black uppercase tracking-widest text-slate-400">
          {t('admin.typeDelete')}
        </label>
        <input
          autoFocus
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          placeholder="DELETE"
          className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 font-bold text-slate-900 outline-none focus:border-rose-400 focus:bg-white"
        />

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="flex-1 rounded-lg border border-slate-200 px-4 py-3 font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!canConfirm || saving}
            className="flex-1 rounded-lg bg-rose-600 px-4 py-3 font-bold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? t('admin.deleting') : t('admin.confirmDelete')}
          </button>
        </div>
      </div>
    </div>
  );
};

const ManagedAccountModal = ({ type, form, setForm, saving, onSubmit, onClose }) => {
  const isWorker = type === 'workers';
  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/60 p-3 sm:p-6 backdrop-blur-sm">
      <form onSubmit={onSubmit} className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white premium-shadow">
        <div className="flex items-center justify-between gap-4 border-b border-slate-50 p-4 sm:p-8">
          <div>
            <h3 className="text-2xl font-bold font-heading text-slate-900">Add {isWorker ? 'Worker' : 'User'}</h3>
            <p className="text-sm font-medium text-slate-500">Admin-created accounts are email verified and admin approved by default.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-50">
            <XCircle size={24} />
          </button>
        </div>

        <div className="grid gap-4 overflow-y-auto p-4 sm:grid-cols-2 sm:p-8">
          <input required value={form.name} onChange={(event) => updateField('name', event.target.value)} placeholder="Full name" className="rounded-2xl bg-slate-50 px-4 py-3 outline-none" />
          <input required type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} placeholder="Email" className="rounded-2xl bg-slate-50 px-4 py-3 outline-none" />
          <input required minLength={6} type="password" value={form.password} onChange={(event) => updateField('password', event.target.value)} placeholder="Temporary password" className="rounded-2xl bg-slate-50 px-4 py-3 outline-none" />
          <input value={form.phone} onChange={(event) => updateField('phone', event.target.value)} placeholder="Phone" className="rounded-2xl bg-slate-50 px-4 py-3 outline-none" />
          <input value={form.address} onChange={(event) => updateField('address', event.target.value)} placeholder="Address" className="rounded-2xl bg-slate-50 px-4 py-3 outline-none sm:col-span-2" />
          <input value={form.city} onChange={(event) => updateField('city', event.target.value)} placeholder="City" className="rounded-2xl bg-slate-50 px-4 py-3 outline-none" />
          <input value={form.pincode} onChange={(event) => updateField('pincode', event.target.value)} placeholder="Pincode" className="rounded-2xl bg-slate-50 px-4 py-3 outline-none" />

          {isWorker && (
            <>
              <input required value={form.skills} onChange={(event) => updateField('skills', event.target.value)} placeholder={`Skills, e.g. ${PROFESSIONS.slice(0, 3).join(', ')}`} className="rounded-2xl bg-slate-50 px-4 py-3 outline-none sm:col-span-2" />
              <input type="number" min="0" value={form.experience} onChange={(event) => updateField('experience', event.target.value)} placeholder="Experience in years" className="rounded-2xl bg-slate-50 px-4 py-3 outline-none" />
              <input type="number" min="0" value={form.amount} onChange={(event) => updateField('amount', event.target.value)} placeholder="Price amount" className="rounded-2xl bg-slate-50 px-4 py-3 outline-none" />
              <select value={form.unit} onChange={(event) => updateField('unit', event.target.value)} className="rounded-2xl bg-slate-50 px-4 py-3 outline-none">
                <option value="hour">Per hour</option>
                <option value="day">Per day</option>
                <option value="job">Per job</option>
              </select>
              <textarea required value={form.bio} onChange={(event) => updateField('bio', event.target.value)} placeholder="Worker bio" className="h-28 rounded-2xl bg-slate-50 px-4 py-3 outline-none sm:col-span-2" />
            </>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-50 bg-slate-50/60 p-4 sm:flex-row sm:p-8">
          <button type="button" onClick={onClose} className="flex-1 rounded-2xl border border-slate-200 py-3 font-bold text-slate-600">Cancel</button>
          <button disabled={saving} className="flex-1 rounded-2xl bg-primary-600 py-3 font-bold text-white hover:bg-primary-700 disabled:opacity-50">
            {saving ? 'Saving...' : `Add ${isWorker ? 'Worker' : 'User'}`}
          </button>
        </div>
      </form>
    </div>
  );
};

const StatCard = ({ icon, label, value, change, color, onClick }) => (
  <button type="button" onClick={onClick} className="bg-white p-5 sm:p-8 rounded-3xl md:rounded-[40px] premium-shadow border border-slate-100 text-left transition-all hover:-translate-y-1 hover:border-primary-100">
    <div className="flex justify-between items-start mb-6">
      <div className={`p-4 ${color} rounded-2xl`}>{icon}</div>
      <span className="text-emerald-500 font-bold text-xs bg-emerald-50 px-3 py-1 rounded-full">{change}</span>
    </div>
    <h3 className="text-4xl font-bold text-slate-900 font-heading tracking-tight mb-1">{value || 0}</h3>
    <p className="text-slate-500 font-bold text-sm tracking-wide">{label}</p>
  </button>
);

export default AdminDashboard;
