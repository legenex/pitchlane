import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const body = await req.json();
    const { action, artifact_id, session_id, user_agent, referrer, device_type, sections_viewed, cta_click, time_spent_seconds } = body;

    if (!artifact_id || !session_id) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (action === 'create') {
      // Check if view record already exists for this session
      const existing = await base44.asServiceRole.entities.ArtifactView.filter({ artifact_id, session_id });
      if (existing.length) return Response.json({ view: existing[0] });

      const view = await base44.asServiceRole.entities.ArtifactView.create({
        artifact_id,
        session_id,
        user_agent: user_agent || '',
        referrer: referrer || '',
        device_type: device_type || 'desktop',
        opened_at: new Date().toISOString(),
        time_spent_seconds: 0,
        sections_viewed: [],
        cta_clicks: [],
        last_heartbeat_at: new Date().toISOString(),
      });

      // Increment artifact view_count
      const artifacts = await base44.asServiceRole.entities.Artifact.filter({ id: artifact_id });
      if (artifacts.length) {
        await base44.asServiceRole.entities.Artifact.update(artifact_id, {
          view_count: (artifacts[0].view_count || 0) + 1,
          last_viewed_at: new Date().toISOString(),
        });
      }

      return Response.json({ view });
    }

    if (action === 'heartbeat') {
      const existing = await base44.asServiceRole.entities.ArtifactView.filter({ artifact_id, session_id });
      if (!existing.length) return Response.json({ error: 'View not found' }, { status: 404 });
      const view = existing[0];

      const updates = {
        time_spent_seconds: time_spent_seconds || view.time_spent_seconds,
        last_heartbeat_at: new Date().toISOString(),
      };
      if (sections_viewed) updates.sections_viewed = sections_viewed;

      const updated = await base44.asServiceRole.entities.ArtifactView.update(view.id, updates);
      return Response.json({ view: updated });
    }

    if (action === 'cta_click') {
      const existing = await base44.asServiceRole.entities.ArtifactView.filter({ artifact_id, session_id });
      if (!existing.length) return Response.json({ error: 'View not found' }, { status: 404 });
      const view = existing[0];

      const updatedClicks = [...(view.cta_clicks || []), { ...cta_click, clicked_at: new Date().toISOString() }];
      const updated = await base44.asServiceRole.entities.ArtifactView.update(view.id, {
        cta_clicks: updatedClicks,
      });
      return Response.json({ view: updated });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});