import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical, Eye, LogIn, ZapOff, Search } from 'lucide-react';

const STATUS_STYLE = {
  active:    { bg: 'rgba(14,92,74,0.1)',  color: 'var(--secondary)' },
  inactive:  { bg: 'var(--canvas)',       color: 'var(--ink-muted)' },
  suspended: { bg: 'rgba(234,67,53,0.1)', color: 'var(--danger)' },
};

export default function AdminClients() {
  const [clients, setClients] = useState([]);
  const [plans, setPlans] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [clientsData, plansData] = await Promise.all([
      base44.asServiceRole.entities.Client.list(),
      base44.asServiceRole.entities.Plan.list(),
    ]);
    setClients(clientsData.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
    setPlans(plansData);
    setLoading(false);
  };

  const getPlan = (planId) => plans.find(p => p.id === planId);

  const filteredClients = clients.filter(c =>
    (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.slug || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleImpersonate = (clientSlug) => {
    window.open(`/app?impersonate=${clientSlug}`, '_blank');
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
      <div style={{ width: 28, height: 28, border: '3px solid var(--line)', borderTop: '3px solid var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ maxWidth: 1000 }}>
      {/* Search */}
      <div style={{ position: 'relative', maxWidth: 360, marginBottom: 24 }}>
        <Search size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-muted)', pointerEvents: 'none' }} />
        <input
          placeholder="Search clients…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', fontFamily: 'var(--font-body)', fontSize: 14, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius-pill)', padding: '9px 16px 9px 36px', color: 'var(--ink)', outline: 'none', boxSizing: 'border-box' }}
          onFocus={e => e.target.style.borderColor = 'rgba(242,92,42,0.4)'}
          onBlur={e => e.target.style.borderColor = 'var(--line)'}
        />
      </div>

      {/* Table */}
      <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--line)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--line-soft)' }}>
                {['Client', 'Plan', 'Status', 'Created', ''].map((h, i) => (
                  <th key={i} style={{ padding: '12px 20px', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.16em', color: 'var(--ink-muted)', fontWeight: 400, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredClients.map(client => {
                const plan = getPlan(client.plan_id);
                const st = STATUS_STYLE[client.status] || STATUS_STYLE.inactive;
                return (
                  <tr key={client.id}
                    style={{ borderBottom: '1px solid var(--line-soft)', transition: 'background 100ms' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--canvas)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 8, background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', color: '#fff', fontSize: 15 }}>{(client.name || '?')[0]}</span>
                        </div>
                        <div>
                          <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>{client.name}</div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-muted)' }}>{client.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      {plan ? (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', background: 'rgba(242,92,42,0.08)', color: 'var(--accent)', borderRadius: 'var(--radius-pill)', padding: '4px 10px' }}>{plan.name}</span>
                      ) : (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-muted)' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', background: st.bg, color: st.color, borderRadius: 'var(--radius-pill)', padding: '4px 10px' }}>{client.status}</span>
                    </td>
                    <td style={{ padding: '14px 20px', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(client.created_date).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8, color: 'var(--ink-muted)' }}>
                            <MoreVertical size={15} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/admin/clients/${client.slug}/artifacts`} style={{ display: 'flex', alignItems: 'center' }}>
                              <Eye size={13} style={{ marginRight: 8 }} /> View Artifacts
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleImpersonate(client.slug)} style={{ display: 'flex', alignItems: 'center' }}>
                            <LogIn size={13} style={{ marginRight: 8 }} /> Impersonate
                          </DropdownMenuItem>
                          {client.status === 'active' && (
                            <DropdownMenuItem style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center' }}>
                              <ZapOff size={13} style={{ marginRight: 8 }} /> Suspend
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
              {filteredClients.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '40px', textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink-muted)' }}>No clients found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}