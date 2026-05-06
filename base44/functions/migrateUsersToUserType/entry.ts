import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const APP_ROLES = ['ללא הרשאה', 'צוות מדווח', 'אב בית', 'מנהל אחזקה', 'מפתח'];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    // Support single user update: { email, userType }
    if (body.email && body.userType) {
      const users = await base44.asServiceRole.entities.User.list();
      const target = users.find(u => u.email === body.email);
      if (!target) return Response.json({ error: 'User not found' }, { status: 404 });
      await base44.asServiceRole.entities.User.update(target.id, { userType: body.userType });
      return Response.json({ success: true, email: body.email, userType: body.userType });
    }

    // Bulk migration
    const allUsers = await base44.asServiceRole.entities.User.list();
    let migrated = 0;
    let skipped = 0;
    const results = [];

    for (const u of allUsers) {
      if (u.userType) {
        skipped++;
        results.push({ email: u.email, action: 'skipped', userType: u.userType });
        continue;
      }

      let userType = 'ללא הרשאה';
      if (APP_ROLES.includes(u.role)) {
        userType = u.role;
      }

      await base44.asServiceRole.entities.User.update(u.id, { userType });
      migrated++;
      results.push({ email: u.email, action: 'migrated', from: u.role, userType });
    }

    return Response.json({ success: true, migrated, skipped, total: allUsers.length, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});