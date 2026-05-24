import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action, client_id, prospect_id, artifact_id, subject, body_html, body_plain, ai_prompt, draft_id, scheduled_for } = body;

    if (action === 'ai_generate') {
      // Load context
      const prospects = await base44.entities.Prospect.filter({ id: prospect_id });
      if (!prospects.length) return Response.json({ error: 'Prospect not found' }, { status: 404 });
      const prospect = prospects[0];

      const profiles = await base44.entities.BrandProfile.filter({ client_id });
      const brand = profiles[0] || {};

      let artifactContent = '';
      if (artifact_id) {
        const arts = await base44.entities.Artifact.filter({ id: artifact_id });
        if (arts.length) {
          const sec = arts[0].content_json?.sections || [];
          artifactContent = sec.map(s => `${s.title || s.key}: ${s.body || s.intro || ''}`).join('\n').slice(0, 800);
        }
      }

      const systemPrompt = `You are an outreach email writer for ${brand.voice_tone || 'professional'} brands.
Voice tone: ${brand.voice_tone || 'professional, warm, direct'}.

CRITICAL RULES — HALLUCINATION PREVENTION:
- Only reference facts from the brand profile, artifact content, and prospect data provided below.
- Never invent project names, testimonial quotes, or numbers not in context.
- Write short, personalized, non-spammy outreach emails (3-5 sentences max for the body).

Brand context:
- Company: ${brand.services ? (brand.services[0]?.name || '') : ''}
- Value props: ${(brand.value_propositions || []).slice(0, 2).join(', ')}
- Voice: ${brand.voice_tone || 'professional'}

Prospect context:
- Name: ${prospect.first_name || prospect.full_name}
- Company: ${prospect.company || ''}
- Title: ${prospect.title || ''}
- Location: ${[prospect.location_city, prospect.location_state].filter(Boolean).join(', ')}
- Intent signals: ${(prospect.intent_signals || []).join(', ')}

Artifact summary:
${artifactContent || 'No artifact linked.'}

User instruction: ${ai_prompt}

Return ONLY valid JSON: { "subject": "...", "body_plain": "...", "body_html": "<p>...</p>" }`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: systemPrompt,
        response_json_schema: {
          type: 'object',
          required: ['subject', 'body_plain', 'body_html'],
          properties: {
            subject: { type: 'string' },
            body_plain: { type: 'string' },
            body_html: { type: 'string' },
          },
        },
        model: 'claude_sonnet_4_6',
      });

      if (!result?.subject) return Response.json({ error: 'AI generation failed' }, { status: 500 });
      return Response.json({ subject: result.subject, body_plain: result.body_plain, body_html: result.body_html });
    }

    if (action === 'save_draft') {
      const data = {
        client_id,
        prospect_id,
        artifact_id: artifact_id || null,
        subject: subject || '',
        body_html: body_html || '',
        body_plain: body_plain || '',
        ai_generated: false,
        status: 'draft',
        created_by: user.id,
      };

      let draft;
      if (draft_id) {
        draft = await base44.entities.EmailDraft.update(draft_id, data);
      } else {
        draft = await base44.entities.EmailDraft.create(data);
      }
      return Response.json({ draft });
    }

    if (action === 'send') {
      // For now: simulate send (Gmail OAuth wired in the connector flow)
      // Save draft first
      const draftData = {
        client_id,
        prospect_id,
        artifact_id: artifact_id || null,
        subject: subject || '',
        body_html: body_html || '',
        body_plain: body_plain || '',
        status: 'sent',
        created_by: user.id,
      };
      const draft = draft_id
        ? await base44.entities.EmailDraft.update(draft_id, { ...draftData, status: 'sent' })
        : await base44.entities.EmailDraft.create(draftData);

      // Create EmailSend record
      const emailSend = await base44.entities.EmailSend.create({
        email_draft_id: draft.id,
        client_id,
        prospect_id,
        artifact_id: artifact_id || null,
        from_address: user.email,
        to_address: body?.to_address || '',
        subject: subject || '',
        sent_at: new Date().toISOString(),
        delivery_status: 'sent',
      });

      // Update prospect
      const prospects = await base44.entities.Prospect.filter({ id: prospect_id });
      if (prospects.length) {
        const p = prospects[0];
        const updates = {
          last_contacted_at: new Date().toISOString(),
          last_artifact_id: artifact_id || p.last_artifact_id,
        };
        if (p.status === 'new') updates.status = 'contacted';
        await base44.entities.Prospect.update(prospect_id, updates);
      }

      return Response.json({ send: emailSend, draft });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});