import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Allowed fields per role/action
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

    console.log('[updateFault] user:', JSON.stringify({ id: user.id, email: user.email, role: user.role, userType: user.userType }));
    const isManager = MANAGER_ROLES.includes(user.userType) || MANAGER_ROLES.includes(user.role);
    const isWorker = user.userType === WORKER_ROLE || user.role === WORKER_ROLE;
    console.log('[updateFault] isManager:', isManager, 'isWorker:', isWorker, 'action:', action);

    // Validate permissions per action
    if (action === 'assign') {
      // Only managers can assign workers
      if (!isManager) return Response.json({ error: 'אין הרשאה לשיוך עובד' }, { status: 403 });
    } else if (action === 'priority') {
      // Only managers can set priority
      if (!isManager) return Response.json({ error: 'אין הרשאה לשינוי עדיפות' }, { status: 403 });
    } else if (action === 'close') {
      // Only managers can close faults
      if (!isManager) return Response.json({ error: 'אין הרשאה לסגירת תקלה' }, { status: 403 });
    } else if (action === 'markRepaired') {
      // Only workers (or managers) can mark as repaired
      if (!isWorker && !isManager) return Response.json({ error: 'אין הרשאה לסמן כתוקן' }, { status: 403 });
      // RLS already ensures workers can only update their assigned faults
    } else {
      return Response.json({ error: 'פעולה לא מוכרת' }, { status: 400 });
    }

    let updated;
    try {
      // Use user-scoped update so RLS applies (worker can update their assigned faults)
      // For manager actions, use asServiceRole to bypass RLS
      if (isManager) {
        updated = await base44.asServiceRole.entities.Fault.update(faultId, updates);
      } else {
        updated = await base44.entities.Fault.update(faultId, updates);
      }
    } catch (err) {
      console.error('[updateFault] Update error:', err?.message);
      return Response.json({ error: 'התקלה לא נמצאה או אין הרשאה לעדכון' }, { status: 404 });
    }
    return Response.json({ fault: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});