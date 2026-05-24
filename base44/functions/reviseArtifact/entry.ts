import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { artifact_id, user_prompt, change_type, target_section_key } = body;

    // Load artifact
    const artifacts = await base44.entities.Artifact.filter({ id: artifact_id });
    if (!artifacts.length) return Response.json({ error: 'Artifact not found' }, { status: 404 });
    const artifact = artifacts[0];

    // Check revision quota
    if (artifact.revisions_used >= artifact.revisions_allowed) {
      return Response.json({ error: 'revision_limit_exceeded' }, { status: 402 });
    }

    // Load brand context
    const profiles = await base44.entities.BrandProfile.filter({ client_id: artifact.client_id });
    const brand = profiles[0] || {};
    const clients = await base44.entities.Client.filter({ id: artifact.client_id });
    const client = clients[0] || {};

    const currentContent = artifact.content_json;

    let prompt;
    if (change_type === 'regenerate_section' && target_section_key) {
      const otherSections = (currentContent.sections || []).filter(s => s.key !== target_section_key);
      const targetSection = (currentContent.sections || []).find(s => s.key === target_section_key);
      prompt = `You are rewriting ONLY the "${target_section_key}" section of an existing pitch artifact.
Brand: ${client.name}, voice: ${brand.voice_tone || 'professional'}.
Current section: ${JSON.stringify(targetSection)}
User instruction: ${user_prompt}
Return ONLY the new section object as JSON (same key "${target_section_key}"). Do not return full artifact.`;
    } else {
      prompt = `You are editing an existing pitch artifact. Apply the user's requested change.
Brand: ${client.name}, voice: ${brand.voice_tone || 'professional'}.
Differentiators: ${(brand.differentiators || []).join('; ')}.
CRITICAL: Only reference projects, testimonials, and facts already present in the current content_json. Do not invent new ones.
Current content_json: ${JSON.stringify(currentContent)}
User instruction: ${user_prompt}
Return the complete updated content_json as JSON.`;
    }

    let result;
    if (change_type === 'regenerate_section' && target_section_key) {
      const sectionSchema = { type: "object", properties: { key: { type: "string" } } };
      result = await base44.integrations.Core.InvokeLLM({ prompt, response_json_schema: sectionSchema, model: 'claude_sonnet_4_6' });
    } else {
      const schema = {
        type: "object",
        required: ["template", "accent_color", "sections"],
        properties: {
          template: { type: "string" },
          accent_color: { type: "string" },
          sections: { type: "array", items: { type: "object" } }
        }
      };
      result = await base44.integrations.Core.InvokeLLM({ prompt, response_json_schema: schema, model: 'claude_sonnet_4_6' });
    }

    let newContentJson;
    if (change_type === 'regenerate_section' && target_section_key) {
      // Replace only the target section
      newContentJson = {
        ...currentContent,
        sections: (currentContent.sections || []).map(s => s.key === target_section_key ? result : s),
      };
    } else {
      if (!result || !result.sections) {
        return Response.json({ error: 'invalid_revision', detail: 'LLM returned invalid schema' }, { status: 500 });
      }
      newContentJson = result;
    }

    // Get existing revision count
    const existingRevisions = await base44.entities.ArtifactRevision.filter({ artifact_id });
    const revisionNumber = existingRevisions.length + 1;

    // Create revision record
    await base44.entities.ArtifactRevision.create({
      artifact_id,
      revision_number: revisionNumber,
      change_type,
      user_prompt,
      target_section_key: target_section_key || null,
      content_json_before: currentContent,
      content_json_after: newContentJson,
    });

    // Update artifact
    const updated = await base44.entities.Artifact.update(artifact_id, {
      content_json: newContentJson,
      revisions_used: artifact.revisions_used + 1,
    });

    return Response.json({ artifact: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});