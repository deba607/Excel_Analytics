import React, { useEffect, useState } from 'react';
import { useAuth } from '../store/auth';
import axios from 'axios';

const Home = () => {
  const { userEmail } = useAuth();
  const [stats, setStats] = useState({ files: 0, reports: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const filesRes = await axios.get('http://localhost:8000/api/v1/files/getfiles', {
          headers: { Authorization: `Bearer ${token}` },
          params: { limit: 1 }
        });
        const filesCount = filesRes.data?.data?.total || filesRes.data?.data?.files?.length || 0;
        const reportsRes = await axios.get('http://localhost:8000/api/v1/analysis/history', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const reportsCount = reportsRes.data?.data?.length || 0;
        setStats({ files: filesCount, reports: reportsCount });
      } catch (err) {
        setStats({ files: 0, reports: 0 });
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold">Welcome back!</h1>
        <p className="mt-2 max-w-2xl text-blue-100">
          Here are your current stats for Excel Analytics Platform.
        </p>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col items-center">
            <div className="text-gray-500 mb-2">Your Email</div>
            <div className="text-lg font-bold text-gray-800">{userEmail}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col items-center">
            <div className="text-gray-500 mb-2">Files Uploaded</div>
            <div className="text-3xl font-bold text-blue-600">{loading ? '...' : stats.files}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col items-center">
            <div className="text-gray-500 mb-2">Reports Generated</div>
            <div className="text-3xl font-bold text-green-600">{loading ? '...' : stats.reports}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;