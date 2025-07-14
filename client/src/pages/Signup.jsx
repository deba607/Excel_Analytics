import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEnvelope, FaLock, FaUser, FaKey, FaArrowLeft, FaCheckCircle } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

const API_URL = 'http://localhost:8000/api/auth';

const Signup = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [otp, setOtp] = useState('');  // Changed to string
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleOtpChange = (e) => {
    const { value } = e.target;
    // Only allow numbers and limit to 6 digits
    if (value === '' || /^[0-9\b]+$/.test(value)) {
      if (value.length <= 6) {
        setOtp(value);
        // Clear error when user types
        if (errors.otp) {
          setErrors(prev => ({
            ...prev,
            otp: undefined
          }));
        }
      }
    }
  };

  const handleGetOTP = async (e) => {
    e.preventDefault();
    if (!validateStep1()) return;
    
    setOtpSending(true);
    setServerError('');
    
    try {
      const response = await axios.post(`${API_URL}/send-otp`, {
        email: formData.email
      });

      if (response.data.success) {
        setOtpSent(true);
        setStep(2);
        setCountdown(30);
        setOtp(''); // Reset OTP input
        toast.success('OTP sent to your email!');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to send OTP. Please try again.';
      setServerError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp.trim()) {
      setErrors(prev => ({ ...prev, otp: 'Please enter the OTP' }));
      return;
    }
    
    setVerifying(true);
    
    try {
      const response = await axios.post(`${API_URL}/verify-otp`, {
        email: formData.email,
        otp: otp.trim()
      });

      if (response.data.success) {
        setOtpVerified(true);
        toast.success('Email verified successfully!');
      } else {
        setErrors(prev => ({
          ...prev,
          otp: response.data.message || 'Invalid OTP'
        }));
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to verify OTP. Please try again.';
      setErrors(prev => ({
        ...prev,
        otp: errorMessage
      }));
      toast.error(errorMessage);
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!otpVerified) return;
    
    try {
      const response = await axios.post(`${API_URL}/register`, {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });

      if (response.data.success) {
        toast.success('Registration successful! Redirecting...');
        localStorage.setItem('authToken', response.data.token);
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(errorMessage);
      setServerError(errorMessage);
    }
  };

  const resendOTP = async () => {
    if (countdown > 0) return;
    
    setOtpSending(true);
    setOtp(''); // Clear current OTP
    setErrors(prev => ({ ...prev, otp: undefined }));
    setServerError('');
    
    try {
      const response = await axios.post(`${API_URL}/resend-otp`, {
        email: formData.email
      });

      if (response.data.success) {
        setCountdown(30);
        toast.success('New OTP sent to your email!');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to resend OTP. Please try again.';
      toast.error(errorMessage);
    } finally {
      setOtpSending(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center relative overflow-hidden bg-gradient-to-br from-teal-400 via-emerald-400 to-lime-200 animate-gradient-move">
      {/* Animated background (example: animated waves) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <svg className="absolute bottom-0 left-0 w-full h-64 opacity-30 animate-wave-move" viewBox="0 0 1440 320"><path fill="#fff" fillOpacity="1" d="M0,224L48,202.7C96,181,192,139,288,144C384,149,480,203,576,197.3C672,192,768,128,864,128C960,128,1056,192,1152,197.3C1248,203,1344,149,1392,122.7L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path></svg>
      </div>
      <motion.div
        className="relative z-10 w-full max-w-md bg-white bg-opacity-90 rounded-2xl shadow-2xl p-8 mt-10"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 120 }}
      >
        <div className="flex justify-center mb-4">
          <img src="/OIMZ3J0.svg" alt="Logo" className="w-16 h-16 rounded-full shadow-lg bg-white p-2" />
        </div>
        <h2 className="text-3xl font-extrabold text-center text-teal-700 mb-2">
          Create your account
        </h2>
        <div>
          <form onSubmit={step === 1 ? handleGetOTP : handleSubmit} className="space-y-6">
            {step === 1 ? (
              <>
                {/* Name, Email, Password, Confirm Password fields */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaUser className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleChange}
                      className={`block w-full pl-10 pr-3 py-2 border ${errors.name ? 'border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500'} rounded-md`}
                      placeholder="John Doe"
                      disabled={otpSent}
                    />
                  </div>
                  {errors.name && <p className="mt-2 text-sm text-red-600">{errors.name}</p>}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email address
                  </label>
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
                      className={`block w-full pl-10 pr-3 py-2 border ${errors.email ? 'border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500'} rounded-md`}
                      placeholder="you@example.com"
                      disabled={otpSent}
                    />
                  </div>
                  {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email}</p>}
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaLock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`block w-full pl-10 pr-3 py-2 border ${errors.password ? 'border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500'} rounded-md`}
                      placeholder="••••••••"
                      disabled={otpSent}
                    />
                  </div>
                  {errors.password && <p className="mt-2 text-sm text-red-600">{errors.password}</p>}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirm Password
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaKey className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`block w-full pl-10 pr-3 py-2 border ${errors.confirmPassword ? 'border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500'} rounded-md`}
                      placeholder="••••••••"
                      disabled={otpSent}
                    />
                  </div>
                  {errors.confirmPassword && <p className="mt-2 text-sm text-red-600">{errors.confirmPassword}</p>}
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div>
                    <a
                      href={`${API_URL}/google`}
                      className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                    >
                      <span className="sr-only">Sign up with Google</span>
                      <svg className="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,14.991,2,12.145,2C6.667,2,2.145,6.521,2.145,12s4.521,10,10,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
                      </svg>
                    </a>
                  </div>
                </div>
                <div>
                  <button
                    type="submit"
                    disabled={otpSending}
                    className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${otpSending ? 'bg-emerald-400' : 'bg-emerald-600 hover:bg-emerald-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500`}
                  >
                    {otpSending ? 'Sending OTP...' : 'Get OTP'}
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    We've sent a 6-digit verification code to <span className="font-medium">{formData.email}</span>.
                    Please enter it below to verify your email address.
                  </p>
                </div>

                <div>
                  <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                    Verification Code
                  </label>
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
                      className="flex-1 min-w-0 block w-full px-4 py-3 text-center text-lg border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="000000"
                      disabled={otpVerified}
                    />
                    {!otpVerified && (
                      <button
                        type="button"
                        onClick={handleVerifyOTP}
                        disabled={verifying || otp.length !== 6}
                        className={`ml-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${verifying || otp.length !== 6 ? 'bg-emerald-400' : 'bg-emerald-600 hover:bg-emerald-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500`}
                      >
                        {verifying ? 'Verifying...' : 'Verify'}
                      </button>
                    )}
                  </div>
                  {otpVerified && (
                    <div className="mt-2 flex items-center text-sm text-green-600">
                      <FaCheckCircle className="mr-1.5 h-4 w-4 flex-shrink-0" />
                      Email verified successfully!
                    </div>
                  )}
                  {errors.otp && <p className="mt-2 text-sm text-red-600">{errors.otp}</p>}
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="font-medium text-emerald-600 hover:text-emerald-500 focus:outline-none"
                    >
                      <FaArrowLeft className="inline mr-1" /> Back
                    </button>
                  </div>
                  <div className="text-sm">
                    <button
                      type="button"
                      onClick={resendOTP}
                      disabled={countdown > 0 || otpSending}
                      className="font-medium text-emerald-600 hover:text-emerald-500 focus:outline-none disabled:text-gray-400"
                    >
                      {otpSending 
                        ? 'Sending...' 
                        : countdown > 0 
                          ? `Resend OTP in ${countdown}s` 
                          : 'Resend OTP'}
                    </button>
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={!otpVerified}
                    className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${!otpVerified ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
                  >
                    Create Account
                  </button>
                </div>
              </div>
            )}
          </form>
          {/* Already have an account? */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Already have an account?
                </span>
              </div>
            </div>
            <div className="mt-6">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
              >
                Sign in
              </button>
            </div>
          </div>
        </div>
      </motion.div>
      <style>{`
        @keyframes gradient-move {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-move {
          background-size: 200% 200%;
          animation: gradient-move 8s ease-in-out infinite;
        }
        @keyframes wave-move {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100px); }
        }
        .animate-wave-move {
          animation: wave-move 6s linear infinite alternate;
        }
      `}</style>
    </div>
  );
};

export default Signup;