import React, { useState, useEffect, useCallback } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  FiHome, FiUpload, FiDatabase, FiPieChart, FiBarChart2, 
  FiUsers, FiSettings, FiMenu, FiX, FiChevronDown,
  FiFileText, FiLogOut, FiArrowRight, FiUser
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../store/auth';
import { toast } from 'react-hot-toast';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 100
    }
  }
};

const submenuVariants = {
  hidden: { 
    opacity: 0,
    height: 0,
    transition: {
      duration: 0.2
    }
  },
  visible: {
    opacity: 1,
    height: 'auto',
    transition: {
      duration: 0.3,
      staggerChildren: 0.05
    }
  }
};

const submenuItemVariants = {
  hidden: { x: -10, opacity: 0 },
  visible: { 
    x: 0, 
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 300
    }
  }
};

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
      { name: 'From Files', path: '/dashboard/import/files' }
    ]
  },
  { 
    name: 'Analysis', 
    icon: <FiBarChart2 className="w-5 h-5" />,
    path: '/dashboard/analysis'
  },
  { 
    name: 'Reports', 
    icon: <FiFileText className="w-5 h-5" />,
    path: '/dashboard/reports'
  }
];

const Dashboard = () => {
  const { userEmail, isLoggedIn, LogoutUser } = useAuth();
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
    if (isLoggedIn === false) {
      navigate('/login', { 
        state: { from: location },
        replace: true 
      });
    }
  }, [isLoggedIn, navigate, location]);

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
    return null;
  }

  const filteredMenuItems = menuItems(isLoggedIn);

  return (
    <motion.div 
      className="flex h-screen bg-gray-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Mobile hamburger menu button */}
      {!sidebarOpen && (
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="fixed top-4 left-4 z-40 p-2 rounded-lg bg-white shadow lg:hidden"
          onClick={toggleSidebar}
          aria-label="Open sidebar"
        >
          <FiMenu className="w-6 h-6 text-gray-800" />
        </motion.button>
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
        <motion.div 
          className="flex items-center justify-between h-16 px-4 border-b border-gray-700"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Link to="/dashboard" className="text-xl font-bold">
            Excel Analytics
          </Link>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSidebarOpen(false)}
            className="p-1 rounded-lg hover:bg-gray-700 focus:outline-none"
            aria-label="Toggle sidebar"
          >
            <FiX className="w-6 h-6" />
          </motion.button>
        </motion.div>

        <motion.nav 
          className="flex-1 px-2 py-4 overflow-y-auto"
          onClick={() => setSidebarOpen(false)}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.ul className="space-y-1">
            {filteredMenuItems.map((item, index) => (
              <motion.li key={item.path} variants={itemVariants}>
                <div>
                  <motion.div
                    whileHover={{ x: 5 }}
                    whileTap={{ scale: 0.98 }}
                  >
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
                        <motion.span
                          animate={{ rotate: openSubmenu === index ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                          className="ml-auto"
                        >
                          <FiChevronDown />
                        </motion.span>
                      )}
                    </Link>
                  </motion.div>

                  {item.submenu && (
                    <AnimatePresence>
                      {openSubmenu === index && (
                        <motion.ul
                          variants={submenuVariants}
                          initial="hidden"
                          animate="visible"
                          exit="hidden"
                          className="overflow-hidden"
                        >
                          {item.submenu.map((subItem) => (
                            <motion.li
                              key={subItem.path}
                              variants={submenuItemVariants}
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
              </motion.li>
            ))}
          </motion.ul>
        </motion.nav>

        <motion.div 
          className="p-4 border-t border-gray-700"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <motion.button
            onClick={handleLogout}
            disabled={isLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white focus:outline-none disabled:opacity-50"
          >
            <FiLogOut className="w-5 h-5" />
            <span className="ml-3">Logout</span>
          </motion.button>
        </motion.div>
      </motion.aside>

      {/* Main Content */}
      <motion.div
        className={`flex flex-col flex-1 h-full transition-all duration-300 ${
          sidebarOpen ? 'md:ml-64' : 'md:ml-0'
        }`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <motion.header 
          className="sticky top-0 z-10 bg-white border-b border-gray-200"
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleSidebar}
                className="p-2 text-gray-500 rounded-lg hover:bg-gray-100 focus:outline-none"
                aria-label="Toggle sidebar"
              >
                <FiMenu className="w-6 h-6" />
              </motion.button>
              <motion.h1 
                className="ml-4 text-xl font-semibold text-gray-900"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                {getPageTitle()}
              </motion.h1>
            </div>

            <motion.div 
              className="flex items-center space-x-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <motion.div 
                className="relative"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <button
                  className="flex items-center justify-center w-8 h-8 text-sm font-medium text-white bg-blue-500 rounded-full focus:outline-none"
                  aria-label="User menu"
                >
                  {getUserInitials()}
                </button>
              </motion.div>
            </motion.div>
          </div>
        </motion.header>

        <motion.main 
          className="flex-1 p-4 sm:p-6 overflow-y-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="mb-6"
          >
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent inline-block">
              Excel Analytics Platform for Business
            </h1>
            <motion.span 
              className="ml-2 text-gray-500 text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              (User_Dashboard)
            </motion.span>
          </motion.div>
          
          <Outlet />
          
          {location.pathname === '/dashboard' && (
            <motion.div 
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <motion.div 
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                whileHover={{ y: -2, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  Welcome back, {userEmail || 'User'}!
                </h2>
                
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  <motion.div 
                    className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-100"
                    whileHover={{ y: -4, scale: 1.02 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">
                        Import Data
                      </h3>
                      <motion.div 
                        className="p-2 bg-blue-100 rounded-lg text-blue-600"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                      >
                        <FiUpload className="w-5 h-5" />
                      </motion.div>
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

                  <motion.div 
                    className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-100"
                    whileHover={{ y: -4, scale: 1.02 }}
                    transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">
                        Data Analysis
                      </h3>
                      <motion.div 
                        className="p-2 bg-green-100 rounded-lg text-green-600"
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <FiBarChart2 className="w-5 h-5" />
                      </motion.div>
                    </div>
                    <p className="text-gray-600 mb-4">
                      Analyze your data with powerful visualization tools
                    </p>
                    <Link
                      to="/dashboard/analysis"
                      className="inline-flex items-center text-green-600 hover:text-green-700 font-medium group"
                    >
                      Start Analyzing
                      <FiArrowRight className="ml-2 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </motion.div>

                  <motion.div 
                    className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-100"
                    whileHover={{ y: -4, scale: 1.02 }}
                    transition={{ type: 'spring', stiffness: 300, delay: 0.2 }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">
                        Generate Reports
                      </h3>
                      <motion.div 
                        className="p-2 bg-purple-100 rounded-lg text-purple-600"
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 3, repeat: Infinity }}
                      >
                        <FiFileText className="w-5 h-5" />
                      </motion.div>
                    </div>
                    <p className="text-gray-600 mb-4">
                      Create and export detailed reports from your data
                    </p>
                    <Link
                      to="/dashboard/reports"
                      className="inline-flex items-center text-purple-600 hover:text-purple-700 font-medium group"
                    >
                      View Reports
                      <FiArrowRight className="ml-2 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </motion.main>
      </motion.div>
    </motion.div>
  );
};

export default React.memo(Dashboard);
