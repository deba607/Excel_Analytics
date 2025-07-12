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

  // Remove analysis types and activeTab
  const chartTypes = [
    { id: 'line', label: 'Line Chart' },
    { id: 'bar', label: 'Bar Chart' },
    { id: 'pie', label: 'Pie Chart' },
    { id: 'doughnut', label: 'Doughnut Chart' },
    { id: 'radar', label: 'Radar Chart' },
    { id: 'polarArea', label: 'Polar Area Chart' }
  ];
  const [selectedChartType, setSelectedChartType] = useState('bar');
  const [xAxis, setXAxis] = useState('');
  const [yAxis, setYAxis] = useState('');
  const [fileColumns, setFileColumns] = useState([]);

  // Analyze: only show summary and field names
  const analyzeFile = useCallback(async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }
    try {
      setIsAnalyzing(true);
      const response = await API.get('/v1/analysis', { 
        params: { fileId: selectedFile }
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to analyze file');
      }
      
      const data = response.data.data;
      setAnalysisData(data);
      
      // Show summary and field names
      setStats([
        { title: 'Total Rows', value: data.totalRows },
        { title: 'Total Columns', value: data.totalColumns },
        { title: 'Numeric Columns', value: data.numericColumns }
      ]);
      
      setFileColumns(data.allColumns || []);
      setChartData(null);
      setTableData([]);
      toast.success('File analyzed successfully!');
    } catch (error) {
      console.error('Analysis error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to analyze file';
      toast.error(errorMessage);
      setAnalysisData(null);
      setChartData(null);
      setTableData([]);
      setStats([]);
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedFile]);

  // Generate chart: send only required fields
  const generateChart = useCallback(async () => {
    if (!selectedFile || !xAxis || !yAxis) {
      toast.error('Please select a file and both axes');
      return;
    }
    try {
      setIsAnalyzing(true);
      const response = await API.post('/v1/analysis/generate-chart', {
        fileId: selectedFile,
        chartType: selectedChartType,
        xAxis,
        yAxis
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to generate chart');
      }
      
      const data = response.data.data;
      setAnalysisData(data);
      setChartData(data.chartData);
      toast.success('Chart generated successfully!');
    } catch (error) {
      console.error('Chart generation error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to generate chart';
      toast.error(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedFile, selectedChartType, xAxis, yAxis]);

  // Handle file selection
  const handleFileSelect = (e) => {
    setSelectedFile(e.target.value);
    // Clear previous analysis when file changes
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

  // Add state for export format and exporting
  const [exportFormat, setExportFormat] = useState('pdf');
  const [isExporting, setIsExporting] = useState(false);

  // Update handleExport to send chart options and user email
  const handleExport = async () => {
    if (!selectedFile || !analysisData) {
      toast.error('No analysis data to export');
      return;
    }
    try {
      setIsExporting(true);
      const params = {
        fileId: selectedFile,
        chartType: selectedChartType,
        xAxis,
        yAxis,
        format: exportFormat
      };
      const response = await API.get('/v1/analysis/export', {
        params,
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const ext = exportFormat;
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `chart_${selectedChartType}_${new Date().toISOString().split('T')[0]}.${ext}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Export started successfully');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  // Fetch user files
  const fetchUserFiles = useCallback(async (page = 1, search = '') => {
    try {
      console.log('[Frontend] Fetching files with params:', { page, search });
      setIsLoadingFiles(true);
      const params = {
        page,
        limit: 50,
        ...(search && { search })
      };
      
      console.log('[Frontend] Making API call to /v1/files/getfiles');
      const response = await API.get('/v1/files/getfiles', { params });
      
      console.log('[Frontend] API response:', response.data);
      
      if (response.data.success) {
        setUserFiles(response.data.data.files || []);
        setPagination({
          currentPage: response.data.data.currentPage || 1,
          totalPages: response.data.data.totalPages || 1,
          total: response.data.data.total || 0,
          hasNextPage: response.data.data.hasNextPage || false,
          hasPreviousPage: response.data.data.hasPreviousPage || false
        });
        console.log('[Frontend] Files loaded successfully:', response.data.data.files?.length || 0);
      } else {
        console.error('Failed to fetch files:', response.data.message);
        toast.error('Failed to load files');
      }
    } catch (error) {
      console.error('Error fetching files:', error);
      console.error('Error response:', error.response?.data);
      toast.error('Failed to load files');
    } finally {
      setIsLoadingFiles(false);
    }
  }, []);

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
                  onClick={generateChart}
                  disabled={!selectedFile || isAnalyzing || fileColumns.length === 0}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAnalyzing ? (
                    <>
                      <FiRefreshCw className="animate-spin -ml-1 mr-2 h-4 w-4" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FiBarChart2 className="-ml-1 mr-2 h-4 w-4" />
                      Generate Chart
                    </>
                  )}
                </button>
                <button
                  onClick={analyzeFile}
                  disabled={!selectedFile || isAnalyzing}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
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

            {/* Chart Controls - Always Row */}
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Chart Options</h3>
              <div className="mb-6 flex flex-row flex-wrap gap-2 items-center w-full">
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
                        {selectedChartType === 'bar' && (
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
                        )}
                        {selectedChartType === 'line' && (
                          <Line
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
                        )}
                        {selectedChartType === 'pie' && (
                          <Pie
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
                        )}
                        {selectedChartType === 'doughnut' && (
                          <Doughnut
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
                        )}
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
                    <div className="flex space-x-4 items-center">
                      <select
                        value={exportFormat}
                        onChange={e => setExportFormat(e.target.value)}
                        className="border rounded px-2 py-1 min-w-[100px]"
                      >
                        <option value="pdf">PDF</option>
                        <option value="jpg">JPG</option>
                        <option value="png">PNG</option>
                      </select>
                      <button
                        onClick={handleExport}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        disabled={isExporting}
                      >
                        {isExporting ? 'Exporting...' : 'Export'}
                      </button>
                    </div>
                  </div>
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