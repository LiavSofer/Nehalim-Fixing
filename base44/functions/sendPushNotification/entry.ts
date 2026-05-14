import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const ONESIGNAL_APP_ID = Deno.env.get('ONESIGNAL_APP_ID');
const ONESIGNAL_REST_API_KEY = Deno.env.get('ONESIGNAL_REST_API_KEY');

Deno.serve(async (req) => {
  try {
    if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
      console.error('[sendPushNotification] Missing OneSignal credentials in Environment Variables!');
      return Response.json({ error: 'Missing credentials' }, { status: 500 });
    }

    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { targetUserId, title, body: messageBody, data, notificationKey } = body;

    if (!targetUserId || !title || !messageBody) {
      console.error('[sendPushNotification] Missing required fields:', { targetUserId, title, messageBody });
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // בדיקת העדפות משתמש
    if (notificationKey) {
      try {
        const prefsList = await base44.asServiceRole.entities.NotificationPreferences.filter({ userId: targetUserId });
        if (prefsList.length > 0) {
          const prefs = prefsList[0];
          // אם המשתמש כיבה את ההתראה הספציפית הזו
          if (prefs[notificationKey] === false) {
            console.log(`[sendPushNotification] Skipped for user ${targetUserId} due to preference: ${notificationKey}`);
            return Response.json({ success: true, skipped: true, reason: 'user_preference' });
          }
        }
      } catch (e) {
        console.error('[sendPushNotification] Error loading preferences:', e);
      }
    }

    // בניית הבקשה ל-OneSignal (התקן המעודכן ביותר)
    const payload = {
      app_id: ONESIGNAL_APP_ID,
      target_channel: "push",
      include_aliases: {
        external_id: [targetUserId]
      },
      headings: { en: title, he: title },
      contents: { en: messageBody, he: messageBody },
      data: data || {}
    };

    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('[sendPushNotification] OneSignal API Error:', result);
      return Response.json({ error: 'OneSignal API error', details: result }, { status: response.status });
    }

    console.log(`[sendPushNotification] Successfully sent push to user ${targetUserId}`);
    return Response.json({ success: true, sent: 1, result });
  } catch (error) {
    console.error('[sendPushNotification] Internal Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});