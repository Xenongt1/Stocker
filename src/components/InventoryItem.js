import React, { useState } from 'react';

const InventoryItem = ({ 
  item,
  isAdmin = false,
  onEdit = () => {},
  onDelete = () => {},
  onUpdateStock = () => {}
}) => {
  const [stockAdjustment, setStockAdjustment] = useState(0);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  
  const handleStockUpdate = () => {
    onUpdateStock(item.id, parseInt(stockAdjustment));
    setStockAdjustment(0);
    setShowAdjustModal(false);
  };
  
  // Determine status based on quantity and threshold
  const getStockStatus = () => {
    if (item.quantity <= 0) return { class: 'bg-red-100 text-red-800', text: 'OUT OF STOCK' };
    if (item.quantity <= item.minStockLevel / 2) return { class: 'bg-red-100 text-red-800', text: 'CRITICAL' };
    if (item.quantity <= item.minStockLevel) return { class: 'bg-yellow-100 text-yellow-800', text: 'LOW' };
    return { class: 'bg-green-100 text-green-800', text: 'OK' };
  };
  
  const stockStatus = getStockStatus();
  
  return (
    <div className="border rounded-lg shadow-sm overflow-hidden">
      <div className="p-4 bg-white">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-lg">{item.name}</h3>
            <p className="text-sm text-gray-600">SKU: {item.sku}</p>
          </div>
          <div>
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${stockStatus.class}`}>
              {stockStatus.text}
            </span>
          </div>
        </div>
        
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div>
            <p className="text-sm text-gray-600">Price</p>
            <p className="font-semibold">${item.price.toFixed(2)}</p>
          </div>
          {isAdmin && (
            <div>
              <p className="text-sm text-gray-600">Cost</p>
              <p className="font-semibold">${item.costPrice.toFixed(2)}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-600">Quantity</p>
            <p className="font-semibold">{item.quantity}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Category</p>
            <p className="font-semibold">{item.category}</p>
          </div>
        </div>
        
        <div className="mt-4 flex space-x-2">
          <button 
            className="text-blue-600 hover:text-blue-800 text-sm" 
            onClick={() => onEdit(item)}
          >
            {isAdmin ? 'Edit' : 'View Details'}
          </button>
          
          <button 
            className="text-blue-600 hover:text-blue-800 text-sm" 
            onClick={() => setShowAdjustModal(true)}
          >
            Adjust Stock
          </button>
          
          {isAdmin && (
            <button 
              className="text-red-600 hover:text-red-800 text-sm" 
              onClick={() => onDelete(item.id)}
            >
              Delete
            </button>
          )}
        </div>
      </div>
      
      {/* Stock adjustment modal */}
      {showAdjustModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded shadow-lg w-80">
            <h3 className="font-bold mb-3">Adjust Stock: {item.name}</h3>
            
            <div>
              <p className="text-sm mb-1">Current Stock: {item.quantity}</p>
              <div className="flex items-center space-x-2 mb-3">
                <button 
                  className="w-8 h-8 border rounded flex items-center justify-center"
                  onClick={() => setStockAdjustment(prev => parseInt(prev) - 1)}
                >
                  -
                </button>
                <input 
                  type="number"
                  className="flex-1 p-2 border rounded text-center"
                  value={stockAdjustment}
                  onChange={(e) => setStockAdjustment(e.target.value)}
                  placeholder="Enter amount"
                />
                <button 
                  className="w-8 h-8 border rounded flex items-center justify-center"
                  onClick={() => setStockAdjustment(prev => parseInt(prev) + 1)}
                >
                  +
                </button>
              </div>
              <p className="text-sm mb-3">
                {stockAdjustment > 0 
                  ? `Add ${stockAdjustment} items (New total: ${item.quantity + parseInt(stockAdjustment)})` 
                  : stockAdjustment < 0 
                    ? `Remove ${Math.abs(stockAdjustment)} items (New total: ${item.quantity + parseInt(stockAdjustment)})` 
                    : 'No change to inventory'}
              </p>
            </div>
            
            <div className="flex justify-end space-x-2">
              <button 
                className="px-3 py-1 border rounded"
                onClick={() => setShowAdjustModal(false)}
              >
                Cancel
              </button>
              <button 
                className="px-3 py-1 bg-blue-500 text-white rounded"
                onClick={handleStockUpdate}
                disabled={stockAdjustment === 0}
              >
                Update Stock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryItem;