import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // משיכת התפקיד האמיתי מתוך userType
    const currentUserType = user.userType || (user.data && user.data.userType) || '';
    
    const allowedRoles = ['צוות מדווח', 'מנהל אחזקה', 'מפתח', 'אב בית'];
    if (!allowedRoles.includes(currentUserType)) {
      return Response.json({ error: 'אין הרשאה ליצור תקלה' }, { status: 403 });
    }

    const body = await req.json();
    const faultData = { ...body, status: body.assignedTo ? 'בטיפול' : 'ממתין', reportedBy: user.email };
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

    // --- שליחת התראות למנהלי אחזקה ---
    try {
      const allUsers = await base44.asServiceRole.entities.User.filter({});
      // בדיקה אך ורק לפי userType
      const managers = allUsers.filter(u => u.userType === 'מנהל אחזקה' || (u.data && u.data.userType === 'מנהל אחזקה'));
      
      const pushBody = `📍 ${fault.locationName || 'מיקום לא צוין'}\n📝 ${fault.description || 'אין תיאור'}`;

      for (const manager of managers) {
        if (manager.id) {
          await base44.functions.invoke('sendPushNotification', {
            targetUserId: manager.id,
            title: '🚨 תקלה חדשה דווחה',
            body: pushBody,
            notificationKey: 'notifyNewFault',
            imageUrl: fault.image,
            data: { faultId: fault.id }
          });
        }
      }
    } catch (err) { console.error('Manager push failed:', err); }

    return Response.json({ fault });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});