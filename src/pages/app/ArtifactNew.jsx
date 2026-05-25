import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import useCurrentUser from '@/lib/useCurrentUser';
import { generateArtifact } from '@/functions/generateArtifact';
import { AlertCircle, ChevronRight, ChevronLeft, Sparkles, Loader2, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';

const STEPS = ['Who is this for?', 'Choose template', 'Generation prompt', 'Generating…'];
const TEMPLATE_ACCENTS = ['#6B4226', '#7C2D2D', '#EF3E2C'];

function StepPill({ index, label, currentStep }) {
  const done = currentStep > index;
  const active = currentStep === index;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: done || active ? 'var(--accent)' : 'var(--canvas)',
        border: done || active ? 'none' : '1px solid var(--line)',
        transition: 'all 200ms',
      }}>
        {done
          ? <CheckCircle size={14} style={{ color: '#fff' }} />
          : <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: active ? '#fff' : 'var(--ink-muted)', fontWeight: 600 }}>{index + 1}</span>}
      </div>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: active ? 'var(--ink)' : 'var(--ink-muted)', fontWeight: active ? 600 : 400 }}>{label}</span>
      {index < 2 && <ChevronRight size={14} style={{ color: 'var(--line)', marginLeft: 4 }} />}
    </div>
  );
}

function OptionCard({ selected, onClick, title, description, disabled }) {
  return (
    <div onClick={!disabled ? onClick : undefined}
      style={{
        background: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: '20px 24px',
        border: selected ? '2px solid var(--accent)' : '1px solid var(--line)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 150ms',
        background: selected ? 'rgba(242,92,42,0.04)' : 'var(--surface)',
      }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--ink)', marginBottom: 4 }}>{title}</div>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.5 }}>{description}</div>
    </div>
  );
}

