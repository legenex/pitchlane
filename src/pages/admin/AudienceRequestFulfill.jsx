import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { fulfillAudienceRequest } from '@/functions/fulfillAudienceRequest';
import { importProspects } from '@/functions/importProspects';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Upload, CheckCircle, AlertTriangle, Users, Loader2, PlayCircle, Check } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const STATUS_COLORS = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
  fulfilled: 'bg-green-50 text-green-700 border-green-200',
  partial: 'bg-orange-50 text-orange-700 border-orange-200',
  cancelled: 'bg-gray-50 text-gray-500 border-gray-200',
};

function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  return lines.slice(1).map(line => {
    const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const row = {};
    headers.forEach((h, i) => { row[h] = vals[i] || ''; });
    return row;
  });
}

export default function AudienceRequestFulfill() {
  const { id } = useParams();
  const { toast } = useToast();
  const [request, setRequest] = useState(null);
  const [client, setClient] = useState(null);
  const [prospects, setProspects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [csvRows, setCsvRows] = useState([]);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [completing, setCompleting] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => { loadData(); }, [id]);

  const loadData = async () => {
    const reqs = await base44.asServiceRole.entities.AudienceRequest.filter({ id });
    if (!reqs.length) { setLoading(false); return; }
    const r = reqs[0];
    setRequest(r);
    setNotes(r.fulfillment_notes || '');

    const [clientList, existingProspects] = await Promise.all([
      base44.asServiceRole.entities.Client.filter({ id: r.client_id }),
      base44.asServiceRole.entities.Prospect.filter({ audience_request_id: id }),
    ]);
    if (clientList.length) setClient(clientList[0]);
    setProspects(existingProspects);
    setLoading(false);
  };

  const handleStart = async () => {
    const res = await fulfillAudienceRequest({ audience_request_id: id, action: 'start', notes });
    if (res.data?.request) { setRequest(res.data.request); toast({ title: 'Started' }); }
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    const res = await fulfillAudienceRequest({ audience_request_id: id, action: 'update_notes', notes });
    setSavingNotes(false);
    if (res.data?.request) { setRequest(res.data.request); toast({ title: 'Notes saved' }); }
  };

  const handleComplete = async () => {
    setCompleting(true);
    const res = await fulfillAudienceRequest({ audience_request_id: id, action: 'complete', notes });
    setCompleting(false);
    if (res.data?.request) { setRequest(res.data.request); toast({ title: 'Marked complete — client notified!' }); }
  };

  const handleCancel = async () => {
    setCancelling(true);
    const res = await fulfillAudienceRequest({ audience_request_id: id, action: 'cancel', notes });
    setCancelling(false);
    if (res.data?.request) { setRequest(res.data.request); toast({ title: 'Cancelled — credits refunded' }); }
  };

  const handleCsvFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const parsed = parseCSV(ev.target.result);
      if (!parsed.length) return;
      setCsvRows(parsed);
      setCsvHeaders(Object.keys(parsed[0]));
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!csvRows.length) return;
    setImporting(true);
    const res = await importProspects({
      client_id: request.client_id,
      audience_request_id: id,
      rows: csvRows,
    });
    setImporting(false);
    if (res.data) {
      setImportResult(res.data);
      toast({ title: `Imported ${res.data.imported} prospects` });
      await loadData();
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  if (!request) return <div className="p-4 text-muted-foreground">Request not found.</div>;

  return (
    <div className="max-w-3xl space-y-6">
      <Link to="/admin/audience-requests">
        <Button variant="ghost" size="sm" className="gap-1 -ml-2"><ArrowLeft className="w-4 h-4" /> Back to Queue</Button>
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">{request.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">Client: {client?.name} · {new Date(request.created_date).toLocaleDateString()}</p>
        </div>
        <span className={`px-3 py-1 text-sm rounded-full border font-medium ${STATUS_COLORS[request.status]}`}>{request.status}</span>
      </div>

      {/* Progress */}
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{request.requested_quantity}</p><p className="text-xs text-muted-foreground">Requested</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-green-600">{prospects.length}</p><p className="text-xs text-muted-foreground">Imported</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{request.credits_committed}</p><p className="text-xs text-muted-foreground">Credits</p></CardContent></Card>
      </div>

      {/* Criteria */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Request Criteria</CardTitle></CardHeader>
        <CardContent className="p-5 pt-0 space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div><p className="text-xs text-muted-foreground">Niche</p><p>{request.niche || '—'}</p></div>
            <div><p className="text-xs text-muted-foreground">Geography</p><p>{request.target_geo || '—'}</p></div>
          </div>
          {request.target_audience_description && (
            <div><p className="text-xs text-muted-foreground mb-1">Criteria</p><p className="text-muted-foreground">{request.target_audience_description}</p></div>
          )}
          {(request.intent_signals || []).length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Intent Signals</p>
              <div className="flex gap-2 flex-wrap">
                {request.intent_signals.map((s, i) => <span key={i} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">{s}</span>)}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Admin notes */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Fulfillment Notes</CardTitle></CardHeader>
        <CardContent className="p-5 pt-0 space-y-2">
          <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add notes visible to client…" className="h-24 text-sm" />
          <Button size="sm" variant="outline" onClick={handleSaveNotes} disabled={savingNotes}>
            {savingNotes ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Notes'}
          </Button>
        </CardContent>
      </Card>

      {/* CSV Upload */}
      {request.status !== 'cancelled' && request.status !== 'fulfilled' && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Upload Prospects CSV</CardTitle></CardHeader>
          <CardContent className="p-5 pt-0 space-y-4">
            <p className="text-xs text-muted-foreground">Required: first_name, last_name, email · Optional: phone, linkedin_url, company, title, location_city, location_state, intent_signals_csv</p>
            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/40 transition-colors">
              <Upload className="w-5 h-5 text-muted-foreground mb-1" />
              <span className="text-sm text-muted-foreground">Upload CSV</span>
              <input type="file" accept=".csv" onChange={handleCsvFile} className="hidden" />
            </label>

            {csvRows.length > 0 && !importResult && (
              <>
                <div className="overflow-x-auto border border-border rounded-lg">
                  <table className="text-xs w-full">
                    <thead className="bg-muted/50"><tr>{csvHeaders.slice(0, 5).map(h => <th key={h} className="p-2 text-left">{h}</th>)}</tr></thead>
                    <tbody className="divide-y divide-border">
                      {csvRows.slice(0, 5).map((row, i) => <tr key={i}>{csvHeaders.slice(0, 5).map(h => <td key={h} className="p-2 text-muted-foreground truncate max-w-[80px]">{row[h]}</td>)}</tr>)}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-muted-foreground">{csvRows.length} rows detected</p>
                <Button onClick={handleImport} disabled={importing} className="w-full gap-2">
                  {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  Validate & Import {csvRows.length} rows
                </Button>
              </>
            )}

            {importResult && (
              <div className="space-y-1 text-sm">
                <p className="flex items-center gap-2 text-green-700"><CheckCircle className="w-4 h-4" />{importResult.imported} imported</p>
                {importResult.skipped > 0 && <p className="text-muted-foreground">{importResult.skipped} duplicates skipped</p>}
                {importResult.errors?.length > 0 && <p className="flex items-center gap-2 text-orange-600"><AlertTriangle className="w-4 h-4" />{importResult.errors.length} errors</p>}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Action buttons */}
      <div className="flex gap-3 flex-wrap">
        {request.status === 'pending' && (
          <Button variant="outline" onClick={handleStart} className="gap-2">
            <PlayCircle className="w-4 h-4" /> Start Fulfilling
          </Button>
        )}
        {(request.status === 'in_progress' || request.status === 'pending') && (
          <Button onClick={handleComplete} disabled={completing} className="gap-2">
            {completing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Mark Complete & Notify Client
          </Button>
        )}
        {request.status !== 'cancelled' && request.status !== 'fulfilled' && (
          <Button variant="destructive" onClick={handleCancel} disabled={cancelling}>
            {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Cancel & Refund'}
          </Button>
        )}
        <Link to={`/app/prospects?audience_request_id=${id}`} target="_blank">
          <Button variant="ghost" className="gap-2"><Users className="w-4 h-4" />View Prospects ({prospects.length})</Button>
        </Link>
      </div>
    </div>
  );
}