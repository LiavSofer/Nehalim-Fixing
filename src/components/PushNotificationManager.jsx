import * as React from 'react';
import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export default function PushNotificationManager() {
  useEffect(() => {
    async function setupOneSignalUser() {
      try {
        // שלב 1: מחיקת Service Workers ישנים שמתנגשים עם OneSignal
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (let reg of registrations) {
            // מוחק כל Service Worker שהוא לא הרשמי של OneSignal
            if (!reg.active?.scriptURL.includes('OneSignalSDKWorker')) {
              await reg.unregister();
              console.log('Unregistered conflicting Service Worker:', reg.active?.scriptURL);
            }
          }
        }

        // שלב 2: זיהוי המשתמש מול OneSignal
        const user = await base44.auth.me();
        window.OneSignalDeferred = window.OneSignalDeferred || [];
        
        if (user && user.id) {
          window.OneSignalDeferred.push(async function(OneSignal) {
            // חיבור ה-ID של המערכת שלך ל-OneSignal
            await OneSignal.login(user.id);
          });
        } else {
          window.OneSignalDeferred.push(async function(OneSignal) {
            await OneSignal.logout();
          });
        }
      } catch (error) {
        console.error('PushNotificationManager Error:', error);
      }
    }

    setupOneSignalUser();
  }, []);

  return null;
}