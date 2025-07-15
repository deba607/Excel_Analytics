import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../store/auth';
import { toast } from 'react-hot-toast';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setToken, setUser, storeuserEmailLS, setuserEmail } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const email = searchParams.get('email');
    const name = searchParams.get('name');
    const error = searchParams.get('error');

    if (error) {
      toast.error('Google authentication failed. Please try again.');
      navigate('/login');
      return;
    }

    if (token && email) {
      try {
        // Store the token and user data
        localStorage.setItem('token', token);
        localStorage.setItem('userEmail', email);
        
        // Update auth context
        setToken(token);
        storeuserEmailLS(email);
        setuserEmail(email);
        setUser({ email, name: decodeURIComponent(name || ''), role: 'user' });
        
        toast.success('Successfully signed in with Google!');
        navigate('/dashboard', { replace: true });
      } catch (error) {
        console.error('Error processing Google OAuth callback:', error);
        toast.error('Error processing authentication. Please try again.');
        navigate('/login');
      }
    } else {
      toast.error('Invalid authentication response. Please try again.');
      navigate('/login');
    }
  }, [searchParams, navigate, setToken, setUser, storeuserEmailLS, setuserEmail]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">
            Processing authentication...
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Please wait while we complete your sign-in.
          </p>
        </div>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    </div>
  );
};

export default AuthCallback; 