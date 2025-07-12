const fs = require('fs').promises;
const path = require('path');
const ExcelJS = require('exceljs');
const { parse } = require('csv-parse/sync');
const { createObjectCsvStringifier } = require('csv-writer');
const Analysis = require('../models/Analysis');

// Constants
const SUPPORTED_FORMATS = ['.xlsx', '.xls', '.csv', '.json'];
const UPLOADS_DIR = path.join(__dirname, '../../uploads');
const TEMP_DIR = path.join(__dirname, '../../temp');

// Ensure temp directory exists
async function ensureTempDir() {
  try {
    await fs.mkdir(TEMP_DIR, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
  }
}

/**
 * Process Excel file using ExcelJS
 */
async function processExcelFile(filePath) {
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.worksheets[0];
    const rows = [];
    
    // Get headers from first row
    const headerRow = worksheet.getRow(1);
    const headers = headerRow.values
      .filter(Boolean) // Remove empty cells
      .map(String);    // Convert all headers to strings

    // Process each row
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header row
      
      const rowData = {};
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const header = headers[colNumber - 1];
        if (header) {
          rowData[header] = cell.value;
        }
      });
      rows.push(rowData);
    });

    return rows;
  } catch (error) {
    console.error(`Error processing Excel file ${filePath}:`, error);
    throw new Error(`Failed to process Excel file: ${error.message}`);
  }
}

/**
 * Process CSV file using csv-parse
 */
async function processCsvFile(filePath) {
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    return parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      skip_records_with_error: true
    });
  } catch (error) {
    console.error(`Error processing CSV file ${filePath}:`, error);
    throw new Error(`Failed to process CSV file: ${error.message}`);
  }
}

/**
 * Process JSON file
 */
async function processJsonFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(content);
    return Array.isArray(data) ? data : [data];
  } catch (error) {
    console.error(`Error processing JSON file ${filePath}:`, error);
    throw new Error(`Failed to process JSON file: ${error.message}`);
  }
}

/**
 * Process any supported file type
 */
async function processFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  
  console.log(`Processing file: ${filePath}, extension: ${ext}`);
  
  try {
    let result;
    switch (ext) {
      case '.xlsx':
      case '.xls':
        console.log('Processing Excel file...');
        result = await processExcelFile(filePath);
        break;
      case '.csv':
        console.log('Processing CSV file...');
        result = await processCsvFile(filePath);
        break;
      case '.json':
        console.log('Processing JSON file...');
        result = await processJsonFile(filePath);
        break;
      default:
        throw new Error(`Unsupported file format: ${ext}`);
    }
    
    console.log(`File processing complete. Rows: ${result?.length || 0}`);
    if (result && result.length > 0) {
      console.log('Sample row:', result[0]);
    }
    
    return result;
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
    throw error;
  }
}

/**
 * Aggregate data for analysis
 */
function aggregateData(rows) {
  if (!rows || !rows.length) {
    return { totalRows: 0, numericColumns: [], stats: {} };
  }

  // Find all numeric columns
  const numericColumns = Object.keys(rows[0] || {}).filter(key => 
    rows.some(row => !isNaN(parseFloat(row[key])))
  );

  // Calculate statistics for each numeric column
  const stats = numericColumns.reduce((acc, col) => {
    const values = rows
      .map(row => parseFloat(row[col]))
      .filter(v => !isNaN(v));

    if (values.length === 0) return acc;

    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);
    
    acc[col] = { sum, avg, max, min, count: values.length };
    return acc;
  }, {});

  return {
    totalRows: rows.length,
    numericColumns,
    stats
  };
}

/**
 * Generate chart data for overview
 */
