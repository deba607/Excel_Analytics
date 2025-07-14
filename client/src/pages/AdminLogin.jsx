import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaEnvelope, FaLock, FaArrowLeft, FaCheckCircle, FaEye, FaEyeSlash } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { useAuth } from '../store/auth';
import { motion } from 'framer-motion';

const API_URL = 'http://localhost:8000/api/adminLogin';

const AdminLogin = () => {
  // Authentication
  const { setadminEmail, storeadminEmailLS, setToken } = useAuth();
  const navigate = useNavigate();

  // State
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [otp, setOtp] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState({
    login: false,
    verify: false,
    resend: false
  });
  const [countdown, setCountdown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  useEffect(() => {
    // If already logged in as admin, redirect
    if (localStorage.getItem('adminToken')) {
      navigate('/admin', { replace: true });
    }
  }, [navigate]);

  // Validation
  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (step === 1 && !formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
    if (errors.otp) setErrors(prev => ({ ...prev, otp: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      if (step === 1) {
        await handleLogin();
      } else {
        await handleVerifyOTP();
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'An error occurred. Please try again.';
      toast.error(message);
    }
  };

  const handleLogin = async () => {
    setIsLoading(prev => ({ ...prev, login: true }));
    try {
      const response = await fetch(`${API_URL}/send-login-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send OTP');
      }
      setStep(2);
      setCountdown(30);
      toast.success('OTP sent to your email!');
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(prev => ({ ...prev, login: false }));
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim()) {
      setErrors(prev => ({ ...prev, otp: 'Please enter the OTP' }));
      return;
    }
    setIsLoading(prev => ({ ...prev, verify: true }));
    try {
      const response = await fetch(`${API_URL}/verify-login-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          otp: otp.trim(),
          password: formData.password
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to verify OTP');
      }
      // Store the admin token in localStorage and auth context
      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('adminEmail', formData.email);
      setToken(data.token);
      storeadminEmailLS(formData.email);
      setadminEmail(formData.email);
      setOtpVerified(true);
      toast.success('Admin login successful!');
      navigate('/admin', { replace: true });
      setFormData({ email: '', password: '' });
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to verify OTP';
      setErrors(prev => ({ ...prev, otp: errorMessage }));
      toast.error(errorMessage);
    } finally {
      setIsLoading(prev => ({ ...prev, verify: false }));
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;
    setIsLoading(prev => ({ ...prev, resend: true }));
    try {
      const response = await fetch(`${API_URL}/resend-login-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: formData.email }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to resend OTP');
      }
      setCountdown(30);
      toast.success('New OTP sent to your email!');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(prev => ({ ...prev, resend: false }));
    }
  };

  // Animation variants
  const formVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 80 } }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-white py-12 px-4">
      <motion.div
        className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8"
        initial="hidden"
        animate="visible"
        variants={formVariants}
      >
        <h2 className="text-2xl font-bold text-center text-blue-700 mb-6">Admin Login</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaEnvelope className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                disabled={isLoading.login || isLoading.verify}
              />
            </div>
            {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email}</p>}
          </div>
          {step === 1 && (
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  disabled={isLoading.login || isLoading.verify}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  tabIndex={-1}
                >
                  {showPassword ? <FaEyeSlash className="h-5 w-5 text-gray-500" /> : <FaEye className="h-5 w-5 text-gray-500" />}
                </button>
              </div>
              {errors.password && <p className="mt-2 text-sm text-red-600">{errors.password}</p>}
            </div>
          )}
          {step === 2 && (
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">Verification Code</label>
              <div className="flex space-x-2">
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={otp}
                  onChange={handleOtpChange}
                  className="block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  disabled={isLoading.verify}
                />
              </div>
              {errors.otp && <p className="mt-2 text-sm text-red-600">{errors.otp}</p>}
              <div className="flex items-center justify-between mt-2">
                <button
                  type="button"
                  onClick={handleResendOTP}
                  className="text-sm text-blue-600 hover:underline disabled:opacity-50"
                  disabled={isLoading.resend || countdown > 0}
                >
                  {countdown > 0 ? `Resend OTP in ${countdown}s` : 'Resend OTP'}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-sm text-gray-500 hover:underline"
                >
                  <FaArrowLeft className="inline mr-1" /> Back
                </button>
              </div>
            </div>
          )}
          <motion.button
            type="submit"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300"
            disabled={isLoading.login || isLoading.verify}
          >
            {step === 1 ? (isLoading.login ? 'Sending OTP...' : 'Send OTP') : (isLoading.verify ? 'Verifying...' : 'Verify OTP')}
          </motion.button>
        </form>
        <div className="mt-6 text-center">
          <Link to="/login" className="text-blue-600 hover:underline">User Login</Link>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin; 