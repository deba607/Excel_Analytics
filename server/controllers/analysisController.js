const fs = require('fs').promises;
const path = require('path');
const ExcelJS = require('exceljs');
const { parse } = require('csv-parse/sync');
const Analysis = require('../models/Analysis');
const File = require('../models/File');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const PDFDocument = require('pdfkit');

// Constants
const UPLOADS_DIR = path.join(__dirname, '../uploads');
const SUPPORTED_FORMATS = ['.xlsx', '.xls', '.csv', '.json'];
const OUTPUTS_DIR = path.join(__dirname, '../output');

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

  const stats = {
    count: data.length,
    columns: columns,
    numericColumns: numericColumns
  };

  // Calculate basic stats for numeric columns
  numericColumns.forEach(col => {
    const values = data.map(row => Number(row[col])).filter(val => !isNaN(val));
    if (values.length > 0) {
      stats[col] = {
        sum: values.reduce((a, b) => a + b, 0),
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        count: values.length
      };
    }
  });

  return stats;
}

/**
 * Generate overview analysis
 */
function generateOverviewAnalysis(data) {
  const stats = generateBasicStats(data);
  
  if (stats.count === 0) {
    return { success: false, message: 'No data found' };
  }

  // Create chart data for the first numeric column
  const chartData = stats.numericColumns.length > 0 ? {
    labels: data.slice(0, 10).map((_, index) => `Row ${index + 1}`),
    datasets: [{
      label: stats.numericColumns[0],
      data: data.slice(0, 10).map(row => Number(row[stats.numericColumns[0]]) || 0),
      backgroundColor: 'rgba(54, 162, 235, 0.2)',
      borderColor: 'rgba(54, 162, 235, 1)',
      borderWidth: 1
    }]
  } : null;

  return {
    success: true,
    summary: {
      totalRows: stats.count,
      totalColumns: stats.columns.length,
      numericColumns: stats.numericColumns.length,
      sampleData: data.slice(0, 5)
    },
    chartData: chartData,
    stats: stats
  };
}

/**
 * Generate sales analysis
 */
function generateSalesAnalysis(data) {
  const stats = generateBasicStats(data);
  
  // Look for common sales-related columns
  const salesColumns = stats.columns.filter(col => 
    col.toLowerCase().includes('sales') || 
    col.toLowerCase().includes('amount') || 
    col.toLowerCase().includes('revenue') ||
    col.toLowerCase().includes('price')
  );

  if (salesColumns.length === 0) {
    return { success: false, message: 'No sales-related columns found' };
  }

  const salesData = salesColumns.map(col => {
    const values = data.map(row => Number(row[col])).filter(val => !isNaN(val));
    return {
      column: col,
      total: values.reduce((a, b) => a + b, 0),
      average: values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0,
      count: values.length
    };
  });

  return {
    success: true,
    salesData: salesData,
    summary: {
      totalSales: salesData.reduce((sum, item) => sum + item.total, 0),
      averageSale: salesData.reduce((sum, item) => sum + item.average, 0) / salesData.length,
      totalTransactions: salesData.reduce((sum, item) => sum + item.count, 0)
    }
  };
}

/**
 * Generate products analysis
 */
function generateProductsAnalysis(data) {
  const stats = generateBasicStats(data);
  
  // Look for product-related columns
  const productColumns = stats.columns.filter(col => 
    col.toLowerCase().includes('product') || 
    col.toLowerCase().includes('item') || 
    col.toLowerCase().includes('name')
  );

  if (productColumns.length === 0) {
    return { success: false, message: 'No product-related columns found' };
  }

  // Group by product and calculate stats
  const productStats = {};
  data.forEach(row => {
    const productName = row[productColumns[0]] || 'Unknown';
    if (!productStats[productName]) {
      productStats[productName] = { count: 0, sales: 0 };
    }
    productStats[productName].count++;
    
    // Add sales if available
    const salesColumns = stats.columns.filter(col => 
      col.toLowerCase().includes('sales') || 
      col.toLowerCase().includes('amount')
    );
    if (salesColumns.length > 0) {
      const salesValue = Number(row[salesColumns[0]]) || 0;
      productStats[productName].sales += salesValue;
    }
  });

  const topProducts = Object.entries(productStats)
    .sort((a, b) => b[1].sales - a[1].sales)
    .slice(0, 10);

  return {
    success: true,
    products: productStats,
    topProducts: topProducts,
    summary: {
      totalProducts: Object.keys(productStats).length,
      totalSales: Object.values(productStats).reduce((sum, product) => sum + product.sales, 0),
      averageSales: Object.values(productStats).reduce((sum, product) => sum + product.sales, 0) / Object.keys(productStats).length
    }
  };
}

