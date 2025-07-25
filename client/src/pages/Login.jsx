import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaEnvelope, FaLock, FaArrowLeft, FaCheckCircle, FaEye, FaEyeSlash } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { useAuth } from '../store/auth';
import { motion } from 'framer-motion';
import { BACKEND_URL } from '../store/backend.jsx';

const Login = () => {
  // Authentication
  const { setuserEmail, setadminEmail, isLoggedIn, storeadminEmailLS, storeuserEmailLS, setToken, setUser } = useAuth();
  const navigate = useNavigate();

  // State
  const [role, setRole] = useState('user'); // 'user' or 'admin'
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
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState(1); // 1: email, 2: OTP, 3: new password
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Effects
  useEffect(() => {
    if (isLoggedIn) {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user && user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
      navigate('/dashboard', { replace: true });
      }
    }
  }, [isLoggedIn, navigate]);

  // On mount, resume countdown if needed
  useEffect(() => {
    const end = localStorage.getItem('loginOtpCountdownEnd');
    if (end) {
      const remaining = Math.max(0, Math.ceil((parseInt(end) - Date.now()) / 1000));
      if (remaining > 0) setCountdown(remaining);
      else localStorage.removeItem('loginOtpCountdownEnd');
    }
  }, []);

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      localStorage.setItem('loginOtpCountdownEnd', Date.now() + countdown * 1000);
    } else {
      localStorage.removeItem('loginOtpCountdownEnd');
    }
    return () => clearTimeout(timer);
  }, [countdown]);

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

  // Update API_URL based on role
  const getApiUrl = () => role === 'admin' ? `${BACKEND_URL}/api/adminLogin` : `${BACKEND_URL}/api/authLogin`;

  const handleLogin = async () => {
    setIsLoading(prev => ({ ...prev, login: true }));
    try {
      const response = await fetch(`${getApiUrl()}/send-login-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        }),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error('Server returned non-JSON response: ' + text);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send OTP');
      }

      setStep(2);
      setCountdown(30);
      toast.success('OTP sent to your email!');
    } catch (error) {
      toast.error(error.message);
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
      const response = await fetch(`${getApiUrl()}/verify-login-otp`, {
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

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error('Server returned non-JSON response: ' + text);
      }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to verify OTP');
    }

    // Store the token in localStorage and auth context
    localStorage.setItem('token', data.token);
    localStorage.setItem('userEmail', formData.email);
    localStorage.setItem('role', role);
    setToken(data.token);
    storeuserEmailLS(formData.email);
    setuserEmail(formData.email);
    setUser({ email: formData.email, role });
    if (role === 'admin') {
      setadminEmail && setadminEmail(formData.email);
      storeadminEmailLS && storeadminEmailLS(formData.email);
    }
    setOtpVerified(true);
    toast.success('Login successful!');
    // Redirect based on role
    if (role === 'admin') {
      navigate('/admin', { replace: true });
    } else {
      navigate('/dashboard', { replace: true });
    }
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
      const response = await fetch(`${getApiUrl()}/resend-login-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: formData.email }),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error('Server returned non-JSON response: ' + text);
      }

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

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    
    if (!formData.email) {
      setErrors(prev => ({ ...prev, email: 'Email is required' }));
      return;
    }

    setIsLoading(prev => ({ ...prev, login: true }));
    
    try {
      const response = await fetch(`${getApiUrl()}/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: formData.email }),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error('Server returned non-JSON response: ' + text);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send reset OTP');
      }

      setForgotPasswordStep(2);
      setCountdown(30);
      toast.success('Password reset OTP sent to your email!');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(prev => ({ ...prev, login: false }));
    }
  };

  const handleResetOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setResetOtp(value);
    if (errors.resetOtp) setErrors(prev => ({ ...prev, resetOtp: undefined }));
  };

  const handleVerifyResetOtp = async (e) => {
    e.preventDefault();
    
    if (!resetOtp.trim()) {
      setErrors(prev => ({ ...prev, resetOtp: 'Please enter the OTP' }));
      return;
    }

    setIsLoading(prev => ({ ...prev, verify: true }));
    
    try {
      const response = await fetch(`${getApiUrl()}/verify-reset-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: formData.email,
          otp: resetOtp.trim()
        }),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error('Server returned non-JSON response: ' + text);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to verify OTP');
      }

      setForgotPasswordStep(3);
      toast.success('OTP verified! Enter your new password.');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(prev => ({ ...prev, verify: false }));
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!newPassword) {
      setErrors(prev => ({ ...prev, newPassword: 'New password is required' }));
      return;
    }
    
    if (newPassword.length < 6) {
      setErrors(prev => ({ ...prev, newPassword: 'Password must be at least 6 characters' }));
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      return;
    }

    setIsLoading(prev => ({ ...prev, login: true }));
    
    try {
      const response = await fetch(`${getApiUrl()}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: formData.email,
          otp: resetOtp,
          newPassword: newPassword
        }),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error('Server returned non-JSON response: ' + text);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }

      toast.success('Password reset successful! You can now login.');
      toggleForgotPassword(); // Close forgot password modal
      setForgotPasswordStep(1);
      setResetOtp('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(prev => ({ ...prev, login: false }));
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleForgotPassword = () => {
    setShowForgotPassword(!showForgotPassword);
    setForgotPasswordStep(1);
    setResetSent(false);
    setResetOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setErrors({});
  };

  // Render Methods
  const renderEmailField = () => (
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
          disabled={isLoading.login || isLoading.verify || isLoading.resend}
          className={`block w-full pl-10 pr-3 py-2 border ${
            errors.email ? 'border-red-300 text-red-900 placeholder-red-300' : 'border-gray-300'
          } rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-50`}
          placeholder="you@example.com"
        />
      </div>
      {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email}</p>}
    </div>
  );

  const renderPasswordField = () => (
    <div>
      <div className="flex items-center justify-between">
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <button
          type="button"
          onClick={toggleForgotPassword}
          className="text-sm font-medium text-emerald-600 hover:text-emerald-500"
          disabled={isLoading.login}
        >
          Forgot password?
        </button>
      </div>
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
          disabled={isLoading.login || isLoading.verify || isLoading.resend}
          className={`block w-full pl-10 pr-10 py-2 border ${
            errors.password ? 'border-red-300 text-red-900 placeholder-red-300' : 'border-gray-300'
          } rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-50`}
          placeholder="••••••••"
        />
        <button
          type="button"
          onClick={togglePasswordVisibility}
          className="absolute inset-y-0 right-0 pr-3 flex items-center"
          disabled={isLoading.login || isLoading.verify || isLoading.resend}
        >
          {showPassword ? (
            <FaEyeSlash className="h-5 w-5 text-gray-500" />
          ) : (
            <FaEye className="h-5 w-5 text-gray-500" />
          )}
        </button>
      </div>
      {errors.password && <p className="mt-2 text-sm text-red-600">{errors.password}</p>}
    </div>
  );

  const renderOtpField = () => (
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
          disabled={otpVerified || isLoading.verify || isLoading.resend}
          className="flex-1 min-w-0 block w-full px-4 py-3 text-center text-lg border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-50"
          placeholder="000000"
        />
        {!otpVerified && (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading.verify || otp.length !== 6}
            className={`ml-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
              isLoading.verify || otp.length !== 6 ? 'bg-emerald-400' : 'bg-emerald-600 hover:bg-emerald-700'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500`}
          >
            {isLoading.verify ? 'Verifying...' : 'Verify'}
          </button>
        )}
      </div>
      {otpVerified && (
        <div className="mt-2 flex items-center justify-center text-sm text-green-600">
          <FaCheckCircle className="mr-1.5 h-4 w-4 flex-shrink-0" />
          Email verified! Redirecting...
        </div>
      )}
      {errors.otp && <p className="mt-2 text-sm text-red-600 text-center">{errors.otp}</p>}
    </div>
  );

  const renderOtpActions = () => (
    <div className="flex items-center justify-between">
      <button
        type="button"
        onClick={() => setStep(1)}
        className="inline-flex items-center text-sm font-medium text-emerald-600 hover:text-emerald-500 disabled:text-gray-400"
        disabled={isLoading.verify || isLoading.resend}
      >
        <FaArrowLeft className="mr-1" /> Back
      </button>
      <button
        type="button"
        onClick={handleResendOTP}
        disabled={countdown > 0 || isLoading.resend}
        className="text-sm font-medium text-emerald-600 hover:text-emerald-500 disabled:text-gray-400"
      >
        {isLoading.resend ? 'Sending...' : countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
      </button>
    </div>
  );

  const renderSubmitButton = (text, loading) => (
    <button
      type="submit"
      disabled={loading}
      className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
        loading ? 'bg-emerald-400' : 'bg-emerald-600 hover:bg-emerald-700'
      } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500`}
    >
      {loading ? 'Processing...' : text}
    </button>
  );

  const renderSocialLogin = () => (
    <div className="mt-6">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        {/* <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">
            Or continue with
          </span>
        </div> */}
      </div>

      {/* <div className="mt-6 grid grid-cols-2 gap-3">
        <div>
          <a
            href={`${API_URL}/auth/google`}
            className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
          >
            <span className="sr-only">Sign in with Google</span>
            <svg className="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,14.991,2,12.145,2C6.667,2,2.145,6.521,2.145,12s4.521,10,10,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
            </svg>
          </a>
        </div>

        <div>
          <a
            href={`${API_URL}/auth/microsoft`}
            className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
          >
            <span className="sr-only">Sign in with Microsoft</span>
            <svg className="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 21 21">
              <path d="M1 1h9v9H1V1zm0 10h9v9H1v-9zm10 0h9v9h-9v-9zm0-10h9v9h-9V1z" />
            </svg>
          </a>
        </div>
      </div> */}
    </div>
  );

  // Render forgot password form
  const renderForgotPasswordForm = () => {
    if (!showForgotPassword) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
          {forgotPasswordStep === 1 && (
            <>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Reset Password</h3>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                {renderEmailField()}
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={toggleForgotPassword}
                    className="text-sm font-medium text-emerald-600 hover:text-emerald-500"
                  >
                    Back to login
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading.login}
                    className={`px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
                      isLoading.login ? 'bg-emerald-400' : 'bg-emerald-600 hover:bg-emerald-700'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500`}
                  >
                    {isLoading.login ? 'Sending...' : 'Send OTP'}
                  </button>
                </div>
              </form>
            </>
          )}

          {forgotPasswordStep === 2 && (
            <>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Verify OTP</h3>
              <div className="text-center mb-4">
                <p className="text-sm text-gray-600">
                  We've sent a 6-digit code to <span className="font-medium">{formData.email}</span>
                </p>
              </div>
              <form onSubmit={handleVerifyResetOtp} className="space-y-4">
                <div>
                  <label htmlFor="resetOtp" className="block text-sm font-medium text-gray-700 mb-2">
                    Verification Code
                  </label>
                  <input
                    id="resetOtp"
                    type="text"
                    value={resetOtp}
                    onChange={handleResetOtpChange}
                    disabled={isLoading.verify}
                    className={`block w-full px-3 py-2 border ${
                      errors.resetOtp ? 'border-red-300 text-red-900 placeholder-red-300' : 'border-gray-300'
                    } rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-50`}
                    placeholder="000000"
                    maxLength={6}
                  />
                  {errors.resetOtp && <p className="mt-2 text-sm text-red-600">{errors.resetOtp}</p>}
                </div>
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setForgotPasswordStep(1)}
                    className="text-sm font-medium text-emerald-600 hover:text-emerald-500"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading.verify}
                    className={`px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
                      isLoading.verify ? 'bg-emerald-400' : 'bg-emerald-600 hover:bg-emerald-700'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500`}
                  >
                    {isLoading.verify ? 'Verifying...' : 'Verify OTP'}
                  </button>
                </div>
              </form>
            </>
          )}

          {forgotPasswordStep === 3 && (
            <>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Set New Password</h3>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                    New Password
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaLock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={isLoading.login}
                      className={`block w-full pl-10 pr-10 py-2 border ${
                        errors.newPassword ? 'border-red-300 text-red-900 placeholder-red-300' : 'border-gray-300'
                      } rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-50`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      disabled={isLoading.login}
                    >
                      {showNewPassword ? (
                        <FaEyeSlash className="h-5 w-5 text-gray-500" />
                      ) : (
                        <FaEye className="h-5 w-5 text-gray-500" />
                      )}
                    </button>
                  </div>
                  {errors.newPassword && <p className="mt-2 text-sm text-red-600">{errors.newPassword}</p>}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirm New Password
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaLock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isLoading.login}
                      className={`block w-full pl-10 pr-10 py-2 border ${
                        errors.confirmPassword ? 'border-red-300 text-red-900 placeholder-red-300' : 'border-gray-300'
                      } rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-50`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      disabled={isLoading.login}
                    >
                      {showConfirmPassword ? (
                        <FaEyeSlash className="h-5 w-5 text-gray-500" />
                      ) : (
                        <FaEye className="h-5 w-5 text-gray-500" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="mt-2 text-sm text-red-600">{errors.confirmPassword}</p>}
                </div>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setForgotPasswordStep(2)}
                    className="text-sm font-medium text-emerald-600 hover:text-emerald-500"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading.login}
                    className={`px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
                      isLoading.login ? 'bg-emerald-400' : 'bg-emerald-600 hover:bg-emerald-700'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500`}
                  >
                    {isLoading.login ? 'Resetting...' : 'Reset Password'}
                  </button>
                </div>
              </form>
            </>
            )}
        </div>
      </div>
    );
  };

  // Main Render
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
          {step === 1 ? 'Sign in to your account' : 'Verify your email'}
        </h2>
        <p className="text-center text-sm text-gray-600 mb-6">
          {step === 1 ? (
            <>
              Or{' '}
              <Link to="/signup" className="font-medium text-emerald-600 hover:text-emerald-500">
                create a new account
              </Link>
            </>
          ) : (
            `Enter the verification code sent to ${formData.email}`
          )}
        </p>
        <div>
          <div>
            {step === 1 ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="mb-4">
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700">Login as</label>
                  <div className="relative mt-1">
                    <select
                      id="role"
                      name="role"
                      value={role}
                      onChange={e => setRole(e.target.value)}
                      className="block w-full appearance-none rounded-lg border border-emerald-300 bg-white py-2 px-4 pr-10 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-500 text-gray-700 transition"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                      <svg className="h-5 w-5 text-emerald-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.585l3.71-3.355a.75.75 0 111.02 1.1l-4.25 3.85a.75.75 0 01-1.02 0l-4.25-3.85a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
                    </span>
                  </div>
                </div>
                {renderEmailField()}
                {renderPasswordField()}
                {renderSubmitButton('Sign in with OTP', isLoading.login)}
              </form>
            ) : (
              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    We've sent a 6-digit code to <span className="font-medium">{formData.email}</span>
                  </p>
                </div>
                {renderOtpField()}
                {renderOtpActions()}
              </div>
            )}
          </div>
        </div>
        {renderForgotPasswordForm()}
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

export default Login;