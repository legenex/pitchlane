import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import useCurrentUser from '@/lib/useCurrentUser';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ArrowLeft, Mail, Phone, Linkedin, ExternalLink, Sparkles, Eye, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import EmailComposerModal from '@/components/prospects/EmailComposerModal';

const STATUS_COLORS = {
  new: 'bg-blue-50 text-blue-700 border-blue-200',
  contacted: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  engaged: 'bg-purple-50 text-purple-700 border-purple-200',
  hot: 'bg-red-50 text-red-700 border-red-200',
  qualified: 'bg-green-50 text-green-700 border-green-200',
  not_interested: 'bg-gray-50 text-gray-500 border-gray-200',
  bounced: 'bg-orange-50 text-orange-700 border-orange-200',
  archived: 'bg-gray-50 text-gray-400 border-gray-200',
};

export default function ProspectDetail() {
  const { id } = useParams();
  const { clientId } = useCurrentUser();
  const { toast } = useToast();

  const [prospect, setProspect] = useState(null);
  const [artifact, setArtifact] = useState(null);
  const [emailSends, setEmailSends] = useState([]);
  const [artifactViews, setArtifactViews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEnrichment, setShowEnrichment] = useState(false);
  const [note, setNote] = useState('');
  const [showComposer, setShowComposer] = useState(false);
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => { loadData(); }, [id]);

  const loadData = async () => {
    setLoading(true);
    const ps = await base44.entities.Prospect.filter({ id });
    if (!ps.length) { setLoading(false); return; }
    const p = ps[0];
    setProspect(p);
    setNote(p.notes || '');

    const [sends, views] = await Promise.all([
      base44.entities.EmailSend.filter({ prospect_id: id }),
      base44.entities.ArtifactView.filter({ prospect_id: id }),
    ]);
    setEmailSends(sends.sort((a, b) => new Date(b.sent_at) - new Date(a.sent_at)));
    setArtifactViews(views.sort((a, b) => new Date(b.opened_at) - new Date(a.opened_at)));

    if (p.last_artifact_id) {
      const arts = await base44.entities.Artifact.filter({ id: p.last_artifact_id });
      if (arts.length) setArtifact(arts[0]);
    }
    setLoading(false);
  };

  const handleStatusChange = async (status) => {
    const updated = await base44.entities.Prospect.update(id, { status });
    setProspect(updated);
    toast({ title: `Status updated to ${status}` });
  };

  const handleSaveNote = async () => {
    setSavingNote(true);
    const updated = await base44.entities.Prospect.update(id, { notes: note });
    setProspect(updated);
    setSavingNote(false);
    toast({ title: 'Note saved' });
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  if (!prospect) return <div className="text-muted-foreground p-8">Prospect not found.</div>;

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link to="/app/prospects">
        <Button variant="ghost" size="sm" className="gap-1 -ml-2"><ArrowLeft className="w-4 h-4" /> Back to Inbox</Button>
      </Link>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Left column (3/5) */}
        <div className="lg:col-span-3 space-y-5">
          {/* Header */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h1 className="text-2xl font-bold">{prospect.full_name || prospect.email}</h1>
                  {(prospect.title || prospect.company) && (
                    <p className="text-muted-foreground">{[prospect.title, prospect.company].filter(Boolean).join(' @ ')}</p>
                  )}
                  {(prospect.location_city || prospect.location_state) && (
                    <p className="text-sm text-muted-foreground">{[prospect.location_city, prospect.location_state, prospect.location_country].filter(Boolean).join(', ')}</p>
                  )}
                </div>
                <div className="flex gap-2 items-center flex-wrap">
                  <span className={`px-2.5 py-1 text-sm rounded-full border font-medium ${STATUS_COLORS[prospect.status]}`}>{prospect.status}</span>
                  <span className="px-2 py-1 text-xs rounded border border-border text-muted-foreground">{prospect.source || 'manual'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact card */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Contact</CardTitle></CardHeader>
            <CardContent className="p-5 pt-0 space-y-3">
              {prospect.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{prospect.email}</span>
                  {prospect.email_verified && <Badge className="text-xs bg-green-50 text-green-700 border-green-200">Verified</Badge>}
                </div>
              )}
              {prospect.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{prospect.phone}</span>
                  {prospect.phone_hlr_result?.line_type && (
                    <span className="text-xs text-muted-foreground">({prospect.phone_hlr_result.line_type})</span>
                  )}
                  <Badge className={`text-xs ${prospect.phone_hlr_status === 'validated' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-muted text-muted-foreground'}`}>
                    {prospect.phone_hlr_status}
                  </Badge>
                </div>
              )}
              {prospect.linkedin_url && (
                <div className="flex items-center gap-2">
                  <Linkedin className="w-4 h-4 text-blue-600" />
                  <a href={prospect.linkedin_url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                    LinkedIn <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Intent signals */}
          {(prospect.intent_signals || []).length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Intent Signals</CardTitle></CardHeader>
              <CardContent className="p-5 pt-0">
                <div className="flex gap-2 flex-wrap">
                  {prospect.intent_signals.map((s, i) => (
                    <span key={i} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">{s}</span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Enrichment data */}
          {prospect.enrichment_data && Object.keys(prospect.enrichment_data).length > 0 && (
            <Card>
              <CardContent className="p-5">
                <button onClick={() => setShowEnrichment(!showEnrichment)} className="flex items-center justify-between w-full text-sm font-medium">
                  Enrichment Data
                  {showEnrichment ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {showEnrichment && (
                  <pre className="mt-3 text-xs bg-muted p-3 rounded overflow-auto max-h-48">
                    {JSON.stringify(prospect.enrichment_data, null, 2)}
                  </pre>
                )}
              </CardContent>
            </Card>
          )}

          {/* Activity timeline */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Activity</CardTitle></CardHeader>
            <CardContent className="p-5 pt-0 space-y-3">
              {artifactViews.map(v => (
                <div key={v.id} className="flex items-start gap-3 text-sm">
                  <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Eye className="w-3 h-3 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium">Viewed artifact</p>
                    <p className="text-xs text-muted-foreground">{v.device_type} · {v.time_spent_seconds}s · {new Date(v.opened_at).toLocaleString()}</p>
                  </div>
                </div>
              ))}
              {emailSends.map(s => (
                <div key={s.id} className="flex items-start gap-3 text-sm">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${s.delivery_status === 'bounced' ? 'bg-orange-100' : 'bg-blue-100'}`}>
                    <Mail className={`w-3 h-3 ${s.delivery_status === 'bounced' ? 'text-orange-600' : 'text-blue-600'}`} />
                  </div>
                  <div>
                    <p className="font-medium">Email sent — {s.delivery_status}</p>
                    <p className="text-xs text-muted-foreground">{s.subject} · {new Date(s.sent_at).toLocaleString()}</p>
                  </div>
                </div>
              ))}
              {artifactViews.length === 0 && emailSends.length === 0 && (
                <p className="text-sm text-muted-foreground">No activity yet.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column (2/5) */}
        <div className="lg:col-span-2 space-y-5">
          {/* Quick actions */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Quick Actions</CardTitle></CardHeader>
            <CardContent className="p-5 pt-0 space-y-2">
              <Link to={`/app/artifacts/new?prospect_id=${prospect.id}`}>
                <Button className="w-full gap-2 justify-start" variant="outline">
                  <Sparkles className="w-4 h-4" /> Generate Artifact
                </Button>
              </Link>
              <Button className="w-full gap-2 justify-start" variant="outline" onClick={() => setShowComposer(true)}>
                <Mail className="w-4 h-4" /> Compose Email
              </Button>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Change Status</label>
                <select
                  value={prospect.status}
                  onChange={e => handleStatusChange(e.target.value)}
                  className="w-full border border-border rounded-md px-2 py-1.5 text-sm bg-background"
                >
                  {['new','contacted','engaged','hot','qualified','not_interested','bounced','archived'].map(s => (
                    <option key={s} value={s}>{s.replace(/_/g,' ')}</option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Linked artifact */}
          {artifact && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Linked Artifact</CardTitle></CardHeader>
              <CardContent className="p-5 pt-0 space-y-3">
                <div className="w-full h-28 rounded bg-muted flex items-center justify-center overflow-hidden">
                  {artifact.status === 'published' ? (
                    <iframe src={`/p/${artifact.public_slug}?preview=1`} className="w-[600px] h-[400px] scale-[0.18] origin-top-left pointer-events-none" title="preview" />
                  ) : (
                    <span className="text-xs text-muted-foreground">{artifact.status}</span>
                  )}
                </div>
                <p className="text-sm font-medium">{artifact.title}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{artifact.view_count || 0} views</span>
                </div>
                <Link to={`/app/artifacts/${artifact.id}/edit`}>
                  <Button variant="outline" size="sm" className="w-full">Open Artifact</Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Notes</CardTitle></CardHeader>
            <CardContent className="p-5 pt-0 space-y-2">
              <Textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note…" className="text-sm h-28" />
              <Button size="sm" variant="outline" onClick={handleSaveNote} disabled={savingNote} className="w-full">
                {savingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Note'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {showComposer && (
        <EmailComposerModal
          prospect={prospect}
          clientId={clientId}
          artifact={artifact}
          onClose={() => setShowComposer(false)}
          onSent={() => { setShowComposer(false); loadData(); toast({ title: 'Email sent!' }); }}
        />
      )}
    </div>
  );
}