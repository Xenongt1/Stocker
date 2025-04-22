import React from 'react';

// Full page loading spinner
export const FullPageLoader = () => {
  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-5 rounded-lg shadow-lg flex flex-col items-center">
        <div className="loader w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-700">Loading...</p>
      </div>
    </div>
  );
};

// Component loader - to be used in cards, panels etc.
export const ComponentLoader = ({ size = 'medium', text = 'Loading...' }) => {
  const sizeClasses = {
    small: 'w-6 h-6 border-2',
    medium: 'w-10 h-10 border-3',
    large: 'w-16 h-16 border-4'
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className={`loader ${sizeClasses[size]} border-blue-500 border-t-transparent rounded-full animate-spin`}></div>
      {text && <p className="mt-2 text-gray-600 text-sm">{text}</p>}
    </div>
  );
};

// Inline loader - for buttons or small areas
export const InlineLoader = ({ size = 'small', color = 'text-white' }) => {
  const sizeClasses = {
    xsmall: 'w-3 h-3 border-1',
    small: 'w-4 h-4 border-2',
    medium: 'w-6 h-6 border-2'
  };

  const colorClasses = {
    'text-white': 'border-white border-t-transparent',
    'text-blue': 'border-blue-500 border-t-transparent',
    'text-gray': 'border-gray-500 border-t-transparent'
  };

  return (
    <div className={`loader ${sizeClasses[size]} ${colorClasses[color]} rounded-full animate-spin inline-block`}></div>
  );
};

// Button with loading state
export const LoadingButton = ({ 
  isLoading, 
  loadingText = 'Loading...', 
  className = '', 
  children, 
  disabled = false,
  ...props 
}) => {
  return (
    <button 
      className={`relative ${className}`} 
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center justify-center">
          <InlineLoader />
          <span className="ml-2">{loadingText}</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};

export default {
  FullPageLoader,
  ComponentLoader,
  InlineLoader,
  LoadingButton
};