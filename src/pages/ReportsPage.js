import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import SalesSummary from '../components/SalesSummary';
import ChartComponent from '../components/ChartComponent';
import { useNotification } from '../components/NotificationSystem';
import { exportAsCSV } from '../utils/dataImportExport';
import { ComponentLoader } from '../components/LoadingState';
import ProfilePicture from '../components/ProfilePicture';

const ReportsPage = ({ isAdmin, onNavigate, onLogout, profileImage, onProfileUpdate }) => {
  const [reportType, setReportType] = useState('sales');
  const [dateRange, setDateRange] = useState({
    start: '2025-04-01',
    end: '2025-04-12'
  });

  // Loading and report states
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState(null);

  // Get notification functions
  const { success, error: showError } = useNotification();

// Create a utility function to properly format dates for CSV export
function formatDateForCSV(dateString) {
  // Format date as DD/MM/YYYY which Excel typically recognizes as a date
  const date = new Date(dateString);
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}


  // Sample data for sales report
  const salesData = [
    { date: '2025-04-01', amount: 1250.45 },
    { date: '2025-04-02', amount: 980.20 },
    { date: '2025-04-03', amount: 1578.99 },
    { date: '2025-04-04', amount: 890.50 },
    { date: '2025-04-05', amount: 2100.75 },
    { date: '2025-04-06', amount: 760.30 },
    { date: '2025-04-07', amount: 1340.15 },
    { date: '2025-04-08', amount: 1670.60 },
    { date: '2025-04-09', amount: 990.25 },
    { date: '2025-04-10', amount: 1430.80 },
    { date: '2025-04-11', amount: 1890.40 },
    { date: '2025-04-12', amount: 1570.50 },
  ];

  // Sample data for product performance
  const productPerformance = [
    { product: 'Laptop', quantity: 15, amount: 14999.85, profit: 3749.85 },
    { product: 'Headphones', quantity: 28, amount: 1679.72, profit: 699.72 },
    { product: 'Office Chair', quantity: 12, amount: 1799.88, profit: 599.88 },
    { product: 'Desk Lamp', quantity: 20, amount: 599.80, profit: 299.80 },
    { product: 'Wireless Mouse', quantity: 35, amount: 874.65, profit: 454.65 },
  ];

  // Sample data for inventory report
  const inventoryData = [
    { product: 'Laptop', currentStock: 15, minStockLevel: 10, status: 'OK', lastRestock: '2025-04-05', avgMonthlySales: 12 },
    { product: 'Headphones', currentStock: 30, minStockLevel: 15, status: 'OK', lastRestock: '2025-04-02', avgMonthlySales: 25 },
    { product: 'Office Chair', currentStock: 8, minStockLevel: 10, status: 'LOW', lastRestock: '2025-03-28', avgMonthlySales: 12 },
    { product: 'Desk Lamp', currentStock: 5, minStockLevel: 5, status: 'CRITICAL', lastRestock: '2025-03-25', avgMonthlySales: 8 },
    { product: 'Wireless Mouse', currentStock: 3, minStockLevel: 8, status: 'CRITICAL', lastRestock: '2025-03-22', avgMonthlySales: 15 },
  ];

  // Sample data for profit report
  const profitData = [
    { product: 'Laptop', qtySold: 15, revenue: 14999.85, cost: 11250.00, profit: 3749.85, margin: '25.0%' },
    { product: 'Headphones', qtySold: 28, revenue: 1679.72, cost: 980.00, profit: 699.72, margin: '41.7%' },
    { product: 'Office Chair', qtySold: 12, revenue: 1799.88, cost: 1200.00, profit: 599.88, margin: '33.3%' },
    { product: 'Desk Lamp', qtySold: 20, revenue: 599.80, cost: 300.00, profit: 299.80, margin: '50.0%' },
    { product: 'Wireless Mouse', qtySold: 35, revenue: 874.65, cost: 420.00, profit: 454.65, margin: '52.0%' },
  ];

const [updateSuccess, setUpdateSuccess] = useState(false);

    const handleProfileImageChange = (newImage) => {
      // Call the parent handler to update the profile image in App.js
      if (onProfileUpdate) {
        onProfileUpdate(newImage);
        
        // Show success message briefly
        setUpdateSuccess(true);
        setTimeout(() => {
          setUpdateSuccess(false);
        }, 3000);
      }
    };
    

    const handleSaveSettings = () => {
      // In a real application, you would save these settings to a database
      // For now, just show a success message
      setUpdateSuccess(true);
      setTimeout(() => {
        setUpdateSuccess(false);
      }, 3000);
    };


  // Function to generate report based on current filters
  const handleGenerateReport = () => {
    setIsLoading(true);
    
    // Simulate API call with timeout
    setTimeout(() => {
      let filteredData;
      
      // Filter data based on date range
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      
      switch (reportType) {
        case 'sales':
          filteredData = salesData.filter(item => {
            const itemDate = new Date(item.date);
            return itemDate >= startDate && itemDate <= endDate;
          });
          break;
        case 'inventory':
          filteredData = inventoryData;
          break;
        case 'products':
          filteredData = productPerformance;
          break;
        case 'profit':
          filteredData = profitData;
          break;
        default:
          filteredData = [];
      }
      
      setReportData({
        type: reportType,
        dateRange: { ...dateRange },
        data: filteredData
      });
      
      setIsLoading(false);
      success('Report generated successfully!');
    }, 800);
  };
  
  // Load initial report data on component mount
  // Add this instead
useEffect(() => {
  // Initialize with empty data or just set loading to false
  setIsLoading(false);
  
  // Optional: Set initial empty report data
  setReportData({
    type: reportType,
    dateRange: { ...dateRange },
    data: [] // Empty data array
  });
}, []);
  
  // Function to export report data as CSV
  const handleExportCSV = () => {
    if (!reportData || !reportData.data?.length) {
      showError('No data available to export');
      return;
    }
    
    try {
      let filename;
      let formattedData = [...reportData.data];
      
      // Format date fields based on report type
      if (reportData.type === 'sales') {
        formattedData = formattedData.map(item => ({
          ...item,
          date: formatDateForCSV(item.date)
        }));
      } else if (reportData.type === 'inventory') {
        formattedData = formattedData.map(item => ({
          ...item,
          lastRestock: formatDateForCSV(item.lastRestock)
        }));
      }
      switch (reportData.type) {
        case 'sales':
          filename = `sales_report_${reportData.dateRange.start}_to_${reportData.dateRange.end}.csv`;
          break;
        case 'inventory':
          filename = 'inventory_status_report.csv';
          break;
        case 'products':
          filename = 'product_performance_report.csv';
          break;
        case 'profit':
          filename = 'profit_analysis_report.csv';
          break;
        default:
          filename = 'report.csv';
      }
      
      exportAsCSV(formattedData, filename);
      success(`Report exported successfully as ${filename}`);
    } catch (err) {
      showError('Failed to export data. Please try again.');
      console.error('Export error:', err);
    }
  };
  
  // Function to print report
  const handlePrint = () => {
    if (!reportData || !reportData.data?.length) {
      showError('No data available to print');
      return;
    }
    
    try {
      // Store current document title
      const originalTitle = document.title;
      
      // Set new title for the print
      let reportTitle;
      
      switch (reportData.type) {
        case 'sales':
          reportTitle = `Sales Report (${reportData.dateRange.start} to ${reportData.dateRange.end})`;
          break;
        case 'inventory':
          reportTitle = 'Inventory Status Report';
          break;
        case 'products':
          reportTitle = 'Product Performance Report';
          break;
        case 'profit':
          reportTitle = 'Profit Analysis Report';
          break;
        default:
          reportTitle = 'Report';
      }
      
      document.title = reportTitle;
      
      // Create a window for printing
      const printWindow = window.open('', '_blank');
      
      // Create print styles
      const styles = `
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
          }
          h1 {
            font-size: 18px;
            margin-bottom: 10px;
          }
          .report-date {
            font-size: 14px;
            color: #666;
            margin-bottom: 20px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #f2f2f2;
          }
          .summary {
            margin-top: 20px;
            padding: 10px;
            background-color: #f9f9f9;
          }
          .summary-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
          }
          .status {
            padding: 2px 6px;
            border-radius: 10px;
            font-size: 12px;
          }
          .status-ok {
            background-color: #d1fae5;
            color: #065f46;
          }
          .status-low {
            background-color: #fef3c7;
            color: #92400e;
          }
          .status-critical {
            background-color: #fee2e2;
            color: #b91c1c;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
        </style>
      `;
      
      // Generate the content based on report type
      let content = '';
      
      if (reportType === 'sales') {
        content = `
          <h1>Sales Report</h1>
          <div class="report-date">Period: ${reportData.dateRange.start} to ${reportData.dateRange.end}</div>
          
          <div class="summary">
            <div class="summary-item"><strong>Total Sales:</strong> $${reportData.data.reduce((sum, item) => sum + item.amount, 0).toFixed(2)}</div>
            <div class="summary-item"><strong>Average Daily:</strong> $${(reportData.data.reduce((sum, item) => sum + item.amount, 0) / reportData.data.length).toFixed(2)}</div>
            <div class="summary-item"><strong>Highest Day:</strong> $${Math.max(...reportData.data.map(item => item.amount)).toFixed(2)}</div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Transactions</th>
                <th>Items Sold</th>
                <th>Total Amount</th>
                ${isAdmin ? '<th>Profit</th>' : ''}
              </tr>
            </thead>
            <tbody>
              ${reportData.data.map((day, index) => `
                <tr>
                  <td>${day.date}</td>
                  <td>${Math.floor(Math.random() * 15) + 2}</td>
                  <td>${Math.floor(Math.random() * 30) + 5}</td>
                  <td>$${day.amount.toFixed(2)}</td>
                  ${isAdmin ? `<td>$${(day.amount * 0.3).toFixed(2)}</td>` : ''}
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
      } else if (reportType === 'inventory') {
        content = `
          <h1>Inventory Status Report</h1>
          <div class="report-date">Generated on: ${new Date().toLocaleDateString()}</div>
          
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Current Stock</th>
                <th>Min Stock Level</th>
                <th>Status</th>
                <th>Last Restock</th>
                <th>Avg. Monthly Sales</th>
              </tr>
            </thead>
            <tbody>
              ${reportData.data.map(item => `
                <tr>
                  <td>${item.product}</td>
                  <td>${item.currentStock}</td>
                  <td>${item.minStockLevel}</td>
                  <td><span class="status status-${item.status.toLowerCase()}">${item.status}</span></td>
                  <td>${item.lastRestock}</td>
                  <td>${item.avgMonthlySales}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
      } else if (reportType === 'products') {
        content = `
          <h1>Product Performance Report</h1>
          <div class="report-date">Generated on: ${new Date().toLocaleDateString()}</div>
          
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Quantity Sold</th>
                <th>Total Amount</th>
                ${isAdmin ? '<th>Profit</th>' : ''}
                <th>% of Sales</th>
              </tr>
            </thead>
            <tbody>
              ${reportData.data.map(product => `
                <tr>
                  <td>${product.product}</td>
                  <td>${product.quantity}</td>
                  <td>$${product.amount.toFixed(2)}</td>
                  ${isAdmin ? `<td>$${product.profit.toFixed(2)}</td>` : ''}
                  <td>${(product.amount / reportData.data.reduce((sum, p) => sum + p.amount, 0) * 100).toFixed(1)}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
      } else if (reportType === 'profit' && isAdmin) {
        content = `
          <h1>Profit Analysis Report</h1>
          <div class="report-date">Generated on: ${new Date().toLocaleDateString()}</div>
          
          <div class="summary">
            <div class="summary-item"><strong>Total Revenue:</strong> $19,954.90</div>
            <div class="summary-item"><strong>Total Cost:</strong> $14,150.00</div>
            <div class="summary-item"><strong>Gross Profit:</strong> $5,804.90</div>
            <div class="summary-item"><strong>Margin:</strong> 29.1%</div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Qty Sold</th>
                <th>Revenue</th>
                <th>Cost</th>
                <th>Profit</th>
                <th>Margin</th>
              </tr>
            </thead>
            <tbody>
              ${reportData.data.map(product => `
                <tr>
                  <td>${product.product}</td>
                  <td>${product.qtySold}</td>
                  <td>$${product.revenue.toFixed(2)}</td>
                  <td>$${product.cost.toFixed(2)}</td>
                  <td>$${product.profit.toFixed(2)}</td>
                  <td>${product.margin}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr>
                <td><strong>Total</strong></td>
                <td><strong>110</strong></td>
                <td><strong>$19,953.90</strong></td>
                <td><strong>$14,150.00</strong></td>
                <td><strong>$5,803.90</strong></td>
                <td><strong>29.1%</strong></td>
              </tr>
            </tfoot>
          </table>
        `;
      }
      
      printWindow.document.write(`
        <html>
          <head>
            <title>${reportTitle}</title>
            ${styles}
          </head>
          <body>
            ${content}
            <div class="footer">
              <p>Generated from Stocker Inventory Management System</p>
              <p>© ${new Date().getFullYear()} Your Company</p>
            </div>
          </body>
        </html>
      `);
      
      printWindow.document.close();
      
      // Focus on the new window and print
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        document.title = originalTitle;
      }, 500);
      
      success('Report sent to printer');
    } catch (err) {
      showError('Failed to print report. Please try again.');
      console.error('Print error:', err);
    }
  };
  
  // Chart rendering functions
  const renderSalesChart = () => {
    const data = {
      labels: salesData.map(item => item.date),
      datasets: [
        {
          label: 'Sales Amount',
          data: salesData.map(item => item.amount),
          borderColor: 'rgb(53, 162, 235)',
          backgroundColor: 'rgba(53, 162, 235, 0.5)',
        },
      ],
    };
    
    return <ChartComponent type="line" data={data} />;
  };
  
  const renderInventoryChart = () => {
    const inventoryChartData = [
      { name: 'Laptop', stock: 15, minimum: 10 },
      { name: 'Headphones', stock: 30, minimum: 15 },
      { name: 'Office Chair', stock: 8, minimum: 10 },
      { name: 'Desk Lamp', stock: 5, minimum: 5 },
      { name: 'Wireless Mouse', stock: 3, minimum: 8 },
    ];
    
    const data = {
      labels: inventoryChartData.map(item => item.name),
      datasets: [
        {
          label: 'Current Stock',
          data: inventoryChartData.map(item => item.stock),
          backgroundColor: 'rgba(53, 162, 235, 0.5)',
        },
        {
          label: 'Minimum Level',
          data: inventoryChartData.map(item => item.minimum),
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
        },
      ],
    };
    
    return <ChartComponent type="bar" data={data} />;
  };
  
  const renderProductChart = () => {
    const data = {
      labels: productPerformance.map(item => item.product),
      datasets: [
        {
          label: 'Sales Amount',
          data: productPerformance.map(item => item.amount),
          backgroundColor: [
            'rgba(255, 99, 132, 0.5)',
            'rgba(54, 162, 235, 0.5)',
            'rgba(255, 206, 86, 0.5)',
            'rgba(75, 192, 192, 0.5)',
            'rgba(153, 102, 255, 0.5)',
          ],
        },
      ],
    };
    
    return <ChartComponent type="pie" data={data} />;
  };
  
  const renderProfitChart = () => {
    const data = {
      labels: productPerformance.map(item => item.product),
      datasets: [
        {
          label: 'Revenue',
          data: productPerformance.map(item => item.amount),
          backgroundColor: 'rgba(53, 162, 235, 0.5)',
        },
        {
          label: 'Profit',
          data: productPerformance.map(item => item.profit),
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
        },
      ],
    };
    
    return <ChartComponent type="bar" data={data} />;
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
        
    <Sidebar 
      isAdmin={isAdmin} 
      activePage="reports" 
      onNavigate={onNavigate} 
      onLogout={onLogout}
      profileImage={profileImage}
    />
      
      <div className="flex-1 p-4 pt-16 lg:pt-4 lg:p-6">
        <h2 className="text-xl sm:text-2xl font-bold mb-4">Reports</h2>
        
        {/* Report filters */}
        <div className="bg-white p-4 rounded shadow mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
              <select 
                className="w-full p-2 border rounded"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
              >
                <option value="sales">Sales Report</option>
                <option value="inventory">Inventory Report</option>
                <option value="products">Product Performance</option>
                {isAdmin && <option value="profit">Profit Analysis</option>}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input 
                type="date" 
                className="w-full p-2 border rounded"
                value={dateRange.start}
                onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input 
                type="date" 
                className="w-full p-2 border rounded"
                value={dateRange.end}
                onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
              />
            </div>
            <div className="flex items-end">
              <button 
                className="bg-blue-600 text-white px-4 py-2 rounded w-full flex items-center justify-center"
                onClick={handleGenerateReport}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : 'Generate Report'}
              </button>
            </div>
          </div>
        </div>
        
        {/* Report visualization */}
        <div className="bg-white p-4 rounded shadow mb-4">
          <h3 className="font-bold mb-4">
            {reportType === 'sales' && 'Sales Over Time'}
            {reportType === 'inventory' && 'Inventory Status'}
            {reportType === 'products' && 'Product Performance'}
            {reportType === 'profit' && 'Profit Analysis'}
          </h3>
          
          {/* Chart visualization */}
          <div className="h-80 mb-8">
            {reportType === 'sales' && renderSalesChart()}
            {reportType === 'inventory' && renderInventoryChart()}
            {reportType === 'products' && renderProductChart()}
            {reportType === 'profit' && isAdmin && renderProfitChart()}
          </div>
          
          {/* Report summary */}
          {reportType === 'sales' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="bg-blue-50 p-3 rounded border border-blue-200">
                <h4 className="text-sm text-blue-700">Total Sales</h4>
                <p className="text-xl font-bold">${salesData.reduce((sum, item) => sum + item.amount, 0).toFixed(2)}</p>
              </div>
              <div className="bg-green-50 p-3 rounded border border-green-200">
                <h4 className="text-sm text-green-700">Average Daily</h4>
                <p className="text-xl font-bold">
                  ${(salesData.reduce((sum, item) => sum + item.amount, 0) / salesData.length).toFixed(2)}
                </p>
              </div>
              <div className="bg-purple-50 p-3 rounded border border-purple-200">
                <h4 className="text-sm text-purple-700">Highest Day</h4>
                <p className="text-xl font-bold">
                  ${Math.max(...salesData.map(item => item.amount)).toFixed(2)}
                </p>
              </div>
              <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                <h4 className="text-sm text-yellow-700">Total Transactions</h4>
                <p className="text-xl font-bold">127</p>
              </div>
            </div>
          )}
          
          {reportType === 'profit' && isAdmin && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="bg-green-50 p-3 rounded border border-green-200">
                <h4 className="text-sm text-green-700">Total Revenue</h4>
                <p className="text-xl font-bold">$19,954.90</p>
              </div>
              <div className="bg-blue-50 p-3 rounded border border-blue-200">
                <h4 className="text-sm text-blue-700">Total Cost</h4>
                <p className="text-xl font-bold">$14,150.00</p>
              </div>
              <div className="bg-indigo-50 p-3 rounded border border-indigo-200">
                <h4 className="text-sm text-indigo-700">Gross Profit</h4>
                <p className="text-xl font-bold">$5,804.90</p>
              </div>
              <div className="bg-purple-50 p-3 rounded border border-purple-200">
                <h4 className="text-sm text-purple-700">Margin</h4>
                <p className="text-xl font-bold">29.1%</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Report data table */}
        <div className="bg-white p-4 rounded shadow">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
            <h3 className="font-bold">Detailed Data</h3>
            
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <button 
                className="text-blue-600 hover:underline flex items-center"
                onClick={handleExportCSV}
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                </svg>
                Export CSV
              </button>
              
              <button 
                className="text-blue-600 hover:underline flex items-center"
                onClick={handlePrint}
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
                </svg>
                Print Report
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="py-12 flex justify-center">
                <ComponentLoader size="medium" text="Loading report data..." />
              </div>
            ) : (
              <>
                {reportType === 'sales' && (
                  <table className="w-full">
                    <thead>
                      <tr className="text-left border-b">
                        <th className="pb-2">Date</th>
                        <th className="pb-2">Transactions</th>
                        <th className="pb-2">Items Sold</th>
                        <th className="pb-2">Total Amount</th>
                        {isAdmin && <th className="pb-2">Profit</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {salesData.map((day, index) => (
                        <tr key={index} className="border-b">
                          <td className="py-2">{day.date}</td>
                          <td className="py-2">{Math.floor(Math.random() * 15) + 2}</td>
                          <td className="py-2">{Math.floor(Math.random() * 30) + 5}</td>
                          <td className="py-2">${day.amount.toFixed(2)}</td>
                          {isAdmin && <td className="py-2">${(day.amount * 0.3).toFixed(2)}</td>}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                
                {reportType === 'products' && (
                  <table className="w-full">
                    <thead>
                      <tr className="text-left border-b">
                        <th className="pb-2">Product</th>
                        <th className="pb-2">Quantity Sold</th>
                        <th className="pb-2">Total Amount</th>
                        {isAdmin && <th className="pb-2">Profit</th>}
                        <th className="pb-2">% of Sales</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productPerformance.map((product, index)=> (
                        <tr key={index} className="border-b">
                          <td className="py-2">{product.product}</td>
                          <td className="py-2">{product.quantity}</td>
                          <td className="py-2">${product.amount.toFixed(2)}</td>
                          {isAdmin && <td className="py-2">${product.profit.toFixed(2)}</td>}
                          <td className="py-2">
                            {(product.amount / productPerformance.reduce((sum, p) => sum + p.amount, 0) * 100).toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                
                {reportType === 'inventory' && (
                  <table className="w-full">
                    <thead>
                      <tr className="text-left border-b">
                        <th className="pb-2">Product</th>
                        <th className="pb-2">Current Stock</th>
                        <th className="pb-2">Min Stock Level</th>
                        <th className="pb-2">Status</th>
                        <th className="pb-2">Last Restock</th>
                        <th className="pb-2">Avg. Monthly Sales</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventoryData.map((item, index) => (
                        <tr key={index} className="border-b">
                          <td className="py-2">{item.product}</td>
                          <td className="py-2">{item.currentStock}</td>
                          <td className="py-2">{item.minStockLevel}</td>
                          <td className="py-2">
                            <span className={`px-2 py-1 ${
                              item.status === 'OK' ? 'bg-green-100 text-green-800' : 
                              item.status === 'LOW' ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-red-100 text-red-800'
                            } rounded-full text-xs`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="py-2">{item.lastRestock}</td>
                          <td className="py-2">{item.avgMonthlySales}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                
                {reportType === 'profit' && isAdmin && (
                  <table className="w-full">
                    <thead>
                      <tr className="text-left border-b">
                        <th className="pb-2">Product</th>
                        <th className="pb-2">Qty Sold</th>
                        <th className="pb-2">Revenue</th>
                        <th className="pb-2">Cost</th>
                        <th className="pb-2">Profit</th>
                        <th className="pb-2">Margin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profitData.map((product, index) => (
                        <tr key={index} className="border-b">
                          <td className="py-2">{product.product}</td>
                          <td className="py-2">{product.qtySold}</td>
                          <td className="py-2">${product.revenue.toFixed(2)}</td>
                          <td className="py-2">${product.cost.toFixed(2)}</td>
                          <td className="py-2">${product.profit.toFixed(2)}</td>
                          <td className="py-2">{product.margin}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="font-bold bg-gray-50">
                        <td className="py-2">Total</td>
                        <td className="py-2">110</td>
                        <td className="py-2">$19,953.90</td>
                        <td className="py-2">$14,150.00</td>
                        <td className="py-2">$5,803.90</td>
                        <td className="py-2">29.1%</td>
                      </tr>
                    </tfoot>
                  </table>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;