import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const VAPID_PUBLIC_KEY = 'BEp_b0JJG7-HbuFT_x79GWS26Ydr4Uc5XAiNWqN2WwP8bHGIbXzSNhNEhbVjjSZNFJr-yd7KhVEQjVtOCgFOLIk';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushNotificationManager() {
  useEffect(() => {
    const register = async () => {
      // בדוק הזמינות של API הדרוש
      if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
        console.log('Push APIs not available');
        return;
      }

      try {
        // בקש הרשאה אם עדיין לא אושרה
        let permission = Notification.permission;
        console.log('Current notification permission:', permission);
        
        if (permission !== 'granted' && permission !== 'denied') {
          permission = await Notification.requestPermission();
          console.log('Requested permission, result:', permission);
        }
        
        // רשום רק אם אישור הוענק
        if (permission !== 'granted') {
          console.log('Permission not granted, skipping registration');
          return;
        }

        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration);
        await navigator.serviceWorker.ready;

        let subscription = await registration.pushManager.getSubscription();
        console.log('Existing subscription:', subscription ? 'found' : 'not found');

        if (!subscription) {
          console.log('Creating new push subscription...');
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
          });
          console.log('New subscription created');
        }

        if (subscription) {
          console.log('Registering subscription with backend...');
          const authKey = subscription.getKey('auth');
          const p256dhKey = subscription.getKey('p256dh');
          
          const result = await base44.functions.invoke('registerPushSubscription', {
            endpoint: subscription.endpoint,
            auth: authKey ? btoa(String.fromCharCode(...new Uint8Array(authKey))) : '',
            p256dh: p256dhKey ? btoa(String.fromCharCode(...new Uint8Array(p256dhKey))) : '',
          });
          console.log('Push subscription registered:', result);
        }
      } catch (error) {
        console.error('Push registration failed:', error);
      }
    };

    register();
  }, []);

  return null;
}