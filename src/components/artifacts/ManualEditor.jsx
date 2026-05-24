import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Save } from 'lucide-react';

export default function ManualEditor({ content, brandProfile, onSave }) {
  const [sections, setSections] = useState(content?.sections || []);

  const updateSection = (key, updates) => {
    setSections(prev => prev.map(s => s.key === key ? { ...s, ...updates } : s));
  };

  const updateProject = (idx, pIdx, updates) => {
    setSections(prev => prev.map((s, i) => {
      if (s.key !== 'selected_work') return s;
      const projects = [...(s.projects || [])];
      projects[pIdx] = { ...projects[pIdx], ...updates };
      return { ...s, projects };
    }));
  };

  const heroSection = sections.find(s => s.key === 'hero');
  const whySection = sections.find(s => s.key === 'why_reaching_out');
  const workSection = sections.find(s => s.key === 'selected_work');
  const diffSection = sections.find(s => s.key === 'differentiators');
  const proofSection = sections.find(s => s.key === 'social_proof');
  const ctaSection = sections.find(s => s.key === 'cta');

  const allowedTestimonials = (brandProfile?.social_proof || []).filter(s => s.type === 'testimonial');

  const addTestimonial = (testimonial) => {
    setSections(prev => prev.map(s => {
      if (s.key !== 'social_proof') return s;
      return { ...s, testimonials: [...(s.testimonials || []), { quote: testimonial.content, source: testimonial.source }] };
    }));
  };

  const handleSave = () => {
    onSave({ ...content, sections });
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Manual edits do not count as revisions.</p>
        <Button size="sm" onClick={handleSave} className="gap-1"><Save className="w-3 h-3" /> Save</Button>
      </div>

      {/* Hero */}
      {heroSection && (
        <Section title="Hero">
          <Field label="Title">
            <Input value={heroSection.title || ''} onChange={e => updateSection('hero', { title: e.target.value })} />
          </Field>
          <Field label="Subtitle">
            <Input value={heroSection.subtitle || ''} onChange={e => updateSection('hero', { subtitle: e.target.value })} />
          </Field>
          <Field label="Opening message">
            <Textarea value={heroSection.personalized_opener || ''} onChange={e => updateSection('hero', { personalized_opener: e.target.value })} className="h-20" />
          </Field>
        </Section>
      )}

      {/* Why reaching out */}
      {whySection && (
        <Section title="Why Reaching Out">
          <Field label="Title">
            <Input value={whySection.title || ''} onChange={e => updateSection('why_reaching_out', { title: e.target.value })} />
          </Field>
          <Field label="Body">
            <Textarea value={whySection.body || ''} onChange={e => updateSection('why_reaching_out', { body: e.target.value })} className="h-28" />
          </Field>
        </Section>
      )}

      {/* Selected work */}
      {workSection && (
        <Section title="Selected Work">
          {(workSection.projects || []).map((p, pi) => (
            <div key={pi} className="border border-border rounded-lg p-3 space-y-2 mb-3">
              <Field label={`Project ${pi + 1} — Name`}>
                <Input value={p.name || ''} onChange={e => updateProject('selected_work', pi, { name: e.target.value })} />
              </Field>
              <Field label="Description">
                <Textarea value={p.description || ''} onChange={e => updateProject('selected_work', pi, { description: e.target.value })} className="h-16" />
              </Field>
            </div>
          ))}
        </Section>
      )}

      {/* Social proof — from BrandProfile only */}
      {proofSection && (
        <Section title="Social Proof">
          <p className="text-xs text-muted-foreground mb-2">Select testimonials from your brand profile (prevents invented quotes).</p>
          {allowedTestimonials.length === 0 && (
            <p className="text-xs text-muted-foreground italic">No testimonials in your brand profile yet. Add them in Settings.</p>
          )}
          {allowedTestimonials.map((t, i) => (
            <button
              key={i}
              onClick={() => addTestimonial(t)}
              className="w-full text-left text-sm border border-border rounded-lg p-2 hover:bg-muted transition-colors mb-2"
            >
              <p className="italic">"{t.content}"</p>
              <p className="text-xs text-muted-foreground mt-1">— {t.source}</p>
            </button>
          ))}
          <div className="mt-2 space-y-2">
            {(proofSection.testimonials || []).map((t, i) => (
              <div key={i} className="flex items-start justify-between gap-2 border border-border rounded-lg p-2">
                <div>
                  <p className="text-sm italic">"{t.quote}"</p>
                  <p className="text-xs text-muted-foreground mt-0.5">— {t.source}</p>
                </div>
                <button
                  onClick={() => setSections(prev => prev.map(s => s.key !== 'social_proof' ? s : { ...s, testimonials: s.testimonials.filter((_, j) => j !== i) }))}
                  className="text-xs text-destructive hover:underline shrink-0"
                >Remove</button>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* CTA */}
      {ctaSection && (
        <Section title="Call to Action">
          <Field label="Title">
            <Input value={ctaSection.title || ''} onChange={e => updateSection('cta', { title: e.target.value })} />
          </Field>
          <Field label="Body">
            <Textarea value={ctaSection.body || ''} onChange={e => updateSection('cta', { body: e.target.value })} className="h-20" />
          </Field>
          <Field label="Primary action label">
            <Input value={ctaSection.primary_action?.label || ''} onChange={e => updateSection('cta', { primary_action: { ...ctaSection.primary_action, label: e.target.value } })} />
          </Field>
          <Field label="Primary action URL">
            <Input value={ctaSection.primary_action?.url || ''} onChange={e => updateSection('cta', { primary_action: { ...ctaSection.primary_action, url: e.target.value } })} placeholder="https://cal.com/yourname" />
          </Field>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</h3>
      <div className="space-y-3">{children}</div>
      <hr className="border-border" />
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}