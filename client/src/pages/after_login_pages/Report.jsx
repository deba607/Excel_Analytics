import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../store/auth';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { FiDownload } from 'react-icons/fi';
import { BACKEND_URL } from '../../store/backend.jsx';

const Report = () => {
  const { userEmail, token } = useAuth();
  const [userFiles, setUserFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState('');
  const [reports, setReports] = useState([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
  const [chartTypeFilter, setChartTypeFilter] = useState('');
  const [xAxisFilter, setXAxisFilter] = useState('');
  const [yAxisFilter, setYAxisFilter] = useState('');
  const [downloadFormat, setDownloadFormat] = useState({}); // { [reportId]: format }
  const [downloading, setDownloading] = useState({}); // { [reportId]: boolean }

  console.log('[Report] Component rendered with userEmail:', userEmail);

  // API instance with auth
  const API = axios.create({
    baseURL: `${BACKEND_URL}/api`,
    headers: { 'Content-Type': 'application/json' }
  });
  API.interceptors.request.use((config) => {
    const currentToken = localStorage.getItem('token') || token;
    if (currentToken && currentToken !== 'null' && currentToken !== 'undefined') {
      config.headers.Authorization = `Bearer ${currentToken}`;
    }
    return config;
  });

  // Fetch user files for dropdown
  const fetchUserFiles = useCallback(async () => {
    setIsLoadingFiles(true);
    try {
      console.log('[Report] Fetching user files');
      const response = await API.get('/v1/files/getfiles', { params: { limit: 100 } });
      console.log('[Report] Files response:', response.data);
      if (response.data.success) {
        setUserFiles(response.data.data.files || []);
      } else {
        toast.error('Failed to load files');
      }
    } catch (error) {
      console.error('[Report] Error fetching files:', error);
      toast.error('Failed to load files');
    } finally {
      setIsLoadingFiles(false);
      setHasAttemptedFetch(true);
    }
  }, [API]);

  // Fetch reports for selected file
  const fetchReports = useCallback(async (fileId) => {
    setIsLoadingReports(true);
    try {
      console.log('[Report] Fetching reports for fileId:', fileId);
      const response = await API.get('/v1/analysis/history', { params: { fileId } });
      console.log('[Report] Response:', response.data);
      if (response.data.success) {
        setReports(response.data.data || []);
      } else {
        setReports([]);
        toast.error('Failed to load reports');
      }
    } catch (error) {
      console.error('[Report] Error fetching reports:', error);
      setReports([]);
      toast.error('Failed to load reports');
    } finally {
      setIsLoadingReports(false);
    }
  }, [API]);

  // Handle file selection
  const handleFileSelect = (fileId) => {
    setSelectedFile(fileId);
    if (fileId) {
      fetchReports(fileId);
    } else {
      setReports([]);
    }
  };

  // Download handler
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
      const response = await axios.get(`${BACKEND_URL}/api/v1/analysis/export`, {
        params,
        responseType: 'blob',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      // Check if the response is a JSON error (not a file)
      const contentType = response.headers['content-type'];
      if (contentType && contentType.includes('application/json')) {
        // Read the blob as text and parse the error
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
      // Otherwise, proceed with download
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
      // Try to show backend error message if available
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

  // Unique dropdown options from reports
  const chartTypeOptions = useMemo(() => {
    const types = Array.from(new Set(reports.map(r => r.chartType).filter(Boolean)));
    return types;
  }, [reports]);
  const xAxisOptions = useMemo(() => {
    const xVals = Array.from(new Set(reports.map(r => r.xAxis).filter(Boolean)));
    return xVals;
  }, [reports]);
  const yAxisOptions = useMemo(() => {
    const yVals = Array.from(new Set(reports.map(r => r.yAxis).filter(Boolean)));
    return yVals;
  }, [reports]);

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter(r =>
      (!chartTypeFilter || r.chartType === chartTypeFilter) &&
      (!xAxisFilter || r.xAxis === xAxisFilter) &&
      (!yAxisFilter || r.yAxis === yAxisFilter)
    );
  }, [reports, chartTypeFilter, xAxisFilter, yAxisFilter]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">Reports</h1>
        <div className="mb-4 p-4 bg-blue-100 text-blue-800 rounded">
          <strong>Test:</strong> Report component is loading! User: {userEmail}
        </div>
        
        {/* Files Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <label className="block text-gray-700 font-medium">Select File</label>
            <button
              onClick={fetchUserFiles}
              disabled={isLoadingFiles}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoadingFiles ? 'Loading...' : 'Fetch Files'}
            </button>
          </div>
          
          {hasAttemptedFetch && !isLoadingFiles && userFiles.length === 0 && (
            <div className="p-4 bg-yellow-100 text-yellow-800 rounded border border-yellow-200">
              <p className="font-medium">No files available</p>
              <p className="text-sm mt-1">Upload some files first, then click "Fetch Files" to load them.</p>
            </div>
          )}
          
          {userFiles.length > 0 && (
            <select
              value={selectedFile}
              onChange={e => handleFileSelect(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Select a file</option>
              {userFiles.map(file => (
                <option key={file._id} value={file._id}>{file.originalName}</option>
              ))}
            </select>
          )}
        </div>

        {/* Reports Section */}
        {selectedFile && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Reports for Selected File</h2>
              <button
                onClick={() => fetchReports(selectedFile)}
                disabled={isLoadingReports}
                className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoadingReports ? 'Loading...' : 'Refresh Reports'}
              </button>
            </div>
            {/* Dropdown Filters */}
            <div className="flex flex-wrap gap-4 mb-4 items-center">
              <label className="text-xs text-gray-500">Chart Type</label>
              <select
                value={chartTypeFilter}
                onChange={e => setChartTypeFilter(e.target.value)}
                className="border rounded px-2 py-1 min-w-[140px]"
              >
                <option value="">All</option>
                {chartTypeOptions.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <label className="text-xs text-gray-500 ml-4">X-Axis</label>
              <select
                value={xAxisFilter}
                onChange={e => setXAxisFilter(e.target.value)}
                className="border rounded px-2 py-1 min-w-[100px]"
              >
                <option value="">All</option>
                {xAxisOptions.map(x => (
                  <option key={x} value={x}>{x}</option>
                ))}
              </select>
              <label className="text-xs text-gray-500 ml-4">Y-Axis</label>
              <select
                value={yAxisFilter}
                onChange={e => setYAxisFilter(e.target.value)}
                className="border rounded px-2 py-1 min-w-[100px]"
              >
                <option value="">All</option>
                {yAxisOptions.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            {/* Table */}
            {isLoadingReports ? (
              <div className="text-center text-gray-500 py-8">Loading reports...</div>
            ) : filteredReports.length === 0 ? (
              <div className="text-center text-red-500 py-8">
                <p className="font-medium">No reports available for this file</p>
                <p className="text-sm mt-1">Generate a chart first in the Analysis page, then check back here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Chart Type</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">X Axis</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Y Axis</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Created At</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Download</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredReports.map((report) => (
                      <tr key={report._id}>
                        <td className="px-4 py-2">{report.chartType}</td>
                        <td className="px-4 py-2">{report.xAxis}</td>
                        <td className="px-4 py-2">{report.yAxis}</td>
                        <td className="px-4 py-2">{new Date(report.createdAt).toLocaleString()}</td>
                        <td className="px-4 py-2">
                          {report.reportGridFsId ? (
                            <div className="flex items-center gap-2">
                              <select
                                value={downloadFormat[report._id] || 'png'}
                                onChange={e => setDownloadFormat(prev => ({ ...prev, [report._id]: e.target.value }))}
                                className="border rounded px-1 py-0.5 text-xs"
                              >
                                <option value="pdf">PDF</option>
                                <option value="png">PNG</option>
                                <option value="jpg">JPG</option>
                              </select>
                              <button
                                onClick={() => handleDownload(report, downloadFormat[report._id] || 'png')}
                                disabled={downloading[report._id]}
                                className="flex items-center gap-1 px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 disabled:opacity-50"
                              >
                                <FiDownload className="w-4 h-4" />
                                {downloading[report._id] ? 'Downloading...' : 'Download'}
                              </button>
                            </div>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Initial State */}
        {!hasAttemptedFetch && (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="mb-4">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Files Loaded</h3>
              <p className="text-gray-500 mb-4">Click "Fetch Files" to load your uploaded files and view reports.</p>
              <button
                onClick={fetchUserFiles}
                disabled={isLoadingFiles}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoadingFiles ? 'Loading...' : 'Fetch Files'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Report;
