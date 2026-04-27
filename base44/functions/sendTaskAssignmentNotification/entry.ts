import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    
    const { event, data } = body;
    
    if (!data || !data.assignedTo) {
      return Response.json({ success: true, message: 'No assignment' });
    }

    // קבל את פרטי העובד
    const worker = await base44.entities.User.filter({ id: data.assignedTo });
    if (!worker || worker.length === 0) {
      return Response.json({ success: true, message: 'Worker not found' });
    }

    const workerEmail = worker[0].email;

    // שלח הודעת פוש
    await base44.functions.invoke('sendPushNotification', {
      targetUserEmail: workerEmail,
      title: '📋 משימה חדשה שוייכה אליך',
      body: `${data.faultType} ב${data.location}`,
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