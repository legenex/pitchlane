import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Users, FileText, TrendingUp, DollarSign } from 'lucide-react';

function KPITile({ icon: Icon, label, value, sublabel, iconColor }) {
  return (
    <div className="card-lift" style={{ background: 'var(--surface)', borderRadius: 'var(--radius-xl)', padding: '24px 28px', border: '1px solid var(--line)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--canvas)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={16} style={{ color: iconColor || 'var(--accent)' }} />
        </div>
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--ink-muted)', marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 44, color: 'var(--ink)', lineHeight: 0.95, marginBottom: 6 }}>{value}</div>
      {sublabel && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--ink-muted)' }}>{sublabel}</div>}
    </div>
  );
}

export default function AdminOverview() {
  const [stats, setStats] = useState({ clients: 0, active: 0, trial: 0, artifacts: 0, mrr: 0 });
  const [recentSignups, setRecentSignups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [clients, plans, artifacts] = await Promise.all([
      base44.entities.Client.list(),
      base44.entities.Plan.list(),
      base44.entities.Artifact.list(),
    ]);

    const active = clients.filter(c => c.status === 'active').length;
    const trial = clients.filter(c => c.plan_id === plans.find(p => p.name === 'Trial')?.id).length;
    const mrr = clients.reduce((sum, c) => {
      const plan = plans.find(p => p.id === c.plan_id);
      return sum + (plan?.monthly_price || 0);
    }, 0);

    setStats({ clients: clients.length, active, trial, artifacts: artifacts.length, mrr });
    setRecentSignups(clients.slice(-5).reverse());
    setLoading(false);
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
      <div style={{ width: 28, height: 28, border: '3px solid var(--line)', borderTop: '3px solid var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ maxWidth: 1100 }}>
      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }} className="admin-kpi-grid">
        <KPITile icon={Users} label="Total Clients" value={stats.clients} iconColor="var(--ink-soft)" />
        <KPITile icon={Users} label="Active Clients" value={stats.active} sublabel={`${stats.trial} on trial`} iconColor="var(--secondary)" />
        <KPITile icon={DollarSign} label="MRR" value={`$${(stats.mrr / 100).toLocaleString()}`} iconColor="var(--secondary)" />
        <KPITile icon={FileText} label="Total Artifacts" value={stats.artifacts} iconColor="var(--accent)" />
      </div>

      {/* Recent signups */}
      <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--line)', padding: '24px 28px' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--ink)', marginBottom: 20 }}>
          Recent <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>signups</em>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {recentSignups.length === 0 && (
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink-muted)', padding: '20px 0', textAlign: 'center' }}>No signups yet.</div>
          )}
          {recentSignups.map(client => (
            <div key={client.id}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--canvas)', borderRadius: 'var(--radius-md)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--line-soft)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--canvas)'}>
              <div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>{client.name}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--ink-muted)', marginTop: 2 }}>
                  {new Date(client.created_date).toLocaleDateString()}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em',
                  background: client.status === 'active' ? 'rgba(14,92,74,0.1)' : 'var(--line)',
                  color: client.status === 'active' ? 'var(--secondary)' : 'var(--ink-muted)',
                  borderRadius: 'var(--radius-pill)', padding: '4px 10px'
                }}>{client.status}</span>
                <Link to={`/admin/clients/${client.slug}/artifacts`} style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--accent)', textDecoration: 'none', borderBottom: '1px solid rgba(242,92,42,0.4)' }}>
                  View →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 900px) { .admin-kpi-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 480px) { .admin-kpi-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}