function generateOverviewChart(rows) {
  const monthlyData = {};
  const weeklyData = {};
  const now = new Date();
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

  // Initialize monthly data
  for (let d = new Date(oneYearAgo); d <= now; d.setMonth(d.getMonth() + 1)) {
    const month = d.toLocaleString('default', { month: 'short', year: '2-digit' });
    monthlyData[month] = 0;
  }

  // Initialize weekly data
  for (let i = 0; i < 12; i++) {
    weeklyData[`Week ${i + 1}`] = 0;
  }

  // Process each row
  rows.forEach(item => {
    if (!item.date) return;

    const date = new Date(item.date);
    if (isNaN(date.getTime())) return;

    const month = date.toLocaleString('default', { month: 'short', year: '2-digit' });
    const week = Math.ceil(((date - oneYearAgo) / (1000 * 60 * 60 * 24)) / 7);
    const amount = parseFloat(item.amount || item.price || item.total || 0);

    if (monthlyData[month] !== undefined) {
      monthlyData[month] += amount;
    }

    const weekKey = `Week ${Math.min(week, 12)}`;
    weeklyData[weekKey] = (weeklyData[weekKey] || 0) + amount;
  });

  return {
    monthly: {
      labels: Object.keys(monthlyData),
      datasets: [{
        label: 'Monthly Sales',
        data: Object.values(monthlyData),
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 2
      }]
    },
    weekly: {
      labels: Object.keys(weeklyData),
      datasets: [{
        label: 'Weekly Sales',
        data: Object.values(weeklyData),
        backgroundColor: 'rgba(99, 102, 241, 0.5)',
        borderColor: 'rgb(99, 102, 241)',
        borderWidth: 2
      }]
    }
  };
}

/**
 * Generate product analysis
 */
function generateProductAnalysis(rows) {
  const products = {};

  rows.forEach(item => {
    const productName = item.product || item.name || 'Unknown';
    const price = parseFloat(item.price || item.amount || 0);
    const quantity = parseInt(item.quantity || 1, 10);
    const category = item.category || 'Uncategorized';

    if (!products[productName]) {
      products[productName] = {
        category,
        totalSales: 0,
        totalQuantity: 0,
        prices: [],
        orders: 0
      };
    }

    products[productName].totalSales += price * quantity;
    products[productName].totalQuantity += quantity;
    products[productName].prices.push(price);
    products[productName].orders += 1;
  });

  // Calculate additional metrics
  Object.values(products).forEach(product => {
    product.avgPrice = product.prices.reduce((a, b) => a + b, 0) / product.prices.length;
    product.avgOrderValue = product.totalSales / product.orders;
  });

  return products;
}

/**
 * Generate customer analysis
 */
function generateCustomerAnalysis(rows) {
  const customers = {};

  rows.forEach(item => {
    const email = item.email || item.customerEmail || 'unknown@example.com';
    const name = item.customerName || `Customer ${Object.keys(customers).length + 1}`;
    const amount = parseFloat(item.amount || item.price || 0);

    if (!customers[email]) {
      customers[email] = {
        name,
        orderCount: 0,
        totalSpent: 0,
        firstOrder: new Date(),
        lastOrder: new Date(0),
        orders: []
      };
    }

    const orderDate = item.date ? new Date(item.date) : new Date();
    customers[email].orderCount += 1;
    customers[email].totalSpent += amount;
    customers[email].orders.push({ date: orderDate, amount });
    
    if (orderDate < customers[email].firstOrder) {
      customers[email].firstOrder = orderDate;
    }
    if (orderDate > customers[email].lastOrder) {
      customers[email].lastOrder = orderDate;
    }
  });

  return customers;
}

/**
 * Generate sales analysis
 */
function generateSalesAnalysis(rows) {
  const salesByStatus = {
    'Completed': 0,
    'Pending': 0,
    'Cancelled': 0
  };

  const salesByCategory = {};
  const salesByDate = {};

  rows.forEach(item => {
    const status = item.status || 'Completed';
    const category = item.category || 'Uncategorized';
    const date = item.date ? new Date(item.date).toISOString().split('T')[0] : 'Unknown Date';
    const amount = parseFloat(item.amount || item.price || 0);

    // Sales by status
    salesByStatus[status] = (salesByStatus[status] || 0) + amount;

    // Sales by category
    if (!salesByCategory[category]) {
      salesByCategory[category] = 0;
    }
    salesByCategory[category] += amount;

    // Sales by date
    if (!salesByDate[date]) {
      salesByDate[date] = 0;
    }
    salesByDate[date] += amount;
  });

  return {
    salesByStatus,
    salesByCategory,
    salesByDate
  };
}

