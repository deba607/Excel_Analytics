import React from 'react';
import { motion } from 'framer-motion';
import { FaUsers, FaFileAlt, FaChartBar, FaCogs } from 'react-icons/fa';

const stats = [
  { label: 'Total Users', value: 128, icon: <FaUsers className="text-blue-500 w-6 h-6" /> },
  { label: 'Files Imported', value: 542, icon: <FaFileAlt className="text-purple-500 w-6 h-6" /> },
  { label: 'Active Sessions', value: 17, icon: <FaChartBar className="text-blue-400 w-6 h-6" /> },
  { label: 'System Health', value: 'Good', icon: <FaCogs className="text-purple-400 w-6 h-6" /> },
];

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, type: 'spring', stiffness: 80 }
  })
};

const AdminDashboard = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-white py-12 px-4 flex flex-col items-center">
      <motion.div
        className="w-full max-w-4xl bg-white rounded-2xl shadow-xl p-8 mb-8"
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 80 }}
      >
        <h2 className="text-3xl font-bold text-center text-blue-700 mb-2">Welcome, Admin!</h2>
        <p className="text-center text-gray-500 mb-6">Here you can manage users, view system stats, and monitor activity.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              className="flex flex-col items-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl shadow p-6"
              custom={i}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
            >
              <div className="mb-2">{stat.icon}</div>
              <div className="text-2xl font-bold text-blue-700">{stat.value}</div>
              <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>
      <motion.div
        className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-8"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: {
            transition: { staggerChildren: 0.2, delayChildren: 0.2 }
          }
        }}
      >
        <motion.div
          className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center hover:shadow-2xl transition-shadow duration-300"
          whileHover={{ scale: 1.03 }}
        >
          <FaUsers className="text-blue-500 w-8 h-8 mb-2" />
          <div className="font-semibold text-lg mb-1">User Management</div>
          <div className="text-gray-500 text-sm text-center">View, edit, or remove users. Manage admin privileges.</div>
        </motion.div>
        <motion.div
          className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center hover:shadow-2xl transition-shadow duration-300"
          whileHover={{ scale: 1.03 }}
        >
          <FaFileAlt className="text-purple-500 w-8 h-8 mb-2" />
          <div className="font-semibold text-lg mb-1">File Overview</div>
          <div className="text-gray-500 text-sm text-center">See all imported files, monitor uploads, and review data usage.</div>
        </motion.div>
        <motion.div
          className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center hover:shadow-2xl transition-shadow duration-300"
          whileHover={{ scale: 1.03 }}
        >
          <FaChartBar className="text-blue-400 w-8 h-8 mb-2" />
          <div className="font-semibold text-lg mb-1">System Logs</div>
          <div className="text-gray-500 text-sm text-center">Audit system activity, view logs, and monitor security events.</div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AdminDashboard; 