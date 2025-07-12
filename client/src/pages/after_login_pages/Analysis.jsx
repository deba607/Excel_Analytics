import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBarChart2, FiPieChart, FiTrendingUp, FiDownload, FiRefreshCw, FiFile, FiSearch, FiChevronLeft, FiChevronRight, FiUpload, FiCheckCircle } from 'react-icons/fi';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { useAuth } from '../../store/auth';

// Register Chart.js components
Chart.register(...registerables);

const Analysis = () => {
  const { userEmail, token } = useAuth();

  const API = axios.create({
    baseURL: 'http://localhost:8000/api',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // Add request interceptor to include token
  API.interceptors.request.use((config) => {
    const currentToken = localStorage.getItem('token') || token;
    if (currentToken && currentToken !== 'null' && currentToken !== 'undefined') {
      config.headers.Authorization = `Bearer ${currentToken}`;
      console.log('Sending request with token:', currentToken.substring(0, 20) + '...');
    } else {
      console.log('No valid token found');
    }
    return config;
  });

  // Add response interceptor for error handling
  API.interceptors.response.use(
    (response) => response,
    (error) => {
      console.error('API Error:', error);
      if (error.response?.status === 401) {
        toast.error('Authentication required. Please log in again.');
        // Redirect to login
        window.location.href = '/login';
      } else if (error.response?.status === 404) {
        toast.error('Resource not found');
      } else {
        toast.error(error.response?.data?.message || 'An error occurred');
      }
      return Promise.reject(error);
    }
  );

  // State management
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFetchingAnalysis, setIsFetchingAnalysis] = useState(false);
  const [analysisSource, setAnalysisSource] = useState(null); // 'fetched' or 'generated'
  const [userFiles, setUserFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState('');
  const [analysisData, setAnalysisData] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [stats, setStats] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    hasNextPage: false,
    hasPreviousPage: false
  });
  const [filters, setFilters] = useState({
    fileType: '',
    sortBy: '-uploadedAt'
  });

  // Fetch user's files with pagination and search
  const fetchUserFiles = useCallback(async (page = 1, search = '') => {
    try {
      setIsLoadingFiles(true);
      const params = {
        page,
        limit: 10,
        ...(search && { search }),
        ...(filters.fileType && { type: filters.fileType }),
        sortBy: filters.sortBy
      };

      console.log('Fetching files with params:', params);
      const response = await API.get('/files/getfiles', { params });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch files');
      }

      const { data: files, ...paginationData } = response.data;
      setUserFiles(files || []);
      setPagination({
        currentPage: paginationData.currentPage || 1,
        totalPages: paginationData.totalPages || 1,
        total: paginationData.total || 0,
        hasNextPage: paginationData.hasNextPage || false,
        hasPreviousPage: paginationData.hasPreviousPage || false
      });
      
      // Auto-select first file if none selected and files are available
      if (files && files.length > 0 && !selectedFile) {
        setSelectedFile(files[0]._id);
      }
      
      return { files, pagination: paginationData };
    } catch (error) {
      console.error('Fetch files error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url
      });
      toast.error('Failed to load files');
      setUserFiles([]);
      throw error;
    } finally {
      setIsLoadingFiles(false);
    }
  }, [filters.fileType, filters.sortBy, selectedFile]);

  // Fetch analysis data
  const fetchAnalysisData = useCallback(async () => {
    if (!selectedFile) {
      return;
    }

    try {
      setIsLoading(true);
      
      const params = {
        fileId: selectedFile,
        type: activeTab,
        generateNew: true // Flag to generate new analysis
      };
      
      console.log('Fetching analysis with params:', params);
      const response = await API.get('/v1/analysis', { params });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to generate analysis');
      }
      
      const data = response.data.data;
      
      if (data === null) {
        // No data found
        setAnalysisData(null);
        setChartData(null);
        setTableData([]);
        setStats([]);
        setAnalysisSource(null);
        toast.info('No data found for this analysis');
      } else {
        setAnalysisData(data);
        updateUI(data);
        setAnalysisSource('generated');
        toast.success('Analysis completed successfully!');
      }
    } catch (error) {
      console.error('Analysis error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url
      });
      toast.error('Failed to generate analysis');
      setAnalysisData(null);
      setChartData(null);
      setTableData([]);
      setStats([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedFile, activeTab]);

  // Update UI based on analysis data
  const updateUI = (data) => {
    if (!data) {
      return;
    }

    if (activeTab === 'overview') {
      // Handle overview data
      const chartData = data.chartData || data.monthly || null;

      setChartData(chartData);
      setStats([
        { title: 'Total Sales', value: `$${data.totalSales?.toFixed(2) || data.summary?.totalSales?.toFixed(2) || '0.00'}` },
        { title: 'Total Items', value: data.totalItems || data.summary?.totalItems || 0 },
        { title: 'Average Value', value: `$${data.avgValue?.toFixed(2) || data.summary?.avgValue?.toFixed(2) || '0.00'}` },
        { title: 'Data Points', value: data.dataPoints || data.summary?.dataPoints || 0 }
      ]);
    } else if (activeTab === 'sales') {
      // Handle sales data
      const chartData = data.chartData || data.weekly || null;

      setChartData(chartData);
      setTableData(data.tableData || []);
    } else if (activeTab === 'products') {
      // Handle products data
      const chartData = data.chartData || null;

      setChartData(chartData);
      setTableData(data.tableData || []);
    }
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    setSelectedFile(e.target.value);
    // Clear previous analysis when file changes
    setAnalysisData(null);
    setChartData(null);
    setTableData([]);
    setStats([]);
    setAnalysisSource(null);
  };

  // Handle analyze button click
  const handleAnalyze = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    setIsAnalyzing(true);
    try {
      await fetchAnalysisData();
    } catch (error) {
      console.error('Analysis failed:', error);
      toast.error('Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle get analysis button click
  const handleGetAnalysis = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    setIsFetchingAnalysis(true);
    try {
      const response = await API.get('/v1/analysis', {
        params: {
          fileId: selectedFile,
          type: activeTab,
          fetchOnly: true // Flag to only fetch, not generate new analysis
        }
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch analysis');
      }
      
      const data = response.data.data;
      
      if (data === null) {
        // No existing analysis found
        setAnalysisData(null);
        setChartData(null);
        setTableData([]);
        setStats([]);
        setAnalysisSource(null);
        toast.info('No existing analysis found. Please run a new analysis.');
      } else {
        setAnalysisData(data);
        updateUI(data);
        setAnalysisSource('fetched');
        toast.success('Existing analysis loaded successfully!');
      }
    } catch (error) {
      toast.error('Failed to fetch existing analysis');
      setAnalysisData(null);
      setChartData(null);
      setTableData([]);
      setStats([]);
    } finally {
      setIsFetchingAnalysis(false);
    }
  };

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Clear current analysis when tab changes
    setAnalysisData(null);
    setChartData(null);
    setTableData([]);
    setStats([]);
    setAnalysisSource(null);
  };

  // Export data
  const handleExport = async (format) => {
    if (!selectedFile) return;

    try {
      const response = await API.get('/v1/analysis/export', {
        params: {
          fileId: selectedFile,
          type: activeTab,
          format
        },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `analysis-${activeTab}-${new Date().toISOString().split('T')[0]}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Export started successfully');
    } catch (error) {
      toast.error('Export failed');
    }
  };

  // Check token status
  const checkTokenStatus = () => {
    const token = localStorage.getItem('token');
    const userEmail = localStorage.getItem('userEmail');
    console.log('Token status:', {
      hasToken: !!token,
      tokenLength: token ? token.length : 0,
      tokenStart: token ? token.substring(0, 20) + '...' : 'none',
      userEmail,
      contextToken: token
    });
  };

  // Test API connection
  const testAPIConnection = async () => {
    try {
      // Test basic API endpoint
      const basicResponse = await fetch('http://localhost:8000/api/test');
      const basicData = await basicResponse.json();
      console.log('Basic API test:', basicData);
      
      // Test auth endpoint
      const authResponse = await fetch('http://localhost:8000/api/auth-test', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const authData = await authResponse.json();
      console.log('Auth test:', authData);
      
      // Test analysis public endpoint
      const analysisResponse = await fetch('http://localhost:8000/api/v1/analysis/public-test');
      const analysisData = await analysisResponse.json();
      console.log('Analysis public test:', analysisData);
      
      // Test analysis protected endpoint
      const protectedResponse = await API.get('/v1/analysis/test');
      const protectedData = await protectedResponse.data;
      console.log('Analysis protected test:', protectedData);
      
      toast.success('All API tests passed!');
    } catch (error) {
      console.error('API test failed:', error);
      toast.error('API connection failed');
    }
  };

  // Initial data load
  useEffect(() => {
    console.log('Analysis component mounted, checking token...');
    checkTokenStatus();
    fetchUserFiles();
  }, [fetchUserFiles]);

  // Fetch analysis when file or tab changes
  useEffect(() => {
    // Only fetch analysis if explicitly triggered by analyze button
    // This prevents automatic analysis on file/tab change
  }, [selectedFile, activeTab, fetchAnalysisData]);

  // Handle pagination
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, currentPage: newPage }));
      fetchUserFiles(newPage, searchQuery);
    }
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    fetchUserFiles(1, searchQuery);
  };

  // Tabs configuration
  const tabs = [
    { id: 'overview', label: 'Overview', icon: <FiBarChart2 /> },
    { id: 'sales', label: 'Sales', icon: <FiTrendingUp /> },
    { id: 'products', label: 'Products', icon: <FiPieChart /> }
  ];

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Rest of your component JSX remains the same
  // ... (keep all your existing JSX code)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-2 border-gray-200 rounded-lg p-6">
            {/* File selection dropdown */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="file-select" className="block text-sm font-medium text-gray-700">
                  Select File
                </label>
                <div className="flex space-x-2">
                  <button
                    onClick={testAPIConnection}
                    className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Test API
                  </button>
                  <button
                    onClick={checkTokenStatus}
                    className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Check Token
                  </button>
                  <button
                    onClick={() => fetchUserFiles()}
                    disabled={isLoadingFiles}
                    className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    <FiRefreshCw className={`h-4 w-4 mr-1 ${isLoadingFiles ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <select
                  id="file-select"
                  value={selectedFile}
                  onChange={handleFileSelect}
                  className="flex-1 mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  <option value="">Select a file</option>
                  {userFiles.map((file) => (
                    <option key={file._id} value={file._id}>
                      {file.originalName} ({formatFileSize(file.size)})
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleGetAnalysis}
                  disabled={!selectedFile || isFetchingAnalysis}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isFetchingAnalysis ? (
                    <>
                      <FiRefreshCw className="animate-spin -ml-1 mr-2 h-4 w-4" />
                      Fetching...
                    </>
                  ) : (
                    <>
                      <FiDownload className="-ml-1 mr-2 h-4 w-4" />
                      Get Analysis
                    </>
                  )}
                </button>
                <button
                  onClick={handleAnalyze}
                  disabled={!selectedFile || isAnalyzing}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAnalyzing ? (
                    <>
                      <FiRefreshCw className="animate-spin -ml-1 mr-2 h-4 w-4" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <FiBarChart2 className="-ml-1 mr-2 h-4 w-4" />
                      Analyze
                    </>
                  )}
                </button>
              </div>
              {selectedFile && (
                <p className="mt-2 text-sm text-gray-500">
                  Selected: {userFiles.find(f => f._id === selectedFile)?.originalName}
                </p>
              )}
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
              <div className="flex items-center justify-between">
                <nav className="-mb-px flex space-x-8">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={`${
                        activeTab === tab.id
                          ? 'border-indigo-500 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                    >
                      {tab.icon}
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </nav>
                {analysisData && (
                  <div className="flex items-center text-sm text-green-600">
                    <FiCheckCircle className="h-4 w-4 mr-1" />
                    Analysis Complete {analysisSource && `(${analysisSource === 'fetched' ? 'Fetched' : 'Generated'})`}
                  </div>
                )}
              </div>
            </div>

            {/* Content Area */}
            <div className="mt-6">
              {isLoadingFiles ? (
                <div className="flex justify-center items-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading files...</p>
                  </div>
                </div>
              ) : userFiles.length === 0 ? (
                <div className="flex justify-center items-center h-64">
                  <div className="text-center">
                    <FiFile className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No files found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Upload some files first to analyze them.
                    </p>
                    <div className="mt-6">
                      <a
                        href="/dashboard/import"
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <FiUpload className="-ml-1 mr-2 h-5 w-5" />
                        Upload Files
                      </a>
                    </div>
                  </div>
                </div>
              ) : isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Analyzing data...</p>
                  </div>
                </div>
              ) : (
                <div>
                  {!selectedFile ? (
                    <div className="flex justify-center items-center h-64">
                      <div className="text-center">
                        <FiBarChart2 className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No file selected</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Please select a file from the dropdown above to view analysis.
                        </p>
                      </div>
                    </div>
                  ) : !analysisData ? (
                    <div className="flex justify-center items-center h-64">
                      <div className="text-center">
                        <FiBarChart2 className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No analysis performed</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Use "Get Analysis" to fetch existing analysis or "Analyze" to generate new analysis.
                        </p>
                        <div className="mt-4 space-x-2">
                          <button
                            onClick={handleGetAnalysis}
                            disabled={!selectedFile || isFetchingAnalysis}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                          >
                            {isFetchingAnalysis ? (
                              <>
                                <FiRefreshCw className="animate-spin -ml-1 mr-2 h-4 w-4" />
                                Fetching...
                              </>
                            ) : (
                              <>
                                <FiDownload className="-ml-1 mr-2 h-4 w-4" />
                                Get Analysis
                              </>
                            )}
                          </button>
                          <button
                            onClick={handleAnalyze}
                            disabled={!selectedFile || isAnalyzing}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                          >
                            {isAnalyzing ? (
                              <>
                                <FiRefreshCw className="animate-spin -ml-1 mr-2 h-4 w-4" />
                                Analyzing...
                              </>
                            ) : (
                              <>
                                <FiBarChart2 className="-ml-1 mr-2 h-4 w-4" />
                                Analyze
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {activeTab === 'overview' && (
                        <div>
                          {/* Stats Cards */}
                          <div className="grid grid-cols-1 gap-5 mt-6 sm:grid-cols-2 lg:grid-cols-4">
                            {stats.map((stat, index) => (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.1 }}
                                className="bg-white overflow-hidden shadow rounded-lg"
                              >
                                <div className="px-4 py-5 sm:p-6">
                                  <dt className="text-sm font-medium text-gray-500 truncate">
                                    {stat.title}
                                  </dt>
                                  <dd className="mt-1 text-3xl font-semibold text-gray-900">
                                    {stat.value}
                                  </dd>
                                </div>
                              </motion.div>
                            ))}
                          </div>

                          {/* Chart */}
                          {chartData ? (
                            <div className="mt-8 bg-white p-6 rounded-lg shadow">
                              <div className="h-80">
                                <Bar
                                  data={chartData}
                                  options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                      legend: {
                                        position: 'top',
                                      },
                                      title: {
                                        display: true,
                                        text: 'Sales Overview',
                                      },
                                    },
                                  }}
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="mt-8 bg-white p-6 rounded-lg shadow">
                              <div className="h-80 flex items-center justify-center">
                                <p className="text-gray-500">No data found for this analysis.</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {activeTab === 'sales' && (
                        <div>
                          {chartData ? (
                            <div className="bg-white p-6 rounded-lg shadow">
                              <div className="h-96">
                                <Line
                                  data={chartData}
                                  options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                      legend: {
                                        position: 'top',
                                      },
                                      title: {
                                        display: true,
                                        text: 'Sales Trend',
                                      },
                                    },
                                  }}
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="bg-white p-6 rounded-lg shadow">
                              <div className="h-96 flex items-center justify-center">
                                <p className="text-gray-500">No data found for this analysis.</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {activeTab === 'products' && (
                        <div>
                          {chartData ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              <div className="bg-white p-6 rounded-lg shadow">
                                <div className="h-96">
                                  <Pie
                                    data={chartData}
                                    options={{
                                      responsive: true,
                                      maintainAspectRatio: false,
                                      plugins: {
                                        legend: {
                                          position: 'right',
                                        },
                                        title: {
                                          display: true,
                                          text: 'Product Distribution',
                                        },
                                      },
                                    }}
                                  />
                                </div>
                              </div>
                              <div className="bg-white p-6 rounded-lg shadow overflow-x-auto">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Top Products</h3>
                                <table className="min-w-full divide-y divide-gray-200">
                                  <thead className="bg-gray-50">
                                    <tr>
                                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Product
                                      </th>
                                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Sales
                                      </th>
                                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Percentage
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white divide-y divide-gray-200">
                                    {tableData.map((item, index) => (
                                      <tr key={index} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                          {item.product}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                          ${item.sales?.toFixed(2) || '0.00'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                          {item.percentage?.toFixed(1) || '0.0'}%
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-white p-6 rounded-lg shadow">
                              <div className="h-96 flex items-center justify-center">
                                <p className="text-gray-500">No data found for this analysis.</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Export Button */}
            <div className="mt-6 flex justify-end space-x-2">
              {analysisData && (
                <>
                  <button
                    onClick={handleGetAnalysis}
                    disabled={isFetchingAnalysis}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {isFetchingAnalysis ? (
                      <>
                        <FiRefreshCw className="animate-spin -ml-1 mr-2 h-4 w-4" />
                        Fetching...
                      </>
                    ) : (
                      <>
                        <FiDownload className="-ml-1 mr-2 h-4 w-4" />
                        Get Analysis
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {isAnalyzing ? (
                      <>
                        <FiRefreshCw className="animate-spin -ml-1 mr-2 h-4 w-4" />
                        Re-analyzing...
                      </>
                    ) : (
                      <>
                        <FiRefreshCw className="-ml-1 mr-2 h-4 w-4" />
                        Re-analyze
                      </>
                    )}
                  </button>
                </>
              )}
              <button
                onClick={() => handleExport('csv')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <FiDownload className="-ml-1 mr-2 h-5 w-5" />
                Export as CSV
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analysis;