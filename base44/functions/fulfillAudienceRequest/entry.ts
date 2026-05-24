import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const body = await req.json();
    const { audience_request_id, action, notes } = body;

    const reqs = await base44.asServiceRole.entities.AudienceRequest.filter({ id: audience_request_id });
    if (!reqs.length) return Response.json({ error: 'Not found' }, { status: 404 });
    const ar = reqs[0];

    if (action === 'start') {
      const updated = await base44.asServiceRole.entities.AudienceRequest.update(audience_request_id, {
        status: 'in_progress',
        fulfillment_notes: notes || ar.fulfillment_notes || '',
      });
      return Response.json({ request: updated });
    }

    if (action === 'complete') {
      const prospects = await base44.asServiceRole.entities.Prospect.filter({ audience_request_id });
      const fulfilledQty = prospects.length;
      const isFull = fulfilledQty >= ar.requested_quantity;

      const updated = await base44.asServiceRole.entities.AudienceRequest.update(audience_request_id, {
        status: isFull ? 'fulfilled' : 'partial',
        fulfilled_quantity: fulfilledQty,
        fulfilled_at: new Date().toISOString(),
        fulfillment_notes: notes || ar.fulfillment_notes || '',
      });

      // Create in-app notification for client
      await base44.asServiceRole.entities.OutreachNotification.create({
        client_id: ar.client_id,
        type: 'audience_fulfilled',
        message: `Your audience request "${ar.title}" has been fulfilled with ${fulfilledQty} prospects.`,
        read: false,
      });

      // Email notification
      const clients = await base44.asServiceRole.entities.Client.filter({ id: ar.client_id });
      if (clients.length) {
        const clientRecord = clients[0];
        const users = await base44.asServiceRole.entities.User.filter({ id: clientRecord.owner_user_id });
        if (users.length && users[0].email) {
          await base44.integrations.Core.SendEmail({
            to: users[0].email,
            subject: `Your prospects are ready — ${ar.title}`,
            body: `Hi ${users[0].full_name || 'there'},\n\nGreat news! Your audience request "${ar.title}" has been fulfilled.\n\n${fulfilledQty} prospects are now in your inbox.\n\nLog in to view them: https://pitchlane.app/app/prospects\n\nPitchlane Team`,
            from_name: 'Pitchlane',
          });
        }
      }

      return Response.json({ request: updated });
    }

    if (action === 'cancel') {
      // Refund credits
      const clients = await base44.asServiceRole.entities.Client.filter({ id: ar.client_id });
      if (clients.length) {
        const c = clients[0];
        const newBalance = (c.credits_balance || 0) + (ar.credits_committed || 0);
        await base44.asServiceRole.entities.Client.update(ar.client_id, { credits_balance: newBalance });
        await base44.asServiceRole.entities.CreditTransaction.create({
          client_id: ar.client_id,
          amount: ar.credits_committed || 0,
          balance_after: newBalance,
          transaction_type: 'refund',
          reference_id: audience_request_id,
          reason: `Cancelled audience request: ${ar.title}`,
          created_by: user.id,
        });
      }

      const updated = await base44.asServiceRole.entities.AudienceRequest.update(audience_request_id, {
        status: 'cancelled',
        fulfillment_notes: notes || ar.fulfillment_notes || '',
      });
      return Response.json({ request: updated });
    }

    if (action === 'update_notes') {
      const updated = await base44.asServiceRole.entities.AudienceRequest.update(audience_request_id, {
        fulfillment_notes: notes || '',
      });
      return Response.json({ request: updated });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});