/**
 * Main analysis controller
 */
exports.getAnalysis = async (req, res, next) => {
  try {
    const { type = 'overview', dateRange = '7d', fileId, fetchOnly, generateNew } = req.query;
    

    
    if (!fileId) {
      return res.status(400).json({
        success: false,
        message: 'File ID is required'
      });
    }

    // 1. Get the specific file
    const File = require('../models/File');
    const file = await File.findById(fileId);
    
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Check if user has permission to access this file
    if (file.userEmail && file.userEmail !== req.user?.email) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this file'
      });
    }

    // 2. Check if analysis already exists in database
    const existingAnalysis = await Analysis.findOne({
      fileId: fileId,
      type: type,
      userEmail: req.user?.email
    }).sort({ createdAt: -1 });

    console.log(`Existing analysis check: ${existingAnalysis ? 'Found' : 'Not found'}`);

    // If fetchOnly is true, only return existing analysis
    if (fetchOnly === 'true') {
      if (!existingAnalysis) {
        return res.status(200).json({
          success: true,
          message: 'No existing analysis found',
          data: null
        });
      }
      
      if (!existingAnalysis.hasData) {
        return res.status(200).json({
          success: true,
          message: 'No data found for this analysis',
          data: null
        });
      }

      console.log(`Returning existing analysis for file ${file.originalName}, type: ${type}`);
      return res.status(200).json({
        success: true,
        data: existingAnalysis.data
      });
    }

    // If generateNew is true or no existing analysis, generate new analysis
    if (generateNew === 'true' || !existingAnalysis) {
      console.log(`Generating new analysis for file ${file.originalName}, type: ${type}`);
    } else {
      console.log(`Found existing analysis for file ${file.originalName}, type: ${type}`);
      
      if (!existingAnalysis.hasData) {
        return res.status(200).json({
          success: true,
          message: 'No data found for this analysis',
          data: null
        });
      }

      return res.status(200).json({
        success: true,
        data: existingAnalysis.data
      });
    }

    const filePath = path.join(UPLOADS_DIR, file.filename);
    console.log(`Processing file: ${filePath}`);
    
    // Check if file exists on disk
    try {
      await fs.access(filePath);
      console.log(`File exists on disk: ${filePath}`);
    } catch (error) {
      console.error(`File not found on disk: ${filePath}`, error);
      return res.status(404).json({
        success: false,
        message: 'File not found on disk'
      });
    }

    // 2. Process the specific file
    let allData;
    try {
      console.log(`Processing file: ${filePath}`);
      allData = await processFile(filePath);
      console.log(`Processed ${allData?.length || 0} rows from file`);
    } catch (error) {
      console.error(`Error processing file ${filePath}:`, error);
      return res.status(400).json({
        success: false,
        message: `Failed to process file: ${error.message}`
      });
    }

    if (!allData || allData.length === 0) {
      console.log(`No valid data found in file: ${file.originalName}`);
      return res.status(400).json({
        success: false,
        message: 'No valid data found in file'
      });
    }

    console.log(`Processing ${allData.length} rows from file ${file.originalName}`);

    // 3. Generate analysis based on type
    let analysisData;
    let hasValidData = false;

    try {
      switch (type) {
        case 'overview': {
          console.log('Generating overview analysis...');
          const stats = aggregateData(allData);
          const charts = generateOverviewChart(allData);
          
          console.log('Overview stats:', stats);
          console.log('Overview charts:', charts);
          
          // Check if we have valid data
          hasValidData = allData.length > 0 && stats.numericColumns.length > 0;
          
          if (hasValidData) {
            analysisData = {
              summary: {
                totalSales: stats.stats.amount?.sum || 0,
                totalItems: allData.length,
                avgValue: stats.stats.amount?.avg || 0,
                dataPoints: allData.length
              },
              chartData: charts.monthly, // Use monthly chart for overview
              totalSales: stats.stats.amount?.sum || 0,
              totalItems: allData.length,
              avgValue: stats.stats.amount?.avg || 0,
              dataPoints: allData.length
            };
          }
          break;
        }

        case 'products': {
          console.log('Generating products analysis...');
          const products = generateProductAnalysis(allData);
          const topProducts = Object.entries(products)
            .sort((a, b) => b[1].totalSales - a[1].totalSales)
            .slice(0, 10);

          console.log('Products analysis:', { totalProducts: Object.keys(products).length, topProducts: topProducts.length });

          // Check if we have valid product data
          hasValidData = Object.keys(products).length > 0;

          if (hasValidData) {
            analysisData = {
              summary: {
                totalProducts: Object.keys(products).length,
                totalRevenue: Object.values(products).reduce((sum, p) => sum + p.totalSales, 0),
                avgPrice: Object.values(products).reduce((sum, p) => sum + p.avgPrice, 0) / Object.keys(products).length
              },
              chartData: {
                labels: topProducts.map(([name]) => name),
                datasets: [{
                  label: 'Sales by Product',
                  data: topProducts.map(([_, data]) => data.totalSales),
                  backgroundColor: topProducts.map((_, i) => 
                    `hsl(${(i * 360 / topProducts.length)}, 70%, 60%)`
                  ),
                  borderWidth: 1
                }]
              },
              tableData: topProducts.map(([name, data]) => ({
                product: name,
                sales: data.totalSales,
                percentage: (data.totalSales / Object.values(products).reduce((sum, p) => sum + p.totalSales, 0)) * 100
              }))
            };
          }
          break;
        }

        case 'sales': {
          console.log('Generating sales analysis...');
          const sales = generateSalesAnalysis(allData);
          const recentSales = allData
            .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
            .slice(0, 10);

          console.log('Sales analysis:', { salesByStatus: sales.salesByStatus, recentSales: recentSales.length });

          // Check if we have valid sales data
          hasValidData = allData.length > 0 && Object.keys(sales.salesByStatus).length > 0;

          if (hasValidData) {
            analysisData = {
              summary: {
                totalSales: Object.values(sales.salesByStatus).reduce((a, b) => a + b, 0),
                completedSales: sales.salesByStatus.Completed || 0,
                pendingSales: sales.salesByStatus.Pending || 0,
                cancelledSales: sales.salesByStatus.Cancelled || 0
              },
              chartData: sales.weekly || {
                labels: ['No Data'],
                datasets: [{
                  label: 'Sales Trend',
                  data: [0],
                  backgroundColor: 'rgba(99, 102, 241, 0.5)',
                  borderColor: 'rgb(99, 102, 241)',
                  borderWidth: 2
                }]
              },
              tableData: recentSales.map(sale => ({
                id: sale.id || Math.random().toString(36).substr(2, 9),
                date: sale.date ? new Date(sale.date).toISOString().split('T')[0] : 'N/A',
                product: sale.product || 'Unknown',
                amount: parseFloat(sale.amount || sale.price || 0).toFixed(2),
                status: sale.status || 'Completed',
                customer: sale.customerName || 'Unknown'
              }))
            };
          }
          break;
        }

        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid analysis type'
          });
      }
    } catch (analysisError) {
      console.error('Error generating analysis:', analysisError);
      return res.status(500).json({
        success: false,
        message: `Error generating ${type} analysis: ${analysisError.message}`
      });
    }

    console.log(`Analysis generation complete. hasValidData: ${hasValidData}, analysisData: ${analysisData ? 'Generated' : 'None'}`);

    // 4. Save analysis to database
    try {
      const analysisRecord = {
        user: req.user?.id || null,
        userEmail: req.user?.email || null,
        fileId: fileId,
        fileName: file.originalName,
        type,
        filters: { dateRange },
        data: analysisData || null,
        hasData: hasValidData,
        createdAt: new Date()
      };

      await Analysis.create(analysisRecord);
      console.log(`Analysis saved to database for file ${file.originalName}, type: ${type}, hasData: ${hasValidData}`);
    } catch (error) {
      console.error('Error saving analysis to database:', error);
      // Continue even if saving to DB fails
    }

    // 5. Return the analysis or no data message
    if (!hasValidData) {
      console.log('No valid data found for analysis');
      return res.status(200).json({
        success: true,
        message: 'No data found for this analysis',
        data: null
      });
    }

    console.log('Returning successful analysis');
    res.status(200).json({
      success: true,
      data: analysisData
    });

  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating analysis'
    });
  }
};

