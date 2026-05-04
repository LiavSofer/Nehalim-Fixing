import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import webpush from 'npm:web-push@3.6.7';

// VAPID key pair - generated valid pair
const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY') || 'BEp_b0JJG7-HbuFT_x79GWS26Ydr4Uc5XAiNWqN2WwP8bHGIbXzSNhNEhbVjjSZNFJr-yd7KhVEQjVtOCgFOLIk';
const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY') || 'Tpl5GdFNg4pTFZaQjYZHjvvkV9Wf4bGQkXaVmNY0Q8A';

webpush.setVapidDetails(
  'mailto:maintenance@nachalim.org',
  vapidPublicKey,
  vapidPrivateKey
);

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { targetUserEmail, title, body: messageBody, data, notificationKey } = body;

    if (!targetUserEmail || !title || !messageBody) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // בדוק העדפות התראות של המשתמש אם יש notificationKey
    if (notificationKey) {
      try {
        const users = await base44.asServiceRole.entities.User.filter({ email: targetUserEmail });
        if (users.length > 0) {
          const userId = users[0].id;
          const prefsList = await base44.asServiceRole.entities.NotificationPreferences.filter({ userId });
          if (prefsList.length > 0) {
            const prefs = prefsList[0];
            if (prefs[notificationKey] === false) {
              return Response.json({ success: true, skipped: true, reason: 'user_preference' });
            }
          }
        }
      } catch (e) {
        // אם לא ניתן לטעון העדפות - ממשיך לשלוח
      }
    }

    // קבלת כל המנויים של המשתמש
    const subscriptions = await base44.asServiceRole.entities.PushSubscription.filter({
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
    const toDelete = [];

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
        // 410 Gone = subscription expired, mark for deletion
        if (error.statusCode === 410 || error.statusCode === 404) {
          toDelete.push(sub.id);
        }
        errors.push({ subscriptionId: sub.id, error: error.message });
      }
    }

    // מחק subscriptions שפג תוקפם
    for (const id of toDelete) {
      try {
        await base44.asServiceRole.entities.PushSubscription.delete(id);
      } catch {}
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