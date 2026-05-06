import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allowedRoles = ['צוות מדווח', 'מנהל אחזקה', 'מפתח', 'אב בית'];
    if (!allowedRoles.includes(user.role)) {
      return Response.json({ error: 'אין הרשאה ליצור תקלה' }, { status: 403 });
    }

    const body = await req.json();
    const faultData = {
      ...body,
      status: body.assignedTo ? 'בטיפול' : 'ממתין',
      reportedBy: user.email,
    };

    const fault = await base44.entities.Fault.create(faultData);

    return Response.json({ fault });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});