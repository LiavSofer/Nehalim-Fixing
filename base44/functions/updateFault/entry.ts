import { createClientFromRequest } from 'npm:@base44/sdk@0.8.27';

const MANAGER_ROLES = ['מנהל אחזקה', 'מפתח'];
const WORKER_ROLE = 'אב בית';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { faultId, updates, action } = await req.json();

    if (!faultId || !updates || !action) {
      return Response.json({ error: 'חסרים פרמטרים' }, { status: 400 });
    }

    const isManager = MANAGER_ROLES.includes(user.userType) || MANAGER_ROLES.includes(user.role);
    const isWorker = user.userType === WORKER_ROLE || user.role === WORKER_ROLE;

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

    let updated;
    try {
      // Always use asServiceRole to bypass RLS
      updated = await base44.asServiceRole.entities.Fault.update(faultId, updates);
    } catch (err) {
      console.error('[updateFault] asServiceRole update error:', err?.message);
      // Fallback: try user-scoped update
      try {
        updated = await base44.entities.Fault.update(faultId, updates);
      } catch (err2) {
        console.error('[updateFault] user-scoped update error:', err2?.message);
        return Response.json({ error: 'התקלה לא נמצאה או אין הרשאה לעדכון' }, { status: 404 });
      }
    }

    return Response.json({ fault: updated });
  } catch (error) {
    console.error('[updateFault] Unexpected error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});