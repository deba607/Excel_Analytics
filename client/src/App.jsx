import React, { useMemo } from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Navigate, 
  Outlet, 
  useLocation 
} from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './store/auth';

// Auth Debug Component
const AuthDebug = () => {
  const auth = useAuth();
  
  const setTestAuth = () => {
    auth.setTestAuth('test@example.com');
  };
  
  const clearAuth = () => {
    auth.LogoutUser();
  };
  
  return (
    <div className="mt-4 p-4 bg-gray-100 rounded">
      <h2 className="font-bold">Authentication Debug Info:</h2>
      <pre className="mt-2 text-sm">
        {JSON.stringify({
          isLoggedIn: auth.isLoggedIn,
          userEmail: auth.userEmail,
          token: auth.token ? 'Present' : 'Missing',
          localStorage: {
            token: localStorage.getItem('token'),
            userEmail: localStorage.getItem('userEmail')
          }
        }, null, 2)}
      </pre>
      <div className="mt-4 space-x-2">
        <button 
          onClick={setTestAuth}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Set Test Auth
        </button>
        <button 
          onClick={clearAuth}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Clear Auth
        </button>
      </div>
    </div>
  );
};

// Layout Components
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';

// Public Pages
import Hero from './components/Hero';
import Features from './components/Features';
import Pricing from './components/Pricing';
import Contact from './components/Contact';
import Signup from './pages/Signup';
import Login from './pages/Login';

// Protected Pages
import Home from './pages/Home';
import Import from './pages/after_login_pages/Import';
import Analysis from './pages/after_login_pages/Analysis';

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole = 'user' }) => {
  const { isLoggedIn, user } = useAuth();
  const location = useLocation();

  return useMemo(() => {
    // If authentication state is still loading, show nothing or a loading spinner
    if (isLoggedIn === undefined) {
      return <div className="flex items-center justify-center h-screen">Loading...</div>;
    }

    if (!isLoggedIn) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Optional: Add role-based access control
    if (requiredRole === 'admin' && (!user || user.role !== 'admin')) {
      return <Navigate to="/unauthorized" replace />;
    }

    return children || <Outlet />;
  }, [isLoggedIn, user, requiredRole, location, children]);
};

// Public Route Component (Redirects to dashboard if already authenticated)
const PublicRoute = () => {
  const { isLoggedIn } = useAuth();
  const location = useLocation();

  return useMemo(() => {
    if (isLoggedIn) {
      const from = location.state?.from?.pathname || '/dashboard';
      return <Navigate to={from} replace />;
    }
    return <Outlet />;
  }, [isLoggedIn, location]);
};

// Layout Components
const PublicLayout = () => (
  <>
    <Navbar />
    <main>
      <Outlet />
    </main>
  </>
);

const DashboardLayout = () => (
  <Dashboard />
);

// Main App Component
function App() {
  return (
    <Router>
      <div className="min-h-screen bg-white">
        <Toaster 
          position="top-right" 
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }} 
        />
        
        <Routes>
          {/* Test Route */}
          <Route path="/test" element={<div>Test route working!</div>} />
          <Route path="/auth-test" element={
            <div className="p-8">
              <h1>Auth Test Page</h1>
              <p>This page shows the current authentication state</p>
              <AuthDebug />
            </div>
          } />

          {/* Public Routes */}
          <Route element={<PublicRoute />}>
            <Route element={<PublicLayout />}>
              <Route 
                path="/" 
                element={
                  <>
                    <Hero />
                    <Features />
                    <Pricing />
                    <Contact />
                  </>
                } 
              />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
            </Route>
          </Route>

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<Home />} />
              <Route path="/dashboard/import" element={<Import />} />
              <Route path="/dashboard/import/files" element={<Import tab="files" />} />
              <Route path="/dashboard/import/database" element={<Import tab="database" />} />
              <Route path="/dashboard/import/web" element={<Import tab="web" />} />
              <Route path="/dashboard/import/cloud" element={<Import tab="cloud" />} />
              <Route path="/dashboard/analysis" element={<Analysis />} />
              <Route path="/dashboard/formulas" element={<div>Formulas</div>} />
              <Route path="/dashboard/visualization" element={<div>Visualization</div>} />
              <Route path="/dashboard/powerpivot" element={<div>Power Pivot</div>} />
              <Route path="/dashboard/automation" element={<div>Automation</div>} />
              <Route path="/dashboard/collaboration" element={<div>Collaboration</div>} />
              <Route path="/dashboard/reports" element={<div>Reports</div>} />
              <Route path="/dashboard/settings" element={<div>Settings</div>} />
            </Route>
          </Route>

          {/* Admin Routes (Example) */}
          <Route element={<ProtectedRoute requiredRole="admin" />}>
            <Route path="/admin" element={<div>Admin Dashboard</div>} />
          </Route>

          {/* Error Routes */}
          <Route path="/unauthorized" element={<div>Unauthorized Access</div>} />
          <Route path="/404" element={<div>Page Not Found</div>} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;