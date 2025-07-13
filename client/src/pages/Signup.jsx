import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEnvelope, FaLock, FaUser, FaKey, FaArrowLeft, FaCheckCircle } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-hot-toast';

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
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-18 text-center text-3xl font-extrabold text-gray-900">
          {step === 1 ? 'Create your account' : 'Verify your email'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {step === 1 
            ? 'Enter your details to get started'
            : `We've sent a verification code to ${formData.email}`
          }
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {serverError && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{serverError}</p>
                </div>
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={step === 1 ? handleGetOTP : handleSubmit}>
            {step === 1 ? (
              <>
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
                      className={`block w-full pl-10 pr-3 py-2 border ${errors.name ? 'border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500'} rounded-md`}
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
                      className={`block w-full pl-10 pr-3 py-2 border ${errors.email ? 'border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500'} rounded-md`}
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
                      className={`block w-full pl-10 pr-3 py-2 border ${errors.password ? 'border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500'} rounded-md`}
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
                      className={`block w-full pl-10 pr-3 py-2 border ${errors.confirmPassword ? 'border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500'} rounded-md`}
                      placeholder="••••••••"
                      disabled={otpSent}
                    />
                  </div>
                  {errors.confirmPassword && <p className="mt-2 text-sm text-red-600">{errors.confirmPassword}</p>}
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={otpSending}
                    className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${otpSending ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
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
                      className="flex-1 min-w-0 block w-full px-4 py-3 text-center text-lg border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="000000"
                      disabled={otpVerified}
                    />
                    {!otpVerified && (
                      <button
                        type="button"
                        onClick={handleVerifyOTP}
                        disabled={verifying || otp.length !== 6}
                        className={`ml-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${verifying || otp.length !== 6 ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
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
                      className="font-medium text-blue-600 hover:text-blue-500 focus:outline-none"
                    >
                      <FaArrowLeft className="inline mr-1" /> Back
                    </button>
                  </div>
                  <div className="text-sm">
                    <button
                      type="button"
                      onClick={resendOTP}
                      disabled={countdown > 0 || otpSending}
                      className="font-medium text-blue-600 hover:text-blue-500 focus:outline-none disabled:text-gray-400"
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
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Sign in
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;