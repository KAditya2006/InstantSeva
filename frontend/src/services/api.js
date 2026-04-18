import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth APIs
export const registerUser = (data) => api.post('/auth/register', data);
export const loginUser = (data) => api.post('/auth/login', data);
export const verifyOTP = (data) => api.post('/auth/verify-otp', data);
export const resendOTP = (data) => api.post('/auth/resend-otp', data);
export const getCurrentUser = () => api.get('/auth/me');
export const forgotPassword = (data) => api.post('/auth/forgot-password', data);
export const resetPassword = (data) => api.post('/auth/reset-password', data);

// User APIs
export const updateProfile = (data) => api.put('/user/profile', data);
export const updateAvatar = (formData) => api.put('/user/profile/avatar', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const uploadUserKYC = (formData) => api.post('/user/upload-kyc', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

// Worker APIs
export const getWorkerProfile = () => api.get('/worker/profile');
export const updateWorkerProfile = (data) => api.patch('/worker/profile', data);
export const uploadKYC = (formData) => api.post('/worker/upload-kyc', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

// Admin APIs
export const getAdminStats = () => api.get('/admin/stats');
export const getAuditLogs = () => api.get('/admin/audit-logs');
export const getAdminUsers = (params) => api.get('/admin/users', { params });
export const getAdminWorkers = (params) => api.get('/admin/workers', { params });
export const getAdminBookings = (params) => api.get('/admin/bookings', { params });
export const getPendingWorkers = () => api.get('/admin/pending-workers');
export const approveWorker = (data) => api.post('/admin/approve-worker', data);

// Chat APIs
export const getChats = () => api.get('/chat');
export const getMessages = (chatId, params) => api.get(`/chat/${chatId}`, { params });
export const initiateChat = (data) => api.post('/chat/initiate', data);
export const sendTextMessage = (chatId, data) => api.post(`/chat/${chatId}/messages`, data);
export const markChatRead = (chatId) => api.patch(`/chat/${chatId}/read`);
export const uploadImageMessage = (formData) => api.post('/chat/upload-image', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

// Marketplace APIs
export const searchWorkers = (params) => api.get('/marketplace/workers', { params });
export const getWorkerDetails = (workerId) => api.get(`/marketplace/workers/${workerId}`);
export const searchLocations = (params) => api.get('/marketplace/locations/search', { params });

// Booking APIs
export const getBookings = (params) => api.get('/bookings', { params });
export const createBooking = (data) => api.post('/bookings', data);
export const updateBookingStatus = (bookingId, status) => api.patch(`/bookings/${bookingId}/status`, { status });
export const updateBookingPayment = (bookingId, data) => api.patch(`/bookings/${bookingId}/payment`, data);
export const verifyStartOTP = (bookingId, otp) => api.post(`/bookings/${bookingId}/verify-start-otp`, { otp });
export const verifyCompletionOTP = (bookingId, otp) => api.post(`/bookings/${bookingId}/verify-completion-otp`, { otp });
export const createReview = (bookingId, data) => api.post(`/bookings/${bookingId}/review`, data);

// Notification APIs
export const getNotifications = (params) => api.get('/notifications', { params });
export const markNotificationsRead = () => api.patch('/notifications/read');
export const getPushPublicKey = () => api.get('/notifications/push/public-key');
export const subscribePushNotifications = (data) => api.post('/notifications/push/subscribe', data);
export const unsubscribePushNotifications = (data) => api.delete('/notifications/push/unsubscribe', { data });

export default api;
