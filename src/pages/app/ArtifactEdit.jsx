import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { reviseArtifact } from '@/functions/reviseArtifact';
import { publishArtifact } from '@/functions/publishArtifact';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Monitor, Tablet, Smartphone, Send, Globe, ArrowLeft, BarChart2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import ManualEditor from '@/components/artifacts/ManualEditor';
import PublishModal from '@/components/artifacts/PublishModal';

const PREVIEW_WIDTHS = { desktop: '100%', tablet: '768px', mobile: '390px' };

export default function ArtifactEdit() {
  const { id } = useParams();
  const { toast } = useToast();
  const iframeRef = useRef(null);
  const [artifact, setArtifact] = useState(null);
  const [brandProfile, setBrandProfile] = useState(null);
  const [previewDevice, setPreviewDevice] = useState('desktop');
  const [aiPrompt, setAiPrompt] = useState('');
  const [regenSection, setRegenSection] = useState('hero');
  const [regenPrompt, setRegenPrompt] = useState('');
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [showPublish, setShowPublish] = useState(false);
  const [previewTs, setPreviewTs] = useState(Date.now());

  useEffect(() => {
    loadArtifact();
  }, [id]);

  const loadArtifact = async () => {
    setLoading(true);
    const arts = await base44.entities.Artifact.filter({ id });
    if (arts.length) {
      const a = arts[0];
      setArtifact(a);
      const profiles = await base44.entities.BrandProfile.filter({ client_id: a.client_id });
      if (profiles.length) setBrandProfile(profiles[0]);
    }
    setLoading(false);
  };

  const refreshPreview = () => setPreviewTs(Date.now());

  const handleAiEdit = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    const res = await reviseArtifact({ artifact_id: id, user_prompt: aiPrompt, change_type: 'ai_prompt_edit' });
    setAiLoading(false);
    if (res.data?.artifact) {
      setArtifact(res.data.artifact);
      setAiPrompt('');
      refreshPreview();
      toast({ title: 'Revision applied!' });
    } else {
      toast({ title: 'Revision failed', description: res.data?.error, variant: 'destructive' });
    }
  };

  const handleRegenSection = async () => {
    if (!regenPrompt.trim()) return;
    setAiLoading(true);
    const res = await reviseArtifact({ artifact_id: id, user_prompt: regenPrompt, change_type: 'regenerate_section', target_section_key: regenSection });
    setAiLoading(false);
    if (res.data?.artifact) {
      setArtifact(res.data.artifact);
      setRegenPrompt('');
      refreshPreview();
      toast({ title: `"${regenSection}" section regenerated!` });
    } else {
      toast({ title: 'Regeneration failed', description: res.data?.error, variant: 'destructive' });
    }
  };

  const handleManualSave = async (updatedContent) => {
    const updated = await base44.entities.Artifact.update(id, { content_json: updatedContent });
    setArtifact(updated);
    refreshPreview();
    toast({ title: 'Saved!' });
  };

  const handleAccentChange = async (color) => {
    const updated = await base44.entities.Artifact.update(id, { accent_color: color });
    setArtifact(updated);
    refreshPreview();
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );

  if (!artifact) return <div className="text-muted-foreground p-8">Artifact not found.</div>;

  const revisionsFull = artifact.revisions_used >= artifact.revisions_allowed;
  const sectionKeys = (artifact.content_json?.sections || []).map(s => s.key);
  const previewUrl = `/p/${artifact.public_slug}?preview=1&ts=${previewTs}`;

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top bar */}
      <div className="h-14 border-b border-border flex items-center justify-between px-4 shrink-0 bg-background z-10">
        <div className="flex items-center gap-3">
          <Link to="/app/artifacts">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
          </Link>
          <span className="font-medium text-sm truncate max-w-xs">{artifact.title}</span>
          <Badge variant={artifact.status === 'published' ? 'default' : 'secondary'} className="shrink-0">{artifact.status}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{artifact.revisions_used}/{artifact.revisions_allowed} revisions</span>
          {/* Accent color picker */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Accent</span>
            <input
              type="color"
              value={artifact.accent_color || '#6B4226'}
              onChange={e => handleAccentChange(e.target.value)}
              className="w-7 h-7 rounded cursor-pointer border border-border"
            />
          </div>
          <Link to={`/app/artifacts/${id}/analytics`}>
            <Button variant="outline" size="sm" className="gap-1">
              <BarChart2 className="w-3.5 h-3.5" /> Analytics
            </Button>
          </Link>
          <Button size="sm" className="gap-1" onClick={() => setShowPublish(true)}>
            <Globe className="w-3.5 h-3.5" /> Publish
          </Button>
        </div>
      </div>

      {/* Split layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Preview */}
        <div className="flex-[6] flex flex-col border-r border-border overflow-hidden bg-muted/30">
          {/* Device toggles */}
          <div className="flex items-center justify-center gap-2 py-2 border-b border-border">
            {[['desktop', Monitor], ['tablet', Tablet], ['mobile', Smartphone]].map(([d, Icon]) => (
              <button
                key={d}
                onClick={() => setPreviewDevice(d)}
                className={`p-1.5 rounded transition-colors ${previewDevice === d ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground'}`}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-auto flex items-start justify-center p-4">
            <div className="transition-all duration-300 bg-white shadow-lg rounded-lg overflow-hidden"
              style={{ width: PREVIEW_WIDTHS[previewDevice], maxWidth: '100%', minHeight: 600 }}>
              <iframe
                ref={iframeRef}
                src={previewUrl}
                className="w-full h-full border-0"
                style={{ minHeight: 700 }}
                title="Artifact preview"
              />
            </div>
          </div>
        </div>

        {/* Right: Editor tabs */}
        <div className="flex-[4] overflow-auto flex flex-col">
          <Tabs defaultValue="ai" className="flex-1 flex flex-col">
            <TabsList className="mx-4 mt-4 mb-0 w-auto justify-start shrink-0">
              <TabsTrigger value="ai">AI Edit</TabsTrigger>
              <TabsTrigger value="manual">Manual</TabsTrigger>
              <TabsTrigger value="regen">Regen Section</TabsTrigger>
            </TabsList>

            <TabsContent value="ai" className="flex-1 p-4 space-y-4 overflow-auto">
              <p className="text-sm text-muted-foreground">Describe the change you want. The AI will rewrite the artifact.</p>
              <Textarea
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                placeholder="e.g. Make the hero more urgent, focus on the Pacific Heights project, and shorten the CTA body."
                className="h-36 text-sm"
                disabled={revisionsFull}
              />
              {revisionsFull ? (
                <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                  All {artifact.revisions_allowed} revisions used. Upgrade for more.
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{artifact.revisions_used}/{artifact.revisions_allowed} revisions used</span>
                  <Button onClick={handleAiEdit} disabled={!aiPrompt.trim() || aiLoading} size="sm" className="gap-1">
                    {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Apply (1 revision)
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="manual" className="flex-1 overflow-auto">
              {brandProfile && (
                <ManualEditor
                  content={artifact.content_json}
                  brandProfile={brandProfile}
                  onSave={handleManualSave}
                />
              )}
            </TabsContent>

            <TabsContent value="regen" className="flex-1 p-4 space-y-4 overflow-auto">
              <p className="text-sm text-muted-foreground">Regenerate a single section while preserving the rest.</p>
              <select
                value={regenSection}
                onChange={e => setRegenSection(e.target.value)}
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
              >
                {sectionKeys.map(k => (
                  <option key={k} value={k}>{k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                ))}
              </select>
              <Textarea
                value={regenPrompt}
                onChange={e => setRegenPrompt(e.target.value)}
                placeholder={`How should the "${regenSection}" section be rewritten?`}
                className="h-28 text-sm"
                disabled={revisionsFull}
              />
              {revisionsFull ? (
                <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                  All {artifact.revisions_allowed} revisions used. Upgrade for more.
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{artifact.revisions_used}/{artifact.revisions_allowed} used</span>
                  <Button onClick={handleRegenSection} disabled={!regenPrompt.trim() || aiLoading} size="sm" className="gap-1">
                    {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Regenerate (1 revision)
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {showPublish && (
        <PublishModal
          artifact={artifact}
          onPublished={(updated) => { setArtifact(updated); setShowPublish(false); }}
          onClose={() => setShowPublish(false)}
        />
      )}
    </div>
  );
}