/**
 * Helper to ensure output directory exists
 */
async function ensureOutputDir() {
  try {
    await fs.mkdir(OUTPUTS_DIR, { recursive: true });
  } catch (err) {
    // Ignore if already exists
  }
}

/**
 * Helper to save chart image
 */
async function saveChartImage(type, chartData, options, filename) {
  const width = 800;
  const height = 600;
  const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });
  const buffer = await chartJSNodeCanvas.renderToBuffer({
    type,
    data: chartData,
    options: options || { responsive: false }
  });
  const outPath = path.join(OUTPUTS_DIR, filename);
  await fs.writeFile(outPath, buffer);
  return outPath;
}

/**
 * Helper to generate PDF report
 */
async function generatePDFReport(summary, chartImagePaths, filename) {
  const outPath = path.join(OUTPUTS_DIR, filename);
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(outPath);
    doc.pipe(stream);
    doc.fontSize(20).text('Analysis Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text('Summary:', { underline: true });
    doc.moveDown();
    Object.entries(summary).forEach(([key, value]) => {
      doc.text(`${key}: ${JSON.stringify(value)}`);
    });
    doc.moveDown();
    doc.fontSize(12).text('Charts:', { underline: true });
    chartImagePaths.forEach((imgPath) => {
      doc.addPage();
      doc.image(imgPath, { fit: [500, 400], align: 'center' });
      doc.moveDown();
      doc.text(imgPath, { align: 'center', fontSize: 8 });
    });
    doc.end();
    stream.on('finish', () => resolve(outPath));
    stream.on('error', reject);
  });
}

/**
 * Main analysis controller - Direct file processing
 */
