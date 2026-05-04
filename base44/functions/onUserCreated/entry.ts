import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { event, data } = body;

    if (!data || !data.id) {
      return Response.json({ success: true, message: 'No data' });
    }

    // אם ה-role הוא "user" (ברירת המחדל של הפלטפורמה), שנה ל"ללא הרשאה"
    if (!data.role || data.role === 'user') {
      await base44.asServiceRole.entities.User.update(data.id, { role: 'ללא הרשאה' });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});