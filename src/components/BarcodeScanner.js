import React, { useState, useEffect, useRef } from 'react';
import { Camera } from './Icons';

const BarcodeScanner = ({ onScan, onClose }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  // Request camera access when component mounts
  useEffect(() => {
    const requestCameraAccess = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        
        setHasPermission(true);
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
        setError(err.message || 'Could not access camera');
        setHasPermission(false);
      }
    };
    
    requestCameraAccess();
    
    // Cleanup function to stop camera when component unmounts
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);
  
  // Handle starting the scan
  const startScan = () => {
    setIsScanning(true);
    scanBarcode();
  };
  
  // Handle manual code entry
  const handleManualEntry = () => {
    const code = prompt('Enter barcode number:');
    if (code) {
      onScan(code);
    }
  };
  
  // Simulate barcode scanning (in a real app, this would use a barcode detection library)
  const scanBarcode = () => {
    if (!isScanning) return;
    
    // In a real implementation, you would:
    // 1. Grab a frame from the video
    // 2. Use a barcode detection library to scan the frame
    // 3. Return the detected barcode
    
    // For this demo, we'll simulate finding a barcode after a delay
    setTimeout(() => {
      // Generate a random barcode for demonstration
      const randomBarcode = 'PROD' + Math.floor(1000000 + Math.random() * 9000000);
      
      // Draw a frame on the canvas to highlight "detected" barcode
      if (canvasRef.current && videoRef.current) {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        const ctx = canvas.getContext('2d');
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Center area representing the "detected" barcode
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const width = canvas.width / 3;
        const height = canvas.height / 8;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#00FF00';
        ctx.lineWidth = 3;
        ctx.strokeRect(centerX - width/2, centerY - height/2, width, height);
        
        // "Found" indicator
        ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
        ctx.fillRect(centerX - width/2, centerY - height/2, width, height);
        
        // Return the "scanned" barcode
        setIsScanning(false);
        onScan(randomBarcode);
      }
    }, 2000);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
        <div className="p-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-medium">Barcode Scanner</h3>
            <button 
              className="text-gray-400 hover:text-gray-500"
              onClick={onClose}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="bg-gray-100 rounded-lg overflow-hidden relative aspect-video">
            {hasPermission === null && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p>Requesting camera access...</p>
              </div>
            )}
            
            {hasPermission === false && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                <svg className="w-12 h-12 text-red-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-center font-medium text-red-700">Camera access denied</p>
                <p className="text-center text-sm text-gray-500 mt-1">{error || 'Please grant camera permission to scan barcodes'}</p>
              </div>
            )}
            
            {hasPermission === true && (
              <>
                <video 
                  ref={videoRef} 
                  className="w-full h-full object-cover" 
                  autoPlay 
                  playsInline
                ></video>
                <canvas 
                  ref={canvasRef} 
                  className="absolute inset-0 w-full h-full" 
                ></canvas>
                
                {/* Scanning guide overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="h-full w-full flex items-center justify-center">
                    {!isScanning && (
                      <div className="border-2 border-dashed border-white w-3/4 h-1/4 rounded-lg"></div>
                    )}
                  </div>
                </div>
                
                {/* Scanning animation */}
                {isScanning && (
                  <div className="absolute inset-x-0 top-1/2 h-0.5 bg-red-500 animate-pulse"></div>
                )}
              </>
            )}
          </div>
          
          <div className="mt-4 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            {hasPermission === true && (
              <button
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded font-medium flex items-center justify-center"
                onClick={startScan}
                disabled={isScanning}
              >
                {isScanning ? (
                  <>
                    <span className="mr-2">Scanning...</span>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </>
                ) : (
                  <>
                    <Camera className="w-5 h-5 mr-2" />
                    Scan Barcode
                  </>
                )}
              </button>
            )}
            
            <button
              className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded font-medium"
              onClick={handleManualEntry}
            >
              Enter Manually
            </button>
            
            <button
              className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded font-medium"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
          
          <p className="mt-4 text-xs text-gray-500 text-center">
            Position the barcode inside the rectangle and hold steady.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;