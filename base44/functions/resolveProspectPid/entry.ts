import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// HMAC-SHA256 using Web Crypto API
async function hmacHex(key, message) {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(message));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function hashProspectId(prospectId) {
  const secret = Deno.env.get('PROSPECT_HASH_SECRET') || 'pitchlane-default-secret';
  return (await hmacHex(secret, prospectId)).slice(0, 16);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const body = await req.json();
    const { action, prospect_id, pid_hash, artifact_id, session_id, time_spent_seconds } = body;

    if (action === 'hash') {
      // Called server-side to get hash for email link building
      const user = await base44.auth.me();
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

      const hash = await hashProspectId(prospect_id);
      return Response.json({ hash });
    }

    if (action === 'resolve_and_track') {
      // Called from ArtifactViewer when pid param is present
      // Find all prospects and match hash
      // This is called service-role because viewer is unauthenticated
      const secret = Deno.env.get('PROSPECT_HASH_SECRET') || 'pitchlane-default-secret';

      // We can't iterate all prospects efficiently; instead store hash on prospect at creation
      // For now: try to find by iterating (bounded by artifact's client)
      if (!artifact_id) return Response.json({ error: 'artifact_id required' }, { status: 400 });

      const arts = await base44.asServiceRole.entities.Artifact.filter({ id: artifact_id });
      if (!arts.length) return Response.json({ error: 'Artifact not found' }, { status: 404 });
      const art = arts[0];

      const clientProspects = await base44.asServiceRole.entities.Prospect.filter({ client_id: art.client_id });
      let resolvedProspect = null;
      for (const p of clientProspects) {
        const hash = await hmacHex(secret, p.id);
        if (hash.slice(0, 16) === pid_hash) {
          resolvedProspect = p;
          break;
        }
      }

      if (!resolvedProspect) return Response.json({ resolved: false });

      const now = new Date().toISOString();
      const newViews = (resolvedProspect.total_artifact_views || 0) + 1;
      const newTime = (resolvedProspect.total_time_spent_seconds || 0) + (time_spent_seconds || 0);

      const updates = {
        last_viewed_artifact_at: now,
        total_artifact_views: newViews,
        total_time_spent_seconds: newTime,
      };

      // Auto-advance status
      if (resolvedProspect.status === 'new' || resolvedProspect.status === 'contacted') {
        updates.status = 'engaged';
      }

      // Hot threshold: 2+ views OR 90+ seconds cumulative
      const isHot = newViews >= 2 || newTime >= 90;
      if (isHot && resolvedProspect.status !== 'hot' && resolvedProspect.status !== 'qualified') {
        updates.status = 'hot';
        // Create hot notification
        await base44.asServiceRole.entities.OutreachNotification.create({
          client_id: resolvedProspect.client_id,
          type: 'prospect_hot',
          prospect_id: resolvedProspect.id,
          artifact_id,
          message: `${resolvedProspect.full_name || resolvedProspect.email} is showing strong interest — viewed your pitch ${newViews} time(s) and spent ${Math.round(newTime)}s total.`,
          read: false,
        });
      }

      // Also set prospect_id on the ArtifactView if session_id provided
      if (session_id) {
        const views = await base44.asServiceRole.entities.ArtifactView.filter({ artifact_id, session_id });
        if (views.length) {
          await base44.asServiceRole.entities.ArtifactView.update(views[0].id, {
            prospect_id: resolvedProspect.id,
          });
        }
      }

      await base44.asServiceRole.entities.Prospect.update(resolvedProspect.id, updates);
      return Response.json({ resolved: true, prospect_id: resolvedProspect.id });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});