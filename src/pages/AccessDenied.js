
import React from 'react';


// Access Denied Component
const AccessDenied = ({ onBack }) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100">
      <div className="bg-white p-6 sm:p-8 rounded shadow-lg max-w-md w-full text-center">
        <div className="text-red-500 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
          </svg>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-gray-600 mb-6">
          You don't have permission to access this page. Please contact an administrator if you believe this is an error.
        </p>
        <button 
          className="bg-blue-600 text-white px-4 py-2 rounded w-full"
          onClick={onBack}
        >
          Go Back
        </button>
      </div>
    </div>
  );
};

    export default AccessDenied;