const fs = require('fs').promises;
const path = require('path');
const ExcelJS = require('exceljs');
const { parse } = require('csv-parse/sync');
const Analysis = require('../models/Analysis');
const File = require('../models/File');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const PDFDocument = require('pdfkit');
const { getGridFSBucket } = require('../utils/db');
const { ObjectId } = require('mongodb');
const tmp = require('tmp');

// Constants
const SUPPORTED_FORMATS = ['.xlsx', '.xls', '.csv', '.json'];

/**
 * Process Excel file
 */
async function processExcelFile(filePath) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.getWorksheet(1);
  
  const data = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header row
      
      const rowData = {};
    row.eachCell((cell, colNumber) => {
      const header = worksheet.getRow(1).getCell(colNumber).value;
        if (header) {
          rowData[header] = cell.value;
        }
      });
    if (Object.keys(rowData).length > 0) {
      data.push(rowData);
    }
  });
  
  return data;
}

/**
 * Process CSV file
 */
async function processCsvFile(filePath) {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    return parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    trim: true
    });
}

/**
 * Process JSON file
 */
async function processJsonFile(filePath) {
  const fileContent = await fs.readFile(filePath, 'utf-8');
  const data = JSON.parse(fileContent);
    return Array.isArray(data) ? data : [data];
}

/**
 * Process file based on extension
 */
async function processFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  
    switch (ext) {
      case '.xlsx':
      case '.xls':
      return await processExcelFile(filePath);
      case '.csv':
      return await processCsvFile(filePath);
      case '.json':
      return await processJsonFile(filePath);
      default:
        throw new Error(`Unsupported file format: ${ext}`);
  }
}

/**
 * Generate basic statistics from data
 */
function generateBasicStats(data) {
  if (!data || data.length === 0) {
    return { count: 0, columns: [] };
  }

  const columns = Object.keys(data[0]);
  const numericColumns = columns.filter(col => {
    const sampleValue = data[0][col];
    return typeof sampleValue === 'number' || !isNaN(Number(sampleValue));
  });

  return {
    count: data.length,
    columns: columns,
    numericColumns: numericColumns
  };
}


async function saveChartImageToGridFS(type, chartData, options, userEmail) {
  const width = 800;
  const height = 600;
  const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, backgroundColour: 'white' });
  const configuration = {
    type: type,
    data: chartData,
    options: {
      ...options,
      responsive: false,
      animation: false,
      plugins: {
        legend: {
          display: options?.legend !== false
        }
      }
    }
  };
  const image = await chartJSNodeCanvas.renderToBuffer(configuration);
  const gridfsBucket = await getGridFSBucket();
  const filename = `chart_${type}_${Date.now()}.png`;
  return await new Promise((resolve, reject) => {
    const uploadStream = gridfsBucket.openUploadStream(filename, {
      contentType: 'image/png',
      metadata: { userEmail }
    });
    uploadStream.end(image);
    uploadStream.on('finish', () => resolve(uploadStream.id.toString()));
    uploadStream.on('error', reject);
  });
}

/**
 * Main analysis controller - Get basic file info and columns
 */
exports.getAnalysis = async (req, res) => {
  try {
    const { fileId } = req.query;
    const userEmail = req.user?.email;

    console.log('[Analysis] Request:', { fileId, userEmail });

    // Validate input
    if (!fileId) {
      return res.status(400).json({
        success: false,
        message: 'File ID is required',
        errorType: 'missing_fileId'
      });
    }

    if (!userEmail) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        errorType: 'not_authenticated'
      });
    }

    let file = null;
    try {
      file = await File.findById(fileId);
    } catch (error) {
      console.log('[Analysis] File not found in database, checking uploads directory');
      return res.status(404).json({
        success: false,
        message: 'File not found',
        errorType: 'file_not_found'
      });
    }

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found',
        errorType: 'file_not_found'
      });
    }

    // Download file from GridFS to temp file
    let data;
    try {
      const gridfsBucket = await getGridFSBucket();
      const downloadStream = gridfsBucket.openDownloadStream(new ObjectId(file.gridFsId));
      const chunks = [];
      await new Promise((resolve, reject) => {
        downloadStream.on('data', chunk => chunks.push(chunk));
        downloadStream.on('end', resolve);
        downloadStream.on('error', reject);
      });
      const fileBuffer = Buffer.concat(chunks);
      const ext = path.extname(file.originalName).toLowerCase();
      const tmpFile = tmp.fileSync({ postfix: ext });
      require('fs').writeFileSync(tmpFile.name, fileBuffer);
      data = await processFile(tmpFile.name);
      tmpFile.removeCallback();
    } catch (error) {
      console.error('[Analysis] File processing error:', error);
      return res.status(400).json({
        success: false,
        message: `Error processing file: ${error.message}`,
        errorType: 'file_processing_error'
      });
    }

    if (!data || data.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No data found in file',
        errorType: 'no_data'
      });
    }

    // Generate basic statistics
    const stats = generateBasicStats(data);

        return res.status(200).json({
          success: true,
      data: {
        totalRows: stats.count,
        totalColumns: stats.columns.length,
        numericColumns: stats.numericColumns.length,
        allColumns: stats.columns
      }
    });
  } catch (error) {
    console.error('[Analysis] Unexpected error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      errorType: 'server_error'
    });
  }
};

