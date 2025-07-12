import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  FiBarChart2, 
  FiPieChart, 
  FiTrendingUp, 
  FiDownload, 
  FiRefreshCw, 
  FiFile, 
  FiSearch, 
  FiChevronLeft, 
  FiChevronRight, 
  FiUpload, 
  FiCheckCircle,
  FiAlertCircle,
  FiInfo
} from 'react-icons/fi';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { useAuth } from '../../store/auth';

// Register Chart.js components
Chart.register(...registerables);

const Analysis = () => {
  const { userEmail, token } = useAuth();

  // API configuration
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
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
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

  // Analysis types
  const analysisTypes = [
    { id: 'overview', label: 'Overview', icon: <FiBarChart2 />, description: 'Basic data statistics and insights' },
    { id: 'sales', label: 'Sales', icon: <FiTrendingUp />, description: 'Sales performance and trends' },
    { id: 'products', label: 'Products', icon: <FiPieChart />, description: 'Product analysis and performance' }
  ];

  // Chart controls state
  const chartTypes = [
    { id: 'line', label: 'Line Chart' },
    { id: 'bar', label: 'Bar Chart' },
    { id: 'pie', label: 'Pie Chart' },
    { id: 'box', label: 'Box Plot' },
    { id: 'scatter', label: 'Scatter Plot' }
  ];
  const [selectedChartType, setSelectedChartType] = useState('line');
  const [xAxis, setXAxis] = useState('');
  const [yAxis, setYAxis] = useState('');
  const [showGrid, setShowGrid] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  const [showValues, setShowValues] = useState(true);
  const [fileColumns, setFileColumns] = useState([]);

  // Fetch user's files
  const fetchUserFiles = useCallback(async (page = 1, search = '') => {
    try {
      setIsLoadingFiles(true);
      const params = {
        page,
        limit: 10,
        ...(search && { search }),
        sortBy: '-createdAt'
      };

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
      
    } catch (error) {
      console.error('Error fetching files:', error);
      // Don't show error toast if no files found - this is normal
      if (error.response?.status !== 404) {
        toast.error('Failed to load files');
      }
      setUserFiles([]);
    } finally {
      setIsLoadingFiles(false);
    }
  }, [selectedFile]);

  // Fetch columns for selected file
  const fetchFileColumns = useCallback(async () => {
    if (!selectedFile) return;
    try {
      const token = localStorage.getItem('token') || token;
      const response = await API.get(`/files/getfiles`, {
        params: { search: '' },
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data && response.data.data) {
        const file = response.data.data.find(f => f._id === selectedFile);
        if (file && file.columns && Array.isArray(file.columns) && file.columns.length > 0) {
          setFileColumns(file.columns);
          if (!xAxis) setXAxis(file.columns[0]);
          if (!yAxis && file.columns.length > 1) setYAxis(file.columns[1]);
        } else {
          setFileColumns([]);
        }
      }
    } catch (err) {
      console.error('Error fetching file columns:', err);
      setFileColumns([]);
    }
  }, [selectedFile, xAxis, yAxis]);

  // Update fileColumns when file changes or after analysis
  useEffect(() => {
    if (analysisData && analysisData.stats && Array.isArray(analysisData.stats.columns) && analysisData.stats.columns.length > 0) {
      setFileColumns(analysisData.stats.columns);
      if (!xAxis) setXAxis(analysisData.stats.columns[0]);
      if (!yAxis && analysisData.stats.columns.length > 1) setYAxis(analysisData.stats.columns[1]);
    } else {
      fetchFileColumns();
    }
  }, [selectedFile, analysisData, fetchFileColumns]);

  // Generate analysis with chart options
  const generateAnalysis = useCallback(async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }
    if (!xAxis || !yAxis) {
      toast.error('Please select both X and Y axes');
      return;
    }
    try {
      setIsAnalyzing(true);
      const params = {
        fileId: selectedFile,
        type: activeTab,
        chartType: selectedChartType,
        xAxis,
        yAxis,
        options: JSON.stringify({
          grid: showGrid,
          legend: showLegend,
          values: showValues
        })
      };
      const response = await API.get('/v1/analysis', { params });
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to generate analysis');
      }
      const data = response.data.data;
      if (!data || !data.success) {
        setAnalysisData(null);
        setChartData(null);
        setTableData([]);
        setStats([]);
        toast.info(data?.message || 'No data found for this analysis');
        return;
      }
      setAnalysisData(data);
      updateUI(data);
      toast.success('Analysis completed successfully!');
    } catch (error) {
      console.error('Analysis error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to generate analysis';
      toast.error(errorMessage);
      setAnalysisData(null);
      setChartData(null);
      setTableData([]);
      setStats([]);
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedFile, activeTab, selectedChartType, xAxis, yAxis, showGrid, showLegend, showValues]);

  // Update UI based on analysis data
  const updateUI = (data) => {
    if (!data) return;

    // Update chart data
    if (data.chartData) {
      setChartData(data.chartData);
    } else {
      setChartData(null);
    }

    // Update table data
    if (data.tableData) {
      setTableData(data.tableData);
    } else {
      setTableData([]);
    }

    // Update stats
    if (data.summary) {
      const statsArray = [];
      
      if (data.summary.totalRows) {
        statsArray.push({ title: 'Total Rows', value: data.summary.totalRows });
      }
      if (data.summary.totalColumns) {
        statsArray.push({ title: 'Total Columns', value: data.summary.totalColumns });
      }
      if (data.summary.numericColumns) {
        statsArray.push({ title: 'Numeric Columns', value: data.summary.numericColumns });
      }
      if (data.summary.totalSales) {
        statsArray.push({ title: 'Total Sales', value: `$${data.summary.totalSales.toFixed(2)}` });
      }
      if (data.summary.averageSale) {
        statsArray.push({ title: 'Average Sale', value: `$${data.summary.averageSale.toFixed(2)}` });
      }
      if (data.summary.totalProducts) {
        statsArray.push({ title: 'Total Products', value: data.summary.totalProducts });
      }

      setStats(statsArray);
    } else {
      setStats([]);
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
  };

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Clear current analysis when tab changes
    setAnalysisData(null);
    setChartData(null);
    setTableData([]);
    setStats([]);
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    fetchUserFiles(1, searchQuery);
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, currentPage: newPage }));
      fetchUserFiles(newPage, searchQuery);
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Export analysis
  const handleExport = async (format) => {
    if (!selectedFile || !analysisData) {
      toast.error('No analysis data to export');
      return;
    }

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
      link.setAttribute('download', `analysis_${activeTab}_${new Date().toISOString().split('T')[0]}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Export started successfully');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Export failed');
    }
  };

  // Initial data load
  useEffect(() => {
    fetchUserFiles();
  }, [fetchUserFiles]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Data Analysis</h1>
            <p className="mt-2 text-gray-600">
              Analyze your uploaded files and generate insights
            </p>
          </div>

          <div className="bg-white shadow-sm rounded-lg">
            {/* File Selection */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">Select File</h2>
                <div className="flex space-x-2">
                  <button
                    onClick={() => fetchUserFiles()}
                    disabled={isLoadingFiles}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    <FiRefreshCw className={`h-4 w-4 mr-2 ${isLoadingFiles ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <select
                  value={selectedFile}
                  onChange={handleFileSelect}
                  className="flex-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  <option value="">Select a file</option>
                  {userFiles.map((file) => (
                    <option key={file._id} value={file._id}>
                      {file.originalName} ({formatFileSize(file.size)})
                    </option>
                  ))}
                </select>
                <button
                  onClick={generateAnalysis}
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
                  Selected: {userFiles.find(f => f._id === selectedFile)?.originalName || selectedFile}
                </p>
              )}
            </div>

            {/* Analysis Types */}
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Analysis Type</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {analysisTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => handleTabChange(type.id)}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                      activeTab === type.id
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="text-xl">{type.icon}</div>
                      <div className="text-left">
                        <div className="font-medium">{type.label}</div>
                        <div className="text-sm text-gray-500">{type.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Chart Controls - Always Row */}
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Chart Options</h3>
              <div className="mb-6 flex flex-col md:flex-row md:items-center md:space-x-6 space-y-4 md:space-y-0">
                <div className="flex flex-row flex-wrap gap-2 items-center w-full">
                  <label className="text-xs text-gray-500">Chart Type</label>
                  <select
                    value={selectedChartType}
                    onChange={e => setSelectedChartType(e.target.value)}
                    className="border rounded px-2 py-1 min-w-[140px] mr-4"
                  >
                    {chartTypes.map(type => (
                      <option key={type.id} value={type.id}>{type.label}</option>
                    ))}
                  </select>
                  <label className="text-xs text-gray-500 ml-4">X-Axis</label>
                  <select value={xAxis} onChange={e => setXAxis(e.target.value)} className="border rounded px-2 py-1 min-w-[100px]">
                    <option value="">{fileColumns.length === 0 ? 'No columns' : 'Select'}</option>
                    {fileColumns.map(col => <option key={col} value={col}>{col}</option>)}
                  </select>
                  <label className="text-xs text-gray-500 ml-2">Y-Axis</label>
                  <select value={yAxis} onChange={e => setYAxis(e.target.value)} className="border rounded px-2 py-1 min-w-[100px]">
                    <option value="">{fileColumns.length === 0 ? 'No columns' : 'Select'}</option>
                    {fileColumns.map(col => <option key={col} value={col}>{col}</option>)}
                  </select>
                  <button className={`ml-4 px-3 py-1 rounded border ${showGrid ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border-blue-600'}`} onClick={() => setShowGrid(g => !g)}>Grid</button>
                  <button className={`px-3 py-1 rounded border ${showLegend ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border-blue-600'}`} onClick={() => setShowLegend(l => !l)}>Legend</button>
                  <button className={`px-3 py-1 rounded border ${showValues ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border-blue-600'}`} onClick={() => setShowValues(v => !v)}>Values</button>
                  <button
                    onClick={generateAnalysis}
                    disabled={!selectedFile || isAnalyzing || fileColumns.length === 0}
                    className="ml-4 px-6 py-2 rounded bg-indigo-600 text-white font-semibold disabled:opacity-50"
                  >
                    {isAnalyzing ? 'Analyzing...' : 'Generate Chart'}
                  </button>
                </div>
              </div>
            </div>

            {/* Analysis Results */}
            <div className="p-6">
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
              ) : !selectedFile ? (
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
                      Click "Analyze" to generate analysis for the selected file.
                    </p>
                  </div>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-6"
                >
                  {/* Stats Cards */}
                  {stats.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {stats.map((stat, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          className="bg-white p-4 rounded-lg border border-gray-200"
                        >
                          <div className="text-sm font-medium text-gray-500">{stat.title}</div>
                          <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Chart */}
                  {chartData && (
                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Chart Visualization</h3>
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
                            },
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Table */}
                  {tableData.length > 0 && (
                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Data Table</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              {Object.keys(tableData[0] || {}).map((header) => (
                                <th
                                  key={header}
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {tableData.map((row, index) => (
                              <tr key={index}>
                                {Object.values(row).map((value, cellIndex) => (
                                  <td
                                    key={cellIndex}
                                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                                  >
                                    {typeof value === 'number' ? value.toFixed(2) : value}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Export Options */}
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Export Analysis</h3>
                    <div className="flex space-x-4">
                      <button
                        onClick={() => handleExport('json')}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <FiDownload className="-ml-1 mr-2 h-4 w-4" />
                        Export JSON
                      </button>
                      <button
                        onClick={() => handleExport('csv')}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <FiDownload className="-ml-1 mr-2 h-4 w-4" />
                        Export CSV
                      </button>
                    </div>
                  </div>
                  {/* Show generated chart image and report link if available */}
                  {analysisData && analysisData.chartImages && analysisData.chartImages.length > 0 && (
                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Generated Chart</h3>
                      <img src={`http://localhost:8000/output/${analysisData.chartImages[0].split('/').pop()}`} alt="Generated Chart" className="max-w-xl border rounded shadow" />
                    </div>
                  )}
                  {analysisData && analysisData.reportPath && (
                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                      <a href={`http://localhost:8000/output/${analysisData.reportPath.split('/').pop()}`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">Download PDF Report</a>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analysis;