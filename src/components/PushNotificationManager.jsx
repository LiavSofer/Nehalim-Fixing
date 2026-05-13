import * as React from 'react';
import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export default function PushNotificationManager() {
  useEffect(() => {
    async function setupOneSignalUser() {
      try {
        const user = await base44.auth.me();
        
        // מוודאים ש-OneSignal נטען (מבוסס על הסקריפט ששמת ב-index.html)
        window.OneSignalDeferred = window.OneSignalDeferred || [];
        
        if (user && user.id) {
          // מקשרים את ה-ID הייחודי של המשתמש מהמערכת שלך אל OneSignal
          window.OneSignalDeferred.push(async function(OneSignal) {
            await OneSignal.login(user.id);
          });
        } else {
          // אם המשתמש התנתק, מנתקים גם מההתראות
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