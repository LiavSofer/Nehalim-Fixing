import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { endpoint, auth, p256dh } = body;

    if (!endpoint || !auth || !p256dh) {
      return Response.json({ error: 'Missing subscription data' }, { status: 400 });
    }

    // בדוק אם רישום זה כבר קיים
    const existing = await base44.entities.PushSubscription.filter({
      userEmail: user.email,
      endpoint: endpoint
    });

    if (existing.length > 0) {
      return Response.json({ success: true, message: 'Already registered' });
    }

    // שמור את הרישום החדש
    await base44.entities.PushSubscription.create({
      userId: user.id,
      userEmail: user.email,
      endpoint,
      auth,
      p256dh
    });

    return Response.json({ success: true, message: 'Subscription registered' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});