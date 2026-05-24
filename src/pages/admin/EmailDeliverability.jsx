import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Mail, TrendingDown } from 'lucide-react';

export default function EmailDeliverability() {
  const [sends, setSends] = useState([]);
  const [clients, setClients] = useState({});
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState(30);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [sendList, clientList] = await Promise.all([
      base44.asServiceRole.entities.EmailSend.list('-sent_at', 1000),
      base44.asServiceRole.entities.Client.list(),
    ]);
    const cm = {};
    clientList.forEach(c => { cm[c.id] = c; });
    setClients(cm);
    setSends(sendList);
    setLoading(false);
  };

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - range);
  const inRange = sends.filter(s => new Date(s.sent_at) >= cutoff);

  const total = inRange.length;
  const bounced = inRange.filter(s => s.delivery_status === 'bounced').length;
  const replied = inRange.filter(s => s.delivery_status === 'replied').length;
  const opened = inRange.filter(s => s.delivery_status === 'opened').length;
  const bounceRate = total > 0 ? ((bounced / total) * 100).toFixed(1) : 0;
  const openRate = total > 0 ? ((opened / total) * 100).toFixed(1) : 0;
  const replyRate = total > 0 ? ((replied / total) * 100).toFixed(1) : 0;

  // Per-client stats
  const clientStats = {};
  inRange.forEach(s => {
    if (!clientStats[s.client_id]) clientStats[s.client_id] = { total: 0, bounced: 0, replied: 0 };
    clientStats[s.client_id].total++;
    if (s.delivery_status === 'bounced') clientStats[s.client_id].bounced++;
    if (s.delivery_status === 'replied') clientStats[s.client_id].replied++;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Email Deliverability</h1>
          <p className="text-muted-foreground text-sm mt-1">Send health and bounce monitoring.</p>
        </div>
        <select value={range} onChange={e => setRange(Number(e.target.value))} className="border border-border rounded-md px-2 py-1.5 text-sm bg-background">
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {/* Aggregate stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{total}</p><p className="text-xs text-muted-foreground">Total Sent</p></CardContent></Card>
        <Card className={Number(bounceRate) > 5 ? 'border-destructive/40' : ''}>
          <CardContent className="p-4 text-center">
            <p className={`text-2xl font-bold ${Number(bounceRate) > 5 ? 'text-destructive' : ''}`}>{bounceRate}%</p>
            <p className="text-xs text-muted-foreground">Bounce Rate</p>
            {Number(bounceRate) > 5 && <p className="text-xs text-destructive mt-1">⚠ Above 5% threshold</p>}
          </CardContent>
        </Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{openRate}%</p><p className="text-xs text-muted-foreground">Open Rate</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{replyRate}%</p><p className="text-xs text-muted-foreground">Reply Rate</p></CardContent></Card>
      </div>

      {/* Per-client breakdown */}
      <div>
        <h2 className="font-semibold mb-3">Per-Client Breakdown</h2>
        {loading ? (
          <p className="text-muted-foreground text-sm">Loading...</p>
        ) : Object.keys(clientStats).length === 0 ? (
          <p className="text-muted-foreground text-sm">No send data in this period.</p>
        ) : (
          <div className="border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="p-3 text-left font-medium text-muted-foreground">Client</th>
                  <th className="p-3 text-right font-medium text-muted-foreground">Sent</th>
                  <th className="p-3 text-right font-medium text-muted-foreground">Bounced</th>
                  <th className="p-3 text-right font-medium text-muted-foreground">Bounce Rate</th>
                  <th className="p-3 text-right font-medium text-muted-foreground">Health</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {Object.entries(clientStats).map(([cid, stats]) => {
                  const br = stats.total > 0 ? ((stats.bounced / stats.total) * 100).toFixed(1) : 0;
                  const isWarning = Number(br) > 5;
                  return (
                    <tr key={cid} className={`hover:bg-muted/20 ${isWarning ? 'bg-destructive/5' : ''}`}>
                      <td className="p-3 font-medium">{clients[cid]?.name || cid}</td>
                      <td className="p-3 text-right">{stats.total}</td>
                      <td className="p-3 text-right">{stats.bounced}</td>
                      <td className={`p-3 text-right font-medium ${isWarning ? 'text-destructive' : ''}`}>{br}%</td>
                      <td className="p-3 text-right">
                        {isWarning ? (
                          <span className="flex items-center gap-1 justify-end text-destructive text-xs">
                            <AlertTriangle className="w-3.5 h-3.5" /> Throttle / Coach
                          </span>
                        ) : (
                          <span className="text-xs text-green-600">Good</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}