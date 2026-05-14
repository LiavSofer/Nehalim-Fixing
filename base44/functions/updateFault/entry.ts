import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const MANAGER_ROLES = ['מנהל אחזקה', 'מפתח'];
const WORKER_ROLE = 'אב בית';

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    const { faultId, updates, action } = body;

    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // משיכת התפקיד האמיתי מתוך userType
    const currentUserType = user.userType || (user.data && user.data.userType) || '';
    const isManager = MANAGER_ROLES.includes(currentUserType);
    const isWorker = currentUserType === WORKER_ROLE;

    if (action === 'assign' && !isManager) return Response.json({ error: 'אין הרשאה לשיוך עובד' }, { status: 403 });
    else if (action === 'priority' && !isManager) return Response.json({ error: 'אין הרשאה לשינוי עדיפות' }, { status: 403 });
    else if (action === 'close' && !isManager) return Response.json({ error: 'אין הרשאה לסגירת תקלה' }, { status: 403 });
    else if (action === 'markRepaired' && (!isWorker && !isManager)) return Response.json({ error: 'אין הרשאה לסמן כתוקן' }, { status: 403 });

    const updated = await base44.entities.Fault.update(faultId, updates);
    const faultImage = updated.image;

    try {
      if (action === 'assign' && updates.assignedTo) {
        await base44.functions.invoke('sendPushNotification', {
          targetUserId: updates.assignedTo,
          title: '👷‍♂️ משימה חדשה שוייכה אליך',
          body: `📍 ${updated.locationName}\n🔧 ${updated.title}`,
          notificationKey: 'notifyTaskAssigned',
          imageUrl: faultImage,
          data: { faultId: updated.id }
        });
      }

      if (action === 'markRepaired') {
        const allUsers = await base44.asServiceRole.entities.User.filter({});
        // סינון מנהלים לפי userType בלבד
        const managers = allUsers.filter(u => u.userType === 'מנהל אחזקה' || (u.data && u.data.userType === 'מנהל אחזקה'));
        
        for (const manager of managers) {
          if (manager.id) {
            await base44.functions.invoke('sendPushNotification', {
              targetUserId: manager.id,
              title: '✅ משימה ממתינה לאישורך',
              body: `אב הבית סימן את התקלה "${updated.title}" כתוקנה ומחכה לאישור הסגירה שלך.`,
              notificationKey: 'notifyAwaitingApproval',
              imageUrl: faultImage,
              data: { faultId: updated.id }
            });
          }
        }
      }

      if (updates.status === 'סגור' && updated.reportedBy) {
        const reporters = await base44.asServiceRole.entities.User.filter({ email: updated.reportedBy });
        if (reporters.length > 0 && reporters[0].id !== user.id) {
          await base44.functions.invoke('sendPushNotification', {
            targetUserId: reporters[0].id,
            title: '🔔 התקלה שדיווחת טופלה',
            body: `התקלה "${updated.title}" נסגרה. תודה על הדיווח!`,
            notificationKey: 'notifyFaultClosed',
            imageUrl: faultImage,
            data: { faultId: updated.id }
          });
        }
      }
    } catch (err) { console.error('Push update failed:', err); }

    return Response.json({ fault: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});