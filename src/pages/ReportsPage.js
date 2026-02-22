import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import SalesSummary from '../components/SalesSummary';
import ChartComponent from '../components/ChartComponent';
import { useNotification } from '../components/NotificationSystem';
import { exportAsCSV } from '../utils/dataImportExport';
import { ComponentLoader } from '../components/LoadingState';
import ProfilePicture from '../components/ProfilePicture';

import { salesService, productService } from '../services/api';

import { useCurrency } from '../hooks/useCurrency';

const ReportsPage = ({ isAdmin, onNavigate, onLogout, profileImage, onProfileUpdate }) => {
  const [reportType, setReportType] = useState('sales');
  const { currency, formatCurrency } = useCurrency();

  // Set default date range to current month
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

  const [dateRange, setDateRange] = useState({
    start: firstDay.toISOString().split('T')[0],
    end: today.toISOString().split('T')[0]
  });

  // Loading and report states
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [isLiveMode, setIsLiveMode] = useState(false); // Live mode state

  // Get notification functions
  const { success, error: showError } = useNotification();

  // Create a utility function to properly format dates for CSV export
  function formatDateForCSV(dateString) {
    // Format date as DD/MM/YYYY which Excel typically recognizes as a date
    const date = new Date(dateString);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  }

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
  const handleGenerateReport = async () => {
    setIsLoading(true);

    try {
      let data = [];
      const { start, end } = dateRange;

      if (reportType === 'sales') {
        // Fetch daily sales chart data
        data = await salesService.getSalesChart('daily', start, end);
        // Map to match component expectations
        data = data.map(item => ({
          date: item.date,
          amount: item.amount,
          count: item.count,
          profit: item.profit
        }));
      } else if (reportType === 'inventory') {
        // Fetch all products for inventory status
        const products = await productService.getAllProducts();
        data = products.map(p => ({
          product: p.name,
          currentStock: p.quantity,
          minStockLevel: p.minStockLevel || 10,
          status: p.quantity <= 0 ? 'CRITICAL' : p.quantity <= (p.minStockLevel || 10) ? 'LOW' : 'OK',
          lastRestock: p.updated_at ? new Date(p.updated_at).toISOString().split('T')[0] : 'N/A',
          avgMonthlySales: 0 // We'd need more complex logic for this, defaulting to 0 for now
        }));
      } else if (reportType === 'products' || reportType === 'profit') {
        // Fetch product performance stats
        data = await salesService.getProductPerformance(start, end);
        // data already has product, quantity, amount, profit
        data = data.map(item => ({
          product: item.product,
          quantity: item.quantity,
          amount: item.amount,
          profit: item.profit,
          // Calculate margins etc if needed
          cost: item.amount - item.profit,
          margin: item.amount > 0 ? ((item.profit / item.amount) * 100).toFixed(1) + '%' : '0%',
          qtySold: item.quantity, // alias for profit report
          revenue: item.amount // alias for profit report
        }));
      }

      setReportData({
        type: reportType,
        dateRange: { ...dateRange },
        data: data
      });

      success('Report generated successfully!');
    } catch (err) {
      console.error('Error generating report:', err);
      showError(err.message || 'Failed to generate report');
      setReportData({
        type: reportType,
        dateRange: { ...dateRange },
        data: []
      });
    } finally {
      setIsLoading(false);
    }
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

  // Live mode polling effect
  useEffect(() => {
    let intervalId;

    if (isLiveMode) {
      // Generate report immediately when switching to live mode
      handleGenerateReport();

      // Set up polling interval (every 30 seconds)
      intervalId = setInterval(() => {
        handleGenerateReport();
      }, 30000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isLiveMode, reportType, dateRange]); // Re-run if dependencies change while in live mode

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
        const totalSales = reportData.data.reduce((sum, item) => sum + item.amount, 0);
        const avgDaily = reportData.data.length ? totalSales / reportData.data.length : 0;
        const highestDay = reportData.data.length ? Math.max(...reportData.data.map(item => item.amount)) : 0;
        const totalTransactions = reportData.data.reduce((sum, item) => sum + item.count, 0);

        content = `
          <h1>Sales Report</h1>
          <div class="report-date">Period: ${reportData.dateRange.start} to ${reportData.dateRange.end}</div>
          
          <div class="summary">
            <div className="summary-item"><strong>Total Sales:</strong> {formatCurrency(totalSales)}</div>
            <div className="summary-item"><strong>Average Daily:</strong> {formatCurrency(avgDaily)}</div>
            <div className="summary-item"><strong>Highest Day:</strong> {formatCurrency(highestDay)}</div>
            <div className="summary-item"><strong>Transactions:</strong> ${totalTransactions}</div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Transactions</th>
                <th>Total Amount</th>
                ${isAdmin ? '<th>Profit</th>' : ''}
              </tr>
            </thead>
            <tbody>
              ${reportData.data.map(day => `
                <tr>
                  <td>${day.date}</td>
                  <td>${day.count}</td>
                  <td>{formatCurrency(day.amount)}</td>
                  ${isAdmin ? `<td>${formatCurrency(day.profit)}</td>` : ''}
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
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
      } else if (reportType === 'products') {
        const totalSales = reportData.data.reduce((sum, p) => sum + p.amount, 0);

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
                  <td>{formatCurrency(product.amount)}</td>
                  ${isAdmin ? `<td>${formatCurrency(product.profit)}</td>` : ''}
                  <td>${totalSales > 0 ? (product.amount / totalSales * 100).toFixed(1) : 0}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
      } else if (reportType === 'profit' && isAdmin) {
        const totalRevenue = reportData.data.reduce((sum, item) => sum + item.amount, 0);
        const totalCost = reportData.data.reduce((sum, item) => sum + (item.cost || 0), 0);
        const totalProfit = reportData.data.reduce((sum, item) => sum + item.profit, 0);
        const margin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

        content = `
          <h1>Profit Analysis Report</h1>
          <div class="report-date">Generated on: ${new Date().toLocaleDateString()}</div>
          
          <div class="summary">
            <div className="summary-item"><strong>Total Revenue:</strong> {formatCurrency(totalRevenue)}</div>
            <div className="summary-item"><strong>Total Cost:</strong> {formatCurrency(totalCost)}</div>
            <div className="summary-item"><strong>Gross Profit:</strong> {formatCurrency(totalProfit)}</div>
            <div className="summary-item"><strong>Margin:</strong> ${margin.toFixed(1)}%</div>
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
                  <td>${product.quantity}</td>
                  <td>{formatCurrency(product.amount)}</td>
                  <td>{formatCurrency(product.cost || 0)}</td>
                  <td>{formatCurrency(product.profit)}</td>
                  <td>${product.margin}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr>
                <td><strong>Total</strong></td>
                <td><strong>${reportData.data.reduce((sum, item) => sum + item.quantity, 0)}</strong></td>
                <td><strong>{formatCurrency(totalRevenue)}</strong></td>
                <td><strong>{formatCurrency(totalCost)}</strong></td>
                <td><strong>{formatCurrency(totalProfit)}</strong></td>
                <td><strong>${margin.toFixed(1)}%</strong></td>
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
    if (!reportData?.data) return null;
    const data = {
      labels: reportData.data.map(item => item.date),
      datasets: [
        {
          label: 'Sales Amount',
          data: reportData.data.map(item => item.amount),
          borderColor: 'rgb(53, 162, 235)',
          backgroundColor: 'rgba(53, 162, 235, 0.5)',
        },
      ],
    };

    return <ChartComponent type="line" data={data} />;
  };

  const renderInventoryChart = () => {
    if (!reportData?.data) return null;
    // Show top 10 items by stock or all if less
    const chartItems = reportData.data.slice(0, 10);

    const data = {
      labels: chartItems.map(item => item.product),
      datasets: [
        {
          label: 'Current Stock',
          data: chartItems.map(item => item.currentStock),
          backgroundColor: 'rgba(53, 162, 235, 0.5)',
        },
        {
          label: 'Minimum Level',
          data: chartItems.map(item => item.minStockLevel),
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
        },
      ],
    };

    return <ChartComponent type="bar" data={data} />;
  };

  const renderProductChart = () => {
    if (!reportData?.data) return null;
    const data = {
      labels: reportData.data.map(item => item.product),
      datasets: [
        {
          label: 'Sales Amount',
          data: reportData.data.map(item => item.amount),
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
    if (!reportData?.data) return null;
    const data = {
      labels: reportData.data.map(item => item.product),
      datasets: [
        {
          label: 'Revenue',
          data: reportData.data.map(item => item.amount),
          backgroundColor: 'rgba(53, 162, 235, 0.5)',
        },
        {
          label: 'Profit',
          data: reportData.data.map(item => item.profit),
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
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                className="w-full p-2 border rounded"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
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

            {/* Live Mode Toggle */}
            <div className="flex items-center justify-end md:col-span-2 lg:col-span-4 border-t pt-4 mt-2">
              <div className="flex items-center space-x-2">
                <span className={`text-sm font-medium ${isLiveMode ? 'text-green-600' : 'text-gray-600'}`}>
                  {isLiveMode ? '● Live Updates On (30s)' : 'Live Updates Off'}
                </span>
                <button
                  onClick={() => setIsLiveMode(!isLiveMode)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isLiveMode ? 'bg-green-500' : 'bg-gray-200'}`}
                >
                  <span className="sr-only">Enable Live Mode</span>
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isLiveMode ? 'translate-x-6' : 'translate-x-1'}`}
                  />
                </button>
              </div>
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
          {reportType === 'sales' && reportData?.data && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-4 rounded shadow border-l-4 border-blue-500">
                <p className="text-gray-500 text-sm">Total Revenue</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(reportData.data.reduce((acc, item) => acc + (item.amount || 0), 0))}
                </p>
              </div>
              <div className="bg-white p-4 rounded shadow border-l-4 border-red-500">
                <p className="text-gray-500 text-sm">Total Cost</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(reportData.data.reduce((acc, item) => acc + ((item.amount || 0) - (item.profit || 0)), 0))}
                </p>
              </div>
              <div className="bg-white p-4 rounded shadow border-l-4 border-green-500">
                <p className="text-gray-500 text-sm">Gross Profit</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(reportData.data.reduce((acc, item) => acc + (item.profit || 0), 0))}
                </p>
              </div>
              <div className="bg-white p-4 rounded shadow border-l-4 border-purple-500">
                <p className="text-gray-500 text-sm">Margin</p>
                <p className="text-2xl font-bold">
                  {((reportData.data.reduce((acc, item) => acc + (item.profit || 0), 0) / (reportData.data.reduce((acc, item) => acc + (item.amount || 0), 0) || 1)) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          )}

          {reportType === 'profit' && isAdmin && reportData?.data && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="bg-green-50 p-3 rounded border border-green-200">
                <h4 className="text-sm text-green-700">Total Revenue</h4>
                <p className="text-xl font-bold">{formatCurrency(reportData.data.reduce((sum, item) => sum + item.amount, 0))}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded border border-blue-200">
                <h4 className="text-sm text-blue-700">Total Cost</h4>
                <p className="text-xl font-bold">{formatCurrency(reportData.data.reduce((sum, item) => sum + (item.cost || 0), 0))}</p>
              </div>
              <div className="bg-indigo-50 p-3 rounded border border-indigo-200">
                <h4 className="text-sm text-indigo-700">Gross Profit</h4>
                <p className="text-xl font-bold">{formatCurrency(reportData.data.reduce((sum, item) => sum + item.profit, 0))}</p>
              </div>
              <div className="bg-purple-50 p-3 rounded border border-purple-200">
                <h4 className="text-sm text-purple-700">Margin</h4>
                <p className="text-xl font-bold">
                  {reportData.data.reduce((sum, item) => sum + item.amount, 0) > 0 ?
                    ((reportData.data.reduce((sum, item) => sum + item.profit, 0) / reportData.data.reduce((sum, item) => sum + item.amount, 0)) * 100).toFixed(1) + '%'
                    : '0.0%'}
                </p>
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
                {reportType === 'sales' && reportData?.data && (
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
                      {reportData.data.map((day, index) => (
                        <tr key={index} className="border-b">
                          <td className="py-2">{day.date}</td>
                          <td className="py-2">{day.count}</td>
                          <td className="py-2">N/A</td>
                          <td className="py-2">{formatCurrency(day.amount)}</td>
                          {isAdmin && <td className="py-2">{formatCurrency(day.profit)}</td>}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {reportType === 'products' && reportData?.data && (
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
                      {reportData.data.map((product, index) => (
                        <tr key={index} className="border-b">
                          <td className="py-2">{product.product}</td>
                          <td className="py-2">{product.quantity}</td>
                          <td className="py-2">{formatCurrency(product.amount)}</td>
                          {isAdmin && <td className="py-2">{formatCurrency(product.profit)}</td>}
                          <td className="py-2">
                            {product.margin}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {reportType === 'inventory' && reportData?.data && (
                  <table className="w-full">
                    <thead>
                      <tr className="text-left border-b">
                        <th className="pb-2">Product</th>
                        <th className="pb-2">Current Stock</th>
                        <th className="pb-2">Min Stock Level</th>
                        <th className="pb-2">Status</th>
                        <th className="pb-2">Last Restock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.data.map((item, index) => (
                        <tr key={index} className="border-b">
                          <td className="py-2">{item.product}</td>
                          <td className="py-2">{item.currentStock}</td>
                          <td className="py-2">{item.minStockLevel}</td>
                          <td className="py-2">
                            <span className={`px-2 py-1 ${item.status === 'OK' ? 'bg-green-100 text-green-800' :
                              item.status === 'LOW' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              } rounded-full text-xs`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="py-2">{item.lastRestock}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {reportType === 'profit' && isAdmin && reportData?.data && (
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
                      {reportData.data.map((product, index) => (
                        <tr key={index} className="border-b">
                          <td className="py-2">{product.product}</td>
                          <td className="py-2">{product.quantity}</td>
                          <td className="py-2">${product.amount.toFixed(2)}</td>
                          <td className="py-2">${(product.cost || 0).toFixed(2)}</td>
                          <td className="py-2">${product.profit.toFixed(2)}</td>
                          <td className="py-2">{product.margin}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="font-bold bg-gray-50">
                        <td className="py-2">Total</td>
                        <td className="py-2">{reportData.data.reduce((sum, item) => sum + item.quantity, 0)}</td>
                        <td className="py-2">${reportData.data.reduce((sum, item) => sum + item.amount, 0).toFixed(2)}</td>
                        <td className="py-2">${reportData.data.reduce((sum, item) => sum + (item.cost || 0), 0).toFixed(2)}</td>
                        <td className="py-2">${reportData.data.reduce((sum, item) => sum + item.profit, 0).toFixed(2)}</td>
                        <td className="py-2">
                          {reportData.data.reduce((sum, item) => sum + item.amount, 0) > 0 ?
                            ((reportData.data.reduce((sum, item) => sum + item.profit, 0) / reportData.data.reduce((sum, item) => sum + item.amount, 0)) * 100).toFixed(1) + '%'
                            : '0.0%'}
                        </td>
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