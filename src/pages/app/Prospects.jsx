import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import useCurrentUser from '@/lib/useCurrentUser';
import { Plus, Upload, Search, Linkedin, Mail, Eye, MoreHorizontal, Sparkles, Inbox } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';

const STATUS_TABS = ['all', 'new', 'contacted', 'engaged', 'hot', 'qualified', 'archived'];

const STATUS_STYLE = {
  new:          { bg: 'rgba(15,16,20,0.06)',    color: 'var(--ink-soft)' },
  contacted:    { bg: 'rgba(244,180,0,0.12)',   color: '#9A6800' },
  engaged:      { bg: 'rgba(14,92,74,0.1)',     color: 'var(--secondary)' },
  hot:          { bg: 'rgba(242,92,42,0.12)',   color: 'var(--accent)' },
  qualified:    { bg: 'rgba(14,92,74,0.15)',    color: 'var(--secondary)' },
  not_interested:{ bg: 'var(--canvas)',         color: 'var(--ink-muted)' },
  bounced:      { bg: 'rgba(234,67,53,0.1)',    color: 'var(--danger)' },
  archived:     { bg: 'var(--canvas)',          color: 'var(--ink-muted)' },
};

export default function Prospects() {
  const { clientId } = useCurrentUser();
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

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
      <div style={{ width: 28, height: 28, border: '3px solid var(--line)', borderTop: '3px solid var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 28 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--ink-muted)', marginBottom: 4 }}>{prospects.length} total</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to="/app/prospects/import" style={{ textDecoration: 'none' }}>
            <button style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, background: 'var(--surface)', color: 'var(--ink-soft)', padding: '8px 16px', borderRadius: 'var(--radius-pill)', border: '1px solid var(--line)', cursor: 'pointer', transition: 'all 150ms' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--canvas)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--surface)'}>
              <Upload size={13} /> Import CSV
            </button>
          </Link>
          <Link to="/app/prospects/request" style={{ textDecoration: 'none' }}>
            <button style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, background: 'var(--accent)', color: '#fff', padding: '8px 18px', borderRadius: 'var(--radius-pill)', border: 'none', cursor: 'pointer', boxShadow: 'var(--shadow-accent)', transition: 'transform 150ms' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
              <Plus size={13} /> Request Audience
            </button>
          </Link>
        </div>
      </div>

      {/* Status Tabs */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        {STATUS_TABS.map(tab => {
          const active = activeTab === tab;
          const count = tabCount(tab);
          return (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{
                fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500,
                padding: '6px 14px', borderRadius: 'var(--radius-pill)',
                border: '1px solid var(--line)',
                background: active ? 'var(--ink)' : 'transparent',
                color: active ? 'var(--canvas)' : 'var(--ink-soft)',
                cursor: 'pointer', transition: 'all 150ms', display: 'flex', alignItems: 'center', gap: 6,
              }}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, background: active ? 'rgba(245,240,230,0.2)' : 'var(--canvas)', color: active ? 'var(--canvas)' : 'var(--ink-muted)', borderRadius: 'var(--radius-pill)', padding: '1px 6px' }}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: 360, marginBottom: 20 }}>
        <Search size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-muted)', pointerEvents: 'none' }} />
        <input
          placeholder="Search name, email, company…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', fontFamily: 'var(--font-body)', fontSize: 14, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius-pill)', padding: '9px 16px 9px 36px', color: 'var(--ink)', outline: 'none', boxSizing: 'border-box' }}
          onFocus={e => e.target.style.borderColor = 'rgba(242,92,42,0.4)'}
          onBlur={e => e.target.style.borderColor = 'var(--line)'}
        />
      </div>

      {/* Empty state */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 24px', background: 'var(--surface)', borderRadius: 'var(--radius-xl)', border: '1px dashed var(--line)' }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: 'var(--canvas)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Inbox size={24} style={{ color: 'var(--ink-muted)' }} />
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 22, color: 'var(--ink)', marginBottom: 8 }}>No prospects yet</div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink-soft)', maxWidth: 360, margin: '0 auto 24px' }}>Request your first audience or import a CSV to get started.</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/app/prospects/request" style={{ textDecoration: 'none' }}>
              <button style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, background: 'var(--accent)', color: '#fff', padding: '10px 24px', borderRadius: 'var(--radius-pill)', border: 'none', cursor: 'pointer', boxShadow: 'var(--shadow-accent)' }}>Request Audience</button>
            </Link>
            <Link to="/app/prospects/import" style={{ textDecoration: 'none' }}>
              <button style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500, background: 'transparent', color: 'var(--ink)', padding: '10px 24px', borderRadius: 'var(--radius-pill)', border: '1px solid var(--line)', cursor: 'pointer' }}>Import CSV</button>
            </Link>
          </div>
        </div>
      ) : (
        <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--line)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--line-soft)' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', width: 40 }}>
                    <input type="checkbox" onChange={e => setSelectedIds(e.target.checked ? new Set(filtered.map(p => p.id)) : new Set())} />
                  </th>
                  {['Name', 'Company', 'Location', 'Intent', 'Status', 'Views', ''].map((h, i) => (
                    <th key={i} style={{ padding: '10px 16px', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.16em', color: 'var(--ink-muted)', fontWeight: 400, whiteSpace: 'nowrap' }}
                      className={h === 'Company' ? 'hide-sm' : h === 'Location' ? 'hide-md' : h === 'Intent' ? 'hide-lg' : h === 'Views' ? 'hide-md' : ''}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const isHot = p.status === 'hot';
                  const st = STATUS_STYLE[p.status] || STATUS_STYLE.new;
                  return (
                    <tr key={p.id}
                      style={{ borderBottom: '1px solid var(--line-soft)', transition: 'background 100ms', borderLeft: isHot ? '3px solid var(--accent)' : '3px solid transparent' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--canvas)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '12px 16px' }}><input type="checkbox" checked={selectedIds.has(p.id)} onChange={() => toggleSelect(p.id)} /></td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <Link to={`/app/prospects/${p.id}`} style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, color: 'var(--ink)', textDecoration: 'none' }}
                            onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                            onMouseLeave={e => e.currentTarget.style.color = 'var(--ink)'}>
                            {p.full_name || p.email}
                          </Link>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-muted)' }}>{p.email}</span>
                        </div>
                        {p.linkedin_url && (
                          <a href={p.linkedin_url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', marginTop: 4 }}>
                            <Linkedin size={12} style={{ color: '#0A66C2' }} />
                          </a>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px' }} className="hide-sm">
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--ink)' }}>{p.company || '—'}</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-muted)' }}>{p.title}</div>
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--ink-muted)', whiteSpace: 'nowrap' }} className="hide-md">
                        {[p.location_city, p.location_state].filter(Boolean).join(', ') || '—'}
                      </td>
                      <td style={{ padding: '12px 16px' }} className="hide-lg">
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {(p.intent_signals || []).slice(0, 2).map((s, i) => (
                            <span key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', background: 'rgba(242,92,42,0.08)', color: 'var(--accent)', borderRadius: 'var(--radius-pill)', padding: '3px 8px' }}>{s}</span>
                          ))}
                          {(p.intent_signals || []).length > 2 && (
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-muted)' }}>+{(p.intent_signals || []).length - 2}</span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', background: st.bg, color: st.color, borderRadius: 'var(--radius-pill)', padding: '4px 10px', whiteSpace: 'nowrap' }}>
                          {p.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }} className="hide-md">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-muted)' }}>
                          <Eye size={12} />
                          <span>{p.total_artifact_views || 0}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8, color: 'var(--ink-muted)' }}>
                              <MoreHorizontal size={15} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to={`/app/prospects/${p.id}`}>View Detail</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link to={`/app/artifacts/new?prospect_id=${p.id}`} style={{ display: 'flex', alignItems: 'center' }}>
                                <Sparkles size={13} style={{ marginRight: 8 }} /> Generate Artifact
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(p.id, 'hot')}>Mark Hot</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(p.id, 'qualified')}>Mark Qualified</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleArchive(p.id)} style={{ color: 'var(--danger)' }}>Archive</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 480px) { .hide-sm { display: none !important; } }
        @media (max-width: 768px) { .hide-md { display: none !important; } }
        @media (max-width: 1024px) { .hide-lg { display: none !important; } }
      `}</style>
    </div>
  );
}