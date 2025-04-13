import React from 'react';

function ProductCard({ product, isAdmin, onAddToCart }) {
  return (
    <div className="border rounded p-3 flex justify-between items-center">
      <div>
        <h4 className="font-semibold">{product.name}</h4>
        <p className="text-sm text-gray-600">Price: ${product.price.toFixed(2)}</p>
        <p className="text-sm text-gray-600">In stock: {product.quantity}</p>
        {isAdmin && (
          <p className="text-sm text-gray-600">Cost: ${product.costPrice.toFixed(2)}</p>
        )}
      </div>
      <button 
        className="bg-green-500 text-white px-3 py-1 rounded"
        onClick={() => onAddToCart(product)}
      >
        Add
      </button>
    </div>
  );
}

export default ProductCard;