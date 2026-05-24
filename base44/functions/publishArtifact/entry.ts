import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { artifact_id } = await req.json();

    const artifacts = await base44.entities.Artifact.filter({ id: artifact_id });
    if (!artifacts.length) return Response.json({ error: 'Not found' }, { status: 404 });
    const artifact = artifacts[0];

    const updated = await base44.entities.Artifact.update(artifact_id, {
      status: 'published',
      published_at: new Date().toISOString(),
    });

    return Response.json({ artifact: updated, public_url: `/p/${artifact.public_slug}` });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});