import React, { useState, useRef } from 'react';
import { importFromFile } from '../utils/dataImportExport';
import { LoadingButton } from './LoadingState';

const ImportData = ({ onImport, supportedFormats = ['csv', 'xlsx', 'xls'], className = '' }) => {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);
  
  // Supported formats text
  const formatText = supportedFormats.map(format => format.toUpperCase()).join(', ');
  
  // Handle drag events
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };
  
  const handleDragLeave = () => {
    setDragging(false);
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    
    const files = e.dataTransfer.files;
    
    if (files.length > 0) {
      validateAndSetFile(files[0]);
    }
  };
  
  const handleFileChange = (e) => {
    const files = e.target.files;
    
    if (files.length > 0) {
      validateAndSetFile(files[0]);
    }
  };
  
  // Validate file type and set file
  const validateAndSetFile = (file) => {
    const extension = file.name.split('.').pop().toLowerCase();
    
    if (!supportedFormats.includes(extension)) {
      setError(`Unsupported file format. Please upload ${formatText} files.`);
      setFile(null);
      return;
    }
    
    setFile(file);
    setError(null);
  };
  
  // Reset the file input
  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setFile(null);
    setError(null);
  };
  
  // Process the imported file
  const processFile = async () => {
    if (!file) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const parsedData = await importFromFile(file);
      onImport(parsedData);
      resetFileInput();
    } catch (err) {
      setError(`Error processing file: ${err.message}`);
      console.error('Import error:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className={`import-data ${className}`}>
      <div 
        className={`border-2 border-dashed rounded-lg p-6 text-center ${dragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="mb-4">
          <svg 
            className="mx-auto h-12 w-12 text-gray-400" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
            />
          </svg>
        </div>
        
        {file ? (
          <div className="mb-4">
            <p className="text-sm font-medium">Selected file:</p>
            <p className="text-sm text-gray-600">{file.name}</p>
          </div>
        ) : (
          <>
            <p className="text-sm font-medium mb-1">Drag and drop your file here, or</p>
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={() => fileInputRef.current.click()}
            >
              Browse files
            </button>
            <p className="text-xs text-gray-500 mt-2">Supported formats: {formatText}</p>
          </>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          accept={supportedFormats.map(format => `.${format}`).join(',')}
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
      
      {error && (
        <div className="mt-2 text-sm text-red-600">
          {error}
        </div>
      )}
      
      <div className="mt-4 flex justify-end space-x-3">
        {file && (
          <>
            <button
              type="button"
              className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={resetFileInput}
            >
              Cancel
            </button>
            
            <LoadingButton
              isLoading={isLoading}
              loadingText="Processing..."
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed"
              onClick={processFile}
            >
              Import Data
            </LoadingButton>
          </>
        )}
      </div>
    </div>
  );
};

export default ImportData;