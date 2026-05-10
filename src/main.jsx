import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// Clear all SW caches on every load to always serve fresh content
const clearCachesAndRegisterSW = async () => {
  try {
    // Clear all existing caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }
  } catch (error) {
    console.warn('Cache clear failed:', error);
  }
};

clearCachesAndRegisterSW().then(() => {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <App />
  );

  // Register service worker for PWA functionality (push notifications)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => {
        // Force check for updates immediately
        reg.update();
        console.log('Service Worker registered:', reg);
      })
      .catch(error => {
        console.warn('Service Worker registration failed:', error);
      });
  }
});