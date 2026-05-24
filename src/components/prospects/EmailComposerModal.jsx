import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { composeEmail } from '@/functions/composeEmail';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, X, Sparkles, Send } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function EmailComposerModal({ prospect, clientId, artifact, onClose, onSent }) {
  const { toast } = useToast();
  const [subject, setSubject] = useState(artifact ? `Following up — ${artifact.title}` : '');
  const [body, setBody] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [showAi, setShowAi] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setGenerating(true);
    const res = await composeEmail({
      action: 'ai_generate',
      client_id: clientId,
      prospect_id: prospect.id,
      artifact_id: artifact?.id || null,
      ai_prompt: aiPrompt,
    });
    setGenerating(false);
    if (res.data?.subject) {
      setSubject(res.data.subject);
      setBody(res.data.body_plain);
      setShowAi(false);
      toast({ title: 'Email generated!' });
    } else {
      toast({ title: 'Generation failed', variant: 'destructive' });
    }
  };

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) return;
    setSending(true);
    const res = await composeEmail({
      action: 'send',
      client_id: clientId,
      prospect_id: prospect.id,
      artifact_id: artifact?.id || null,
      subject,
      body_html: `<p>${body.replace(/\n/g, '</p><p>')}</p>`,
      body_plain: body,
      to_address: prospect.email,
    });
    setSending(false);
    if (res.data?.send) {
      onSent();
    } else {
      toast({ title: 'Send failed', description: res.data?.error, variant: 'destructive' });
    }
  };

  const handleSaveDraft = async () => {
    await composeEmail({
      action: 'save_draft',
      client_id: clientId,
      prospect_id: prospect.id,
      artifact_id: artifact?.id || null,
      subject,
      body_html: `<p>${body.replace(/\n/g, '</p><p>')}</p>`,
      body_plain: body,
    });
    toast({ title: 'Draft saved' });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-xl border border-border w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-semibold">Compose Email</h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-4 space-y-4">
          {/* To */}
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground w-8">To</span>
            <div className="flex items-center gap-2 flex-1 border border-border rounded-md px-3 py-2 bg-muted/30">
              <span>{prospect.email}</span>
              {prospect.email_verified && <span className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded">Verified</span>}
            </div>
          </div>

          {/* Linked artifact */}
          {artifact && (
            <div className="flex items-center gap-3 text-sm">
              <span className="text-muted-foreground w-8">Pitch</span>
              <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded truncate max-w-xs">{artifact.title}</span>
            </div>
          )}

          {/* Subject */}
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground w-8">Sub</span>
            <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject…" className="flex-1" />
          </div>

          {/* Body */}
          <Textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder={`Hi ${prospect.first_name || prospect.full_name || 'there'},\n\n`}
            className="h-40 text-sm"
          />

          {/* AI compose toggle */}
          {!showAi ? (
            <button onClick={() => setShowAi(true)} className="flex items-center gap-1 text-xs text-primary hover:underline">
              <Sparkles className="w-3.5 h-3.5" /> Generate with AI
            </button>
          ) : (
            <div className="border border-primary/30 rounded-lg p-3 space-y-2 bg-primary/5">
              <p className="text-xs font-medium text-primary">AI Compose</p>
              <Textarea
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                placeholder="e.g. Short, warm intro leading with their interest in Pacific Heights renovation"
                className="h-20 text-sm"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAiGenerate} disabled={generating || !aiPrompt.trim()} className="gap-1">
                  {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  Generate
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowAi(false)}>Cancel</Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-border">
          <Button variant="ghost" size="sm" onClick={handleSaveDraft}>Save Draft</Button>
          <Button onClick={handleSend} disabled={sending || !subject.trim() || !body.trim()} className="gap-2">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Send Now
          </Button>
        </div>
      </div>
    </div>
  );
}