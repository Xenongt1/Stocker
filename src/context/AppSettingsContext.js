// 1. First, we need to create a central store or context for app settings
// This will be stored in a new file: src/context/AppSettingsContext.js

import React, { createContext, useState, useContext, useEffect } from 'react';

// Create the context
const AppSettingsContext = createContext();

// Settings provider component
export const AppSettingsProvider = ({ children }) => {
  // Initialize with default settings
  const [settings, setSettings] = useState({
    storeName: 'Stocker Store',
    currency: 'USD',
    taxRate: 7.5,
    lowStockThreshold: 5,
    receiptFooter: 'Thank you for your purchase!',
  });
  
  // Function to update settings
  const updateSettings = (newSettings) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      ...newSettings
    }));
    
    // In a real app, you would save this to localStorage or a database
    // For demo purposes, we'll add localStorage persistence
    localStorage.setItem('stocker_settings', JSON.stringify({
      ...settings,
      ...newSettings
    }));
  };
  
  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('stocker_settings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error('Error loading settings:', e);
      }
    }
  }, []);
  
  return (
    <AppSettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </AppSettingsContext.Provider>
  );
};

// Custom hook to use settings
export const useAppSettings = () => {
  const context = useContext(AppSettingsContext);
  if (!context) {
    throw new Error('useAppSettings must be used within an AppSettingsProvider');
  }
  return context;
};