/**
 * Export analysis data
 */
exports.exportAnalysis = async (req, res, next) => {
  try {
    const { type = 'overview', format = 'csv' } = req.query;
    
    // Ensure temp directory exists
    await ensureTempDir();
    
    // Get analysis data
    const response = await exports.getAnalysis(req, res, () => {});
    if (!response) return;

    const { data } = response;
    const fileName = `analysis-${type}-${new Date().toISOString().split('T')[0]}.${format}`;
    const filePath = path.join(TEMP_DIR, fileName);

    if (format === 'csv') {
      // Convert data to CSV
      let records = [];
      
      if (type === 'products' && data.tableData) {
        records = data.tableData;
      } else if (type === 'customers' && data.tableData) {
        records = data.tableData;
      } else if (type === 'sales' && data.tableData) {
        records = data.tableData;
      } else {
        // For overview or other types, flatten the data
        records = [data.summary || data];
      }

      const csvStringifier = createObjectCsvStringifier({
        header: Object.keys(records[0] || {}).map(key => ({ id: key, title: key }))
      });

      const header = csvStringifier.getHeaderString();
      const rows = csvStringifier.stringifyRecords(records);
      const csvContent = header + rows;

      await fs.writeFile(filePath, csvContent, 'utf8');

    } else if (format === 'xlsx') {
      // Convert data to Excel
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Analysis');

      let rows = [];
      if (data.tableData) {
        // For tabular data
        if (data.tableData.length > 0) {
          // Add headers
          worksheet.columns = Object.keys(data.tableData[0]).map(key => ({
            header: key,
            key: key,
            width: 15
          }));
          // Add rows
          worksheet.addRows(data.tableData);
        }
      } else {
        // For summary data
        const summaryRows = Object.entries(data.summary || data).map(([key, value]) => ({
          Metric: key,
          Value: value
        }));
        worksheet.columns = [
          { header: 'Metric', key: 'Metric', width: 30 },
          { header: 'Value', key: 'Value', width: 20 }
        ];
        worksheet.addRows(summaryRows);
      }

      // Style header row
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD3D3D3' }
      };

      await workbook.xlsx.writeFile(filePath);
    } else {
      // Default to JSON
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
    }

    // Send the file
    res.download(filePath, fileName, (err) => {
      // Clean up the temp file after sending
      fs.unlink(filePath).catch(console.error);
      if (err) next(err);
    });

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting analysis'
    });
  }
};

