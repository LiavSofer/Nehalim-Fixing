import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user's full record to check their app role
    const allUsers = await base44.asServiceRole.entities.User.list();
    const currentUser = allUsers.find(u => u.email === user.email);
    const userRole = currentUser?.role;

    // Only allow מנהל אחזקה and מפתח
    if (userRole !== 'מנהל אחזקה' && userRole !== 'מפתח') {
      return Response.json({ error: 'Forbidden: insufficient role' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { action, userId, data } = body;

    if (action === 'list') {
      return Response.json({ users: allUsers });
    }

    if (action === 'update' && userId && data) {
      await base44.asServiceRole.entities.User.update(userId, data);
      return Response.json({ success: true });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});