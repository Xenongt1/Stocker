import React, { useState, useEffect } from 'react';
import LoginPage from './pages/LoginPage';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import InventoryPage from './pages/InventoryPage';
import SalesPage from './pages/SalesPage';
import ReportsPage from './pages/ReportsPage';
import UserManagementPage from './pages/UserManagementPage';
import SettingsPage from './pages/SettingsPage';
import AccessDenied from './pages/AccessDenied';
import {FullPageLoader} from './components/LoadingState';
import { NotificationProvider } from './components/NotificationSystem';
import { AppSettingsProvider } from './context/AppSettingsContext';
import { authService } from './services/api';

function App() {
  const [page, setPage] = useState('login');
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profileImage, setProfileImage] = useState(null);
  
  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      if (authService.isLoggedIn()) {
        try {
          // Get current user data
          const userData = await authService.getCurrentUser();
          setUser(userData);
          
          // Navigate to appropriate dashboard
          setPage(userData.role === 'admin' ? 'adminDashboard' : 'userDashboard');
        } catch (err) {
          // If token is invalid, clear it
          authService.logout();
        }
      }
      
      setIsLoading(false);
    };
    
    checkAuth();
  }, []);
  
  // Login handler
  const handleLogin = (userData) => {
    setIsLoading(true);
    
    setUser(userData);
    setPage(userData.role === 'admin' ? 'adminDashboard' : 'userDashboard');
    setIsLoading(false);
  };
  
  // Logout handler
  const handleLogout = () => {
    setIsLoading(true);
    
    // Clear auth data
    authService.logout();
    
    setUser(null);
    setPage('login');
    setIsLoading(false);
    // Reset profile image on logout
    setProfileImage(null);
  };
  
  // Page navigation handler
  const handleNavigate = (pageName) => {
    setIsLoading(true);
    
    // Simulate page loading delay
    setTimeout(() => {
      setPage(pageName);
      setIsLoading(false);
    }, 300);
  };
  
  // Profile image update handler
  const handleProfileUpdate = (imageData) => {
    setProfileImage(imageData);
    
    // In a real application, you would save this to a database or local storage
    // For demonstration, we're just updating state in memory
    console.log('Profile image updated');
  };
  
  // Renders the appropriate page based on state
  const renderPage = () => {
    // Common props for pages with sidebar
    const commonProps = {
      onNavigate: handleNavigate, 
      onLogout: handleLogout,
      profileImage: profileImage,
      user: user
    };
    
    if (isLoading) {
      return <FullPageLoader />;
    }
    
    switch(page) {
      case 'login':
        return <LoginPage onLoginSuccess={handleLogin} />;
      case 'userDashboard':
        return <UserDashboard {...commonProps} />;
      case 'adminDashboard':
        return <AdminDashboard {...commonProps} />;
      case 'inventory':
        return <InventoryPage isAdmin={user?.role === 'admin'} {...commonProps} />;
      case 'sales':
        return <SalesPage isAdmin={user?.role === 'admin'} {...commonProps} />;
      case 'reports':
        return <ReportsPage isAdmin={user?.role === 'admin'} {...commonProps} />;
      case 'users':
        return user?.role === 'admin' ? 
          <UserManagementPage {...commonProps} /> : 
          <AccessDenied onBack={() => handleNavigate(user?.role === 'admin' ? 'adminDashboard' : 'userDashboard')} />;
      case 'settings':
        return <SettingsPage 
          isAdmin={user?.role === 'admin'} 
          {...commonProps}
          onProfileUpdate={handleProfileUpdate}
        />;
      default:
        return <LoginPage onLoginSuccess={handleLogin} />;
    }
  };
  
  return (
    <AppSettingsProvider>
      <NotificationProvider>
        <div className="bg-gray-100 min-h-screen">
          {renderPage()}
        </div>
      </NotificationProvider>
    </AppSettingsProvider>
  );
}

export default App;