import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import SalesSummary from '../components/SalesSummary';
import ChartComponent from '../components/ChartComponent';

const ReportsPage = ({ isAdmin, onNavigate, onLogout }) => {
  const [reportType, setReportType] = useState('sales');
  const [dateRange, setDateRange] = useState({
    start: '2025-04-01',
    end: '2025-04-12'
  });

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
    const inventoryData = [
      { name: 'Laptop', stock: 15, minimum: 10 },
      { name: 'Headphones', stock: 30, minimum: 15 },
      { name: 'Office Chair', stock: 8, minimum: 10 },
      { name: 'Desk Lamp', stock: 5, minimum: 5 },
      { name: 'Wireless Mouse', stock: 3, minimum: 8 },
    ];
    
    const data = {
      labels: inventoryData.map(item => item.name),
      datasets: [
        {
          label: 'Current Stock',
          data: inventoryData.map(item => item.stock),
          backgroundColor: 'rgba(53, 162, 235, 0.5)',
        },
        {
          label: 'Minimum Level',
          data: inventoryData.map(item => item.minimum),
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
    <div className="flex">
      <Sidebar isAdmin={isAdmin} activePage="reports" onNavigate={onNavigate} onLogout={onLogout} />
      
      <div className="flex-1 p-6">
        <h2 className="text-2xl font-bold mb-4">Reports</h2>
        
        {/* Report filters */}
        <div className="bg-white p-4 rounded shadow mb-4">
          <div className="grid grid-cols-4 gap-4">
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
              <button className="bg-blue-600 text-white px-4 py-2 rounded w-full">
                Generate Report
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
          
          {/* Chart visualization - UPDATED HEIGHT AND MARGIN */}
          <div className="h-80 mb-8">
            {reportType === 'sales' && renderSalesChart()}
            {reportType === 'inventory' && renderInventoryChart()}
            {reportType === 'products' && renderProductChart()}
            {reportType === 'profit' && isAdmin && renderProfitChart()}
          </div>
          
          {/* Report summary */}
          {reportType === 'sales' && (
            <div className="grid grid-cols-4 gap-4 mb-4 mt-4">
              <div className="bg-blue-50 p-3 rounded border border-blue-200">
                <h4 className="text-sm text-blue-700">Total Sales</h4>
                <p className="text-2xl font-bold">${salesData.reduce((sum, item) => sum + item.amount, 0).toFixed(2)}</p>
              </div>
              <div className="bg-green-50 p-3 rounded border border-green-200">
                <h4 className="text-sm text-green-700">Average Daily</h4>
                <p className="text-2xl font-bold">
                  ${(salesData.reduce((sum, item) => sum + item.amount, 0) / salesData.length).toFixed(2)}
                </p>
              </div>
              <div className="bg-purple-50 p-3 rounded border border-purple-200">
                <h4 className="text-sm text-purple-700">Highest Day</h4>
                <p className="text-2xl font-bold">
                  ${Math.max(...salesData.map(item => item.amount)).toFixed(2)}
                </p>
              </div>
              <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                <h4 className="text-sm text-yellow-700">Total Transactions</h4>
                <p className="text-2xl font-bold">127</p>
              </div>
            </div>
          )}
          
          {reportType === 'profit' && isAdmin && (
            <div className="grid grid-cols-4 gap-4 mb-4 mt-4">
              <div className="bg-green-50 p-3 rounded border border-green-200">
                <h4 className="text-sm text-green-700">Total Revenue</h4>
                <p className="text-2xl font-bold">$19,954.90</p>
              </div>
              <div className="bg-blue-50 p-3 rounded border border-blue-200">
                <h4 className="text-sm text-blue-700">Total Cost</h4>
                <p className="text-2xl font-bold">$14,150.00</p>
              </div>
              <div className="bg-indigo-50 p-3 rounded border border-indigo-200">
                <h4 className="text-sm text-indigo-700">Gross Profit</h4>
                <p className="text-2xl font-bold">$5,804.90</p>
              </div>
              <div className="bg-purple-50 p-3 rounded border border-purple-200">
                <h4 className="text-sm text-purple-700">Margin</h4>
                <p className="text-2xl font-bold">29.1%</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Report data table */}
        <div className="bg-white p-4 rounded shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold">Detailed Data</h3>
            
            <div className="flex space-x-2">
              <button className="text-blue-600 hover:underline flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                </svg>
                Export CSV
              </button>
              
              <button className="text-blue-600 hover:underline flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
                </svg>
                Print Report
              </button>
            </div>
          </div>
          
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
                {productPerformance.map((product, index) => (
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
                <tr className="border-b">
                  <td className="py-2">Laptop</td>
                  <td className="py-2">15</td>
                  <td className="py-2">10</td>
                  <td className="py-2"><span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">OK</span></td>
                  <td className="py-2">2025-04-05</td>
                  <td className="py-2">12</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Headphones</td>
                  <td className="py-2">30</td>
                  <td className="py-2">15</td>
                  <td className="py-2"><span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">OK</span></td>
                  <td className="py-2">2025-04-02</td>
                  <td className="py-2">25</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Office Chair</td>
                  <td className="py-2">8</td>
                  <td className="py-2">10</td>
                  <td className="py-2"><span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">LOW</span></td>
                  <td className="py-2">2025-03-28</td>
                  <td className="py-2">12</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Desk Lamp</td>
                  <td className="py-2">5</td>
                  <td className="py-2">5</td>
                  <td className="py-2"><span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">CRITICAL</span></td>
                  <td className="py-2">2025-03-25</td>
                  <td className="py-2">8</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Wireless Mouse</td>
                  <td className="py-2">3</td>
                  <td className="py-2">8</td>
                  <td className="py-2"><span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">CRITICAL</span></td>
                  <td className="py-2">2025-03-22</td>
                  <td className="py-2">15</td>
                </tr>
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
                <tr className="border-b">
                  <td className="py-2">Laptop</td>
                  <td className="py-2">15</td>
                  <td className="py-2">$14,999.85</td>
                  <td className="py-2">$11,250.00</td>
                  <td className="py-2">$3,749.85</td>
                  <td className="py-2">25.0%</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Headphones</td>
                  <td className="py-2">28</td>
                  <td className="py-2">$1,679.72</td>
                  <td className="py-2">$980.00</td>
                  <td className="py-2">$699.72</td>
                  <td className="py-2">41.7%</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Office Chair</td>
                  <td className="py-2">12</td>
                  <td className="py-2">$1,799.88</td>
                  <td className="py-2">$1,200.00</td>
                  <td className="py-2">$599.88</td>
                  <td className="py-2">33.3%</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Desk Lamp</td>
                  <td className="py-2">20</td>
                  <td className="py-2">$599.80</td>
                  <td className="py-2">$300.00</td>
                  <td className="py-2">$299.80</td>
                  <td className="py-2">50.0%</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Wireless Mouse</td>
                  <td className="py-2">35</td>
                  <td className="py-2">$874.65</td>
                  <td className="py-2">$420.00</td>
                  <td className="py-2">$454.65</td>
                  <td className="py-2">52.0%</td>
                </tr>
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
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;