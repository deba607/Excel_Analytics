const File = require('../models/File');
const Analysis = require('../models/Analysis');
const path = require('path');
const ExcelJS = require('exceljs');
const { parse } = require('csv-parse/sync');
const fs = require('fs');

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
    const duplicateFiles = [];

    for (const file of req.files) {
      try {
        // Check if file with same name and size already exists for this user's email
        const existingFile = await File.findOne({ 
          originalName: file.originalname,
          size: file.size,
          userEmail // Using email instead of userId
        });

        if (existingFile) {
          // Check if file exists on disk
          const fsPath = require('path').join(__dirname, '../../uploads', existingFile.filename);
          const fsPromises = require('fs').promises;
          let fileOnDisk = false;
          try {
            await fsPromises.access(fsPath);
            fileOnDisk = true;
          } catch {
            fileOnDisk = false;
          }

          if (fileOnDisk) {
            // File exists in both DB and disk, return as success
            uploadedFiles.push({
              id: existingFile._id,
              filename: existingFile.filename,
              originalName: existingFile.originalName,
              size: existingFile.size,
              uploadedAt: existingFile.createdAt,
              message: 'File already exists, not re-uploaded.'
            });
            continue; // Skip to next file
          } else {
            // File missing on disk, allow re-upload and update DB
            existingFile.filename = file.filename;
            existingFile.path = file.path;
            existingFile.size = file.size;
            existingFile.status = 'completed';
            await existingFile.save();
            uploadedFiles.push({
              id: existingFile._id,
              filename: existingFile.filename,
              originalName: existingFile.originalName,
              size: existingFile.size,
              uploadedAt: existingFile.createdAt,
              message: 'File was missing on disk, re-uploaded and DB updated.'
            });
            continue;
          }
        }

        // If file doesn't exist, create new record
        const newFile = new File({
          filename: file.filename,
          originalName: file.originalname,
          path: file.path,
          size: file.size,
          userEmail, // Using email instead of userId
          status: 'completed',
        });

        await newFile.save();
        // Extract columns and update file
        try {
          const columns = await extractColumnsFromFile(newFile.path);
          newFile.columns = columns;
          await newFile.save();
        } catch (err) {
          console.error('Failed to extract columns:', err);
        }
        uploadedFiles.push({
          id: newFile._id,
          filename: newFile.filename,
          originalName: newFile.originalName,
          size: newFile.size,
          uploadedAt: newFile.createdAt,
          message: 'File uploaded successfully.'
        });

      } catch (fileError) {
        console.error(`Error processing file ${file.originalname}:`, fileError);
        // Continue with next file even if one fails
      }
    }

    const response = {
      success: true,
      uploadedCount: uploadedFiles.length,
      uploadedFiles
    };

    if (duplicateFiles.length > 0) {
      response.duplicateCount = duplicateFiles.length;
      response.duplicateFiles = duplicateFiles;
      response.message = 'Some files were skipped as they already exist';
    }

    // If all files were duplicates
    if (uploadedFiles.length === 0 && duplicateFiles.length > 0) {
      return res.status(200).json({
        success: true,
        message: 'All files were skipped as they already exist',
        duplicateCount: duplicateFiles.length,
        duplicateFiles
      });
    }

    res.status(201).json(response);

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

    // Delete the actual file from disk
    const fs = require('fs').promises;
    const path = require('path');
    const filePath = path.join(__dirname, '../../uploads', file.filename);
    
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error(`Error deleting file from disk: ${error.message}`);
      // Continue even if file deletion fails
    }

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