export default function ArtifactNew() {
  const { user, clientId } = useCurrentUser();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const prospectIdParam = searchParams.get('prospect_id');
  const [step, setStep] = useState(0);
  const [prospectMode, setProspectMode] = useState(prospectIdParam ? 'prospect' : 'quick_paste');
  const [selectedProspect, setSelectedProspect] = useState(null);
  const [prospectContext, setProspectContext] = useState('');
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [client, setClient] = useState(null);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!clientId) return;
    loadData();
  }, [clientId]);

  useEffect(() => {
    if (!prospectIdParam || !clientId) return;
    base44.entities.Prospect.filter({ id: prospectIdParam }).then(ps => {
      if (ps.length) {
        const p = ps[0];
        setSelectedProspect(p);
        const ctx = [
          p.full_name,
          p.title && p.company ? `${p.title} at ${p.company}` : (p.company || p.title || ''),
          [p.location_city, p.location_state].filter(Boolean).join(', '),
          (p.intent_signals || []).length ? `Intent: ${p.intent_signals.join(', ')}` : '',
        ].filter(Boolean).join('\n');
        setProspectContext(ctx);
        setStep(1);
      }
    });
  }, [prospectIdParam, clientId]);

  const loadData = async () => {
    setLoading(true);
    const [tmps, clients] = await Promise.all([
      base44.entities.ArtifactTemplate.list(),
      base44.entities.Client.filter({ id: clientId }),
    ]);
    setTemplates(tmps);
    if (clients.length) {
      const c = clients[0];
      setClient(c);
      if (c.plan_id) {
        const plans = await base44.entities.Plan.filter({ id: c.plan_id });
        if (plans.length) setPlan(plans[0]);
      }
    }
    const clientNiche = clients[0]?.niche?.toLowerCase() || '';
    const recommended = tmps.find(t => (t.recommended_niches || []).some(n => clientNiche.includes(n)));
    setSelectedTemplate(recommended || tmps[0] || null);
    setLoading(false);
  };

  useEffect(() => {
    if (!selectedTemplate || !client) return;
    const niche = client.niche || 'professional services';
    setPrompt(
      `Generate a personalized pitch for ${prospectContext ? prospectContext.split('\n')[0] : 'our prospect'}. ` +
      `Emphasize our work in ${niche}. ` +
      `Lead with our top differentiator. ` +
      `Keep the tone consistent with our brand voice.`
    );
  }, [selectedTemplate, client, prospectContext]);

  const quota = plan?.artifact_quota || 3;
  const used = client?.artifacts_used_this_period || 0;
  const remaining = quota - used;
  const overQuota = remaining <= 0;

  const handleGenerate = async () => {
    setGenerating(true);
    setStep(3);
    const res = await generateArtifact({
      client_id: clientId,
      template_id: selectedTemplate?.id,
      generation_prompt: prompt,
      prospect_context: prospectContext,
      prospect_id: selectedProspect?.id || null,
      title: selectedProspect?.full_name
        ? `Pitch for ${selectedProspect.full_name}`
        : prospectContext
          ? `Pitch for ${prospectContext.split('\n')[0].slice(0, 60)}`
          : `New Pitch — ${new Date().toLocaleDateString()}`,
    });
    setGenerating(false);
    if (res.data?.artifact) {
      navigate(`/app/artifacts/${res.data.artifact.id}/edit`);
    } else {
      toast({ title: 'Generation failed', description: res.data?.error || 'Please try again.', variant: 'destructive' });
      setStep(2);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
      <Loader2 size={24} style={{ color: 'var(--ink-muted)', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      {/* Step pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'wrap', marginBottom: 32 }}>
        {STEPS.slice(0, 3).map((s, i) => (
          <StepPill key={i} index={i} label={s} currentStep={step} />
        ))}
      </div>

      <motion.div key={step} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>

        {/* Step 0: Who */}
        {step === 0 && (
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--ink)', marginBottom: 20 }}>
              Who is this <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>pitch for?</em>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              {selectedProspect ? (
                <OptionCard selected title={`Prospect: ${selectedProspect.full_name}`}
                  description={selectedProspect.title && selectedProspect.company ? `${selectedProspect.title} @ ${selectedProspect.company}` : selectedProspect.email} />
              ) : (
                <OptionCard disabled title="Select a prospect from inbox" description={'Use "Generate Artifact" from a prospect\'s profile.'} />
              )}
              <OptionCard selected={prospectMode === 'quick_paste'} onClick={() => setProspectMode('quick_paste')}
                title="Quick paste" description="Paste name, role, company, and context in any format." />
              <OptionCard selected={prospectMode === 'test'} onClick={() => setProspectMode('test')}
                title="Test / preview only" description="Generic pitch using your brand profile alone." />
            </div>

            {prospectMode === 'quick_paste' && (
              <textarea
                placeholder="e.g. Jane Doe, CEO at Pacific Heights Development. Looking to renovate a 4BR residence."
                value={prospectContext}
                onChange={e => setProspectContext(e.target.value)}
                style={{ width: '100%', minHeight: 120, fontFamily: 'var(--font-body)', fontSize: 14, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', padding: '12px 16px', color: 'var(--ink)', outline: 'none', resize: 'vertical', boxSizing: 'border-box', marginBottom: 16 }}
                onFocus={e => e.target.style.borderColor = 'rgba(242,92,42,0.4)'}
                onBlur={e => e.target.style.borderColor = 'var(--line)'}
              />
            )}

            <button onClick={() => setStep(1)} disabled={prospectMode === 'quick_paste' && !prospectContext.trim()}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, background: 'var(--accent)', color: '#fff', padding: '12px 0', borderRadius: 'var(--radius-pill)', border: 'none', cursor: 'pointer', boxShadow: 'var(--shadow-accent)', opacity: prospectMode === 'quick_paste' && !prospectContext.trim() ? 0.5 : 1 }}>
              Next <ChevronRight size={15} />
            </button>
          </div>
        )}

        {/* Step 1: Template */}
        {step === 1 && (
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--ink)', marginBottom: 20 }}>
              Choose a <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>template</em>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              {templates.map((t, idx) => {
                const accent = TEMPLATE_ACCENTS[idx % TEMPLATE_ACCENTS.length];
                const isRecommended = (t.recommended_niches || []).some(n => (client?.niche || '').toLowerCase().includes(n));
                const selected = selectedTemplate?.id === t.id;
                return (
                  <div key={t.id} onClick={() => setSelectedTemplate(t)}
                    style={{
                      background: selected ? 'rgba(242,92,42,0.04)' : 'var(--surface)',
                      border: selected ? `2px solid ${accent}` : '1px solid var(--line)',
                      borderRadius: 'var(--radius-lg)', padding: '20px 24px', cursor: 'pointer', transition: 'all 150ms',
                      display: 'flex', gap: 16, alignItems: 'center',
                    }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: accent + '22', border: `1px solid ${accent}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <div style={{ width: 18, height: 18, borderRadius: 3, background: accent, opacity: 0.7 }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--ink)' }}>{t.name}</span>
                        {isRecommended && (
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.14em', background: accent + '18', color: accent, borderRadius: 'var(--radius-pill)', padding: '3px 8px' }}>Recommended</span>
                        )}
                      </div>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.5 }}>{t.description}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep(0)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500, background: 'var(--surface)', color: 'var(--ink-soft)', padding: '11px 20px', borderRadius: 'var(--radius-pill)', border: '1px solid var(--line)', cursor: 'pointer' }}>
                <ChevronLeft size={14} /> Back
              </button>
              <button onClick={() => setStep(2)} disabled={!selectedTemplate}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, background: 'var(--accent)', color: '#fff', padding: '11px 0', borderRadius: 'var(--radius-pill)', border: 'none', cursor: 'pointer', boxShadow: 'var(--shadow-accent)', opacity: !selectedTemplate ? 0.5 : 1 }}>
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Prompt */}
        {step === 2 && (
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--ink)', marginBottom: 20 }}>
              Generation <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>prompt</em>
            </div>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              style={{ width: '100%', minHeight: 160, fontFamily: 'var(--font-mono)', fontSize: 13, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', padding: '14px 16px', color: 'var(--ink)', outline: 'none', resize: 'vertical', boxSizing: 'border-box', marginBottom: 12, lineHeight: 1.6 }}
              placeholder="Describe what to emphasize in this pitch…"
              onFocus={e => e.target.style.borderColor = 'rgba(242,92,42,0.4)'}
              onBlur={e => e.target.style.borderColor = 'var(--line)'}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, padding: '10px 14px', background: overQuota ? 'rgba(234,67,53,0.06)' : 'var(--canvas)', borderRadius: 'var(--radius-md)' }}>
              <AlertCircle size={14} style={{ color: overQuota ? 'var(--danger)' : 'var(--ink-muted)', flexShrink: 0 }} />
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: overQuota ? 'var(--danger)' : 'var(--ink-muted)' }}>
                {overQuota
                  ? `Quota reached (${used}/${quota} artifacts used this period).`
                  : `This will use 1 of your ${remaining}/${quota} artifacts this period.`}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep(1)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500, background: 'var(--surface)', color: 'var(--ink-soft)', padding: '11px 20px', borderRadius: 'var(--radius-pill)', border: '1px solid var(--line)', cursor: 'pointer' }}>
                <ChevronLeft size={14} /> Back
              </button>
              {overQuota ? (
                <button disabled style={{ flex: 1, fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, background: 'var(--danger)', color: '#fff', padding: '11px 0', borderRadius: 'var(--radius-pill)', border: 'none', opacity: 0.6, cursor: 'not-allowed' }}>Upgrade to generate more</button>
              ) : (
                <button onClick={handleGenerate} disabled={!prompt.trim()}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, background: 'var(--accent)', color: '#fff', padding: '11px 0', borderRadius: 'var(--radius-pill)', border: 'none', cursor: 'pointer', boxShadow: 'var(--shadow-accent)', opacity: !prompt.trim() ? 0.5 : 1 }}>
                  <Sparkles size={15} /> Generate →
                </button>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Generating */}
        {step === 3 && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(242,92,42,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <Sparkles size={32} style={{ color: 'var(--accent)', animation: 'pulse 1.5s ease-in-out infinite' }} />
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--ink)', marginBottom: 12 }}>
              Generating your <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>artifact…</em>
            </div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--ink-soft)', maxWidth: 360, margin: '0 auto 24px', lineHeight: 1.6 }}>
              Building a personalized pitch using your brand profile and knowledge assets. This takes about 15–30 seconds.
            </p>
            <Loader2 size={22} style={{ color: 'var(--accent)', animation: 'spin 0.8s linear infinite' }} />
          </div>
        )}
      </motion.div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
      `}</style>
    </div>
  );
}