import React, { useState } from 'react';
import { publishArtifact } from '@/functions/publishArtifact';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Globe, Copy, X, Check, Loader2, QrCode } from 'lucide-react';

export default function PublishModal({ artifact, onPublished, onClose }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [published, setPublished] = useState(artifact.status === 'published');
  const [copied, setCopied] = useState(false);

  const publicUrl = `${window.location.origin}/p/${artifact.public_slug}`;

  const handlePublish = async () => {
    setLoading(true);
    const res = await publishArtifact({ artifact_id: artifact.id });
    setLoading(false);
    if (res.data?.artifact) {
      setPublished(true);
      onPublished(res.data.artifact);
      copyUrl();
      toast({ title: 'Artifact published!', description: 'Share URL copied to clipboard.' });
    } else {
      toast({ title: 'Publish failed', description: res.data?.error, variant: 'destructive' });
    }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(publicUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Publish Artifact</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {published ? (
            <>
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                  <Check className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold">Your artifact is live!</h3>
                <p className="text-sm text-muted-foreground mt-1">Share the link below with your prospect.</p>
              </div>

              <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
                <span className="text-sm font-mono flex-1 truncate">{publicUrl}</span>
                <button onClick={copyUrl} className="text-primary hover:text-primary/70 transition-colors shrink-0">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <Button asChild variant="outline" className="w-full gap-2">
                <a href={publicUrl} target="_blank" rel="noreferrer">
                  <Globe className="w-4 h-4" /> Open in new tab
                </a>
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Publishing makes this artifact accessible at a public URL. The slug is permanent once set.
              </p>
              <div className="bg-muted rounded-lg px-3 py-2">
                <p className="text-xs text-muted-foreground mb-0.5">Public URL will be:</p>
                <span className="text-sm font-mono">{publicUrl}</span>
              </div>
              <Button onClick={handlePublish} disabled={loading} className="w-full gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                Publish & Copy Link
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}