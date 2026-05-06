import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const APP_ROLES = ['ללא הרשאה', 'צוות מדווח', 'אב בית', 'מנהל אחזקה', 'מפתח'];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const allUsers = await base44.asServiceRole.entities.User.list();
    let migrated = 0;
    let skipped = 0;

    for (const u of allUsers) {
      // If already has userType, skip
      if (u.userType) {
        skipped++;
        continue;
      }

      // If role is one of the app roles, copy it to userType and reset role to 'user'
      let userType = 'ללא הרשאה';
      if (APP_ROLES.includes(u.role)) {
        userType = u.role;
      }

      await base44.asServiceRole.entities.User.update(u.id, { userType });
      migrated++;
    }

    return Response.json({ success: true, migrated, skipped, total: allUsers.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});