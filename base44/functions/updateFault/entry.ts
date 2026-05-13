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

    // 👇 לוג זמני - מחק אחרי הדיבוג
    console.log('[updateFault] user object:', JSON.stringify(user, null, 2));
    console.log('[updateFault] userType resolved:', user?.data?.userType, '|', user?.role);

    const userType = user?.data?.userType || user?.role || '';
    const isManager = MANAGER_ROLES.includes(userType);
    const isWorker = userType === WORKER_ROLE;

    console.log('[updateFault] userType:', userType, '| isManager:', isManager, '| isWorker:', isWorker);

    if (action === 'assign') {
      if (!isManager) return Response.json({ error: 'אין הרשאה לשיוך עובד' }, { status: 403 });
    } else if (action === 'priority') {
      if (!isManager) return Response.json({ error: 'אין הרשאה לשינוי עדיפות' }, { status: 403 });
    } else if (action === 'close') {
      if (!isManager) return Response.json({ error: 'אין הרשאה לסגירת תקלה' }, { status: 403 });
    } else if (action === 'markRepaired') {
      if (!isWorker && !isManager) return Response.json({ error: 'אין הרשאה לסמן כתוקן' }, { status: 403 });
    } else {
      return Response.json({ error: 'פעולה לא מוכרת' }, { status: 400 });
    }

    const updated = await base44.asServiceRole.entities.Fault.update(faultId, updates);

    return Response.json({ fault: updated });
  } catch (error) {
    console.error('[updateFault] Full error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});