/**
 * Get analysis history
 */
exports.getAnalysisHistory = async (req, res, next) => {
  try {
    const { type, limit = 10, page = 1 } = req.query;
    const query = { userEmail: req.user?.email };

    if (type) {
      query.type = type;
    }

    const analyses = await Analysis.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .select('type fileName fileId hasData createdAt');

    const total = await Analysis.countDocuments(query);

    res.status(200).json({
      success: true,
      count: analyses.length,
      total,
      data: analyses
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analysis history'
    });
  }
};

/**
 * Get specific analysis by ID
 */
exports.getAnalysisById = async (req, res, next) => {
  try {
    const analysis = await Analysis.findById(req.params.id);
    
    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Analysis not found'
      });
    }

    // Check if user has permission to view this analysis
    if (analysis.user && analysis.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this analysis'
      });
    }

    res.status(200).json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Get analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analysis'
    });
  }
};

/**
 * Delete analysis
 */
exports.deleteAnalysis = async (req, res, next) => {
  try {
    const analysis = await Analysis.findById(req.params.id);
    
    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Analysis not found'
      });
    }

    // Check if user has permission to delete this analysis
    if (analysis.user && analysis.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this analysis'
      });
    }

    await analysis.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Delete analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting analysis'
    });
  }
};

