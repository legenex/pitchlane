import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { client_id, title, niche, target_geo, target_audience_description, intent_signals, requested_quantity, is_rush } = body;

    if (!client_id || !title || !requested_quantity) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Load client
    const clients = await base44.entities.Client.filter({ id: client_id });
    if (!clients.length) return Response.json({ error: 'Client not found' }, { status: 404 });
    const client = clients[0];

    // Calculate cost
    const creditCost = is_rush ? Math.ceil(requested_quantity * 1.2) : requested_quantity;

    // Check balance
    if ((client.credits_balance || 0) < creditCost) {
      return Response.json({ error: 'insufficient_credits', needed: creditCost, balance: client.credits_balance || 0 }, { status: 402 });
    }

    const newBalance = (client.credits_balance || 0) - creditCost;

    // Deduct credits
    await base44.entities.Client.update(client_id, { credits_balance: newBalance });

    // Create credit transaction
    await base44.entities.CreditTransaction.create({
      client_id,
      amount: -creditCost,
      balance_after: newBalance,
      transaction_type: 'audience_request',
      reason: `Audience request: ${title}`,
      created_by: user.id,
    });

    // Create audience request
    const request = await base44.entities.AudienceRequest.create({
      client_id,
      title,
      niche: niche || '',
      target_geo: target_geo || '',
      target_audience_description: target_audience_description || '',
      intent_signals: intent_signals || [],
      requested_quantity,
      credits_committed: creditCost,
      status: 'pending',
      fulfilled_quantity: 0,
      requested_at: new Date().toISOString(),
      requested_by: user.id,
      is_rush: is_rush || false,
    });

    // Notify super admin
    const adminEmail = Deno.env.get('ADMIN_NOTIFICATION_EMAIL');
    if (adminEmail) {
      await base44.integrations.Core.SendEmail({
        to: adminEmail,
        subject: `[Pitchlane] New Audience Request: ${title}`,
        body: `Client: ${client.name}\nRequest: ${title}\nQuantity: ${requested_quantity}\nRush: ${is_rush ? 'YES (+20%)' : 'No'}\nNiche: ${niche}\nGeo: ${target_geo}\n\nCriteria:\n${target_audience_description}\n\nIntent signals: ${(intent_signals || []).join(', ')}\n\nView in admin: https://pitchlane.app/admin/audience-requests`,
        from_name: 'Pitchlane Platform',
      });
    }

    return Response.json({ request });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});