import React, { useState, useEffect, useCallback } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  FiHome, FiUpload, FiDatabase, FiPieChart, FiBarChart2, 
  FiUsers, FiSettings, FiMenu, FiX, FiChevronDown,
  FiFileText, FiLogOut, FiArrowRight, FiUser
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../store/auth';
import { toast } from 'react-hot-toast';

const menuItems = (isAdmin) => [
  { 
    name: 'Dashboard', 
    icon: <FiHome className="w-5 h-5" />, 
    path: '/dashboard' 
  },
  { 
    name: 'Data Import', 
    icon: <FiUpload className="w-5 h-5" />,
    path: '/dashboard/import',
    submenu: [
      { name: 'From Files', path: '/dashboard/import/files' },
      { name: 'From Database', path: '/dashboard/import/database' },
      { name: 'From Web/API', path: '/dashboard/import/web' },
      { name: 'From Cloud', path: '/dashboard/import/cloud' }
    ]
  },
  { 
    name: 'Analysis', 
    icon: <FiBarChart2 className="w-5 h-5" />,
    path: '/dashboard/analysis'
  },
  // Removed Visualization and Admin
  { 
    name: 'Reports', 
    icon: <FiFileText className="w-5 h-5" />,
    path: '/dashboard/reports'
  }
];

const Dashboard = () => {
  // Authentication
  const { userEmail, isLoggedIn, LogoutUser } = useAuth();
  // Sidebar is closed by default
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  



  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  const toggleSubmenu = useCallback((index) => {
    setOpenSubmenu(prev => prev === index ? null : index);
  }, []);

  const handleLogout = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      await LogoutUser();
      toast.success('Successfully logged out');
      navigate('/login', { replace: true });
    } catch (error) {
      toast.error('Failed to log out. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Only redirect if we're sure the user is not logged in
    if (isLoggedIn === false) {
      navigate('/login', { 
        state: { from: location },
        replace: true 
      });
    }
  }, [isLoggedIn, navigate, location]);

  // Always close sidebar on navigation (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const getUserInitials = useCallback(() => {
    if (!userEmail) return <FiUser className="w-4 h-4" />;
    const name = userEmail || '';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }, [userEmail]);

  const getPageTitle = useCallback(() => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Dashboard';
    const page = path.split('/').pop();
    return page.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }, [location.pathname]);

  if (!isLoggedIn) {
    return null; // or return a loading spinner
  }

  const filteredMenuItems = menuItems(isLoggedIn);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile hamburger menu button (top left) - only when sidebar is closed */}
      {!sidebarOpen && (
        <button
          className="fixed top-4 left-4 z-40 p-2 rounded-lg bg-white shadow lg:hidden"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open sidebar"
        >
          <FiMenu className="w-6 h-6 text-gray-800" />
        </button>
      )}
      {/* Mobile sidebar backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-20 bg-black lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -256 }}
        animate={{ x: sidebarOpen ? 0 : -256 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed z-30 flex flex-col h-full bg-gray-800 text-white w-64"
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-700">
          <Link to="/dashboard" className="text-xl font-bold">
            Excel Analytics
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1 rounded-lg hover:bg-gray-700 focus:outline-none"
            aria-label="Toggle sidebar"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 px-2 py-4 overflow-y-auto" onClick={() => setSidebarOpen(false)}>
          <ul className="space-y-1">
            {filteredMenuItems.map((item, index) => (
              <li key={item.path}>
                <div>
                  <Link
                    to={item.path}
                    onClick={() => {
                      setSidebarOpen(false);
                      if (item.submenu) {
                        toggleSubmenu(index);
                      }
                    }}
                    className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                      location.pathname.startsWith(item.path)
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    <span className="flex-shrink-0">{item.icon}</span>
                    <span className="ml-3">{item.name}</span>
                    {item.submenu && (
                      <FiChevronDown
                        className={`ml-auto transition-transform ${
                          openSubmenu === index ? 'transform rotate-180' : ''
                        }`}
                      />
                    )}
                  </Link>

                  {item.submenu && (
                    <AnimatePresence>
                      {openSubmenu === index && (
                        <motion.ul
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          {item.submenu.map((subItem) => (
                            <motion.li
                              key={subItem.path}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.1 }}
                            >
                              <Link
                                to={subItem.path}
                                className={`block py-2 pl-14 pr-4 text-sm rounded ${
                                  location.pathname === subItem.path
                                    ? 'bg-blue-700 text-white'
                                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                }`}
                              >
                                {subItem.name}
                              </Link>
                            </motion.li>
                          ))}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            disabled={isLoading}
            className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <FiLogOut className="w-5 h-5" />
            <span className="ml-3">Logout</span>
          </button>
        </div>
      </motion.aside>

      {/* Main content */}
      <div
        className={`flex flex-col flex-1 h-full transition-all duration-300 ${
          sidebarOpen ? 'md:ml-64' : 'md:ml-0'
        }`}
      >
        <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <button
                onClick={toggleSidebar}
                className="p-2 text-gray-500 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
                aria-label="Toggle sidebar"
              >
                <FiMenu className="w-6 h-6" />
              </button>
              <h1 className="ml-4 text-xl font-semibold text-gray-900">
                {getPageTitle()}
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <button
                className="p-2 text-gray-500 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
                aria-label="Settings"
              >
                <FiSettings className="w-5 h-5" />
              </button>
              <div className="relative">
                <button
                  className="flex items-center justify-center w-8 h-8 text-sm font-medium text-white bg-blue-500 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  aria-label="User menu"
                >
                  {getUserInitials()}
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          <div>Dashboard Layout - Outlet should render below:</div>
          <Outlet />
          
          {location.pathname === '/dashboard' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  Welcome back, {userEmail || 'User'}!
                </h2>
                
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  <motion.div 
                    className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-100"
                    whileHover={{ y: -4 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">
                        Import Data
                      </h3>
                      <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                        <FiUpload className="w-5 h-5" />
                      </div>
                    </div>
                    <p className="text-gray-600 mb-4">
                      Start by importing your Excel, CSV, or connect to a database
                    </p>
                    <Link
                      to="/dashboard/import"
                      className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium group"
                    >
                      Go to Import
                      <FiArrowRight className="ml-2 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </motion.div>

                  {/* Additional dashboard widgets can be added here */}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default React.memo(Dashboard);