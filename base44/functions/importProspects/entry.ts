import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const body = await req.json();
    const { client_id, audience_request_id, rows } = body;

    if (!client_id || !rows || !Array.isArray(rows)) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch existing prospects for dedup by email
    const existing = await base44.asServiceRole.entities.Prospect.filter({ client_id });
    const existingEmails = new Set(existing.map(p => (p.email || '').toLowerCase()));

    let imported = 0;
    let skipped = 0;
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      if (!row.email) {
        errors.push({ row: i + 1, error: 'Missing email' });
        continue;
      }

      const emailNorm = row.email.trim().toLowerCase();

      if (existingEmails.has(emailNorm)) {
        skipped++;
        continue;
      }

      const firstName = (row.first_name || '').trim();
      const lastName = (row.last_name || '').trim();
      const fullName = row.full_name || [firstName, lastName].filter(Boolean).join(' ') || emailNorm;

      const intentSignals = row.intent_signals_csv
        ? row.intent_signals_csv.split(',').map(s => s.trim()).filter(Boolean)
        : [];

      const hasPhone = !!(row.phone && row.phone.trim());

      const prospect = await base44.asServiceRole.entities.Prospect.create({
        client_id,
        audience_request_id: audience_request_id || null,
        first_name: firstName,
        last_name: lastName,
        full_name: fullName,
        email: emailNorm,
        email_verified: false,
        phone: row.phone || '',
        phone_hlr_status: hasPhone ? 'pending' : 'not_run',
        linkedin_url: row.linkedin_url || '',
        company: row.company || '',
        title: row.title || '',
        location_city: row.location_city || '',
        location_state: row.location_state || '',
        location_country: row.location_country || '',
        intent_signals: intentSignals,
        enrichment_data: row.enrichment_data || {},
        source: 'audiencelab',
        source_record_id: row.source_record_id || '',
        status: 'new',
        total_artifact_views: 0,
        total_time_spent_seconds: 0,
      });

      existingEmails.add(emailNorm);
      imported++;
    }

    // Update audience request fulfilled_quantity
    if (audience_request_id) {
      const reqs = await base44.asServiceRole.entities.AudienceRequest.filter({ id: audience_request_id });
      if (reqs.length) {
        const ar = reqs[0];
        await base44.asServiceRole.entities.AudienceRequest.update(audience_request_id, {
          fulfilled_quantity: (ar.fulfilled_quantity || 0) + imported,
          status: 'in_progress',
        });
      }
    }

    return Response.json({ imported, skipped, errors });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});