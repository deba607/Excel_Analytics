import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FaUsers, FaFileAlt, FaChartBar } from 'react-icons/fa';
import { FiDownload } from 'react-icons/fi';
import axios from 'axios';
import { useAuth } from '../../store/auth';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, type: 'spring', stiffness: 80 }
  })
};

const AdminDashboard = () => {
  const auth = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState(null);
  const [showAdminsModal, setShowAdminsModal] = useState(false);
  const [admins, setAdmins] = useState([]);
  const [adminsLoading, setAdminsLoading] = useState(false);
  const [adminsError, setAdminsError] = useState(null);
  const [showFilesModal, setShowFilesModal] = useState(false);
  const [files, setFiles] = useState([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [filesError, setFilesError] = useState(null);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState(null);
  const [downloadFormat, setDownloadFormat] = useState({});
  const [downloading, setDownloading] = useState({});
  const [filterUser, setFilterUser] = useState('');
  const [filterChartType, setFilterChartType] = useState('');
  const [filterXAxis, setFilterXAxis] = useState('');
  const [filterYAxis, setFilterYAxis] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterFilesUser, setFilterFilesUser] = useState('');

  // Helper function to format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  useEffect(() => {
    const fetchStats = async () => {
      setStatsLoading(true);
      try {
        const res = await axios.get('/api/adminLogin/stats');
        if (res.data.success && res.data.data) {
          const cards = [];
          if (typeof res.data.data.totalUsers === 'number') {
            cards.push({ label: 'Total Users', value: res.data.data.totalUsers, icon: <FaUsers className="text-blue-500 w-6 h-6" /> });
          }
          if (typeof res.data.data.totalFiles === 'number') {
            cards.push({ label: 'Files Imported', value: res.data.data.totalFiles, icon: <FaFileAlt className="text-purple-500 w-6 h-6" /> });
          }
          if (typeof res.data.data.totalAdmins === 'number') {
            cards.push({ label: 'Total Admins', value: res.data.data.totalAdmins, icon: <FaUsers className="text-green-500 w-6 h-6" /> });
          }
          if (typeof res.data.data.totalReports === 'number') {
            cards.push({ label: 'Total Reports', value: res.data.data.totalReports, icon: <FaChartBar className="text-orange-500 w-6 h-6" /> });
          }
          setStats(cards);
        } else {
          setStats([]);
        }
      } catch (err) {
        setStats([]);
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, []);

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

  // Handler for Total Users card click
  const handleTotalUsersClick = async () => {
    setShowUsersModal(true);
    setUsersLoading(true);
    setUsersError(null);
    try {
      const res = await axios.get('/api/adminLogin/users');
      if (res.data.success) {
        setUsers(res.data.users);
      } else {
        setUsersError('Failed to fetch users');
      }
    } catch (err) {
      setUsersError('Failed to fetch users');
    } finally {
      setUsersLoading(false);
    }
  };

  // Handler for Total Admins card click
  const handleTotalAdminsClick = async () => {
    setShowAdminsModal(true);
    setAdminsLoading(true);
    setAdminsError(null);
    try {
      const res = await axios.get('/api/adminLogin/admins');
      if (res.data.success) {
        setAdmins(res.data.admins);
      } else {
        setAdminsError('Failed to fetch admins');
      }
    } catch (err) {
      setAdminsError('Failed to fetch admins');
    } finally {
      setAdminsLoading(false);
    }
  };

  // Handler for Total Files card click
  const handleTotalFilesClick = async () => {
    setShowFilesModal(true);
    setFilesLoading(true);
    setFilesError(null);
    try {
      const res = await axios.get('/api/adminLogin/files');
      if (res.data.success) {
        setFiles(res.data.files);
      } else {
        setFilesError('Failed to fetch files');
      }
    } catch (err) {
      setFilesError('Failed to fetch files');
    } finally {
      setFilesLoading(false);
    }
  };

  // Handler for Total Reports card click
  const handleTotalReportsClick = async () => {
    setShowReportsModal(true);
    setReportsLoading(true);
    setReportsError(null);
    try {
      const res = await axios.get('/api/adminLogin/reports');
      if (res.data.success) {
        setReports(res.data.reports);
      } else {
        setReportsError('Failed to fetch reports');
      }
    } catch (err) {
      setReportsError('Failed to fetch reports');
    } finally {
      setReportsLoading(false);
    }
  };

  // Download handler for reports
  const handleDownload = async (report, format) => {
    setDownloading(prev => ({ ...prev, [report._id]: true }));
    try {
      const params = {
        fileId: report.fileId,
        chartType: report.chartType,
        xAxis: report.xAxis,
        yAxis: report.yAxis,
        format: format
      };
      const response = await axios.get('/api/v1/analysis/export', {
        params,
        responseType: 'blob',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const contentType = response.headers['content-type'];
      if (contentType && contentType.includes('application/json')) {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const errorData = JSON.parse(reader.result);
            toast.error(errorData.message || 'Failed to download file.');
          } catch {
            toast.error('Failed to download file.');
          }
        };
        reader.readAsText(response.data);
        return;
      }
      
      const ext = format;
      const filename = `chart_${report.chartType}_${report.xAxis}_${report.yAxis}_${new Date(report.createdAt).toISOString().split('T')[0]}.${ext}`;
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      if (error.response && error.response.data) {
        try {
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const errorData = JSON.parse(reader.result);
              toast.error(errorData.message || 'Failed to download file.');
            } catch {
              toast.error('Failed to download file.');
            }
          };
          reader.readAsText(error.response.data);
        } catch {
          toast.error('Failed to download file.');
        }
      } else {
        toast.error('Failed to download file.');
      }
    } finally {
      setDownloading(prev => ({ ...prev, [report._id]: false }));
    }
  };

  const userEmails = Array.from(new Set(reports.map(r => r.user?.email).filter(Boolean)));
  const chartTypes = Array.from(new Set(reports.map(r => r.chartType).filter(Boolean)));
  const xAxes = Array.from(new Set(reports.map(r => r.xAxis).filter(Boolean)));
  const yAxes = Array.from(new Set(reports.map(r => r.yAxis).filter(Boolean)));
  const dates = Array.from(new Set(reports.map(r => new Date(r.createdAt).toLocaleDateString()).filter(Boolean)));

  const filteredReports = reports.filter(r =>
    (!filterUser || r.user?.email === filterUser) &&
    (!filterChartType || r.chartType === filterChartType) &&
    (!filterXAxis || r.xAxis === filterXAxis) &&
    (!filterYAxis || r.yAxis === filterYAxis) &&
    (!filterDate || new Date(r.createdAt).toLocaleDateString() === filterDate)
  );

  const fileUserEmails = Array.from(new Set(files.map(f => f.user?.email).filter(Boolean)));
  const filteredFiles = files.filter(f => !filterFilesUser || f.user?.email === filterFilesUser);

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
      {/* Users Modal */}
      <AnimatePresence>
        {showUsersModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-3xl relative overflow-y-auto max-h-[80vh]"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 120 }}
            >
              <button
                className="absolute top-3 right-4 text-gray-400 hover:text-gray-700 text-2xl"
                onClick={() => setShowUsersModal(false)}
                aria-label="Close"
              >
                &times;
              </button>
              <h3 className="text-2xl font-bold mb-6 text-blue-700 text-center">All Users</h3>
              {usersLoading ? (
                <div className="text-center text-gray-500 py-8">Loading users...</div>
              ) : usersError ? (
                <div className="text-center text-red-500 py-8">{usersError}</div>
              ) : users.length === 0 ? (
                <div className="text-center text-gray-400 py-8">No users found.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {users.map((user, idx) => (
                    <motion.div
                      key={user._id}
                      className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl shadow p-6 flex flex-col items-center"
                      initial={{ opacity: 0, y: 40 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05, type: 'spring', stiffness: 80 }}
                    >
                      <FaUsers className="text-blue-500 w-8 h-8 mb-2" />
                      <div className="font-semibold text-lg text-blue-700 mb-1">{user.name}</div>
                      <div className="text-gray-600 text-sm mb-1">{user.email}</div>
                      <div className="text-xs text-gray-400">ID: {user._id}</div>
                      {user.isAdmin && <div className="mt-2 px-2 py-1 bg-blue-200 text-blue-800 rounded text-xs font-semibold">Admin</div>}
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Admins Modal */}
      <AnimatePresence>
        {showAdminsModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-3xl relative overflow-y-auto max-h-[80vh]"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 120 }}
            >
              <button
                className="absolute top-3 right-4 text-gray-400 hover:text-gray-700 text-2xl"
                onClick={() => setShowAdminsModal(false)}
                aria-label="Close"
              >
                &times;
              </button>
              <h3 className="text-2xl font-bold mb-6 text-blue-700 text-center">All Admins</h3>
              {adminsLoading ? (
                <div className="text-center text-gray-500 py-8">Loading admins...</div>
              ) : adminsError ? (
                <div className="text-center text-red-500 py-8">{adminsError}</div>
              ) : admins.length === 0 ? (
                <div className="text-center text-gray-400 py-8">No admins found.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {admins.map((admin, idx) => (
                    <motion.div
                      key={admin._id}
                      className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl shadow p-6 flex flex-col items-center"
                      initial={{ opacity: 0, y: 40 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05, type: 'spring', stiffness: 80 }}
                    >
                      <FaUsers className="text-green-500 w-8 h-8 mb-2" />
                      <div className="font-semibold text-lg text-green-700 mb-1">{admin.name}</div>
                      <div className="text-gray-600 text-sm mb-1">{admin.email}</div>
                      <div className="text-xs text-gray-400">ID: {admin._id}</div>
                      <div className="mt-2 px-2 py-1 bg-green-200 text-green-800 rounded text-xs font-semibold">Admin</div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Files Modal */}
      <AnimatePresence>
        {showFilesModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-6xl relative overflow-y-auto max-h-[90vh]"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 120 }}
            >
              <button
                className="absolute top-3 right-4 text-gray-400 hover:text-gray-700 text-2xl"
                onClick={() => setShowFilesModal(false)}
                aria-label="Close"
              >
                &times;
              </button>
              <h3 className="text-2xl font-bold mb-6 text-blue-700 text-center">All Files</h3>
              {filesLoading ? (
                <div className="text-center text-gray-500 py-8">Loading files...</div>
              ) : filesError ? (
                <div className="text-center text-red-500 py-8">{filesError}</div>
              ) : files.length === 0 ? (
                <div className="text-center text-gray-400 py-8">No files found.</div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {files.length > 0 && (
                    <div className="flex flex-wrap gap-4 mb-6">
                      <select value={filterFilesUser} onChange={e => setFilterFilesUser(e.target.value)} className="border rounded px-2 py-1">
                        <option value="">All Users</option>
                        {fileUserEmails.map(email => <option key={email} value={email}>{email}</option>)}
                      </select>
                    </div>
                  )}
                  {filteredFiles.map((file, idx) => (
                    <motion.div
                      key={file._id}
                      className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl shadow p-6"
                      initial={{ opacity: 0, y: 40 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05, type: 'spring', stiffness: 80 }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <FaFileAlt className="text-purple-500 w-8 h-8" />
                        <div className="text-xs text-gray-400">ID: {file._id}</div>
                      </div>
                      
                      <div className="space-y-2">
                        <div>
                          <div className="font-semibold text-lg text-purple-700 mb-1">{file.originalName}</div>
                          <div className="text-gray-600 text-sm">Filename: {file.filename}</div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">Size:</span>
                            <div className="text-gray-600">{formatFileSize(file.size)}</div>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Status:</span>
                            <div className={`text-sm px-2 py-1 rounded-full inline-block ${
                              file.status === 'completed' ? 'bg-green-100 text-green-800' :
                              file.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                              file.status === 'failed' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {file.status}
                            </div>
                          </div>
                        </div>
                        
                        <div className="border-t pt-3">
                          <div className="font-medium text-gray-700 mb-1">Uploaded by:</div>
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-purple-200 rounded-full flex items-center justify-center">
                              <span className="text-purple-700 font-semibold text-sm">
                                {file.user?.name?.charAt(0) || 'U'}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{file.user?.name || 'Unknown User'}</div>
                              <div className="text-sm text-gray-500">{file.user?.email || file.userEmail}</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-xs text-gray-400">
                          Uploaded: {new Date(file.createdAt).toLocaleDateString()} at {new Date(file.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Reports Modal */}
      <AnimatePresence>
        {showReportsModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-4xl relative overflow-y-auto max-h-[90vh]"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 120 }}
            >
              <button
                className="absolute top-3 right-4 text-gray-400 hover:text-gray-700 text-2xl"
                onClick={() => setShowReportsModal(false)}
                aria-label="Close"
              >
                &times;
              </button>
              <h3 className="text-2xl font-bold mb-6 text-blue-700 text-center">All Reports</h3>
              {reportsLoading ? (
                <div className="text-center text-gray-500 py-8">Loading reports...</div>
              ) : reportsError ? (
                <div className="text-center text-red-500 py-8">{reportsError}</div>
              ) : reports.length === 0 ? (
                <div className="text-center text-gray-400 py-8">No reports found.</div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {reports.length > 0 && (
                    <div className="flex flex-wrap gap-4 mb-6">
                      <select value={filterUser} onChange={e => setFilterUser(e.target.value)} className="border rounded px-2 py-1">
                        <option value="">All Users</option>
                        {userEmails.map(email => <option key={email} value={email}>{email}</option>)}
                      </select>
                      <select value={filterChartType} onChange={e => setFilterChartType(e.target.value)} className="border rounded px-2 py-1">
                        <option value="">All Chart Types</option>
                        {chartTypes.map(type => <option key={type} value={type}>{type}</option>)}
                      </select>
                      <select value={filterXAxis} onChange={e => setFilterXAxis(e.target.value)} className="border rounded px-2 py-1">
                        <option value="">All X-Axis</option>
                        {xAxes.map(x => <option key={x} value={x}>{x}</option>)}
                      </select>
                      <select value={filterYAxis} onChange={e => setFilterYAxis(e.target.value)} className="border rounded px-2 py-1">
                        <option value="">All Y-Axis</option>
                        {yAxes.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                      <select value={filterDate} onChange={e => setFilterDate(e.target.value)} className="border rounded px-2 py-1">
                        <option value="">All Dates</option>
                        {dates.map(date => <option key={date} value={date}>{date}</option>)}
                      </select>
                    </div>
                  )}
                  {filteredReports.map((report, idx) => (
                    <motion.div
                      key={report._id}
                      className="bg-gradient-to-br from-orange-50 to-blue-50 rounded-xl shadow p-6"
                      initial={{ opacity: 0, y: 40 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05, type: 'spring', stiffness: 80 }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <FaChartBar className="text-orange-500 w-8 h-8" />
                        <div className="text-xs text-gray-400">ID: {report._id}</div>
                      </div>
                      
                      <div className="space-y-2">
                        <div>
                          <div className="font-semibold text-lg text-orange-700 mb-1">Report for File: {report.fileId}</div>
                          <div className="text-gray-600 text-sm">Chart Type: {report.chartType}</div>
                          <div className="text-gray-600 text-sm">X-Axis: {report.xAxis}</div>
                          <div className="text-gray-600 text-sm">Y-Axis: {report.yAxis}</div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">Status:</span>
                            <div className={`text-sm px-2 py-1 rounded-full inline-block ${
                              report.status === 'completed' ? 'bg-green-100 text-green-800' :
                              report.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                              report.status === 'failed' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {report.status}
                            </div>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Created:</span>
                            <div className="text-gray-600">{new Date(report.createdAt).toLocaleDateString()} at {new Date(report.createdAt).toLocaleTimeString()}</div>
                          </div>
                        </div>
                        
                        <div className="border-t pt-3">
                          <div className="font-medium text-gray-700 mb-1">Download Options:</div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => handleDownload(report, 'png')}
                              className={`px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-semibold hover:bg-blue-700 transition ${
                                downloading[report._id] ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                              disabled={downloading[report._id]}
                            >
                              {downloading[report._id] ? 'Downloading...' : 'PNG'}
                            </button>
                            <button
                              onClick={() => handleDownload(report, 'pdf')}
                              className={`px-3 py-1 bg-red-600 text-white rounded-full text-sm font-semibold hover:bg-red-700 transition ${
                                downloading[report._id] ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                              disabled={downloading[report._id]}
                            >
                              {downloading[report._id] ? 'Downloading...' : 'PDF'}
                            </button>
                            <button
                              onClick={() => handleDownload(report, 'svg')}
                              className={`px-3 py-1 bg-green-600 text-white rounded-full text-sm font-semibold hover:bg-green-700 transition ${
                                downloading[report._id] ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                              disabled={downloading[report._id]}
                            >
                              {downloading[report._id] ? 'Downloading...' : 'SVG'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div
        className="w-full max-w-4xl bg-white rounded-2xl shadow-xl p-8 mb-8"
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 80 }}
      >
        <h2 className="text-3xl font-bold text-center text-blue-700 mb-2">Welcome, Admin!</h2>
        <p className="text-center text-gray-500 mb-6">Here you can manage users, view system stats, and monitor activity.</p>
        {statsLoading ? (
          <div className="text-center text-gray-400 py-8">Loading stats...</div>
        ) : stats.length === 0 ? (
          <div className="text-center text-gray-400 py-8">No stats available.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                className="flex flex-col items-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl shadow p-6 cursor-pointer hover:shadow-2xl transition-shadow duration-300"
                custom={i}
                initial="hidden"
                animate="visible"
                variants={cardVariants}
                onClick={stat.label === 'Total Users' ? handleTotalUsersClick : stat.label === 'Total Admins' ? handleTotalAdminsClick : stat.label === 'Files Imported' ? handleTotalFilesClick : stat.label === 'Total Reports' ? handleTotalReportsClick : undefined}
              >
                <div className="mb-2">{stat.icon}</div>
                <div className="text-2xl font-bold text-blue-700">{stat.value}</div>
                <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        )}
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
      </motion.div>
    </div>
  );
};

export default AdminDashboard; 