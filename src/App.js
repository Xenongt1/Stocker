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

function App() {
  const [page, setPage] = useState('login');
  const [userRole, setUserRole] = useState(null);
  
  // Login handler
  const handleLogin = (role) => {
    setUserRole(role);
    setPage(role === 'admin' ? 'adminDashboard' : 'userDashboard');
  };
  
  // Logout handler
  const handleLogout = () => {
    setUserRole(null);
    setPage('login');
  };
  
  // Renders the appropriate page based on state
  const renderPage = () => {
    switch(page) {
      case 'login':
        return <LoginPage onLogin={handleLogin} />;
      case 'userDashboard':
        return <UserDashboard onNavigate={setPage} onLogout={handleLogout} />;
      case 'adminDashboard':
        return <AdminDashboard onNavigate={setPage} onLogout={handleLogout} />;
      case 'inventory':
        return <InventoryPage isAdmin={userRole === 'admin'} onNavigate={setPage} onLogout={handleLogout} />;
      case 'sales':
        return <SalesPage isAdmin={userRole === 'admin'} onNavigate={setPage} onLogout={handleLogout} />;
      case 'reports':
        return <ReportsPage isAdmin={userRole === 'admin'} onNavigate={setPage} onLogout={handleLogout} />;
      case 'users':
        return userRole === 'admin' ? 
          <UserManagementPage onNavigate={setPage} onLogout={handleLogout} /> : 
          <AccessDenied onBack={() => setPage(userRole === 'admin' ? 'adminDashboard' : 'userDashboard')} />;
      case 'settings':
        return <SettingsPage isAdmin={userRole === 'admin'} onNavigate={setPage} onLogout={handleLogout} />;
      default:
        return <LoginPage onLogin={handleLogin} />;
    }
  };
  
  return (
    <div className="bg-gray-100 min-h-screen">
      {renderPage()}
    </div>
  );
}
export default App;