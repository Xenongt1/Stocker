import React from 'react';

function SalesSummary({ sales = [], title = "Sales Summary", showDetails = false }) {
  // Calculate total amount
  const totalAmount = sales.reduce((sum, sale) => sum + sale.amount, 0);
  
  // Calculate total items
  const totalItems = sales.reduce((sum, sale) => sum + sale.quantity, 0);
  
  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="font-bold mb-3">{title}</h3>
      
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-blue-50 p-3 rounded">
          <p className="text-sm text-gray-600">Total Sales</p>
          <p className="text-xl font-bold">${totalAmount.toFixed(2)}</p>
        </div>
        <div className="bg-green-50 p-3 rounded">
          <p className="text-sm text-gray-600">Items Sold</p>
          <p className="text-xl font-bold">{totalItems}</p>
        </div>
        <div className="bg-purple-50 p-3 rounded">
          <p className="text-sm text-gray-600">Transactions</p>
          <p className="text-xl font-bold">{sales.length}</p>
        </div>
      </div>
      
      {showDetails && sales.length > 0 && (
        <div>
          <h4 className="font-medium mb-2 text-gray-700">Recent Transactions</h4>
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
              {sales.map((sale, index) => (
                <tr key={index} className="border-b">
                  <td className="py-2">{sale.product}</td>
                  <td className="py-2">{sale.quantity}</td>
                  <td className="py-2">${sale.amount.toFixed(2)}</td>
                  <td className="py-2">{sale.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {!showDetails && sales.length > 0 && (
        <div className="flex justify-end">
          <button className="text-blue-600 text-sm hover:underline">View Details →</button>
        </div>
      )}
      
      {sales.length === 0 && (
        <div className="text-center py-4 text-gray-500">
          No sales data available for the selected period.
        </div>
      )}
    </div>
  );
}

export default SalesSummary;