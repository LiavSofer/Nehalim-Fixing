import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// Check for version updates and clear cache if needed
const checkForUpdates = async () => {
  try {
    const response = await fetch('/src/lib/version.js');
    const text = await response.text();
    const versionMatch = text.match(/export const APP_VERSION = ['"]([^'"]+)['"]/);
    const currentVersion = versionMatch ? versionMatch[1] : null;
    
    const storedVersion = localStorage.getItem('appVersion');
    
    if (currentVersion && storedVersion && currentVersion !== storedVersion) {
      // Version changed, clear service worker cache
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
      }
      // Clear all caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
    }
    
    if (currentVersion) {
      localStorage.setItem('appVersion', currentVersion);
    }
  } catch (error) {
    console.warn('Version check failed:', error);
  }
};

checkForUpdates().then(() => {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <App />
  );
  
  // Register service worker for PWA functionality
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => {
        console.log('Service Worker registered successfully:', reg);
      })
      .catch(error => {
        console.warn('Service Worker registration failed:', error);
      });
  }
});