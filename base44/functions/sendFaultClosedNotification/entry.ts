import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    
    const { event, data } = body;
    
    if (!data || !data.reportedBy) {
      return Response.json({ success: true, message: 'No reporter' });
    }

    // שלח הודעת פוש למשתמש שדיווח על התקלה
    await base44.functions.invoke('sendPushNotification', {
      targetUserEmail: data.reportedBy,
      title: '✅ התקלה שלך נפתרה!',
      body: `${data.faultType} ב${data.location} סגורה`,
      notificationKey: 'notifyFaultClosed',
      data: {
        faultId: data.id,
        type: 'fault_closed'
      }
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});