import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { 
  ShoppingCart, 
  Package, 
  BarChart2, 
  Camera,
  Eye,
  EyeOff
} from '../components/Icons';
import ProfilePicture from '../components/ProfilePicture';
const UserDashboard = ({ onNavigate, onLogout, isAdmin = false , profileImage, onProfileUpdate}) => {
    // State for hiding/showing sensitive financial data
    const [showAmounts, setShowAmounts] = useState(false);
    
    // Sample data for recent sales
    const recentSales = [
      { id: 1, product: 'Headphones', quantity: 2, amount: 119.98, date: '2025-04-12' },
      { id: 2, product: 'Office Chair', quantity: 1, amount: 149.99, date: '2025-04-11' },
      { id: 3, product: 'Laptop', quantity: 1, amount: 899.99, date: '2025-04-10' },
    ];
    
    // Function to format amounts based on visibility state
    const formatAmount = (amount) => {
      if (isAdmin && showAmounts) {
        return `$${amount.toFixed(2)}`;
      } else {
        return '********';
      }
    };

    const [updateSuccess, setUpdateSuccess] = useState(false);

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
      // In a real application, you would save these settings to a database
      // For now, just show a success message
      setUpdateSuccess(true);
      setTimeout(() => {
        setUpdateSuccess(false);
      }, 3000);
    };

    // Calculate today's sales total
    const todaySalesTotal = recentSales
      .filter(sale => sale.date === '2025-04-12')
      .reduce((sum, sale) => sum + sale.amount, 0);
      
    // Toggle visibility function - only available to admin
    const toggleAmountVisibility = () => {
      if (isAdmin) {
        setShowAmounts(!showAmounts);
      }
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
          <h2 className="text-xl sm:text-2xl font-bold mb-4">User Dashboard</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded shadow">
              <div className="flex justify-between items-center">
                <h3 className="text-gray-500">Today's Sales</h3>
                {isAdmin && (
                  <button 
                    onClick={toggleAmountVisibility} 
                    className="text-gray-500 hover:text-gray-700 focus:outline-none"
                    aria-label={showAmounts ? "Hide amounts" : "Show amounts"}
                  >
                    {showAmounts ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                )}
              </div>
              <p className="text-xl sm:text-2xl font-bold">
                {formatAmount(todaySalesTotal)}
              </p>
            </div>
            <div className="bg-white p-4 rounded shadow">
              <h3 className="text-gray-500">Items Sold Today</h3>
              <p className="text-xl sm:text-2xl font-bold">3</p>
            </div>
            <div className="bg-white p-4 rounded shadow">
              <h3 className="text-gray-500">Low Stock Items</h3>
              <p className="text-xl sm:text-2xl font-bold">5</p>
              <button 
                className="text-blue-500 text-sm hover:underline mt-1"
                onClick={() => onNavigate('inventory')}
              >
                View details
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded shadow">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold">Recent Sales</h3>
                <div className="flex items-center space-x-2">
                  {isAdmin && (
                    <button 
                      onClick={toggleAmountVisibility} 
                      className="text-gray-500 hover:text-gray-700 focus:outline-none"
                      aria-label={showAmounts ? "Hide amounts" : "Show amounts"}
                    >
                      {showAmounts ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  )}
                  <button 
                    className="text-blue-500 text-sm hover:underline"
                    onClick={() => onNavigate('sales')}
                  >
                    Go to sales
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="pb-2">Product</th>
                      <th className="pb-2">Qty</th>
                      <th className="pb-2">Amount</th>
                      <th className="pb-2">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentSales.map(sale => (
                      <tr key={sale.id} className="border-b">
                        <td className="py-2">{sale.product}</td>
                        <td className="py-2">{sale.quantity}</td>
                        <td className="py-2">
                          <span className={!isAdmin ? "text-gray-400" : ""}>
                            {formatAmount(sale.amount)}
                          </span>
                        </td>
                        <td className="py-2">{sale.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded shadow">
              <h3 className="font-bold mb-4">Quick Actions</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <button 
                  className="bg-blue-100 text-blue-800 p-4 rounded flex flex-col items-center justify-center"
                  onClick={() => onNavigate('sales')}
                >
                  <ShoppingCart size={24} className="mb-2" />
                  <span>New Sale</span>
                </button>
                
                <button 
                  className="bg-green-100 text-green-800 p-4 rounded flex flex-col items-center justify-center"
                  onClick={() => onNavigate('inventory')}
                >
                  <Package size={24} className="mb-2" />
                  <span>Update Stock</span>
                </button>
                
                <button 
                  className="bg-yellow-100 text-yellow-800 p-4 rounded flex flex-col items-center justify-center"
                  onClick={() => onNavigate('reports')}
                >
                  <BarChart2 size={24} className="mb-2" />
                  <span>View Reports</span>
                </button>
                
                <button 
                  className="bg-purple-100 text-purple-800 p-4 rounded flex flex-col items-center justify-center"
                  onClick={() => onNavigate('inventory', { showScanner: true })}
                >
                  <Camera size={24} className="mb-2" />
                  <span>Scan Barcode</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

export default UserDashboard;