// Generate analysis with charts
const ChartGenerator = require('../utils/chartGenerator');
const File = require('../models/File');

exports.generateAnalysis = async (req, res, next) => {
    try {
        const { fileId, chartType = 'column' } = req.query;

        console.log('Generate analysis request:', { fileId, chartType, userEmail: req.user?.email });

        if (!fileId) {
            return res.status(400).json({
                success: false,
                message: 'File ID is required'
            });
        }

        // Get the file
        const file = await File.findById(fileId);
        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }

        // Check if user has permission to access this file
        if (file.userEmail && file.userEmail !== req.user?.email) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to access this file'
            });
        }

        const inputPath = path.join(__dirname, '..', 'uploads', file.filename);
        const outputPath = path.join(__dirname, '..', 'outputs', `analysis_${Date.now()}.xlsx`);

        console.log(`Processing file: ${inputPath}`);
        console.log(`Output path: ${outputPath}`);

        // Check if input file exists
        try {
            await fs.access(inputPath);
        } catch (error) {
            return res.status(404).json({
                success: false,
                message: 'Input file not found on disk'
            });
        }

        // Process the file to get data
        let fileData;
        try {
            fileData = await processFile(inputPath);
            console.log(`Processed ${fileData?.length || 0} rows from file`);
        } catch (error) {
            console.error('Error processing file:', error);
            return res.status(400).json({
                success: false,
                message: `Failed to process file: ${error.message}`
            });
        }

        if (!fileData || fileData.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid data found in file'
            });
        }

        // Create workbook and worksheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Analysis');
        
        // Add headers
        if (fileData.length > 0) {
            const headers = Object.keys(fileData[0]);
            worksheet.addRow(headers);
            
            // Add data rows
            fileData.forEach(row => {
                const rowData = headers.map(header => row[header] || '');
                worksheet.addRow(rowData);
            });
        }

        // Create chart generator
        const chartGen = new ChartGenerator(worksheet);

        // Generate charts based on chartType
        try {
            switch (chartType.toLowerCase()) {
                case 'column':
                    if (fileData.length > 0) {
                        const firstRow = fileData[0];
                        const numericColumns = Object.keys(firstRow).filter(key => 
                            !isNaN(parseFloat(firstRow[key]))
                        );
                        
                        if (numericColumns.length > 0) {
                            const categoryCol = Object.keys(firstRow)[0];
                            const valueCol = numericColumns[0];
                            
                            chartGen.createClusteredColumn(
                                'Data Analysis',
                                `A2:A${Math.min(fileData.length + 1, 10)}`,
                                `B2:B${Math.min(fileData.length + 1, 10)}`,
                                'D2'
                            );
                        }
                    }
                    break;
                    
                case 'pie':
                    if (fileData.length > 0) {
                        const firstRow = fileData[0];
                        const numericColumns = Object.keys(firstRow).filter(key => 
                            !isNaN(parseFloat(firstRow[key]))
                        );
                        
                        if (numericColumns.length > 0) {
                            chartGen.createPie(
                                'Data Distribution',
                                `A2:A${Math.min(fileData.length + 1, 5)}`,
                                `B2:B${Math.min(fileData.length + 1, 5)}`,
                                'D2'
                            );
                        }
                    }
                    break;
                    
                default:
                    return res.status(400).json({
                        success: false,
                        message: 'Unsupported chart type'
                    });
            }
        } catch (chartError) {
            console.error('Error creating chart:', chartError);
            return res.status(500).json({
                success: false,
                message: `Error creating chart: ${chartError.message}`
            });
        }

        // Save the workbook
        await workbook.xlsx.writeFile(outputPath);
        console.log(`Analysis file saved: ${outputPath}`);

        res.status(200).json({
            success: true,
            message: 'Analysis generated successfully',
            downloadUrl: `/outputs/${path.basename(outputPath)}`,
            fileName: path.basename(outputPath)
        });

    } catch (error) {
        console.error('Generate analysis error:', error);
        res.status(500).json({
            success: false,
            message: `Error generating analysis: ${error.message}`
        });
    }
};

module.exports = exports;