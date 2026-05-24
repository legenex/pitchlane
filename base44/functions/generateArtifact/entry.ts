import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const CONTENT_JSON_SCHEMA = {
  type: "object",
  required: ["template", "accent_color", "sections"],
  properties: {
    template: { type: "string", enum: ["service_pro", "creative_portfolio", "advisory"] },
    accent_color: { type: "string" },
    sections: {
      type: "array",
      items: { type: "object" }
    }
  }
};

function generateSlug() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let slug = '';
  for (let i = 0; i < 10; i++) slug += chars[Math.floor(Math.random() * chars.length)];
  return slug;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { client_id, template_id, generation_prompt, prospect_context, title } = body;

    // Load client + plan
    const clients = await base44.entities.Client.filter({ id: client_id });
    if (!clients.length) return Response.json({ error: 'Client not found' }, { status: 404 });
    const client = clients[0];

    // Load plan
    let plan = null;
    if (client.plan_id) {
      const plans = await base44.entities.Plan.filter({ id: client.plan_id });
      if (plans.length) plan = plans[0];
    }

    // Check quota
    const quota = plan?.artifact_quota || 3;
    const used = client.artifacts_used_this_period || 0;
    if (used >= quota) {
      return Response.json({ error: 'quota_exceeded', quota, used }, { status: 402 });
    }

    // Load brand profile
    const profiles = await base44.entities.BrandProfile.filter({ client_id });
    const brand = profiles[0] || {};

    // Load knowledge assets (top 10 ready)
    const allAssets = await base44.entities.KnowledgeAsset.filter({ client_id });
    const assets = allAssets.filter(a => a.status === 'ready').slice(0, 10);

    // Load template
    const templates = await base44.entities.ArtifactTemplate.filter({ id: template_id });
    const template = templates[0] || {};

    // Build system prompt with hallucination guardrails
    const allowedProjects = (brand.notable_projects || []).map((p, i) => `${i + 1}. ${p.name}: ${p.description}`).join('\n');
    const allowedTestimonials = (brand.social_proof || []).filter(s => s.type === 'testimonial').map((t, i) => `${i + 1}. "${t.content}" — ${t.source}`).join('\n');
    const allowedAwards = (brand.social_proof || []).filter(s => s.type === 'award').map(a => a.content).join(', ');

    const systemPrompt = `You are a professional pitch writer for ${brand.voice_tone || 'professional'} brands.
Voice tone: ${brand.voice_tone || 'professional, confident, clear'}.
Example value props: ${(brand.value_propositions || []).slice(0, 2).join('. ')}.

CRITICAL RULES — HALLUCINATION PREVENTION:
1. Only reference projects from this EXACT list (do not invent any):
${allowedProjects || 'None available.'}

2. Only use testimonials from this EXACT list (do not invent any):
${allowedTestimonials || 'None available.'}

3. Allowed awards/metrics: ${allowedAwards || 'None available.'} 

4. If a fact is not in the above lists, OMIT it. NEVER invent project names, testimonial quotes, or numbers.
5. You MUST return ONLY valid JSON conforming to the schema. No markdown, no prose, no explanation.

Brand context:
- Name: ${client.name}
- Niche: ${client.niche || 'professional services'}
- Target audience: ${brand.target_audience_description || client.target_audience_short || ''}
- Services: ${(brand.services || []).map(s => s.name).join(', ')}
- Differentiators: ${(brand.differentiators || []).join('; ')}
- Contact CTA URL: ${brand.contact?.calendar_url || brand.contact?.email || ''}
- Accent color: ${brand.accent_color || template.accent_default || '#6B4226'}
- Template: ${template.slug || 'service_pro'}

Knowledge asset excerpts:
${assets.map(a => `[${a.title}]: ${(a.parsed_content || '').slice(0, 300)}`).join('\n')}`;

    const userPrompt = `${generation_prompt}

Prospect context: ${prospect_context || 'Generic pitch, no specific prospect.'}

Return a complete content_json object with all required sections: hero, why_reaching_out, selected_work, differentiators, social_proof, cta.
Use accent_color: "${brand.accent_color || template.accent_default || '#6B4226'}".
Template: "${template.slug || 'service_pro'}".`;

    const schemaForLLM = {
      type: "object",
      required: ["template", "accent_color", "sections"],
      properties: {
        template: { type: "string" },
        accent_color: { type: "string" },
        sections: {
          type: "array",
          items: {
            type: "object",
            properties: {
              key: { type: "string" },
              title: { type: "string" },
              subtitle: { type: "string" },
              personalized_opener: { type: "string" },
              client_logo_url: { type: "string" },
              body: { type: "string" },
              signal_chips: { type: "array", items: { type: "string" } },
              intro: { type: "string" },
              projects: { type: "array", items: { type: "object" } },
              items: { type: "array", items: { type: "object" } },
              testimonials: { type: "array", items: { type: "object" } },
              primary_action: { type: "object" },
              secondary_action: { type: "object" }
            }
          }
        }
      }
    };

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `${systemPrompt}\n\n${userPrompt}`,
      response_json_schema: schemaForLLM,
      model: 'claude_sonnet_4_6',
    });

    // Validate basic shape
    if (!result || !result.sections || !Array.isArray(result.sections)) {
      return Response.json({ error: 'invalid_generation', detail: 'LLM returned invalid schema' }, { status: 500 });
    }

    // Increment artifacts used
    await base44.entities.Client.update(client_id, {
      artifacts_used_this_period: used + 1,
    });

    // Generate unique public_slug (collision-safe, 5 retries)
    let public_slug = '';
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = generateSlug();
      const existing = await base44.entities.Artifact.filter({ public_slug: candidate });
      if (!existing.length) { public_slug = candidate; break; }
    }
    if (!public_slug) return Response.json({ error: 'slug_collision' }, { status: 500 });

    // Create artifact
    const artifact = await base44.entities.Artifact.create({
      client_id,
      template_id,
      title: title || `New Pitch — ${new Date().toLocaleDateString()}`,
      public_slug,
      content_json: result,
      accent_color: result.accent_color || brand.accent_color || template.accent_default || '#6B4226',
      status: 'draft',
      revisions_used: 0,
      revisions_allowed: plan?.revisions_per_artifact || 3,
      generation_prompt,
    });

    return Response.json({ artifact });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});