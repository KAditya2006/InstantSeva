import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { verifyOTP, resendOTP } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, ArrowLeft, RefreshCcw } from 'lucide-react';
import toast from 'react-hot-toast';

const VerifyOTP = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const email = location.state?.email;

  useEffect(() => {
    if (!email) {
      navigate('/signup');
      return;
    }
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [email, navigate]);

  const handleChange = (e, index) => {
    const value = e.target.value;
    if (isNaN(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`).focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      toast.error('Please enter complete 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const { data } = await verifyOTP({ email, otp: otpCode });
      if (data.success) {
        toast.success('Email verified successfully!');
        login(data.user, data.token);
        
        // Redirect based on role
        if (data.user.role === 'worker') {
          navigate('/worker/dashboard');
        } else if (data.user.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/');
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    try {
      await resendOTP({ email });
      toast.success('OTP sent again');
      setTimer(60);
      setOtp(['', '', '', '', '', '']);
    } catch {
      toast.error('Failed to resend OTP');
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full">
        <button onClick={() => navigate('/signup')} className="mb-8 sm:mb-12 flex items-center gap-2 text-slate-500 hover:text-primary-600 transition-colors font-medium">
          <ArrowLeft size={18} /> Back to Signup
        </button>

        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-primary-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-primary-600">
            <ShieldCheck size={40} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 mb-2">Verify your Email</h1>
          <p className="text-slate-500 break-words">We've sent a 6-digit code to <span className="text-slate-900 font-semibold">{email}</span></p>
        </div>

        <form onSubmit={handleVerify} className="space-y-8 sm:space-y-10">
          <div className="flex justify-between gap-1 sm:gap-2">
            {otp.map((digit, i) => (
              <input 
                key={i}
                id={`otp-${i}`}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(e, i)}
                onKeyDown={(e) => handleKeyDown(e, i)}
                className="w-10 h-14 sm:w-12 sm:h-16 md:w-14 md:h-[72px] text-center text-xl sm:text-2xl font-bold bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-primary-500 focus:bg-white transition-all"
              />
            ))}
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-bold transition-all premium-shadow disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify & Continue'}
          </button>
        </form>

        <div className="mt-12 text-center">
          <p className="text-slate-500 mb-4">Didn't receive code?</p>
          <button 
            onClick={handleResend}
            disabled={timer > 0}
            className={`flex items-center gap-2 mx-auto font-bold transition-colors ${timer > 0 ? 'text-slate-300' : 'text-primary-600 hover:text-primary-700'}`}
          >
            <RefreshCcw size={18} className={timer > 0 ? '' : 'animate-spin-slow'} />
            {timer > 0 ? `Resend code in ${timer}s` : 'Resend Code Now'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;
