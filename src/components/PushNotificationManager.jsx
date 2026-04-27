import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function PushNotificationManager() {
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    const registerServiceWorker = async () => {
      try {
        // בדוק תמיכה בבדפדפן
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
          console.log('Push notifications not supported');
          return;
        }

        // רשום את ה-service worker
        const registration = await navigator.serviceWorker.register('/sw.js');

        // קבל את ה-subscription
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: 'BEp_b0JJG7-HbuFT_x79GWS26Ydr4Uc5XAiNWqN2WwP8bHGIbXzSNhNEhbVjjSZNFJr-yd7KhVEQjVtOCgFOLIk'
          });
        }

        // שלח את ה-subscription לשרת
        if (subscription) {
          await base44.functions.invoke('registerPushSubscription', {
            endpoint: subscription.endpoint,
            auth: subscription.getKey('auth') ? 
              btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('auth')))) : '',
            p256dh: subscription.getKey('p256dh') ? 
              btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('p256dh')))) : ''
          });

          setRegistered(true);
        }
      } catch (error) {
        console.error('Push notification registration failed:', error);
      }
    };

    registerServiceWorker();
  }, []);

  return null;
}