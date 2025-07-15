import React, { useEffect, useState } from 'react';
import { useAuth } from '../../store/auth';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import 'animate.css';
import { BACKEND_URL } from '../../store/backend.jsx';

const Home = () => {
  const { userEmail } = useAuth();
  const [stats, setStats] = useState({ files: 0, reports: 0 });
  const [loading, setLoading] = useState(true);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
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
    },
    hover: {
      scale: 1.02,
      transition: { duration: 0.3 }
    },
    tap: {
      scale: 0.98
    }
  };

  const statCountVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { type: 'spring', stiffness: 200 }
    }
  };

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const [filesRes, reportsRes] = await Promise.all([
          axios.get(`${BACKEND_URL}/api/v1/files/getfiles`, {
            headers: { Authorization: `Bearer ${token}` },
            params: { limit: 1 }
          }),
          axios.get(`${BACKEND_URL}/api/v1/analysis/history`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        ]);
        
        const filesCount = filesRes.data?.data?.total || filesRes.data?.data?.files?.length || 0;
        const reportsCount = reportsRes.data?.data?.length || 0;
        
        // Animate the stats counting up
        let files = 0;
        let reports = 0;
        const duration = 1000; // 1 second for counting animation
        const steps = 20;
        const filesStep = filesCount / steps;
        const reportsStep = reportsCount / steps;
        
        const counter = setInterval(() => {
          files = Math.min(files + filesStep, filesCount);
          reports = Math.min(reports + reportsStep, reportsCount);
          
          setStats({ 
            files: Math.round(files), 
            reports: Math.round(reports) 
          });
          
          if (files >= filesCount && reports >= reportsCount) {
            clearInterval(counter);
            setLoading(false);
          }
        }, duration / steps);
        
      } catch (err) {
        console.error('Error fetching stats:', err);
        setStats({ files: 0, reports: 0 });
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Welcome Banner */}
      <motion.div 
        className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white relative overflow-hidden"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Animated background elements */}
        <motion.div 
          className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        />
        <motion.div 
          className="absolute -bottom-10 -left-10 w-60 h-60 bg-white/5 rounded-full"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.05, 0.15, 0.05]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        />
        
        <div className="relative z-10">
          <motion.h1 
            className="text-2xl font-bold"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Welcome back!
          </motion.h1>
          <motion.p 
            className="mt-2 max-w-2xl text-blue-100"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Here are your current stats for Excel Analytics Platform.
          </motion.p>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Email Card */}
        <motion.div 
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col items-center relative overflow-hidden group"
          variants={itemVariants}
          whileHover="hover"
          whileTap="tap"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-blue-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative z-10 text-center">
            <div className="text-gray-500 mb-2">Your Email</div>
            <motion.div 
              className="text-lg font-bold text-gray-800 truncate max-w-full px-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              {userEmail}
            </motion.div>
          </div>
        </motion.div>

        {/* Files Uploaded Card */}
        <motion.div 
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col items-center relative overflow-hidden group"
          variants={itemVariants}
          whileHover="hover"
          whileTap="tap"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-blue-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative z-10 text-center">
            <div className="text-gray-500 mb-2">Files Uploaded</div>
            <AnimatePresence mode="wait">
              <motion.div
                key={loading ? 'loading' : 'loaded'}
                variants={statCountVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="text-3xl font-bold text-blue-600"
              >
                {loading ? (
                  <motion.span
                    className="inline-block"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    ...
                  </motion.span>
                ) : (
                  stats.files.toLocaleString()
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Reports Generated Card */}
        <motion.div 
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col items-center relative overflow-hidden group"
          variants={itemVariants}
          whileHover="hover"
          whileTap="tap"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-green-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative z-10 text-center">
            <div className="text-gray-500 mb-2">Reports Generated</div>
            <AnimatePresence mode="wait">
              <motion.div
                key={loading ? 'loading' : 'loaded'}
                variants={statCountVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="text-3xl font-bold text-green-600"
              >
                {loading ? (
                  <motion.span
                    className="inline-block"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                  >
                    ...
                  </motion.span>
                ) : (
                  stats.reports.toLocaleString()
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>

      {/* Additional Animated Elements */}
      <motion.div 
        className="mt-8 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <motion.p 
          className="text-gray-600"
          animate={{ 
            scale: [1, 1.02, 1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        >
          Start by uploading a new file or view your existing reports
        </motion.p>
        <motion.div 
          className="mt-4 flex justify-center space-x-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)' }}
            whileTap={{ scale: 0.98 }}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium"
          >
            Upload File
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)' }}
            whileTap={{ scale: 0.98 }}
            className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium"
          >
            View Reports
          </motion.button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default Home;