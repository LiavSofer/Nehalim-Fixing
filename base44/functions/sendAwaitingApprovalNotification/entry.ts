import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    
    const { event, data } = body;
    
    if (!data) {
      return Response.json({ success: true, message: 'No data' });
    }

    // קבל את מנהלי האחזקה (משתמשים עם תפקיד "מנהל אחזקה")
    const managers = await base44.asServiceRole.entities.User.filter({ role: 'מנהל אחזקה' });

    if (!managers || managers.length === 0) {
      return Response.json({ success: true, message: 'No managers found' });
    }

    // שלח הודעה לכל מנהל אחזקה
    for (const manager of managers) {
      await base44.functions.invoke('sendPushNotification', {
        targetUserEmail: manager.email,
        title: '⏳ משימה בממתין לאישור',
        body: `${data.faultType} ב${data.location} מחכה לאישורך`,
        notificationKey: 'notifyAwaitingApproval',
        data: {
          faultId: data.id,
          type: 'awaiting_approval'
        }
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});