exports.getAnalysis = async (req, res) => {
  try {
    const { fileId, type = 'overview', chartType = 'bar', xAxis, yAxis, options } = req.query;
    const userEmail = req.user?.email;

    console.log('[Analysis] Request:', { fileId, type, chartType, xAxis, yAxis, options, userEmail });

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

    // Try to get file from database first
    let file = null;
    try {
      file = await File.findById(fileId);
    } catch (error) {
      console.log('[Analysis] File not found in database, checking uploads directory');
    }

    let filePath;
    let fileName = 'Unknown';

    // List all files in uploads directory for debugging
    try {
      const filesInUploads = await fs.readdir(UPLOADS_DIR);
      console.log('[Analysis] Files in uploads directory:', filesInUploads);
    } catch (err) {
      console.error('[Analysis] Could not read uploads directory:', err);
    }

    if (file) {
      // File exists in database
      filePath = path.join(UPLOADS_DIR, file.filename);
      fileName = file.originalName;
      console.log('[Analysis] Using filename from DB:', file.filename);
      // Double-check if file exists on disk
      try {
        await fs.access(filePath);
        console.log('[Analysis] File found on disk (from DB):', filePath);
      } catch (error) {
        console.error('[Analysis] File listed in DB but not found on disk:', filePath);
        return res.status(404).json({
          success: false,
          message: 'File listed in database but not found on disk',
          errorType: 'file_not_on_disk'
        });
      }
    } else {
      // File not in database, check uploads directory
      console.log('[Analysis] Checking uploads directory for fileId:', fileId);
      try {
        const files = await fs.readdir(UPLOADS_DIR);
        // Look for files that might match the fileId or contain it
        const matchingFile = files.find(f => f.includes(fileId) || f.startsWith(fileId));
        if (matchingFile) {
          filePath = path.join(UPLOADS_DIR, matchingFile);
          fileName = matchingFile;
          console.log('[Analysis] Found file in uploads by fileId:', matchingFile);
        } else {
          console.error('[Analysis] No file found in uploads matching fileId:', fileId);
          return res.status(404).json({
            success: false,
            message: 'File not found in database or uploads directory',
            errorType: 'file_not_found'
          });
        }
      } catch (error) {
        console.error('[Analysis] Error reading uploads directory:', error);
        return res.status(404).json({
          success: false,
          message: 'Uploads directory not accessible',
          errorType: 'uploads_not_accessible'
        });
      }
    }

    // Process file
    let data;
    try {
      console.log('[Analysis] Processing file:', fileName);
      data = await processFile(filePath);
      console.log('[Analysis] Processed file:', { rows: data.length, file: fileName });
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

    // Generate analysis based on type
    let analysisResult;
    switch (type) {
      case 'overview':
        analysisResult = generateOverviewAnalysis(data);
        break;
      case 'sales':
        analysisResult = generateSalesAnalysis(data);
        break;
      case 'products':
        analysisResult = generateProductsAnalysis(data);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid analysis type',
          errorType: 'invalid_type'
        });
    }

    if (!analysisResult.success) {
      return res.status(400).json({
        success: false,
        message: analysisResult.message,
        errorType: 'analysis_failed'
      });
    }

    await ensureOutputDir();

    // --- Chart Generation Section ---
    // Determine chart data based on xAxis and yAxis
    let chartData = analysisResult.chartData;
    if (xAxis && yAxis && data.length > 0) {
      // Build chartData dynamically from selected axes
      const labels = data.map(row => row[xAxis]);
      const values = data.map(row => Number(row[yAxis]));
      chartData = {
        labels,
        datasets: [{
          label: yAxis,
          data: values,
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }]
      };
    }

    // Chart options (grid, legend, values)
    let chartOptions = { responsive: false };
    if (options) {
      try {
        const parsed = typeof options === 'string' ? JSON.parse(options) : options;
        chartOptions = { ...chartOptions, ...parsed };
      } catch (e) { /* ignore */ }
    }

    // Only generate the requested chart type
    const chartImages = [];
    let chartImagePath = null;
    if (chartData) {
      try {
        const filename = `chart_${chartType}_${Date.now()}.png`;
        chartImagePath = await saveChartImage(chartType, chartData, chartOptions, filename);
        chartImages.push(chartImagePath);
      } catch (err) {
        console.error(`[Analysis] Failed to generate ${chartType} chart:`, err);
      }
    }

    // Generate PDF report
    let reportPath = null;
    try {
      reportPath = await generatePDFReport(analysisResult.summary || {}, chartImages, `report_${Date.now()}.pdf`);
    } catch (err) {
      console.error('[Analysis] Failed to generate PDF report:', err);
    }

    // Save analysis to database if file exists in DB
    if (file) {
      try {
        await Analysis.create({
          userEmail: userEmail,
          fileId: file._id,
          fileName: file.originalName,
          type: type,
          data: analysisResult,
          hasData: true,
          chartImages,
          reportPath
        });
        console.log('[Analysis] Saved to database with chart images and report');
      } catch (error) {
        console.log('[Analysis] Error saving to database:', error);
        // Continue even if saving fails
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        ...analysisResult,
        chartImages,
        reportPath
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
 * Get analysis history
 */
exports.getAnalysisHistory = async (req, res) => {
  try {
    const userEmail = req.user?.email;
    const { fileId } = req.query;

    if (!userEmail) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const query = { userEmail };
    if (fileId) {
      query.fileId = fileId;
    }

    const analyses = await Analysis.find(query)
      .sort({ createdAt: -1 })
      .limit(50);

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
    const { fileId, type, format = 'json' } = req.query;
    const userEmail = req.user?.email;

    if (!userEmail) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Get the latest analysis
    const analysis = await Analysis.findOne({
      fileId,
      type,
      userEmail
    }).sort({ createdAt: -1 });

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Analysis not found'
      });
    }

    let exportData;
    let contentType;
    let filename;

    switch (format) {
      case 'json':
        exportData = JSON.stringify(analysis.data, null, 2);
        contentType = 'application/json';
        filename = `analysis_${type}_${Date.now()}.json`;
        break;
      case 'csv':
        // Convert to CSV format
        const csvData = convertToCSV(analysis.data);
        exportData = csvData;
        contentType = 'text/csv';
        filename = `analysis_${type}_${Date.now()}.csv`;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Unsupported export format'
        });
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(exportData);

  } catch (error) {
    console.error('[Export Analysis] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
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