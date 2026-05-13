import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const MANAGER_ROLES = ['מנהל אחזקה', 'מפתח'];
const WORKER_ROLE = 'אב בית';

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    console.log('[1] body parsed:', JSON.stringify(body));
    
    const base44 = createClientFromRequest(req);
    console.log('[2] base44 client created');
    
    const user = await base44.auth.me();
    console.log('[3] user fetched:', JSON.stringify(user));

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
    console.log('[4] userType:', userType, '| isManager:', isManager, '| isWorker:', isWorker, '| action:', action);

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

    console.log('[5] permission check passed, attempting update. faultId:', faultId, '| updates:', JSON.stringify(updates));
    
    try {
      const updated = await base44.entities.Fault.update(faultId, updates);
      console.log('[6] update success:', JSON.stringify(updated));
      return Response.json({ fault: updated });
    } catch (updateError) {
      console.error('[6] update FAILED:', updateError.message);
      console.error('[6] update error status:', updateError?.status);
      console.error('[6] update error data:', JSON.stringify(updateError?.data));
      throw updateError;
    }

  } catch (error) {
    console.error('[FINAL ERROR] message:', error.message);
    console.error('[FINAL ERROR] status:', error?.status);
    console.error('[FINAL ERROR] data:', JSON.stringify(error?.data));
    console.error('[FINAL ERROR] stack:', error.stack);
    return Response.json({ error: error.message }, { status: 500 });
  }
});