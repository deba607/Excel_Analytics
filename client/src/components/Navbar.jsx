import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  // Add scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { name: 'Features', path: '/' },
    { name: 'Pricing', path: '/' },
    { name: 'Contact', path: '/' },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  const item = {
    hidden: { y: -20, opacity: 0 },
    show: { 
      y: 0, 
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100
      }
    }
  };

  const mobileMenu = {
    open: { 
      opacity: 1,
      height: 'auto',
      transition: { 
        duration: 0.3,
        ease: [0.04, 0.62, 0.23, 0.98]
      }
    },
    closed: { 
      opacity: 0,
      height: 0,
      transition: { 
        duration: 0.2,
        ease: [0.04, 0.62, 0.23, 0.98]
      }
    }
  };

  return (
    <motion.nav 
      className={`fixed w-full z-50 transition-all duration-300 ${
        scrolled ? 'bg-white shadow-md py-2' : 'bg-white/90 backdrop-blur-sm py-3'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
    >
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <motion.div 
            className="flex-shrink-0"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link to="/" className="text-2xl font-bold text-blue-600 hover:text-blue-700 transition-colors">
              Excel Analytics
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <motion.div 
            className="hidden md:flex items-center space-x-8"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {navItems.map((navItem) => (
              <motion.div key={navItem.path} variants={item}>
                <Link 
                  to={navItem.path} 
                  className={`relative px-2 py-1 text-gray-700 hover:text-blue-600 transition-colors ${
                    location.pathname === navItem.path ? 'font-medium text-blue-600' : 'font-normal'
                  }`}
                >
                  {navItem.name}
                  {location.pathname === navItem.path && (
                    <motion.span 
                      layoutId="nav-underline"
                      className="absolute left-0 -bottom-1 w-full h-0.5 bg-blue-600"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                </Link>
              </motion.div>
            ))}
            <motion.div variants={item}>
              <Link to="/signup">
                <motion.button 
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
                >
                  Start Free Trial
                </motion.button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Mobile menu button */}
          <motion.div 
            className="md:hidden"
            whileTap={{ scale: 0.95 }}
          >
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-gray-700 hover:text-blue-600 transition-colors"
              aria-label="Toggle menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </motion.div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="md:hidden bg-white shadow-lg"
            initial="closed"
            animate="open"
            exit="closed"
            variants={mobileMenu}
          >
            <motion.div 
              className="px-4 pt-2 pb-4 space-y-2"
              variants={{
                open: {
                  transition: { staggerChildren: 0.07, delayChildren: 0.2 }
                },
                closed: {
                  transition: { staggerChildren: 0.05, staggerDirection: -1 }
                }
              }}
            >
              {navItems.map((navItem, index) => (
                <motion.div
                  key={navItem.path}
                  variants={{
                    open: {
                      y: 0,
                      opacity: 1,
                      transition: {
                        y: { stiffness: 1000, velocity: -100 }
                      }
                    },
                    closed: {
                      y: 20,
                      opacity: 0,
                      transition: {
                        y: { stiffness: 1000 }
                      }
                    }
                  }}
                >
                  <Link
                    to={navItem.path}
                    className={`block px-3 py-3 rounded-md text-base font-medium ${
                      location.pathname === navItem.path 
                        ? 'bg-blue-50 text-blue-600' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {navItem.name}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                variants={{
                  open: {
                    y: 0,
                    opacity: 1,
                    transition: {
                      y: { stiffness: 1000, velocity: -100 }
                    }
                  },
                  closed: {
                    y: 20,
                    opacity: 0,
                    transition: {
                      y: { stiffness: 1000 }
                    }
                  }
                }}
                className="pt-2"
              >
                <Link to="/signup">
                  <motion.button 
                    whileTap={{ scale: 0.98 }}
                    className="w-full block text-center bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Start Free Trial
                  </motion.button>
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;