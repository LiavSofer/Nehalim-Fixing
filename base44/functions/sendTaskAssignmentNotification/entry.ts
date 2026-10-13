import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    
    const { event, data } = body;
    
    if (!data || !data.assignedTo) {
      return Response.json({ success: true, message: 'No assignment' });
    }

    // שלח הודעת פוש לעובד לפי מזהה המשתמש
    await base44.functions.invoke('sendPushNotification', {
      targetUserId: data.assignedTo,
      title: '📋 משימה חדשה שוייכה אליך',
      body: `${data.faultType} ב${data.location}`,
      notificationKey: 'notifyTaskAssigned',
      data: {
        faultId: data.id,
        type: 'task_assignment'
      }
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});