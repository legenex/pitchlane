import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronDown, ChevronRight, Search, Shield } from 'lucide-react';
import { format } from 'date-fns';

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [clients, setClients] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [logList, clientList] = await Promise.all([
      base44.entities.AuditLog.list('-created_date', 200),
      base44.entities.Client.list(),
    ]);
    const cm = {};
    clientList.forEach(c => { cm[c.id] = c; });
    setClients(cm);
    setLogs(logList);
    setLoading(false);
  };

  const actionTypes = [...new Set(logs.map(l => l.action))].filter(Boolean);

  const filtered = logs.filter(l => {
    const matchSearch = !search ||
      l.user_email?.toLowerCase().includes(search.toLowerCase()) ||
      l.action?.toLowerCase().includes(search.toLowerCase()) ||
      clients[l.client_id]?.name?.toLowerCase().includes(search.toLowerCase());
    const matchAction = filterAction === 'all' || l.action === filterAction;
    return matchSearch && matchAction;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="w-6 h-6" /> Audit Log
        </h1>
        <p className="text-muted-foreground text-sm mt-1">All admin and system actions.</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            className="pl-9 h-9"
            placeholder="Search by actor, action, client..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterAction} onValueChange={setFilterAction}>
          <SelectTrigger className="w-48 h-9">
            <SelectValue placeholder="Filter by action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            {actionTypes.map(a => (
              <SelectItem key={a} value={a}>{a}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">No log entries found.</div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map(log => (
            <div key={log.id} className="border border-border rounded-xl overflow-hidden">
              <div
                className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
              >
                <div className="shrink-0 text-muted-foreground">
                  {expandedId === log.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0 grid grid-cols-[1fr_auto_auto_auto] items-center gap-4">
                  <div>
                    <span className="font-medium text-sm">{log.action}</span>
                    <span className="text-muted-foreground text-xs ml-2">by {log.user_email || log.user_id}</span>
                  </div>
                  {log.client_id && (
                    <Badge variant="outline" className="text-xs shrink-0">{clients[log.client_id]?.name || log.client_id}</Badge>
                  )}
                  {log.entity_type && (
                    <span className="text-xs text-muted-foreground shrink-0">{log.entity_type}</span>
                  )}
                  <span className="text-xs text-muted-foreground shrink-0">
                    {format(new Date(log.created_date), 'MMM d, HH:mm')}
                  </span>
                </div>
              </div>
              {expandedId === log.id && (
                <div className="px-4 pb-4 bg-muted/20 border-t border-border">
                  {log.details && (
                    <pre className="text-xs bg-background border border-border rounded-lg p-3 mt-3 overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  )}
                  <div className="mt-2 flex gap-4 text-xs text-muted-foreground flex-wrap">
                    {log.entity_id && <span>Entity ID: {log.entity_id}</span>}
                    {log.ip_address && <span>IP: {log.ip_address}</span>}
                    <span>Log ID: {log.id}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}