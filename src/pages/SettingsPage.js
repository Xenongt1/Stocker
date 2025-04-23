import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';
import ProfilePicture from '../components/ProfilePicture';
import { useAppSettings } from '../context/AppSettingsContext';
import { useNotification } from '../components/NotificationSystem';
import { LoadingButton } from '../components/LoadingState';
import { validateEmail, validatePassword, validateConfirmPassword } from '../utils/validation';

// Settings Page Component
const SettingsPage = ({ 
  isAdmin, 
  onNavigate, 
  onLogout, 
  profileImage, 
  username,
  onProfileUpdate, 
  onUserInfoUpdate, 
  onPasswordUpdate,
  userInfo 
}) => {
  const { settings, updateSettings } = useAppSettings();
  const { success, error: showError } = useNotification();
  
  // State for user profile information
  const [userProfile, setUserProfile] = useState({
    username: username || (isAdmin ? 'admin' : 'user'),
    email: userInfo?.email || (isAdmin ? 'admin@example.com' : 'user@example.com'),
    role: isAdmin ? 'admin' : 'user'
  });
  
  // State for general settings
  const [generalSettings, setGeneralSettings] = useState({
    storeName: settings.storeName,
    currency: settings.currency,
    taxRate: String(settings.taxRate),
    lowStockThreshold: String(settings.lowStockThreshold),
    receiptFooter: settings.receiptFooter,
  });
  
  // State for password change
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // Validation errors
  const [errors, setErrors] = useState({});
  
  // UI state
  const [activeTab, setActiveTab] = useState('general');
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Update user profile from props when component mounts or isAdmin changes
  useEffect(() => {
    if (userInfo) {
      setUserProfile({
        username: userInfo.username || (isAdmin ? 'admin' : 'user'),
        email: userInfo.email || (isAdmin ? 'admin@example.com' : 'user@example.com'),
        role: isAdmin ? 'admin' : 'user'
      });
    }
  }, [isAdmin, userInfo]);
  
  // For regular users, we'll only show account tab with limited options
  // If user is not admin and tries to access other tabs, redirect to account tab
  useEffect(() => {
    if (!isAdmin && activeTab !== 'account') {
      setActiveTab('account');
    }
  }, [isAdmin, activeTab]);
  
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
  
  // Handle changes to user profile information
  const handleUserProfileChange = (e) => {
    const { name, value } = e.target;
    setUserProfile(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error when field is changed
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };
  
  // Handle changes to general settings
  const handleGeneralSettingsChange = (e) => {
    const { name, value } = e.target;
    setGeneralSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle changes to password fields
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error when field is changed
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };
  
  // Validate user profile form
  const validateUserProfile = () => {
    const newErrors = {};
    
    if (!userProfile.username) {
      newErrors.username = 'Username is required';
    }
    
    const emailError = validateEmail(userProfile.email);
    if (emailError) {
      newErrors.email = emailError;
    }
    
    setErrors(prev => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };
  
  // Validate password change form
  const validatePasswordChange = () => {
    const newErrors = {};
    
    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }
    
    const passwordError = validatePassword(passwordData.newPassword);
    if (passwordError) {
      newErrors.newPassword = passwordError;
    }
    
    const confirmError = validateConfirmPassword(
      passwordData.newPassword, 
      passwordData.confirmPassword
    );
    if (confirmError) {
      newErrors.confirmPassword = confirmError;
    }
    
    setErrors(prev => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };
  
  // Save general settings
  const handleSaveGeneralSettings = () => {
    // Update the context with new settings
    updateSettings({
      storeName: generalSettings.storeName,
      currency: generalSettings.currency,
      taxRate: parseFloat(generalSettings.taxRate),
      lowStockThreshold: parseInt(generalSettings.lowStockThreshold),
      receiptFooter: generalSettings.receiptFooter,
    });
    
    // Show success message
    success('General settings updated successfully!');
  };
  
  // Save user profile
  const handleSaveUserProfile = () => {
    if (!validateUserProfile()) {
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      // Call the parent handler to update user info in App.js
      if (onUserInfoUpdate) {
        onUserInfoUpdate({
          username: userProfile.username,
          email: userProfile.email
        });
      }
      
      setIsSubmitting(false);
      success('Profile updated successfully!');
    }, 800);
  };
  
  // Change password
  const handleChangePassword = () => {
    if (!validatePasswordChange()) {
      return;
    }
    
    // For demo purposes, we'll check if current password matches expected value
    // Get expected password from userInfo or fallback to default
    const expectedPassword = userInfo?.password || (isAdmin ? 'admin123' : 'user123');
    
    if (passwordData.currentPassword !== expectedPassword) {
      setErrors(prev => ({
        ...prev,
        currentPassword: 'Current password is incorrect'
      }));
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      // Call the parent handler to update password in App.js
      if (onPasswordUpdate) {
        onPasswordUpdate(passwordData.newPassword);
      }
      
      // Reset password fields
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      setIsSubmitting(false);
      success('Password changed successfully!');
    }, 800);
  };
  
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <Sidebar 
        isAdmin={isAdmin} 
        activePage="settings" 
        onNavigate={onNavigate} 
        onLogout={onLogout}
        profileImage={profileImage}
        username={userProfile.username}
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
                      name="storeName"
                      className="w-full p-2 border rounded" 
                      value={generalSettings.storeName}
                      onChange={handleGeneralSettingsChange}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                     <select 
                      name="currency"
                      className="w-full p-2 border rounded"
                      value={generalSettings.currency}
                      onChange={handleGeneralSettingsChange}
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
                      name="taxRate"
                      className="w-full p-2 border rounded" 
                      value={generalSettings.taxRate}
                      onChange={handleGeneralSettingsChange}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Threshold</label>
                    <input 
                      type="number" 
                      name="lowStockThreshold"
                      className="w-full p-2 border rounded" 
                      value={generalSettings.lowStockThreshold}
                      onChange={handleGeneralSettingsChange}
                    />
                  </div>
                  <div className="col-span-1 sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Footer</label>
                    <textarea 
                      name="receiptFooter"
                      className="w-full p-2 border rounded" 
                      rows="2"
                      value={generalSettings.receiptFooter}
                      onChange={handleGeneralSettingsChange}
                    ></textarea>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button 
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                    onClick={handleSaveGeneralSettings}
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
                    userName={userProfile.username}
                    isAdmin={isAdmin}
                    onImageChange={handleProfileImageChange}
                  />
                  <div>
                    <h4 className="font-bold text-lg">{userProfile.username}</h4>
                    <p className="text-gray-600">{userProfile.email}</p>
                    <p className="text-xs text-gray-500 mt-1">Role: {userProfile.role}</p>
                  </div>
                </div>
                
                <h4 className="font-medium mb-2">Profile Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                    <input 
                      type="text" 
                      name="username"
                      className={`w-full p-2 border rounded ${errors.username ? 'border-red-500' : 'border-gray-300'}`}
                      value={userProfile.username}
                      onChange={handleUserProfileChange}
                    />
                    {errors.username && (
                      <p className="text-red-500 text-xs mt-1">{errors.username}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input 
                      type="email" 
                      name="email"
                      className={`w-full p-2 border rounded ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                      value={userProfile.email}
                      onChange={handleUserProfileChange}
                    />
                    {errors.email && (
                      <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-end mt-4">
                  <LoadingButton
                    isLoading={isSubmitting}
                    loadingText="Updating..."
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                    onClick={handleSaveUserProfile}
                  >
                    Update Profile
                  </LoadingButton>
                </div>
                
                <hr className="my-6" />
                
                <h4 className="font-medium mb-2">Change Password</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                    <input 
                      type="password" 
                      name="currentPassword"
                      className={`w-full p-2 border rounded ${errors.currentPassword ? 'border-red-500' : 'border-gray-300'}`}
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                    />
                    {errors.currentPassword && (
                      <p className="text-red-500 text-xs mt-1">{errors.currentPassword}</p>
                    )}
                  </div>
                  <div className="sm:col-span-2 lg:col-span-1"></div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                    <input 
                      type="password" 
                      name="newPassword"
                      className={`w-full p-2 border rounded ${errors.newPassword ? 'border-red-500' : 'border-gray-300'}`}
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                    />
                    {errors.newPassword && (
                      <p className="text-red-500 text-xs mt-1">{errors.newPassword}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                    <input 
                      type="password" 
                      name="confirmPassword"
                      className={`w-full p-2 border rounded ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                    />
                    {errors.confirmPassword && (
                      <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-end mt-4">
                  <LoadingButton
                    isLoading={isSubmitting}
                    loadingText="Updating..."
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                    onClick={handleChangePassword}
                  >
                    Change Password
                  </LoadingButton>
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
                        <td className="py-2">View Dashboard</td>
                        <td className="py-2 text-center">
                          <input type="checkbox" checked disabled className="h-4 w-4 text-blue-600" />
                        </td>
                        <td className="py-2 text-center">
                          <input type="checkbox" checked disabled className="h-4 w-4 text-blue-600" />
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">Manage Inventory</td>
                        <td className="py-2 text-center">
                          <input type="checkbox" checked disabled className="h-4 w-4 text-blue-600" />
                        </td>
                        <td className="py-2 text-center">
                          <input type="checkbox" checked disabled className="h-4 w-4 text-blue-600" />
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">Process Sales</td>
                        <td className="py-2 text-center">
                          <input type="checkbox" checked disabled className="h-4 w-4 text-blue-600" />
                        </td>
                        <td className="py-2 text-center">
                          <input type="checkbox" checked disabled className="h-4 w-4 text-blue-600" />
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">View Reports</td>
                        <td className="py-2 text-center">
                          <input type="checkbox" checked disabled className="h-4 w-4 text-blue-600" />
                        </td>
                        <td className="py-2 text-center">
                          <input type="checkbox" checked disabled className="h-4 w-4 text-blue-600" />
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">Edit Product Prices</td>
                        <td className="py-2 text-center">
                          <input type="checkbox" checked disabled className="h-4 w-4 text-blue-600" />
                        </td>
                        <td className="py-2 text-center">
                          <input type="checkbox" disabled className="h-4 w-4 text-blue-600" />
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">Apply Discounts : 20%</td>
                        <td className="py-2 text-center">
                          <input type="checkbox" checked disabled className="h-4 w-4 text-blue-600" />
                        </td>
                        <td className="py-2 text-center">
                          <input type="checkbox" disabled className="h-4 w-4 text-blue-600" />
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">View Profit Reports</td>
                        <td className="py-2 text-center">
                          <input type="checkbox" checked disabled className="h-4 w-4 text-blue-600" />
                        </td>
                        <td className="py-2 text-center">
                          <input type="checkbox" disabled className="h-4 w-4 text-blue-600" />
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">Manage Users</td>
                        <td className="py-2 text-center">
                          <input type="checkbox" checked disabled className="h-4 w-4 text-blue-600" />
                        </td>
                        <td className="py-2 text-center">
                          <input type="checkbox" disabled className="h-4 w-4 text-blue-600" />
                        </td>
                      </tr>
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