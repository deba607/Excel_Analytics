import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaEnvelope, FaLock, FaArrowLeft, FaCheckCircle, FaEye, FaEyeSlash } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { useAuth } from '../store/auth';

const API_URL = 'http://localhost:8000/api/authLogin';

const Login = () => {
  // Authentication
  const { setuserEmail, setadminEmail, isLoggedIn, storeadminEmailLS, storeuserEmailLS, setToken } = useAuth();
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
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // Effects
  useEffect(() => {
    if (isLoggedIn) {
      navigate('/dashboard', { replace: true });
    }
  }, [isLoggedIn, navigate]);

  // useEffect(() => {
  //   let timer;
  //   if (countdown > 0) {
  //     timer = setTimeout(() => setCountdown(countdown - 1), 1000);
  //   }
  //   return () => clearTimeout(timer);
  // }, [countdown]);

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

    // Store the token in localStorage and auth context
    localStorage.setItem('token', data.token);
    localStorage.setItem('userEmail', formData.email);
    
    // Update auth context with user data
    setToken(data.token);
    storeuserEmailLS(formData.email);
    setuserEmail(formData.email);
    
    setOtpVerified(true);
    toast.success('Login successful!');
    
    // Navigate to dashboard
    navigate('/dashboard', { replace: true });
    
    // Reset form
    setFormData({ email: '', password: '' });
    console.log('User email stored:', formData.email);

    
  } catch (error) {
    console.error('OTP Verification Error:', error);
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

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    
    if (!formData.email) {
      setErrors(prev => ({ ...prev, email: 'Email is required' }));
      return;
    }

    setIsLoading(prev => ({ ...prev, login: true }));
    
    try {
      const response = await fetch(`${API_URL}/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send reset email');
      }

      setResetSent(true);
      toast.success('Password reset link sent to your email!');
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
    setResetSent(false);
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
          } rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50`}
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
          className="text-sm font-medium text-blue-600 hover:text-blue-500"
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
          } rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50`}
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
          className="flex-1 min-w-0 block w-full px-4 py-3 text-center text-lg border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
          placeholder="000000"
        />
        {!otpVerified && (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading.verify || otp.length !== 6}
            className={`ml-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
              isLoading.verify || otp.length !== 6 ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
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
        className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500 disabled:text-gray-400"
        disabled={isLoading.verify || isLoading.resend}
      >
        <FaArrowLeft className="mr-1" /> Back
      </button>
      <button
        type="button"
        onClick={handleResendOTP}
        disabled={countdown > 0 || isLoading.resend}
        className="text-sm font-medium text-blue-600 hover:text-blue-500 disabled:text-gray-400"
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
        loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
      } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
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
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">
            Or continue with
          </span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
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
      </div>
    </div>
  );

  // Main Render
  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Reset your password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {resetSent 
              ? 'Check your email for the reset link' 
              : 'We\'ll send you a link to reset your password'}
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            {resetSent ? (
              <div className="rounded-md bg-green-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-700">
                      Password reset link has been sent to {formData.email}. Please check your email.
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={toggleForgotPassword}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-blue-600 hover:text-blue-500"
                  >
                    Back to login
                  </button>
                </div>
              </div>
            ) : (
              <form className="space-y-6" onSubmit={handleForgotPassword}>
                {renderEmailField()}
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={toggleForgotPassword}
                    className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500"
                  >
                    <FaArrowLeft className="mr-1" /> Back to login
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading.login}
                    className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                      isLoading.login ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                  >
                    {isLoading.login ? 'Sending...' : 'Send reset link'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {step === 1 ? 'Sign in to your account' : 'Verify your email'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {step === 1 ? (
            <>
              Or{' '}
              <Link to="/signup" className="font-medium text-blue-600 hover:text-blue-500">
                create a new account
              </Link>
            </>
          ) : (
            `Enter the verification code sent to ${formData.email}`
          )}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {step === 1 ? (
            <>
              <form className="space-y-6" onSubmit={handleSubmit}>
                {renderEmailField()}
                {renderPasswordField()}
                {renderSubmitButton('Sign in with OTP', isLoading.login)}
              </form>
              {renderSocialLogin()}
            </>
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
    </div>
  );
};

export default Login;