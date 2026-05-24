import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import useCurrentUser from '@/lib/useCurrentUser';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Upload, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const REQUIRED_COLS = ['first_name', 'last_name', 'email'];
const OPTIONAL_COLS = ['phone', 'linkedin_url', 'company', 'title', 'location_city', 'location_state', 'location_country', 'intent_signals_csv'];

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

export default function ProspectImport() {
  const { clientId } = useCurrentUser();
  const { toast } = useToast();
  const [rows, setRows] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      const parsed = parseCSV(text);
      if (!parsed.length) { setError('CSV appears empty or invalid.'); return; }
      setRows(parsed);
      setHeaders(Object.keys(parsed[0]));
      setError('');
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!rows.length) return;
    setImporting(true);
    const { importProspects } = await import('@/functions/importProspects');
    const res = await importProspects({ client_id: clientId, rows });
    setImporting(false);
    if (res.data) {
      setResult(res.data);
      toast({ title: `Imported ${res.data.imported} prospects` });
    } else {
      setError('Import failed. Please try again.');
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <Link to="/app/prospects">
        <Button variant="ghost" size="sm" className="gap-1 -ml-2"><ArrowLeft className="w-4 h-4" /> Back</Button>
      </Link>
      <div>
        <h1 className="text-2xl font-bold">Import Prospects via CSV</h1>
        <p className="text-muted-foreground text-sm mt-1">Upload a CSV file with your prospect data.</p>
      </div>

      <Card>
        <CardContent className="p-5 space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">Required columns:</p>
            <div className="flex gap-2 flex-wrap">
              {REQUIRED_COLS.map(c => <span key={c} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded font-mono">{c}</span>)}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium mb-2 text-muted-foreground">Optional columns:</p>
            <div className="flex gap-2 flex-wrap">
              {OPTIONAL_COLS.map(c => <span key={c} className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded font-mono">{c}</span>)}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">For <code>intent_signals_csv</code>: comma-separated signals in one cell e.g. <code>"Signal 1,Signal 2"</code></p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-4">
          <div>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/40 transition-colors">
              <Upload className="w-6 h-6 text-muted-foreground mb-2" />
              <span className="text-sm text-muted-foreground">Click to upload CSV</span>
              <input type="file" accept=".csv" onChange={handleFile} className="hidden" />
            </label>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          {rows.length > 0 && !result && (
            <>
              <p className="text-sm font-medium">{rows.length} rows detected</p>
              <div className="overflow-x-auto border border-border rounded-lg">
                <table className="text-xs w-full">
                  <thead className="bg-muted/50">
                    <tr>{headers.slice(0, 6).map(h => <th key={h} className="p-2 text-left font-medium">{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {rows.slice(0, 5).map((row, i) => (
                      <tr key={i}>{headers.slice(0, 6).map(h => <td key={h} className="p-2 text-muted-foreground truncate max-w-[100px]">{row[h]}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Button onClick={handleImport} disabled={importing} className="w-full gap-2">
                {importing ? 'Importing…' : `Import ${rows.length} prospects`}
              </Button>
            </>
          )}

          {result && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-green-700 text-sm">
                <CheckCircle className="w-4 h-4" />
                <strong>{result.imported}</strong> prospects imported
              </div>
              {result.skipped > 0 && <p className="text-sm text-muted-foreground">{result.skipped} duplicates skipped</p>}
              {result.errors?.length > 0 && (
                <div className="flex items-center gap-2 text-orange-600 text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  {result.errors.length} rows had errors
                </div>
              )}
              <Link to="/app/prospects"><Button variant="outline" className="w-full">View Prospect Inbox</Button></Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}