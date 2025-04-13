import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';



// Settings Page Component
const SettingsPage = ({ isAdmin, onNavigate, onLogout }) => {
  const [generalSettings, setGeneralSettings] = useState({
    storeName: 'InventoryPro Store',
    currency: 'USD',
    taxRate: '7.5',
    lowStockThreshold: '5',
    receiptFooter: 'Thank you for your purchase!',
  });
  
  const [activeTab, setActiveTab] = useState('general');
  
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <Sidebar isAdmin={isAdmin} activePage="settings" onNavigate={onNavigate} onLogout={onLogout} />
      
      <div className="flex-1 p-4 pt-16 lg:pt-4 lg:p-6">
        <h2 className="text-xl sm:text-2xl font-bold mb-4">Settings</h2>
        
        <div className="bg-white rounded shadow overflow-hidden">
          {/* Settings navigation */}
          <div className="flex flex-wrap border-b">
            <button 
              className={`px-4 py-2 font-medium ${activeTab === 'general' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
              onClick={() => setActiveTab('general')}
            >
              General
            </button>
            <button 
              className={`px-4 py-2 font-medium ${activeTab === 'account' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
              onClick={() => setActiveTab('account')}
            >
              Account
            </button>
            {isAdmin && (
              <button 
                className={`px-4 py-2 font-medium ${activeTab === 'system' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
                onClick={() => setActiveTab('system')}
              >
                System
              </button>
            )}
            {isAdmin && (
              <button 
                className={`px-4 py-2 font-medium ${activeTab === 'permissions' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
                onClick={() => setActiveTab('permissions')}
              >
                User Permissions
              </button>
            )}
          </div>
          
          {/* Settings content */}
          <div className="p-4">
            {activeTab === 'general' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-2">General Settings</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Store Name</label>
                    <input 
                      type="text" 
                      className="w-full p-2 border rounded" 
                      value={generalSettings.storeName}
                      onChange={(e) => setGeneralSettings({...generalSettings, storeName: e.target.value})}
                      disabled={!isAdmin}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                    <select 
                      className="w-full p-2 border rounded"
                      value={generalSettings.currency}
                      onChange={(e) => setGeneralSettings({...generalSettings, currency: e.target.value})}
                      disabled={!isAdmin}
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="JPY">JPY (¥)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
                    <input 
                      type="number" 
                      className="w-full p-2 border rounded" 
                      value={generalSettings.taxRate}
                      onChange={(e) => setGeneralSettings({...generalSettings, taxRate: e.target.value})}
                      disabled={!isAdmin}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Threshold</label>
                    <input 
                      type="number" 
                      className="w-full p-2 border rounded" 
                      value={generalSettings.lowStockThreshold}
                      onChange={(e) => setGeneralSettings({...generalSettings, lowStockThreshold: e.target.value})}
                      disabled={!isAdmin}
                    />
                  </div>
                  <div className="col-span-1 sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Footer</label>
                    <textarea 
                      className="w-full p-2 border rounded" 
                      rows="2"
                      value={generalSettings.receiptFooter}
                      onChange={(e) => setGeneralSettings({...generalSettings, receiptFooter: e.target.value})}
                      disabled={!isAdmin}
                    ></textarea>
                  </div>
                </div>
                
                {isAdmin && (
                  <div className="flex justify-end">
                    <button className="bg-blue-600 text-white px-4 py-2 rounded">
                      Save Changes
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'account' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-2">Account Settings</h3>
                
                <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
                  <div className="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold">
                    {isAdmin ? 'A' : 'U'}
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">{isAdmin ? 'Admin User' : 'Store User'}</h4>
                    <p className="text-gray-600">{isAdmin ? 'admin@example.com' : 'user@example.com'}</p>
                    <button className="text-blue-600 text-sm hover:underline mt-1">Change Profile Picture</button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                    <input 
                      type="text" 
                      className="w-full p-2 border rounded" 
                      value={isAdmin ? 'admin' : 'user'}
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input 
                      type="email" 
                      className="w-full p-2 border rounded" 
                      value={isAdmin ? 'admin@example.com' : 'user@example.com'}
                    />
                  </div>
                </div>
                
                <h4 className="font-medium mt-6 mb-2">Change Password</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                    <input 
                      type="password" 
                      className="w-full p-2 border rounded" 
                    />
                  </div>
                  <div className="sm:col-span-2 lg:col-span-1"></div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                    <input 
                      type="password" 
                      className="w-full p-2 border rounded" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                    <input 
                      type="password" 
                      className="w-full p-2 border rounded" 
                    />
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button className="bg-blue-600 text-white px-4 py-2 rounded">
                    Update Account
                  </button>
                </div>
              </div>
            )}
            
            {activeTab === 'system' && isAdmin && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-2">System Settings</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Backup Frequency</label>
                    <select className="w-full p-2 border rounded">
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data Retention Period</label>
                    <select className="w-full p-2 border rounded">
                      <option value="1year">1 Year</option>
                      <option value="2years">2 Years</option>
                      <option value="5years">5 Years</option>
                      <option value="indefinite">Indefinite</option>
                    </select>
                  </div>
                </div>
                
                <div className="mt-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded bg-gray-50 gap-2">
                    <div>
                    <h4 className="font-medium">Database Backup</h4>
                      <p className="text-sm text-gray-600">Last backup: 2025-04-12 03:00</p>
                    </div>
                    <button className="bg-blue-600 text-white px-3 py-1 rounded">
                      Backup Now
                    </button>
                  </div>
                </div>
                
                <div className="mt-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded bg-gray-50 gap-2">
                    <div>
                      <h4 className="font-medium">System Logs</h4>
                      <p className="text-sm text-gray-600">View application logs and activity</p>
                    </div>
                    <button className="bg-blue-600 text-white px-3 py-1 rounded">
                      View Logs
                    </button>
                  </div>
                </div>
                
                <div className="flex justify-end mt-6">
                  <button className="bg-blue-600 text-white px-4 py-2 rounded">
                    Save System Settings
                  </button>
                </div>
              </div>
            )}
            
            {activeTab === 'permissions' && isAdmin && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-2">User Permission Management</h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left border-b">
                        <th className="pb-2">Feature</th>
                        <th className="pb-2 text-center">Admin</th>
                        <th className="pb-2 text-center">User</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2">View Dashboard</td>
                        <td className="py-2 text-center">
                          <input type="checkbox" checked disabled />
                        </td>
                        <td className="py-2 text-center">
                          <input type="checkbox" checked />
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">Manage Inventory</td>
                        <td className="py-2 text-center">
                          <input type="checkbox" checked disabled />
                        </td>
                        <td className="py-2 text-center">
                          <input type="checkbox" checked />
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">Process Sales</td>
                        <td className="py-2 text-center">
                          <input type="checkbox" checked disabled />
                        </td>
                        <td className="py-2 text-center">
                          <input type="checkbox" checked />
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">View Reports</td>
                        <td className="py-2 text-center">
                          <input type="checkbox" checked disabled />
                        </td>
                        <td className="py-2 text-center">
                          <input type="checkbox" checked />
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">Apply Discounts</td>
                        <td className="py-2 text-center">
                          <input type="checkbox" checked disabled />
                        </td>
                        <td className="py-2 text-center">
                          <input type="checkbox" checked />
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">Set Unlimited Discounts</td>
                        <td className="py-2 text-center">
                          <input type="checkbox" checked disabled />
                        </td>
                        <td className="py-2 text-center">
                          <input type="checkbox" />
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">Edit Prices</td>
                        <td className="py-2 text-center">
                          <input type="checkbox" checked disabled />
                        </td>
                        <td className="py-2 text-center">
                          <input type="checkbox" />
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">View Cost Prices</td>
                        <td className="py-2 text-center">
                          <input type="checkbox" checked disabled />
                        </td>
                        <td className="py-2 text-center">
                          <input type="checkbox" />
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">Manage Users</td>
                        <td className="py-2 text-center">
                          <input type="checkbox" checked disabled />
                        </td>
                        <td className="py-2 text-center">
                          <input type="checkbox" disabled />
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">System Settings</td>
                        <td className="py-2 text-center">
                          <input type="checkbox" checked disabled />
                        </td>
                        <td className="py-2 text-center">
                          <input type="checkbox" disabled />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                <div className="flex justify-end mt-6">
                  <button className="bg-blue-600 text-white px-4 py-2 rounded">
                    Save Permissions
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
  export default SettingsPage;