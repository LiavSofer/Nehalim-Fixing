import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
// Build timestamp injected at build time — changes on every deploy automatically
const BUILD_TS = import.meta.env.VITE_BUILD_TS || Date.now();

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
);

// Register service worker for PWA functionality (push notifications + caching)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register(`/sw.js?v=${BUILD_TS}`)
    .then(reg => {
      reg.update();
    })
    .catch(error => {
      console.warn('Service Worker registration failed:', error);
    });
}