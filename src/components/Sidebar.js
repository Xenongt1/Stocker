// then you should import from './Icons' (same directory) not '../components/Icons'
import React, { useState } from 'react';
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

const Sidebar = ({ isAdmin, activePage, onNavigate, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

return (
  <>
    {/* Mobile menu button - visible only on small screens */}
    <div className="lg:hidden fixed top-0 left-0 z-20 m-4">
      <button 
        onClick={toggleMobileMenu} 
        className="p-2 rounded-md bg-gray-800 text-white hover:bg-gray-700 focus:outline-none"
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
    </div>
    
    {/* Sidebar - fixed position and full height */}
    <div 
      className={`${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      } fixed top-0 left-0 z-10 w-64 h-screen bg-gray-800 text-white transition-transform duration-300 ease-in-out overflow-y-auto`}
    >
      <div className="p-4 h-full">
        <div className="flex items-center space-x-2 mb-6">
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
            <span className="font-bold">{isAdmin ? 'A' : 'U'}</span>
          </div>
          <div>
            <p className="font-bold">{isAdmin ? 'Admin User' : 'Store User'}</p>
            <p className="text-xs text-gray-400">{isAdmin ? 'Administrator' : 'Staff'}</p>
          </div>
          {/* Close button for mobile */}
          <button 
            onClick={toggleMobileMenu}
            className="ml-auto p-1 rounded text-gray-400 lg:hidden hover:text-white hover:bg-gray-700"
          >
            <X size={20} />
          </button>
        </div>
        
        <nav className="h-full pb-20">
          <ul className="space-y-2">
            <li>
              <button 
                className={`flex items-center w-full text-left p-2 rounded ${activePage === (isAdmin ? 'adminDashboard' : 'userDashboard') ? 'bg-blue-700' : 'hover:bg-gray-700'}`}
                onClick={() => {
                  onNavigate(isAdmin ? 'adminDashboard' : 'userDashboard');
                  setIsMobileMenuOpen(false);
                }}
              >
                <Home size={18} className="mr-2" />
                Dashboard
              </button>
            </li>
            <li>
                <button 
                  className={`flex items-center w-full text-left p-2 rounded ${activePage === 'inventory' ? 'bg-blue-700' : 'hover:bg-gray-700'}`}
                  onClick={() => {
                    onNavigate('inventory');
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <Package size={18} className="mr-2" />
                  Inventory
                </button>
              </li>
              <li>
                <button 
                  className={`flex items-center w-full text-left p-2 rounded ${activePage === 'sales' ? 'bg-blue-700' : 'hover:bg-gray-700'}`}
                  onClick={() => {
                    onNavigate('sales');
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <ShoppingCart size={18} className="mr-2" />
                  Sales
                </button>
              </li>
              <li>
                <button 
                  className={`flex items-center w-full text-left p-2 rounded ${activePage === 'reports' ? 'bg-blue-700' : 'hover:bg-gray-700'}`}
                  onClick={() => {
                    onNavigate('reports');
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <BarChart2 size={18} className="mr-2" />
                  Reports
                </button>
              </li>
              {isAdmin && (
                <li>
                  <button 
                    className={`flex items-center w-full text-left p-2 rounded ${activePage === 'users' ? 'bg-blue-700' : 'hover:bg-gray-700'}`}
                    onClick={() => {
                      onNavigate('users');
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <Users size={18} className="mr-2" />
                    User Management
                  </button>
                </li>
              )}
              <li>
                <button 
                  className={`flex items-center w-full text-left p-2 rounded ${activePage === 'settings' ? 'bg-blue-700' : 'hover:bg-gray-700'}`}
                  onClick={() => {
                    onNavigate('settings');
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <Settings size={18} className="mr-2" />
                  Settings
                </button>
              </li>
              <li className="pt-4 mt-4 border-t border-gray-700">
                <button 
                  className="flex items-center w-full text-left p-2 rounded text-red-300 hover:bg-gray-700"
                  onClick={onLogout}
                >
                  <LogOut size={18} className="mr-2" />
                  Logout
                </button>
              </li>
          </ul>
        </nav>
      </div>
    </div>

    {/* Add a spacer div for large screens to push content to the right */}
    <div className="hidden lg:block w-64 flex-shrink-0"></div>
  </>
);
};

export default Sidebar;