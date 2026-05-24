import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { action, artifact_id, client_id, reason } = await req.json();

    if (!reason || reason.trim().length < 5) {
      return Response.json({ error: 'Reason is required (min 5 chars)' }, { status: 400 });
    }

    if (action === 'reset_revisions' && artifact_id) {
      const artifacts = await base44.asServiceRole.entities.Artifact.filter({ id: artifact_id });
      if (!artifacts.length) return Response.json({ error: 'Artifact not found' }, { status: 404 });

      await base44.asServiceRole.entities.Artifact.update(artifact_id, { revisions_used: 0 });
      await base44.asServiceRole.entities.AuditLog.create({
        user_id: user.id,
        user_email: user.email,
        action: 'admin_reset_revisions',
        entity_type: 'Artifact',
        entity_id: artifact_id,
        details: { reason },
      });
      return Response.json({ success: true });
    }

    if (action === 'reset_quota' && client_id) {
      await base44.asServiceRole.entities.Client.update(client_id, { artifacts_used_this_period: 0 });
      await base44.asServiceRole.entities.AuditLog.create({
        user_id: user.id,
        user_email: user.email,
        action: 'admin_reset_quota',
        entity_type: 'Client',
        entity_id: client_id,
        details: { reason },
      });
      return Response.json({ success: true });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});