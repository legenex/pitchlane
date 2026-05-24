import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const body = await req.json();
    const { client_id, amount, reason, transaction_type } = body;

    if (!client_id || amount === undefined || !reason) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const clients = await base44.asServiceRole.entities.Client.filter({ id: client_id });
    if (!clients.length) return Response.json({ error: 'Client not found' }, { status: 404 });
    const client = clients[0];

    const newBalance = (client.credits_balance || 0) + amount;
    if (newBalance < 0) {
      return Response.json({ error: 'Would result in negative balance', current: client.credits_balance }, { status: 400 });
    }

    await base44.asServiceRole.entities.Client.update(client_id, { credits_balance: newBalance });

    const tx = await base44.asServiceRole.entities.CreditTransaction.create({
      client_id,
      amount,
      balance_after: newBalance,
      transaction_type: transaction_type || 'admin_adjustment',
      reason,
      created_by: user.id,
    });

    // Audit log
    await base44.asServiceRole.entities.AuditLog.create({
      client_id,
      user_id: user.id,
      user_email: user.email,
      action: 'admin_credit_adjustment',
      entity_type: 'Client',
      entity_id: client_id,
      details: { amount, reason, new_balance: newBalance, transaction_id: tx.id },
    });

    return Response.json({ transaction: tx, new_balance: newBalance });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});