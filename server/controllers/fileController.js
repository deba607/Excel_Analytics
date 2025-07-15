const File = require('../models/File');
const Analysis = require('../models/Analysis');
const path = require('path');
const ExcelJS = require('exceljs');
const { parse } = require('csv-parse/sync');
const fs = require('fs');
const { getGridFSBucket } = require('../utils/db');
const { ObjectId } = require('mongodb');
const tmp = require('tmp');

async function extractColumnsFromFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.xlsx' || ext === '.xls') {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.getWorksheet(1);
    const headers = worksheet.getRow(1).values;
    return headers.slice(1).map(h => (typeof h === 'object' && h !== null ? h.text : h)).filter(Boolean);
  } else if (ext === '.csv') {
    const fileContent = await fs.promises.readFile(filePath, 'utf-8');
    const records = parse(fileContent, { columns: true });
    return records.length > 0 ? Object.keys(records[0]) : [];
  }
  return [];
}

// @desc    Upload files
// @route   POST /api/upload
// @access  Private
exports.uploadFiles = async (req, res) => {
  try {
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'No files were uploaded' 
      });
    }
    
    // Get user email from the authenticated request
    const userEmail = req.user?.email;
    if (!userEmail) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const uploadedFiles = [];
    const gridfsBucket = await getGridFSBucket();

    for (const file of req.files) {
      try {
        // Check for duplicate by name/size/email
        const existingFile = await File.findOne({ 
          originalName: file.originalname,
          size: file.size,
          userEmail
        });
        if (existingFile) {
          uploadedFiles.push({
            id: existingFile._id,
            originalName: existingFile.originalName,
            size: existingFile.size,
            uploadedAt: existingFile.createdAt,
            message: 'File already exists, not re-uploaded.'
          });
          continue;
        }
        // Upload to GridFS
        const uploadStream = gridfsBucket.openUploadStream(file.originalname, {
          contentType: file.mimetype,
          metadata: { userEmail }
        });
        uploadStream.end(file.buffer);
        await new Promise((resolve, reject) => {
          uploadStream.on('finish', resolve);
          uploadStream.on('error', reject);
        });
        // Save metadata in File collection
        const newFile = new File({
          gridFsId: uploadStream.id.toString(),
          originalName: file.originalname,
          size: file.size,
          userEmail,
          status: 'completed',
        });
        // After saving to GridFS, extract columns
        let columns = [];
        try {
          // Download file from GridFS to buffer
          const downloadStream = gridfsBucket.openDownloadStream(uploadStream.id);
          const chunks = [];
          await new Promise((resolve, reject) => {
            downloadStream.on('data', chunk => chunks.push(chunk));
            downloadStream.on('end', resolve);
            downloadStream.on('error', reject);
          });
          const fileBuffer = Buffer.concat(chunks);
          // Save to temp file
          const ext = path.extname(file.originalname).toLowerCase();
          const tmpFile = tmp.fileSync({ postfix: ext });
          require('fs').writeFileSync(tmpFile.name, fileBuffer);
          columns = await extractColumnsFromFile(tmpFile.name);
          tmpFile.removeCallback();
        } catch (err) {
          console.error('Failed to extract columns:', err);
        }
        newFile.columns = columns;
        await newFile.save();
        uploadedFiles.push({
          id: newFile._id,
          originalName: newFile.originalName,
          size: newFile.size,
          uploadedAt: newFile.createdAt,
          message: 'File uploaded successfully.'
        });
      } catch (fileError) {
        console.error(`Error processing file ${file.originalname}:`, fileError);
      }
    }
    res.status(201).json({
      success: true,
      uploadedCount: uploadedFiles.length,
      uploadedFiles
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error during file upload',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/// @desc    Get all files
// @route   GET /api/files
// @access  Private
/**
 * @desc    Get all files for the authenticated user
 * @route   GET /api/v1/files
 * @access  Private
 */
exports.getFiles = async (req, res) => {
  try {
    console.log('[GetFiles] Request received:', {
      user: req.user?.email,
      query: req.query,
      headers: req.headers.authorization ? 'Authorization present' : 'No authorization'
    });

    // Ensure user is authenticated
    if (!req.user || !req.user.email) {
      console.log('[GetFiles] Authentication failed - no user or email');
      return res.status(401).json({ 
        success: false,
        error: 'Authentication required' 
      });
    }

    const userEmail = req.user.email;
    console.log('[GetFiles] User email:', userEmail);
    
    // Basic query with user filter
    const query = { userEmail };
    
    // Optional search parameter
    if (req.query.search) {
      query.$or = [
        { originalName: { $regex: req.query.search, $options: 'i' } },
        { filename: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Optional file type filter
    if (req.query.type) {
      const fileTypes = Array.isArray(req.query.type) 
        ? req.query.type 
        : [req.query.type];
      query['metadata.mimetype'] = { $in: fileTypes.map(t => new RegExp(t, 'i')) };
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    console.log('[GetFiles] Query:', query);
    console.log('[GetFiles] Pagination:', { page, limit, skip });

    // Get total count for pagination
    const total = await File.countDocuments(query);
    console.log('[GetFiles] Total files found:', total);

    // Get paginated files
    const files = await File.find(query)
      .sort('-createdAt')
      .skip(skip)
      .limit(limit)
      .select('-__v'); // Exclude version key

    console.log('[GetFiles] Files retrieved:', files.length);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    const response = {
      success: true,
      count: files.length,
      total,
      totalPages,
      currentPage: page,
      hasNextPage,
      hasPreviousPage,
      data: {
        files: files,
        currentPage: page,
        totalPages,
        total,
        hasNextPage,
        hasPreviousPage
      }
    };

    console.log('[GetFiles] Sending response:', {
      success: response.success,
      count: response.count,
      total: response.total,
      filesCount: response.data.files.length
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('[GetFiles] Error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error fetching files',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Delete file and its analysis
 */
exports.deleteFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    const userEmail = req.user?.email;

    if (!userEmail) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Find the file
    const file = await File.findById(fileId);
    
    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    // Check if user owns the file
    if (file.userEmail !== userEmail) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this file'
      });
    }

    // Delete all analysis records for this file
    await Analysis.deleteMany({ fileId: fileId, userEmail: userEmail });

    // Delete the file record
    await File.findByIdAndDelete(fileId);

    res.status(200).json({
      success: true,
      message: 'File and associated analysis deleted successfully'
    });

  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error deleting file',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};