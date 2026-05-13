import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// משיכת המפתחות מתוך משתני הסביבה בלבד
const ONESIGNAL_APP_ID = Deno.env.get('ONESIGNAL_APP_ID');
const ONESIGNAL_REST_API_KEY = Deno.env.get('ONESIGNAL_REST_API_KEY');

Deno.serve(async (req) => {
  // נוודא שהמפתחות קיימים כדי שלא ננסה לשלוח בלעדיהם
  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
    console.error('Missing OneSignal secrets!');
    return Response.json({ error: 'Server configuration error' }, { status: 500 });
  }

    // בדיקת העדפות התראות של המשתמש (נשאר ללא שינוי לוגי)
    if (notificationKey) {
      try {
        const prefsList = await base44.asServiceRole.entities.NotificationPreferences.filter({ userId: targetUserId });
        if (prefsList.length > 0) {
          const prefs = prefsList[0];
          if (prefs[notificationKey] === false) {
            return Response.json({ success: true, skipped: true, reason: 'user_preference' });
          }
        }
      } catch (e) {
        // אם לא ניתן לטעון העדפות - ממשיכים לשלוח
      }
    }

    // שליחת ההתראה באמצעות OneSignal API (שליחה רק למשתמש הספציפי)
    const payload = {
      app_id: ONESIGNAL_APP_ID,
      include_external_user_ids: [targetUserId], // זה יחפש את ה-ID שהגדרנו ב-OneSignal.login
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
      console.error('OneSignal Error:', result);
      return Response.json({ error: 'OneSignal API error', details: result }, { status: response.status });
    }

    return Response.json({
      success: true,
      sent: 1,
      result: result
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});