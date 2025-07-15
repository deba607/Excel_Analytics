// utils/chartGenerator.js
const ExcelJS = require('exceljs');

class ChartGenerator {
    constructor(worksheet) {
        this.worksheet = worksheet;
        this.chartId = 1;
    }

    // Create a simple column chart
    createClusteredColumn(title, categories, values, startCell) {
        try {
            // Add chart title
            const titleRow = this._parseCellPosition(startCell).row;
            const titleCol = this._parseCellPosition(startCell).col;
            this.worksheet.getCell(titleCol + 1, titleRow + 1).value = title;
            this.worksheet.getCell(titleCol + 1, titleRow + 1).font = { bold: true, size: 14 };

            // Add data summary
            const summaryRow = titleRow + 2;
            this.worksheet.getCell(titleCol + 1, summaryRow + 1).value = 'Data Summary:';
            this.worksheet.getCell(titleCol + 1, summaryRow + 1).font = { bold: true };

            // Add some basic statistics
            const dataRow = summaryRow + 1;
            this.worksheet.getCell(titleCol + 1, dataRow + 1).value = 'Total Records:';
            this.worksheet.getCell(titleCol + 2, dataRow + 1).value = this.worksheet.rowCount - 1;

            const avgRow = dataRow + 1;
            this.worksheet.getCell(titleCol + 1, avgRow + 1).value = 'Generated:';
            this.worksheet.getCell(titleCol + 2, avgRow + 1).value = new Date().toLocaleString();

            return true;
        } catch (error) {
            console.error('Error creating column chart:', error);
            throw new Error(`Failed to create column chart: ${error.message}`);
        }
    }

    // Create a simple pie chart summary
    createPie(title, categories, values, startCell) {
        try {
            // Add chart title
            const titleRow = this._parseCellPosition(startCell).row;
            const titleCol = this._parseCellPosition(startCell).col;
            this.worksheet.getCell(titleCol + 1, titleRow + 1).value = title;
            this.worksheet.getCell(titleCol + 1, titleRow + 1).font = { bold: true, size: 14 };

            // Add data summary
            const summaryRow = titleRow + 2;
            this.worksheet.getCell(titleCol + 1, summaryRow + 1).value = 'Data Summary:';
            this.worksheet.getCell(titleCol + 1, summaryRow + 1).font = { bold: true };

            // Add some basic statistics
            const dataRow = summaryRow + 1;
            this.worksheet.getCell(titleCol + 1, dataRow + 1).value = 'Total Records:';
            this.worksheet.getCell(titleCol + 2, dataRow + 1).value = this.worksheet.rowCount - 1;

            const avgRow = dataRow + 1;
            this.worksheet.getCell(titleCol + 1, avgRow + 1).value = 'Generated:';
            this.worksheet.getCell(titleCol + 2, avgRow + 1).value = new Date().toLocaleString();

            return true;
        } catch (error) {
            console.error('Error creating pie chart:', error);
            throw new Error(`Failed to create pie chart: ${error.message}`);
        }
    }

    _parseCellPosition(cell) {
        const match = cell.match(/([A-Z]+)(\d+)/);
        if (!match) return { col: 0, row: 0 };
        
        const col = match[1].toUpperCase();
        const row = parseInt(match[2], 10);
        
        // Convert column letters to 0-based index (A=0, B=1, ...)
        let colNum = 0;
        for (let i = 0; i < col.length; i++) {
            colNum = colNum * 26 + (col.charCodeAt(i) - 64);
        }
        
        return {
            col: colNum - 1,  // 0-based
            row: row - 1      // 0-based
        };
    }
}

// Example usage:
/*
async function generateReport() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Charts');
    
    // Add some sample data
    worksheet.addRows([
        ['Category', 'Value 1', 'Value 2'],
        ['A', 10, 15],
        ['B', 20, 30],
        ['C', 30, 45]
    ]);

    const chartGen = new ChartGenerator(worksheet);
    
    // Create different types of charts
    chartGen.createClusteredColumn(
        'Clustered Column',
        'A2:A4',  // Categories
        'B2:C4',  // Values
        'E2'      // Start cell
    );

    // Save the workbook
    await workbook.xlsx.writeFile('report.xlsx');
}

generateReport().catch(console.error);
*/

module.exports = ChartGenerator;