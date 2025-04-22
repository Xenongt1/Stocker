import React, { useState } from 'react';
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

function App() {
  const [page, setPage] = useState('login');
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  
  // Login handler
  const handleLogin = (role) => {
    setIsLoading(true);
    
    // Simulate API authentication delay
    setTimeout(() => {
      setUserRole(role);
      setPage(role === 'admin' ? 'adminDashboard' : 'userDashboard');
      setIsLoading(false);
    }, 1000);
  };
  
  // Logout handler
  const handleLogout = () => {
    setIsLoading(true);
    
    // Simulate logout delay
    setTimeout(() => {
      setUserRole(null);
      setPage('login');
      setIsLoading(false);
      // Reset profile image on logout
      setProfileImage(null);
    }, 500);
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
      profileImage: profileImage
    };
    
    switch(page) {
      case 'login':
        return <LoginPage onLogin={handleLogin} />;
      case 'userDashboard':
        return <UserDashboard {...commonProps} />;
      case 'adminDashboard':
        return <AdminDashboard {...commonProps} />;
      case 'inventory':
        return <InventoryPage isAdmin={userRole === 'admin'} {...commonProps} />;
      case 'sales':
        return <SalesPage isAdmin={userRole === 'admin'} {...commonProps} />;
      case 'reports':
        return <ReportsPage isAdmin={userRole === 'admin'} {...commonProps} />;
      case 'users':
        return userRole === 'admin' ? 
          <UserManagementPage {...commonProps} /> : 
          <AccessDenied onBack={() => handleNavigate(userRole === 'admin' ? 'adminDashboard' : 'userDashboard')} />;
      case 'settings':
        return <SettingsPage 
          isAdmin={userRole === 'admin'} 
          {...commonProps}
          onProfileUpdate={handleProfileUpdate}
        />;
      default:
        return <LoginPage onLogin={handleLogin} />;
    }
  };
  
  return (
    <NotificationProvider>
      <div className="bg-gray-100 min-h-screen">
        {isLoading && <FullPageLoader />}
        {renderPage()}
      </div>
    </NotificationProvider>
  );
}

export default App;