/**
 * Generate chart controller
 */
exports.generateChart = async (req, res) => {
  try {
    const { fileId, chartType, xAxis, yAxis } = req.body;
    const userEmail = req.user?.email;

    console.log('[GenerateChart] Request:', { fileId, chartType, xAxis, yAxis, userEmail });

    // Validate input
    if (!fileId || !chartType || !xAxis || !yAxis) {
      return res.status(400).json({
        success: false,
        message: 'File ID, chart type, X axis, and Y axis are required',
        errorType: 'missing_parameters'
      });
    }

    if (!userEmail) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        errorType: 'not_authenticated'
      });
    }

    // Get file from database
    let file = null;
    try {
      file = await File.findById(fileId);
    } catch (error) {
      console.log('[GenerateChart] File not found in database');
      return res.status(404).json({
        success: false,
        message: 'File not found',
        errorType: 'file_not_found'
      });
    }

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found',
        errorType: 'file_not_found'
      });
    }

    // Download file from GridFS to temp file
    let data;
    try {
      const gridfsBucket = await getGridFSBucket();
      const downloadStream = gridfsBucket.openDownloadStream(new ObjectId(file.gridFsId));
      const chunks = [];
      await new Promise((resolve, reject) => {
        downloadStream.on('data', chunk => chunks.push(chunk));
        downloadStream.on('end', resolve);
        downloadStream.on('error', reject);
      });
      const fileBuffer = Buffer.concat(chunks);
      const ext = path.extname(file.originalName).toLowerCase();
      const tmpFile = tmp.fileSync({ postfix: ext });
      require('fs').writeFileSync(tmpFile.name, fileBuffer);
      data = await processFile(tmpFile.name);
      tmpFile.removeCallback();
    } catch (error) {
      console.error('[GenerateChart] File processing error:', error);
      return res.status(400).json({
        success: false,
        message: `Error processing file: ${error.message}`,
        errorType: 'file_processing_error'
      });
    }

    if (!data || data.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No data found in file',
        errorType: 'no_data'
      });
    }

    // Validate axes exist in data
    const columns = Object.keys(data[0]);
    if (!columns.includes(xAxis) || !columns.includes(yAxis)) {
          return res.status(400).json({
        success: false,
        message: 'Selected axes do not exist in the data',
        errorType: 'invalid_axes'
      });
    }

    // Generate chart data
    const labels = data.map(row => row[xAxis]);
    const values = data.map(row => Number(row[yAxis]));
    
    const chartData = {
      labels,
      datasets: [{
        label: yAxis,
        data: values,
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }]
    };

    // Save chart image to GridFS
    const reportGridFsId = await saveChartImageToGridFS(chartType, chartData, {}, userEmail);
    // Save analysis
    let analysis;
    try {
      analysis = await Analysis.create({
        userEmail,
        fileId,
        fileName: file.originalName,
        chartType,
        xAxis,
        yAxis,
        reportGridFsId
      });
      console.log('[GenerateChart] Saved to database');
    } catch (error) {
      console.log('[GenerateChart] Error saving to database:', error);
      // Continue even if saving fails
    }

      return res.status(200).json({
      success: true,
      data: {
        reportGridFsId,
        chartData: chartData
      }
    });
  } catch (error) {
    console.error('[GenerateChart] Unexpected error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      errorType: 'server_error'
    });
  }
};

