import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// PDF export via html2canvas + jsPDF approach — server-side rendering is not
// directly available in Deno Deploy without a headless browser service.
// This function returns the artifact's public URL for client-side PDF printing,
// or can be extended to call an external Puppeteer service.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { artifact_id } = body;
    if (!artifact_id) return Response.json({ error: 'artifact_id required' }, { status: 400 });

    const artifacts = await base44.entities.Artifact.filter({ id: artifact_id });
    if (!artifacts.length) return Response.json({ error: 'Artifact not found' }, { status: 404 });
    const artifact = artifacts[0];

    // Return the public viewer URL — client side uses window.print() or html2canvas
    const viewerUrl = `/p/${artifact.public_slug}?preview=1`;
    const isDraft = artifact.status !== 'published';

    return Response.json({
      artifact_id,
      viewer_url: viewerUrl,
      public_slug: artifact.public_slug,
      is_draft: isDraft,
      title: artifact.title,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});