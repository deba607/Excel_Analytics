import { useState, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiUpload, 
  FiX, 
  FiFileText, 
  FiCheckCircle, 
  FiAlertCircle,
  FiInfo,
  FiClock
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../store/auth';
import axios from 'axios';
import { BACKEND_URL } from '../../store/backend.jsx';

const Import = () => {
  // Authentication
  const { userEmail, isLoggedIn, LogoutUser } = useAuth();
  const navigate = useNavigate();
  
  // State
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [importStatus, setImportStatus] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);
  const API = BACKEND_URL;
  // Handle drag and drop events
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    validateAndSetFile(droppedFile);
  };

  // File selection handler
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    validateAndSetFile(selectedFile);
  };

  // File validation
  const validateAndSetFile = (selectedFile) => {
    if (!selectedFile) return;

    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];

    const fileExtension = selectedFile.name.split('.').pop().toLowerCase();
    const isValidType = validTypes.includes(selectedFile.type) || 
                       ['xls', 'xlsx', 'csv'].includes(fileExtension);

    if (!isValidType) {
      toast.error('Please upload a valid Excel or CSV file');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('File size should be less than 10MB');
      return;
    }

    setFile(selectedFile);
    setImportStatus(null);
  };

  // Remove selected file
  const removeFile = () => {
    setFile(null);
    setImportStatus(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Check if file exists in DB for this user
  const checkFileExistsInDB = async (fileName) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API}/api/v1/files/getfiles`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params: {
          search: fileName
        }
      });
      if (response.data && response.data.data && response.data.data.length > 0) {
        // Find exact match by name
        const match = response.data.data.find(f => f.originalName === fileName);
        return match || null;
      }
      return null;
    } catch (err) {
      console.error('Error checking file in DB:', err);
      return null;
    }
  };

  // Handle file upload
const handleImport = async () => {
  if (!file) {
    toast.error('Please select a file to import');
    return;
  }

  if (!userEmail) {
    toast.error('Authentication required. Please log in again.');
    navigate('/login', { state: { from: '/import' } });
    return;
  }

  setIsLoading(true);
  setImportStatus(null);
  setUploadProgress(0);

  // Check if file exists in DB
  const existing = await checkFileExistsInDB(file.name);
  if (existing) {
    setImportStatus({
      success: true,
      message: 'File already exists in your account. Using existing file.',
      data: existing
    });
    toast.success('File already exists. Using existing file.');
    setFile(null);
    setUploadProgress(0);
    return;
  }

  const formData = new FormData();
  formData.append('files', file); // Changed from 'file' to 'files' to match server expectation
  formData.append('userEmail', userEmail);

  try {

    
    const response = await axios.post(`${API}/api/v1/files`, formData, {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.lengthComputable) {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(progress);
        }
      }
    });

    setImportStatus({ 
      success: true, 
      message: 'File imported successfully!',
      data: response.data
    });
    
    toast.success('File imported successfully!');
    setFile(null);
    setUploadProgress(0);
    
    // Optional: Redirect after successful import
    // navigate('/dashboard');
    
  } catch (error) {
    console.error('Import error:', error);
    const errorMessage = error.response?.data?.message || 
                        error.message || 
                        'Failed to import file. Please try again.';
    
    setImportStatus({ 
      success: false, 
      message: errorMessage
    });
    
    toast.error(errorMessage);
  } finally {
    setIsLoading(false);
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

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Import Data</h1>
          <p className="mt-2 text-sm text-gray-600">
            Upload your Excel or CSV file to import data into the system
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* Progress Bar */}
          {isLoading && uploadProgress > 0 && (
            <div className="h-1.5 bg-gray-200">
              <div 
                className="h-full bg-blue-600 transition-all duration-300 ease-in-out"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          )}

          <div className="p-6">
            {/* Drag and Drop Zone */}
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                isDragging 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-blue-400'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !isLoading && fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".xlsx, .xls, .csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={handleFileChange}
                disabled={isLoading}
              />
              
              <div className="space-y-3">
                <div className="mx-auto h-16 w-16 text-gray-300">
                  <FiUpload className="mx-auto h-full w-10" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">
                  {file ? 'File selected' : 'Drag and drop files here'}
                </h3>
                <p className="text-sm text-gray-500">
                  {file 
                    ? file.name
                    : 'or click to browse files (Excel or CSV, max 10MB)'}
                </p>
                {file && (
                  <p className="text-xs text-gray-400">
                    {formatFileSize(file.size)}
                  </p>
                )}
              </div>
            </div>

            {/* File Preview */}
            {file && (
              <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-blue-50 rounded-md">
                      <FiFileText className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                        {file.name}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-gray-500">
                          {formatFileSize(file.size)}
                        </span>
                        <span className="text-gray-300">•</span>
                        <span className="text-xs text-gray-500">
                          {file.type || 'Unknown type'}
                        </span>
                      </div>
                      {uploadProgress > 0 && uploadProgress < 100 && (
                        <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                          <div 
                            className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" 
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removeFile}
                    disabled={isLoading}
                    className="text-gray-400 hover:text-gray-500 disabled:opacity-50"
                  >
                    <FiX className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Status Messages */}
            {importStatus && (
              <div
                className={`mt-4 p-4 rounded-md ${
                  importStatus.success ? 'bg-green-50' : 'bg-red-50'
                }`}
              >
                <div className="flex">
                  <div className="flex-shrink-0">
                    {importStatus.success ? (
                      <FiCheckCircle className="h-5 w-5 text-green-400" />
                    ) : (
                      <FiAlertCircle className="h-5 w-5 text-red-400" />
                    )}
                  </div>
                  <div className="ml-3">
                    <p
                      className={`text-sm font-medium ${
                        importStatus.success ? 'text-green-800' : 'text-red-800'
                      }`}
                    >
                      {importStatus.message}
                    </p>
                    {importStatus.data && (
                      <div className="mt-2 text-sm text-gray-600">
                        <p>File ID: {importStatus.data._id}</p>
                        <p>Status: {importStatus.data.status}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-6 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
              {file && (
                <button
                  type="button"
                  onClick={removeFile}
                  disabled={isLoading}
                  className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              )}
              <button
                type="button"
                onClick={handleImport}
                disabled={!file || isLoading}
                className={`w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  isLoading || !file
                    ? 'bg-blue-400'
                    : 'bg-blue-600 hover:bg-blue-700'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    {uploadProgress > 0 ? 'Uploading...' : 'Processing...'}
                  </>
                ) : (
                  'Import File'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Guidelines Card */}
        <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
              <FiInfo className="mr-2 h-5 w-5 text-blue-500" />
              Import Guidelines
            </h3>
            <div className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-5 w-5 text-blue-500">
                    <FiCheckCircle className="h-5 w-5" />
                  </div>
                  <p className="ml-3 text-sm text-gray-600">
                    Supported file formats: <span className="font-medium">.xlsx, .xls, .csv</span>
                  </p>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-5 w-5 text-blue-500">
                    <FiCheckCircle className="h-5 w-5" />
                  </div>
                  <p className="ml-3 text-sm text-gray-600">
                    Maximum file size: <span className="font-medium">10MB</span>
                  </p>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-5 w-5 text-blue-500">
                    <FiCheckCircle className="h-5 w-5" />
                  </div>
                  <p className="ml-3 text-sm text-gray-600">
                    First row should contain <span className="font-medium">column headers</span>
                  </p>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-5 w-5 text-blue-500">
                    <FiClock className="h-5 w-5" />
                  </div>
                  <p className="ml-3 text-sm text-gray-600">
                    Large files may take several minutes to process
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Import;