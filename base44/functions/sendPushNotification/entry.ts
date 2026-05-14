import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const ONESIGNAL_APP_ID = Deno.env.get('ONESIGNAL_APP_ID');
const ONESIGNAL_REST_API_KEY = Deno.env.get('ONESIGNAL_REST_API_KEY');

Deno.serve(async (req) => {
  try {
    if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
      return Response.json({ error: 'Missing credentials' }, { status: 500 });
    }

    const base44 = createClientFromRequest(req);
    const body = await req.json();

    // הוספנו את imageUrl ו-data
    const { targetUserId, title, body: messageBody, data, notificationKey, imageUrl } = body;

    if (!targetUserId || !title || !messageBody) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (notificationKey) {
      try {
        const prefsList = await base44.asServiceRole.entities.NotificationPreferences.filter({ userId: targetUserId });
        if (prefsList.length > 0) {
          if (prefsList[0][notificationKey] === false) {
            return Response.json({ success: true, skipped: true, reason: 'user_preference' });
          }
        }
      } catch (e) {
        console.error('[sendPushNotification] Error loading preferences:', e);
      }
    }

    const payload: any = {
      app_id: ONESIGNAL_APP_ID,
      target_channel: "push",
      include_aliases: {
        external_id: [targetUserId]
      },
      headings: { en: title, he: title },
      contents: { en: messageBody, he: messageBody },
      data: data || {} // מאפשר להעביר את ה-faultId לפרונטאנד
    };

    // 🌟 הוספת התמונה להתראה עבור כל הפלטפורמות
    if (imageUrl) {
      payload.chrome_web_image = imageUrl; // עבור דפדפנים במחשב ובאנדרואיד
      payload.big_picture = imageUrl;      // עבור מכשירי אנדרואיד
      payload.ios_attachments = { "image": imageUrl }; // עבור מכשירי iOS (אייפון)
    }

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
      return Response.json({ error: 'OneSignal API error', details: result }, { status: response.status });
    }

    return Response.json({ success: true, sent: 1, result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});