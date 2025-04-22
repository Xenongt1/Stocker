import React, { useState, useRef } from 'react';
import { Camera } from './Icons';

const ProfilePicture = ({ initialImage, userName, isAdmin, onImageChange }) => {
  const [image, setImage] = useState(initialImage || null);
  const [showModal, setShowModal] = useState(false);
  const fileInputRef = useRef(null);
  
  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newImage = e.target.result;
        setImage(newImage);
        if (onImageChange) {
          onImageChange(newImage);
        }
      };
      reader.readAsDataURL(file);
    }
    setShowModal(false);
  };
  
  // Trigger file input click
  const handleSelectImage = () => {
    fileInputRef.current.click();
  };
  
  // Modal for image upload options
  const renderModal = () => {
    if (!showModal) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800">Change Profile Picture</h3>
            <button 
              className="text-gray-500 hover:text-gray-700" 
              onClick={() => setShowModal(false)}
            >
              &times;
            </button>
          </div>
          
          <div className="space-y-4">
            <button 
              className="w-full p-3 border rounded flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
              onClick={handleSelectImage}
            >
              <Camera size={20} />
              <span>Upload from device</span>
            </button>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              className="hidden" 
            />
            
            {image && (
              <button 
                className="w-full p-3 border border-red-300 text-red-500 rounded hover:bg-red-50 transition-colors"
                onClick={() => {
                  setImage(null);
                  if (onImageChange) {
                    onImageChange(null);
                  }
                  setShowModal(false);
                }}
              >
                Remove current photo
              </button>
            )}
          </div>
          
          <div className="mt-6 flex justify-end">
            <button 
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  const userInitial = userName ? userName.charAt(0).toUpperCase() : (isAdmin ? 'A' : 'U');
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        {image ? (
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200">
            <img 
              src={image} 
              alt="Profile" 
              className="w-full h-full object-cover" 
            />
          </div>
        ) : (
          <div className="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold">
            {userInitial}
          </div>
        )}
        
        <button 
          className="absolute bottom-0 right-0 bg-white p-1.5 rounded-full shadow-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          onClick={() => setShowModal(true)}
          aria-label="Change profile picture"
        >
          <Camera size={16} />
        </button>
      </div>
      
      <button 
        className="text-blue-600 text-sm hover:underline mt-2 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-0.5"
        onClick={() => setShowModal(true)}
      >
        Change Profile Picture
      </button>
      
      {renderModal()}
    </div>
  );
};

export default ProfilePicture;