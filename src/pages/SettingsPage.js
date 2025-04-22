import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';
import ProfilePicture from '../components/ProfilePicture';
import { useAppSettings } from '../context/AppSettingsContext';

// Settings Page Component
const SettingsPage = ({ isAdmin, onNavigate, onLogout, profileImage, onProfileUpdate }) => {
  const [username, setUsername] = useState(isAdmin ? 'admin' : 'user');
const [email, setEmail] = useState(isAdmin ? 'admin@example.com' : 'user@example.com');

  const { settings, updateSettings } = useAppSettings();
  
  const [generalSettings, setGeneralSettings] = useState({
    storeName: settings.storeName,
    currency: settings.currency,
    taxRate: String(settings.taxRate),
    lowStockThreshold: String(settings.lowStockThreshold),
    receiptFooter: settings.receiptFooter,
    
  });
  
  const [activeTab, setActiveTab] = useState('general');
  const [updateSuccess, setUpdateSuccess] = useState(false);
  
  // For regular users, we'll only show account tab with limited options
  // If user is not admin and tries to access other tabs, redirect to account tab
  if (!isAdmin && activeTab !== 'account') {
    setActiveTab('account');
  }
  
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
    // Update the context with new settings
    updateSettings({
      storeName: generalSettings.storeName,
      currency: generalSettings.currency,
      taxRate: parseFloat(generalSettings.taxRate),
      lowStockThreshold: parseInt(generalSettings.lowStockThreshold),
      receiptFooter: generalSettings.receiptFooter,
    });
    
    // Show success message
    setUpdateSuccess(true);
    setTimeout(() => {
      setUpdateSuccess(false);
    }, 3000);
  };
  
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <Sidebar 
        isAdmin={isAdmin} 
        activePage="settings" 
        onNavigate={onNavigate} 
        onLogout={onLogout}
        profileImage={profileImage}
      />
      
      <div className="flex-1 p-4 pt-16 lg:pt-4 lg:p-6">
        <h2 className="text-xl sm:text-2xl font-bold mb-4">Settings</h2>
        
        {updateSuccess && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 flex justify-between items-center">
            <span>Settings updated successfully!</span>
            <button 
              onClick={() => setUpdateSuccess(false)}
              className="text-green-700"
            >
              &times;
            </button>
          </div>
        )}
        
        <div className="bg-white rounded shadow overflow-hidden">
          {/* Settings navigation - only show Account tab for regular users */}
          <div className="flex flex-wrap border-b">
            {isAdmin && (
              <button 
                className={`px-4 py-2 font-medium ${activeTab === 'general' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
                onClick={() => setActiveTab('general')}
              >
                General
              </button>
            )}
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
            {activeTab === 'general' && isAdmin && (
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
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                     <select 
                      className="w-full p-2 border rounded"
                      value={generalSettings.currency}
                      onChange={(e) => setGeneralSettings({...generalSettings, currency: e.target.value})}
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="JPY">JPY (¥)</option>
                      <option value="XOF">CFA (CFA)</option>
                      <option value="GHS">GHS (₵)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
                    <input 
                      type="number" 
                      className="w-full p-2 border rounded" 
                      value={generalSettings.taxRate}
                      onChange={(e) => setGeneralSettings({...generalSettings, taxRate: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Threshold</label>
                    <input 
                      type="number" 
                      className="w-full p-2 border rounded" 
                      value={generalSettings.lowStockThreshold}
                      onChange={(e) => setGeneralSettings({...generalSettings, lowStockThreshold: e.target.value})}
                    />
                  </div>
                  <div className="col-span-1 sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Footer</label>
                    <textarea 
                      className="w-full p-2 border rounded" 
                      rows="2"
                      value={generalSettings.receiptFooter}
                      onChange={(e) => setGeneralSettings({...generalSettings, receiptFooter: e.target.value})}
                    ></textarea>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button 
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                    onClick={handleSaveSettings}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            )}
            
            {activeTab === 'account' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-2">Account Settings</h3>
                
                <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
                  <ProfilePicture 
                    initialImage={profileImage}
                    userName={isAdmin ? 'Admin' : 'User'}
                    isAdmin={isAdmin}
                    onImageChange={handleProfileImageChange}
                  />
                  <div>
                    <h4 className="font-bold text-lg">{isAdmin ? 'Admin User' : 'Store User'}</h4>
                    <p className="text-gray-600">{isAdmin ? 'admin@example.com' : 'user@example.com'}</p>
                  </div>
                </div>
                
                {/* For regular users, only show username and password fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Store Name</label>
                    <input 
                      type="text" 
                      className="w-full p-2 border rounded" 
                      value={generalSettings.storeName}
                      onChange={(e) => setGeneralSettings({...generalSettings, storeName: e.target.value})}
                    />


                  </div>
                  
                  {/* Only show email field for admins */}
                  {isAdmin && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input 
                      type="email" 
                      className="w-full p-2 border rounded" 
                      value={email}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, email: e.target.value })}
                    />
                    </div>
                  )}
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
                  <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"  
                    onClick={handleSaveSettings}>
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
                    <button className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors">
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
                    <button className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors">
                      View Logs
                    </button>
                  </div>
                </div>
                
                <div className="flex justify-end mt-6">
                  <button 
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                    onClick={handleSaveSettings}  
                  >
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
                        <td className="py-2">System Settings</td>
                        <td className="py-2 text-center">
                          <input type="checkbox" checked disabled className="h-4 w-4 text-blue-600" />
                        </td>
                        <td className="py-2 text-center">
                          <input type="checkbox" disabled className="h-4 w-4 text-blue-600" />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                <div className="flex justify-end mt-6">
                  <button 
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                    onClick={handleSaveSettings}
                  >
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