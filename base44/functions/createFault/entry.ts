import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allowedRoles = ['צוות מדווח', 'מנהל אחזקה', 'מפתח', 'אב בית'];
    if (!allowedRoles.includes(user.role) && !allowedRoles.includes(user.userType)) {
      return Response.json({ error: 'אין הרשאה ליצור תקלה' }, { status: 403 });
    }

    const body = await req.json();
    const faultData = {
      ...body,
      status: body.assignedTo ? 'בטיפול' : 'ממתין',
      reportedBy: user.email,
    };

    const fault = await base44.entities.Fault.create(faultData);

    if (faultData.assignedTo) {
      const worker = await base44.asServiceRole.entities.User.get(faultData.assignedTo).catch(() => null);
      await base44.asServiceRole.entities.FaultComment.create({
        faultId: fault.id,
        comment: `התקלה הועברה לטיפול${worker ? ` - ${worker.full_name}` : ''}`,
        userId: user.id || '',
        userName: user.full_name || '',
        userProfileImage: user.profileImage || '',
        type: 'automatic',
        automaticEventType: 'assigned',
      });
    }

    // --- התראת פוש למנהל על תקלה חדשה ---
    try {
      const managers = await base44.asServiceRole.entities.User.filter({ role: 'מנהל אחזקה' });
      for (const manager of managers) {
        if (manager && manager.id) {
          await base44.functions.invoke('sendPushNotification', {
            targetUserId: manager.id,
            title: 'תקלה חדשה דווחה',
            body: `דווחה תקלה חדשה ב${fault.locationName || 'הקמפוס'}: ${fault.title}`,
            notificationKey: 'newFault'
          });
        }
      }
    } catch (pushErr) {
      console.error('Failed to send push for new fault:', pushErr);
    }

    return Response.json({ fault });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});