/**
 * Get analysis history
 */
exports.getAnalysisHistory = async (req, res) => {
  try {
    const userEmail = req.user?.email;
    const { fileId } = req.query;

    console.log('[Analysis History] Request received:', { userEmail, fileId });

    if (!userEmail) {
      console.log('[Analysis History] No user email found');
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const query = { userEmail };
    if (fileId) {
      query.fileId = fileId;
    }

    console.log('[Analysis History] Query:', query);

    const analyses = await Analysis.find(query)
      .sort({ createdAt: -1 })
      .limit(50);

    console.log('[Analysis History] Found analyses:', analyses.length);

    return res.status(200).json({
      success: true,
      data: analyses
    });

  } catch (error) {
    console.error('[Analysis History] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Export analysis data
 */
exports.exportAnalysis = async (req, res) => {
  try {
    const { fileId, chartType, xAxis, yAxis, format = 'png' } = req.query;
    const userEmail = req.user?.email;
    const sharp = require('sharp');
    const PDFDocument = require('pdfkit');
    const path = require('path');

    console.log('[ExportAnalysis] Request:', { fileId, chartType, xAxis, yAxis, format, userEmail });

    if (!userEmail) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Only look up the analysis record, do not generate on-demand
    const analysis = await Analysis.findOne({
      fileId,
      userEmail,
      chartType,
      xAxis,
      yAxis
    }).sort({ createdAt: -1 });
    if (!analysis) {
      console.log('[ExportAnalysis] Analysis not found for', { fileId, userEmail, chartType, xAxis, yAxis });
      return res.status(404).json({
        success: false,
        message: 'Analysis not found for the specified chart options.'
      });
    }
    if (!analysis.reportGridFsId) {
      console.log('[ExportAnalysis] No chart image found for analysis');
      return res.status(404).json({
        success: false,
        message: 'No chart image found for this analysis.'
      });
    }
    const gridfsBucket = await getGridFSBucket();
    const downloadStream = gridfsBucket.openDownloadStream(new ObjectId(analysis.reportGridFsId));
    const chunks = [];
    await new Promise((resolve, reject) => {
      downloadStream.on('data', chunk => chunks.push(chunk));
      downloadStream.on('end', resolve);
      downloadStream.on('error', reject);
    });
    const imageBuffer = Buffer.concat(chunks);
    let contentType;
    let filename;
    if (format === 'pdf') {
      contentType = 'application/pdf';
      filename = `chart_${analysis.chartType}_${Date.now()}.pdf`;
      const doc = new PDFDocument({ autoFirstPage: false });
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      doc.pipe(res);
      doc.addPage({ size: [800, 600] });
      doc.image(imageBuffer, 0, 0, { width: 800, height: 600 });
      doc.end();
      return;
    } else if (format === 'jpg' || format === 'jpeg' || format === 'png') {
      contentType = format === 'png' ? 'image/png' : 'image/jpeg';
      filename = `chart_${analysis.chartType}_${Date.now()}.${format}`;
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      // Convert if needed
      if (format === 'png') {
        return res.end(imageBuffer);
      } else {
        const converted = await sharp(imageBuffer).toFormat(format === 'jpg' ? 'jpeg' : format).toBuffer();
        return res.end(converted);
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Unsupported export format. Only PDF, JPG, and PNG are allowed.'
      });
    }
  } catch (error) {
    console.error('[Export Analysis] Unexpected error:', error);
            return res.status(500).json({
                success: false,
      message: 'Internal server error: ' + error.message
        });
    }
};

/**
 * Helper function to convert data to CSV
 */
function convertToCSV(data) {
  // Simple CSV conversion - can be enhanced based on data structure
  if (!data || typeof data !== 'object') {
    return '';
  }

  const rows = [];
  
  // Add headers
  const headers = Object.keys(data);
  rows.push(headers.join(','));
  
  // Add data row
  const values = headers.map(header => {
    const value = data[header];
    return typeof value === 'string' ? `"${value}"` : value;
  });
  rows.push(values.join(','));
  
  return rows.join('\n');
}