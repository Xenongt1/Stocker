import React from 'react';

function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-md' }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white p-6 rounded-lg shadow-lg w-full ${maxWidth}`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">{title}</h3>
          <button className="text-gray-500 hover:text-gray-700" onClick={onClose}>
            &times;
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default Modal;