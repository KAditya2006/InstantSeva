import React, { lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { getOnboardingMessage } from './utils/onboarding';

// Pages
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const VerifyOTP = lazy(() => import('./pages/VerifyOTP'));
const WorkerDashboard = lazy(() => import('./pages/WorkerDashboard'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const ChatPage = lazy(() => import('./pages/Chat'));
const SearchPage = lazy(() => import('./pages/Search'));
const Profile = lazy(() => import('./pages/Profile'));
const EditProfile = lazy(() => import('./pages/EditProfile'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const WorkerProfile = lazy(() => import('./pages/WorkerProfile'));
const NotFound = lazy(() => import('./pages/NotFound'));

const PageLoader = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center font-heading font-medium text-slate-500">
      {t('common.loadingInstantSeva')}
    </div>
  );
};

const ProtectedRoute = ({ children, role, requireDashboardAccess = false }) => {
  const { t } = useTranslation();
  const { token, user, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center font-heading font-medium text-slate-500">{t('common.loadingMarketplace')}</div>;
  if (!token) return <Navigate to="/login" state={{ message: t('auth.notLoggedIn') }} />;
  if (role && user?.role !== role) return <Navigate to="/" />;
  if (requireDashboardAccess && !user?.canAccessDashboard) {
    return <Navigate to="/profile" replace state={{ notice: getOnboardingMessage(user) }} />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/verify-otp" element={<VerifyOTP />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route 
        path="/search" 
        element={<SearchPage />} 
      />
      <Route 
        path="/workers/:workerId" 
        element={<WorkerProfile />} 
      />
      
      {/* Protected Routes */}
      <Route 
        path="/worker/dashboard/*" 
        element={
          <ProtectedRoute role="worker" requireDashboardAccess>
            <WorkerDashboard />
          </ProtectedRoute>
        } 
      />

      <Route
        path="/dashboard/*"
        element={
          <ProtectedRoute role="user" requireDashboardAccess>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      
      <Route 
        path="/admin/dashboard/*" 
        element={
          <ProtectedRoute role="admin">
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/messages" 
        element={
          <ProtectedRoute requireDashboardAccess>
            <ChatPage />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/profile/edit" 
        element={
          <ProtectedRoute>
            <EditProfile />
          </ProtectedRoute>
        } 
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" />
        <Suspense fallback={<PageLoader />}>
          <AppRoutes />
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;
