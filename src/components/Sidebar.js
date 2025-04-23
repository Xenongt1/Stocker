import React, { useState, useEffect } from 'react';
import { 
  Home, 
  Package, 
  ShoppingCart, 
  BarChart2, 
  Users, 
  Settings, 
  LogOut,
  Menu,
  X
} from './Icons';

const Sidebar = ({ 
  isAdmin, 
  activePage, 
  onNavigate, 
  onLogout, 
  profileImage,
  username
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState({
    lowStock: 3,
    pendingOrders: 2,
  });
  
  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  
  // Close menu when navigating on mobile
  const handleNavigate = (page) => {
    onNavigate(page);
    setIsMobileMenuOpen(false);
  };
  
  // Close sidebar on screen resize (larger than lg breakpoint)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Get the display username or fallback to role
  const displayUsername = username || (isAdmin ? 'Admin' : 'User');
  // Get first letter for avatar
  const userInitial = displayUsername ? displayUsername.charAt(0).toUpperCase() : (isAdmin ? 'A' : 'U');
  
  return (
    <>
      {/* Mobile menu button - visible only on small screens */}
      <div className="lg:hidden fixed top-0 left-0 z-20 m-4">
        <button 
          onClick={toggleMobileMenu} 
          className="p-2 rounded-md bg-gray-800 text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      
      {/* Overlay for mobile - closes menu when clicking outside */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-10"
          onClick={toggleMobileMenu}
        ></div>
      )}
      
      {/* Sidebar - fixed position and full height */}
      <div 
        className={`${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } fixed top-0 left-0 z-20 w-64 h-screen bg-gray-800 text-white transition-transform duration-300 ease-in-out overflow-y-auto`}
      >
        <div className="p-4 h-full flex flex-col">
          <div className="flex items-center space-x-2 mb-6">
            {/* Profile image or initial avatar */}
            {profileImage ? (
              <div className="w-10 h-10 rounded-full overflow-hidden">
                <img 
                  src={profileImage} 
                  alt="Profile" 
                  className="w-full h-full object-cover" 
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="font-bold">{userInitial}</span>
              </div>
            )}
            <div>
              <p className="font-bold">{displayUsername}</p>
              <p className="text-xs text-gray-400">{isAdmin ? 'Administrator' : 'Staff'}</p>
            </div>
            {/* Close button for mobile */}
            <button 
              onClick={toggleMobileMenu}
              className="ml-auto p-1 rounded text-gray-400 lg:hidden hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>
          
          <nav className="flex-1">
            <ul className="space-y-1">
              <li>
                <button 
                  className={`flex items-center w-full text-left p-3 rounded transition-colors ${activePage === (isAdmin ? 'adminDashboard' : 'userDashboard') ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
                  onClick={() => handleNavigate(isAdmin ? 'adminDashboard' : 'userDashboard')}
                >
                  <Home className="mr-3 h-5 w-5" />
                  <span>Dashboard</span>
                </button>
              </li>
              <li>
                <button 
                  className={`flex items-center justify-between w-full text-left p-3 rounded transition-colors ${activePage === 'inventory' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
                  onClick={() => handleNavigate('inventory')}
                >
                  <div className="flex items-center">
                    <Package className="mr-3 h-5 w-5" />
                    <span>Inventory</span>
                  </div>
                  {notifications.lowStock > 0 && (
                    <span className="bg-red-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                      {notifications.lowStock}
                    </span>
                  )}
                </button>
              </li>
              <li>
                <button 
                  className={`flex items-center justify-between w-full text-left p-3 rounded transition-colors ${activePage === 'sales' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
                  onClick={() => handleNavigate('sales')}
                >
                  <div className="flex items-center">
                    <ShoppingCart className="mr-3 h-5 w-5" />
                    <span>Sales</span>
                  </div>
                  {notifications.pendingOrders > 0 && (
                    <span className="bg-yellow-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                      {notifications.pendingOrders}
                    </span>
                  )}
                </button>
              </li>
              <li>
                <button 
                  className={`flex items-center w-full text-left p-3 rounded transition-colors ${activePage === 'reports' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
                  onClick={() => handleNavigate('reports')}
                >
                  <BarChart2 className="mr-3 h-5 w-5" />
                  <span>Reports</span>
                </button>
              </li>
              {isAdmin && (
                <li>
                  <button 
                    className={`flex items-center w-full text-left p-3 rounded transition-colors ${activePage === 'users' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
                    onClick={() => handleNavigate('users')}
                  >
                    <Users className="mr-3 h-5 w-5" />
                    <span>User Management</span>
                  </button>
                </li>
              )}
              <li>
                <button 
                  className={`flex items-center w-full text-left p-3 rounded transition-colors ${activePage === 'settings' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
                  onClick={() => handleNavigate('settings')}
                >
                  <Settings className="mr-3 h-5 w-5" />
                  <span>Settings</span>
                </button>
              </li>
            </ul>
          </nav>
          
          <div className="pt-4 mt-4 border-t border-gray-700">
            <button 
              className="flex items-center w-full text-left p-3 rounded text-red-300 hover:bg-gray-700 transition-colors"
              onClick={onLogout}
            >
              <LogOut className="mr-3 h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Add a spacer div for large screens to push content to the right */}
      <div className="hidden lg:block w-64 flex-shrink-0"></div>
    </>
  );
};

export default Sidebar;