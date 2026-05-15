import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Retrieve OneSignal credentials from environment variables
const ONESIGNAL_APP_ID = Deno.env.get('ONESIGNAL_APP_ID');
const ONESIGNAL_REST_API_KEY = Deno.env.get('ONESIGNAL_REST_API_KEY');

Deno.serve(async (req) => {
  try {
    // Check if credentials exist before proceeding
    if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
      console.error('[sendPushNotification] Missing OneSignal credentials!');
      return Response.json({ error: 'Missing credentials' }, { status: 500 });
    }

    const base44 = createClientFromRequest(req);
    const body = await req.json();

    // Extract necessary fields from the request body
    const { targetUserId, title, body: messageBody, data, notificationKey, imageUrl } = body;

    // Validate required fields
    if (!targetUserId || !title || !messageBody) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check user notification preferences if a notification key is provided
    if (notificationKey) {
      try {
        const prefsList = await base44.asServiceRole.entities.NotificationPreferences.filter({ userId: targetUserId });
        if (prefsList.length > 0 && prefsList[0][notificationKey] === false) {
          console.log(`[sendPushNotification] Skipped for user ${targetUserId} due to preference: ${notificationKey}`);
          return Response.json({ success: true, skipped: true, reason: 'user_preference' });
        }
      } catch (e) {
        console.error('[sendPushNotification] Prefs check failed:', e);
      }
    }

    // 1. Define the exact structure expected by OneSignal API
    interface OneSignalPayload {
      app_id: string;
      target_channel: string;
      include_aliases: { external_id: string[] };
      headings: { en: string; he: string };
      contents: { en: string; he: string };
      data?: any; // Relaxed definition to avoid strict type errors from custom data
      chrome_web_image?: string;
      chrome_web_icon?: string;
      big_picture?: string;
      ios_attachments?: Record<string, string>;
    }

    // 2. Create the payload object safely
    const payload: OneSignalPayload = {
      app_id: ONESIGNAL_APP_ID as string, // Promise TypeScript this is a string
      target_channel: "push",
      include_aliases: { external_id: [String(targetUserId)] }, // Safe conversion to string array
      headings: { en: title, he: title },
      contents: { en: messageBody, he: messageBody },
      data: data || {}
    };

    // 3. Add the image to the payload if provided to display rich notifications
    if (imageUrl) {
      // Ensure the URL is absolute (starts with http:// or https://)
      const isAbsolute = imageUrl.startsWith('http://') || imageUrl.startsWith('https://');
      
      // If relative, append your server's domain (change 'https://your-domain.com' if necessary)
      const finalImageUrl = isAbsolute ? imageUrl : `https://your-domain.com${imageUrl}`; 

      payload.chrome_web_image = finalImageUrl; // Large image for browser notifications (Android/Chrome/Windows)
      payload.chrome_web_icon = finalImageUrl;  // Replaces the app icon on the side with the fault image
      payload.big_picture = finalImageUrl;      // Large image for native Android devices
      payload.ios_attachments = { "image": finalImageUrl }; // Attached image for native iOS devices
    }

    // Send the POST request to OneSignal API
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    // Handle OneSignal API errors
    if (!response.ok) {
      console.error('[sendPushNotification] OneSignal API Error:', result);
      return Response.json({ error: 'OneSignal API error', details: result }, { status: response.status });
    }

    return Response.json({ success: true, sent: 1, result });
  } catch (error: any) {
    console.error('[sendPushNotification] Internal Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});