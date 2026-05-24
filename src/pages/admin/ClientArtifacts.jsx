import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { adminResetArtifact } from '@/functions/adminResetArtifact';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MoreVertical, Eye, RotateCw, ArrowLeft, RefreshCw } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';

const STATUS_COLORS = {
  draft: 'bg-yellow-100 text-yellow-800',
  published: 'bg-green-100 text-green-800',
  archived: 'bg-gray-100 text-gray-600',
};

export default function ClientArtifacts() {
  const { slug } = useParams();
  const { toast } = useToast();
  const [client, setClient] = useState(null);
  const [artifacts, setArtifacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resetReason, setResetReason] = useState('');
  const [quotaReason, setQuotaReason] = useState('');
  const [resetingId, setResetingId] = useState(null);

  useEffect(() => {
    loadData();
  }, [slug]);

  const loadData = async () => {
    const clients = await base44.asServiceRole.entities.Client.filter({ slug });
    if (!clients.length) { setLoading(false); return; }
    const c = clients[0];
    setClient(c);
    const arts = await base44.asServiceRole.entities.Artifact.filter({ client_id: c.id });
    setArtifacts(arts.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
    setLoading(false);
  };

  const handleResetRevisions = async (artifactId) => {
    if (!resetReason.trim()) {
      toast({ title: 'Reason required', variant: 'destructive' });
      return;
    }
    setResetingId(artifactId);
    const res = await adminResetArtifact({ action: 'reset_revisions', artifact_id: artifactId, reason: resetReason });
    setResetingId(null);
    if (res.data?.success) {
      toast({ title: 'Revisions reset and audit-logged.' });
      setResetReason('');
      loadData();
    } else {
      toast({ title: 'Failed', description: res.data?.error, variant: 'destructive' });
    }
  };

  const handleResetQuota = async () => {
    if (!quotaReason.trim()) {
      toast({ title: 'Reason required', variant: 'destructive' });
      return;
    }
    const res = await adminResetArtifact({ action: 'reset_quota', client_id: client.id, reason: quotaReason });
    if (res.data?.success) {
      toast({ title: 'Quota reset and audit-logged.' });
      setQuotaReason('');
      loadData();
    } else {
      toast({ title: 'Failed', description: res.data?.error, variant: 'destructive' });
    }
  };

  if (loading) return <div className="text-muted-foreground">Loading…</div>;
  if (!client) return <div className="text-muted-foreground">Client not found.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/admin/clients">
          <Button variant="ghost" size="sm" className="gap-1"><ArrowLeft className="w-4 h-4" /> Clients</Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">{client.name} — Artifacts</h1>
          <p className="text-sm text-muted-foreground">{client.slug} · {artifacts.length} artifacts</p>
        </div>
      </div>

      {/* Reset quota panel */}
      <Card className="border-orange-200 bg-orange-50/50">
        <CardContent className="py-4 flex items-center gap-3 flex-wrap">
          <RefreshCw className="w-4 h-4 text-orange-500 shrink-0" />
          <span className="text-sm font-medium">Reset artifact quota ({client.artifacts_used_this_period || 0} used this period)</span>
          <Input
            placeholder="Reason (required)"
            value={quotaReason}
            onChange={e => setQuotaReason(e.target.value)}
            className="max-w-xs text-sm"
          />
          <Button size="sm" variant="outline" onClick={handleResetQuota} disabled={!quotaReason.trim()}>
            Reset Quota
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {artifacts.length === 0 && <p className="text-muted-foreground text-sm">No artifacts yet.</p>}
        {artifacts.map(artifact => (
          <Card key={artifact.id} className="hover:border-primary/30 transition-colors">
            <CardContent className="py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-sm truncate">{artifact.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_COLORS[artifact.status]}`}>
                      {artifact.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {artifact.revisions_used}/{artifact.revisions_allowed} revisions · {artifact.view_count || 0} views ·
                    Created {new Date(artifact.created_date).toLocaleDateString()}
                  </p>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    {artifact.status === 'published' && (
                      <DropdownMenuItem asChild>
                        <a href={`/p/${artifact.public_slug}?admin_preview=1`} target="_blank" rel="noreferrer" className="flex items-center">
                          <Eye className="w-4 h-4 mr-2" /> View artifact
                        </a>
                      </DropdownMenuItem>
                    )}
                    <div className="px-2 py-2 space-y-2">
                      <p className="text-xs text-muted-foreground font-medium">Reset revisions (audit-logged)</p>
                      <Input
                        placeholder="Reason (required)"
                        value={resetReason}
                        onChange={e => setResetReason(e.target.value)}
                        className="text-xs h-7"
                        onClick={e => e.stopPropagation()}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full gap-1 text-xs"
                        onClick={() => handleResetRevisions(artifact.id)}
                        disabled={resetingId === artifact.id || !resetReason.trim()}
                      >
                        <RotateCw className="w-3 h-3" /> Reset Revisions
                      </Button>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}