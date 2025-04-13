import React from 'react';
import Sidebar from '../components/Sidebar';
import SalesSummary from '../components/SalesSummary';

const AdminDashboard = ({ onNavigate, onLogout }) => {
    // Sample data
    const salesByCategory = [
      { name: 'Electronics', value: 15000 },
      { name: 'Furniture', value: 8500 },
      { name: 'Office Supplies', value: 5200 },
      { name: 'Accessories', value: 3800 },
    ];
    
    const lowStockItems = [
      { id: 1, name: 'Office Chair', category: 'Furniture', quantity: 3, threshold: 5 },
      { id: 2, name: 'Wireless Mouse', category: 'Electronics', quantity: 4, threshold: 10 },
      { id: 3, name: 'Desk Lamp', category: 'Accessories', quantity: 2, threshold: 5 },
    ];
    
    const recentOrders = [
      { id: 'ORD-001', date: '2025-04-12', customer: 'John Doe', items: 3, total: 319.97, status: 'Completed' },
      { id: 'ORD-002', date: '2025-04-11', customer: 'Jane Smith', items: 1, total: 899.99, status: 'Completed' },
      { id: 'ORD-003', date: '2025-04-10', customer: 'Bob Johnson', items: 2, total: 89.98, status: 'Completed' },
    ];
    
    return (
      <div className="min-h-screen flex flex-col lg:flex-row">
        <Sidebar isAdmin={true} activePage="adminDashboard" onNavigate={onNavigate} onLogout={onLogout} />
        
        <div className="flex-1 p-4 pt-16 lg:pt-4 lg:p-6">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">Admin Dashboard</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded shadow">
              <h3 className="text-gray-500">Total Revenue</h3>
              <p className="text-xl sm:text-2xl font-bold">$32,500</p>
              <p className="text-green-500 text-sm">↑ 12% from last month</p>
            </div>
            <div className="bg-white p-4 rounded shadow">
              <h3 className="text-gray-500">Total Products</h3>
              <p className="text-xl sm:text-2xl font-bold">248</p>
              <p className="text-green-500 text-sm">↑ 5 new this month</p>
            </div>
            <div className="bg-white p-4 rounded shadow">
              <h3 className="text-gray-500">Low Stock Items</h3>
              <p className="text-xl sm:text-2xl font-bold">{lowStockItems.length}</p>
              <p className="text-red-500 text-sm">Needs attention</p>
            </div>
            <div className="bg-white p-4 rounded shadow">
              <h3 className="text-gray-500">Active Users</h3>
              <p className="text-xl sm:text-2xl font-bold">5</p>
              <button 
                className="text-blue-500 text-sm hover:underline"
                onClick={() => onNavigate('users')}
              >
                Manage users
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <div className="bg-white p-4 rounded shadow">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold">Sales by Category</h3>
                <button 
                  className="text-blue-500 text-sm hover:underline"
                  onClick={() => onNavigate('reports')}
                >
                  View detailed reports
                </button>
              </div>
              
              <div className="space-y-4">
                {salesByCategory.map(category => (
                  <div key={category.name}>
                    <div className="flex justify-between">
                      <span>{category.name}</span>
                      <span>${category.value.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${(category.value / Math.max(...salesByCategory.map(c => c.value))) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-white p-4 rounded shadow">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold">Low Stock Alert</h3>
                <button 
                  className="text-blue-500 text-sm hover:underline"
                  onClick={() => onNavigate('inventory')}
                >
                  View all inventory
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="pb-2">Product</th>
                      <th className="pb-2">Category</th>
                      <th className="pb-2">Quantity</th>
                      <th className="pb-2">Threshold</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockItems.map(item => (
                      <tr key={item.id} className="border-b">
                        <td className="py-2">{item.name}</td>
                        <td className="py-2">{item.category}</td>
                        <td className="py-2 text-red-500 font-semibold">{item.quantity}</td>
                        <td className="py-2">{item.threshold}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded shadow">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold">Recent Orders</h3>
              <button 
                className="text-blue-500 text-sm hover:underline"
                onClick={() => onNavigate('sales')}
              >
                View all orders
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b">
                    <th className="pb-2">Order ID</th>
                    <th className="pb-2">Date</th>
                    <th className="pb-2">Customer</th>
                    <th className="pb-2">Items</th>
                    <th className="pb-2">Total</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map(order => (
                    <tr key={order.id} className="border-b">
                      <td className="py-2">{order.id}</td>
                      <td className="py-2">{order.date}</td>
                      <td className="py-2">{order.customer}</td>
                      <td className="py-2">{order.items}</td>
                      <td className="py-2">${order.total.toFixed(2)}</td>
                      <td className="py-2">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {order.status}
                        </span>
                      </td>
                      <td className="py-2">
                        <button className="text-blue-500 hover:underline">Details</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

export default AdminDashboard;