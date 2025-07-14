import React from 'react';
import { motion } from 'framer-motion';
import { FaUsers, FaFileAlt, FaChartBar, FaCogs } from 'react-icons/fa';
import { useState } from 'react';
import axios from 'axios';

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
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);
    if (!form.name || !form.email || !form.password || !form.confirmPassword) {
      setError('All fields are required');
      setLoading(false);
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    try {
      const res = await axios.post('/api/auth/register-admin', form);
      setMessage('Admin added successfully!');
      setForm({ name: '', email: '', password: '', confirmPassword: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add admin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-white py-12 px-4 flex flex-col items-center">
      <button
        className="mb-6 px-6 py-2 bg-blue-700 text-white rounded-lg font-semibold shadow hover:bg-blue-800 transition"
        onClick={() => setShowModal(true)}
      >
        Add Admin
      </button>
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl"
              onClick={() => { setShowModal(false); setMessage(null); setError(null); }}
              aria-label="Close"
            >
              &times;
            </button>
            <h3 className="text-xl font-bold mb-4 text-blue-700">Add New Admin</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                name="name"
                placeholder="Name"
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-400"
                value={form.name}
                onChange={handleChange}
                required
              />
              <input
                type="email"
                name="email"
                placeholder="Email"
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-400"
                value={form.email}
                onChange={handleChange}
                required
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-400"
                value={form.password}
                onChange={handleChange}
                required
                minLength={8}
                maxLength={16}
              />
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password"
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-400"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                minLength={8}
                maxLength={16}
              />
              {error && <div className="text-red-600 text-sm">{error}</div>}
              {message && <div className="text-green-600 text-sm">{message}</div>}
              <button
                type="submit"
                className="w-full bg-blue-700 text-white py-2 rounded font-semibold hover:bg-blue-800 transition disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Adding...' : 'Add Admin'}
              </button>
            </form>
          </div>
        </div>
      )}
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