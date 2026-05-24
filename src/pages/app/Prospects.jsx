import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import useCurrentUser from '@/lib/useCurrentUser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Upload, Search, Linkedin, Mail, Eye, MoreHorizontal, Archive, Sparkles, Inbox } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';

const STATUS_TABS = ['all', 'new', 'contacted', 'engaged', 'hot', 'qualified', 'archived'];
const STATUS_COLORS = {
  new: 'bg-blue-50 text-blue-700 border-blue-200',
  contacted: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  engaged: 'bg-purple-50 text-purple-700 border-purple-200',
  hot: 'bg-red-50 text-red-700 border-red-200',
  qualified: 'bg-green-50 text-green-700 border-green-200',
  not_interested: 'bg-gray-50 text-gray-600 border-gray-200',
  bounced: 'bg-orange-50 text-orange-700 border-orange-200',
  archived: 'bg-gray-50 text-gray-500 border-gray-200',
};

export default function Prospects() {
  const { clientId } = useCurrentUser();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [prospects, setProspects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());

  useEffect(() => {
    if (!clientId) return;
    loadProspects();
  }, [clientId]);

  const loadProspects = async () => {
    setLoading(true);
    const ps = await base44.entities.Prospect.filter({ client_id: clientId });
    setProspects(ps.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
    setLoading(false);
  };

  const filtered = prospects.filter(p => {
    const matchTab = activeTab === 'all' || p.status === activeTab;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (p.full_name || '').toLowerCase().includes(q) ||
      (p.email || '').toLowerCase().includes(q) ||
      (p.company || '').toLowerCase().includes(q) ||
      (p.title || '').toLowerCase().includes(q);
    return matchTab && matchSearch;
  });

  const tabCount = (status) => status === 'all' ? prospects.length : prospects.filter(p => p.status === status).length;

  const handleStatusChange = async (id, status) => {
    await base44.entities.Prospect.update(id, { status });
    setProspects(prev => prev.map(p => p.id === id ? { ...p, status } : p));
  };

  const handleArchive = async (id) => {
    await handleStatusChange(id, 'archived');
    toast({ title: 'Prospect archived' });
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  if (loading) return <div className="text-muted-foreground">Loading prospects...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Prospect Inbox</h1>
          <p className="text-muted-foreground text-sm mt-1">{prospects.length} prospects total</p>
        </div>
        <div className="flex gap-2">
          <Link to="/app/prospects/import">
            <Button variant="outline" size="sm" className="gap-1"><Upload className="w-4 h-4" /> Import CSV</Button>
          </Link>
          <Link to="/app/prospects/request">
            <Button size="sm" className="gap-1"><Plus className="w-4 h-4" /> Request Audience</Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 flex-wrap border-b border-border pb-0">
        {STATUS_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              {tabCount(tab)}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search name, email, company…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 ? (
        <div className="text-center py-24 border-2 border-dashed border-border rounded-xl">
          <Inbox className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">No prospects yet</h3>
          <p className="text-muted-foreground mb-6 text-sm">Request your first audience or import a CSV to get started.</p>
          <div className="flex gap-3 justify-center">
            <Link to="/app/prospects/request"><Button>Request Audience</Button></Link>
            <Link to="/app/prospects/import"><Button variant="outline">Import CSV</Button></Link>
          </div>
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="w-10 p-3 text-left"><input type="checkbox" onChange={e => setSelectedIds(e.target.checked ? new Set(filtered.map(p => p.id)) : new Set())} /></th>
                <th className="p-3 text-left font-medium text-muted-foreground">Name</th>
                <th className="p-3 text-left font-medium text-muted-foreground hidden md:table-cell">Company</th>
                <th className="p-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Location</th>
                <th className="p-3 text-left font-medium text-muted-foreground hidden xl:table-cell">Intent</th>
                <th className="p-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="p-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Views</th>
                <th className="p-3 text-left font-medium text-muted-foreground"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-3"><input type="checkbox" checked={selectedIds.has(p.id)} onChange={() => toggleSelect(p.id)} /></td>
                  <td className="p-3">
                    <div className="flex flex-col">
                      <Link to={`/app/prospects/${p.id}`} className="font-medium hover:underline">{p.full_name || p.email}</Link>
                      <span className="text-xs text-muted-foreground">{p.email}</span>
                    </div>
                    {p.linkedin_url && (
                      <a href={p.linkedin_url} target="_blank" rel="noreferrer" className="inline-flex mt-1">
                        <Linkedin className="w-3 h-3 text-blue-600" />
                      </a>
                    )}
                  </td>
                  <td className="p-3 hidden md:table-cell">
                    <div className="font-medium">{p.company || '—'}</div>
                    <div className="text-xs text-muted-foreground">{p.title}</div>
                  </td>
                  <td className="p-3 hidden lg:table-cell text-muted-foreground text-xs">
                    {[p.location_city, p.location_state].filter(Boolean).join(', ') || '—'}
                  </td>
                  <td className="p-3 hidden xl:table-cell">
                    <div className="flex gap-1 flex-wrap">
                      {(p.intent_signals || []).slice(0, 2).map((s, i) => (
                        <span key={i} className="px-1.5 py-0.5 bg-primary/10 text-primary text-xs rounded">{s}</span>
                      ))}
                      {(p.intent_signals || []).length > 2 && (
                        <span className="text-xs text-muted-foreground">+{(p.intent_signals || []).length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 text-xs rounded-full border font-medium ${STATUS_COLORS[p.status] || ''}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="p-3 hidden lg:table-cell text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      <span>{p.total_artifact_views || 0}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="w-4 h-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/app/prospects/${p.id}`}>View Detail</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={`/app/artifacts/new?prospect_id=${p.id}`}>
                            <Sparkles className="w-3.5 h-3.5 mr-2" /> Generate Artifact
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(p.id, 'hot')}>Mark Hot</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(p.id, 'qualified')}>Mark Qualified</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleArchive(p.id)} className="text-destructive">Archive</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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