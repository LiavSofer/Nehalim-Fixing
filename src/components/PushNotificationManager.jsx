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
      // אל תנסה לרשום push בתוך iframe (למשל ב-preview של הדשבורד)
      if (window.self !== window.top) return;
      if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return;

      // רשום רק אם המשתמש כבר אישר התראות - אל תשאל אוטומטית
      if (Notification.permission !== 'granted') return;

      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        await navigator.serviceWorker.ready;

        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
          });
        }

        if (subscription) {
          await base44.functions.invoke('registerPushSubscription', {
            endpoint: subscription.endpoint,
            auth: subscription.getKey('auth')
              ? btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('auth'))))
              : '',
            p256dh: subscription.getKey('p256dh')
              ? btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('p256dh'))))
              : '',
          });
        }
      } catch (error) {
        console.error('Push registration failed:', error);
      }
    };

    register();
  }, []);

  return null;
}