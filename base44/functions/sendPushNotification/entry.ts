import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import webpush from 'npm:web-push@3.6.7';

// הגדרת VAPID keys - ניתן להשתמש ב-keys כללים או להגדיר משלך
const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY') || 'BEp_b0JJG7-HbuFT_x79GWS26Ydr4Uc5XAiNWqN2WwP8bHGIbXzSNhNEhbVjjSZNFJr-yd7KhVEQjVtOCgFOLIk';
const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY') || 'BPvHGwv5rkSgnm3p5QAq7LV7xSzJrXGmPqaE7fXWqJs';

webpush.setVapidDetails(
  'mailto:test@example.com',
  vapidPublicKey,
  vapidPrivateKey
);

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    
    const { targetUserEmail, title, body: messageBody, data } = body;
    
    if (!targetUserEmail || !title || !messageBody) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // קבלת כל המנויים של המשתמש
    const subscriptions = await base44.entities.PushSubscription.filter({
      userEmail: targetUserEmail
    });

    if (subscriptions.length === 0) {
      return Response.json({ success: true, sent: 0, message: 'No subscriptions found' });
    }

    const payload = JSON.stringify({
      title,
      body: messageBody,
      data: data || {},
      timestamp: new Date().toISOString()
    });

    let sentCount = 0;
    const errors = [];

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification({
          endpoint: sub.endpoint,
          keys: {
            auth: sub.auth,
            p256dh: sub.p256dh
          }
        }, payload);
        sentCount++;
      } catch (error) {
        errors.push({ subscriptionId: sub.id, error: error.message });
      }
    }

    return Response.json({ 
      success: true, 
      sent: sentCount, 
      total: subscriptions.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});