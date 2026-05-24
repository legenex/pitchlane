import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import useCurrentUser from '@/lib/useCurrentUser';
import { generateArtifact } from '@/functions/generateArtifact';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, ChevronRight, ChevronLeft, Sparkles, Loader2, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';

const STEPS = ['Who is this for?', 'Choose template', 'Generation prompt', 'Generating…'];

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
        setStep(1); // Skip to template step since prospect is pre-filled
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
    // Auto-select recommended template based on niche
    const clientNiche = clients[0]?.niche?.toLowerCase() || '';
    const recommended = tmps.find(t => (t.recommended_niches || []).some(n => clientNiche.includes(n)));
    setSelectedTemplate(recommended || tmps[0] || null);
    setLoading(false);
  };

  useEffect(() => {
    if (!selectedTemplate || !client) return;
    const brand_voice = '';
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

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1">New Artifact</h1>
        {/* Step indicator */}
        <div className="flex gap-2 mt-4">
          {STEPS.slice(0, 3).map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                step > i ? 'bg-primary text-primary-foreground' : step === i ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>{step > i ? <CheckCircle className="w-3 h-3" /> : i + 1}</div>
              <span className={`text-sm ${step === i ? 'font-medium' : 'text-muted-foreground'}`}>{s}</span>
              {i < 2 && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
            </div>
          ))}
        </div>
      </div>

      <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
        {/* Step 0: Who is this for? */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Who is this pitch for?</h2>
            <div className="grid gap-3">
              {selectedProspect ? (
                <Card className="border-2 border-primary bg-primary/5">
                  <CardContent className="p-4">
                    <div className="font-medium mb-1">Prospect: {selectedProspect.full_name}</div>
                    <div className="text-sm text-muted-foreground">{selectedProspect.title && selectedProspect.company ? `${selectedProspect.title} @ ${selectedProspect.company}` : selectedProspect.email}</div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="cursor-not-allowed opacity-50 border-2 border-border">
                  <CardContent className="p-4">
                    <div className="font-medium mb-1">Select a prospect from inbox</div>
                    <div className="text-sm text-muted-foreground">Use "Generate Artifact" from a prospect's profile.</div>
                  </CardContent>
                </Card>
              )}
              <Card
                onClick={() => setProspectMode('quick_paste')}
                className={`cursor-pointer border-2 transition-colors ${prospectMode === 'quick_paste' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}
              >
                <CardContent className="p-4">
                  <div className="font-medium mb-1">Quick paste</div>
                  <div className="text-sm text-muted-foreground">Paste name, role, company, and context in any format.</div>
                </CardContent>
              </Card>
              <Card
                onClick={() => setProspectMode('test')}
                className={`cursor-pointer border-2 transition-colors ${prospectMode === 'test' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}
              >
                <CardContent className="p-4">
                  <div className="font-medium mb-1">Test / preview only</div>
                  <div className="text-sm text-muted-foreground">Generic pitch using your brand profile alone.</div>
                </CardContent>
              </Card>
            </div>

            {prospectMode === 'quick_paste' && (
              <Textarea
                placeholder="e.g. Jane Doe, CEO at Pacific Heights Development. Looking to renovate a 4BR residence. Interested in sustainable materials."
                value={prospectContext}
                onChange={e => setProspectContext(e.target.value)}
                className="h-32 mt-3"
              />
            )}

            <Button onClick={() => setStep(1)} disabled={prospectMode === 'quick_paste' && !prospectContext.trim()} className="w-full gap-2">
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Step 1: Choose template */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Choose a template</h2>
            <div className="grid gap-3">
              {templates.map(t => {
                const isRecommended = (t.recommended_niches || []).some(n =>
                  (client?.niche || '').toLowerCase().includes(n)
                );
                return (
                  <Card
                    key={t.id}
                    onClick={() => setSelectedTemplate(t)}
                    className={`cursor-pointer border-2 transition-colors ${selectedTemplate?.id === t.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="font-medium">{t.name}</div>
                        {isRecommended && <Badge className="text-xs bg-primary/10 text-primary border-primary/20">Recommended</Badge>}
                      </div>
                      <div className="text-sm text-muted-foreground">{t.description}</div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(0)} className="gap-2"><ChevronLeft className="w-4 h-4" /> Back</Button>
              <Button onClick={() => setStep(2)} disabled={!selectedTemplate} className="flex-1 gap-2">Next <ChevronRight className="w-4 h-4" /></Button>
            </div>
          </div>
        )}

        {/* Step 2: Generation prompt */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Generation prompt</h2>
            <Textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              className="h-40 font-mono text-sm"
              placeholder="Describe what to emphasize in this pitch…"
            />
            <div className={`flex items-center gap-2 text-sm ${overQuota ? 'text-destructive' : 'text-muted-foreground'}`}>
              <AlertCircle className="w-4 h-4" />
              <span>
                {overQuota
                  ? `Quota reached (${used}/${quota} artifacts used this period).`
                  : `This will use 1 of your ${remaining}/${quota} artifacts this period.`}
              </span>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="gap-2"><ChevronLeft className="w-4 h-4" /> Back</Button>
              {overQuota ? (
                <Button variant="destructive" className="flex-1" disabled>Upgrade to generate more</Button>
              ) : (
                <Button onClick={handleGenerate} disabled={!prompt.trim()} className="flex-1 gap-2">
                  <Sparkles className="w-4 h-4" /> Generate →
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Generating */}
        {step === 3 && (
          <div className="text-center py-16 space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Sparkles className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <h2 className="text-xl font-semibold">Generating your artifact…</h2>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
              Building a personalized pitch using your brand profile and knowledge assets. This takes about 15–30 seconds.
            </p>
            <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mt-4" />
          </div>
        )}
      </motion.div>
    </div>
  );
}