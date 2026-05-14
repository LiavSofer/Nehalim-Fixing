import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const MANAGER_ROLES = ['מנהל אחזקה', 'מפתח'];
const WORKER_ROLE = 'אב בית';

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { faultId, updates, action } = body;

    if (!faultId || !updates || !action) {
      return Response.json({ error: 'חסרים פרמטרים' }, { status: 400 });
    }

    const userType = user?.userType || user?.data?.userType || user?.role || '';
    const isManager = MANAGER_ROLES.includes(userType);
    const isWorker = userType === WORKER_ROLE;

    if (action === 'assign' && !isManager) return Response.json({ error: 'אין הרשאה לשיוך עובד' }, { status: 403 });
    else if (action === 'priority' && !isManager) return Response.json({ error: 'אין הרשאה לשינוי עדיפות' }, { status: 403 });
    else if (action === 'close' && !isManager) return Response.json({ error: 'אין הרשאה לסגירת תקלה' }, { status: 403 });
    else if (action === 'markRepaired' && (!isWorker && !isManager)) return Response.json({ error: 'אין הרשאה לסמן כתוקן' }, { status: 403 });

    try {
      const updated = await base44.entities.Fault.update(faultId, updates);
      
      // שליפת התמונה מהתקלה המעודכנת
      const faultImage = updated.image;
      const pushData = { faultId: updated.id };

      try {
        if (action === 'assign' && updates.assignedTo) {
          await base44.functions.invoke('sendPushNotification', {
            targetUserId: updates.assignedTo,
            title: '👷‍♂️ משימה חדשה שוייכה אליך',
            body: `📍 ${updated.locationName || 'מיקום לא צוין'}\n🔧 ${updated.title}`,
            notificationKey: 'notifyTaskAssigned',
            imageUrl: faultImage,
            data: pushData
          });
        }

        if (action === 'markRepaired') {
          const managers = await base44.asServiceRole.entities.User.filter({ role: 'מנהל אחזקה' });
          for (const manager of managers) {
            if (manager && manager.id) {
              await base44.functions.invoke('sendPushNotification', {
                targetUserId: manager.id,
                title: '✅ משימה ממתינה לאישור',
                body: `אב הבית סימן את התקלה "${updated.title}" ב-${updated.locationName} כתוקנה. ממתין לאישורך.`,
                notificationKey: 'notifyAwaitingApproval',
                imageUrl: faultImage,
                data: pushData
              });
            }
          }
        }

        if (updates.status && updated.reportedBy) {
          const reporters = await base44.asServiceRole.entities.User.filter({ email: updated.reportedBy });
          if (reporters.length > 0 && reporters[0].id && reporters[0].id !== user.id) {
            await base44.functions.invoke('sendPushNotification', {
              targetUserId: reporters[0].id,
              title: '🔔 עדכון בסטטוס התקלה שדיווחת',
              body: `התקלה "${updated.title}" עודכנה לסטטוס: ${updated.status}`,
              notificationKey: 'notifyFaultClosed',
              imageUrl: faultImage,
              data: pushData
            });
          }
        }
      } catch (pushErr) {
        console.error('[updateFault] Push Notification Error:', pushErr);
      }

      return Response.json({ fault: updated });
    } catch (updateError) {
      throw updateError;
    }

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});