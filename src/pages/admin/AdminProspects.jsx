import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Eye, Linkedin } from 'lucide-react';

const STATUS_COLORS = {
  new: 'bg-blue-50 text-blue-700 border-blue-200',
  contacted: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  engaged: 'bg-purple-50 text-purple-700 border-purple-200',
  hot: 'bg-red-50 text-red-700 border-red-200',
  qualified: 'bg-green-50 text-green-700 border-green-200',
  bounced: 'bg-orange-50 text-orange-700 border-orange-200',
  archived: 'bg-gray-50 text-gray-500 border-gray-200',
};

export default function AdminProspects() {
  const [prospects, setProspects] = useState([]);
  const [clients, setClients] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterSource, setFilterSource] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [ps, cs] = await Promise.all([
      base44.asServiceRole.entities.Prospect.list('-created_date', 500),
      base44.asServiceRole.entities.Client.list(),
    ]);
    const cm = {};
    cs.forEach(c => { cm[c.id] = c; });
    setClients(cm);
    setProspects(ps);
    setLoading(false);
  };

  const filtered = prospects.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (p.full_name || '').toLowerCase().includes(q) ||
      (p.email || '').toLowerCase().includes(q) ||
      (p.company || '').toLowerCase().includes(q);
    const matchSource = filterSource === 'all' || p.source === filterSource;
    const matchStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchSearch && matchSource && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Prospect Search</h1>
        <p className="text-muted-foreground text-sm mt-1">Read-only cross-client prospect search for QA and dedup checking.</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search name, email, company…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-64" />
        </div>
        <select value={filterSource} onChange={e => setFilterSource(e.target.value)} className="border border-border rounded-md px-2 py-1.5 text-sm bg-background">
          <option value="all">All Sources</option>
          <option value="audiencelab">AudienceLab</option>
          <option value="csv_upload">CSV Upload</option>
          <option value="manual">Manual</option>
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border border-border rounded-md px-2 py-1.5 text-sm bg-background">
          <option value="all">All Statuses</option>
          {['new','contacted','engaged','hot','qualified','not_interested','bounced','archived'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <p className="text-sm text-muted-foreground">{filtered.length} prospects</p>

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="p-3 text-left font-medium text-muted-foreground">Name</th>
                <th className="p-3 text-left font-medium text-muted-foreground hidden md:table-cell">Client</th>
                <th className="p-3 text-left font-medium text-muted-foreground hidden md:table-cell">Company</th>
                <th className="p-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="p-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Source</th>
                <th className="p-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Views</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.slice(0, 200).map(p => (
                <tr key={p.id} className="hover:bg-muted/20">
                  <td className="p-3">
                    <div>
                      <p className="font-medium">{p.full_name || p.email}</p>
                      <p className="text-xs text-muted-foreground">{p.email}</p>
                    </div>
                  </td>
                  <td className="p-3 hidden md:table-cell text-xs text-muted-foreground">{clients[p.client_id]?.name || '—'}</td>
                  <td className="p-3 hidden md:table-cell text-xs">{p.company || '—'}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[p.status] || ''}`}>{p.status}</span>
                  </td>
                  <td className="p-3 hidden lg:table-cell text-xs text-muted-foreground">{p.source || '—'}</td>
                  <td className="p-3 hidden lg:table-cell text-xs text-muted-foreground flex items-center gap-1">
                    <Eye className="w-3 h-3" /> {p.total_artifact_views || 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}