import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useCurrentUser from '@/lib/useCurrentUser';
import { base44 } from '@/api/base44Client';
import { FileText, TrendingUp, Mail, CreditCard, Sparkles, ArrowRight } from 'lucide-react';

function KPICard({ label, value, subtitle, trend, trendColor, icon: Icon, iconColor }) {
  return (
    <div className="card-lift" style={{ background: 'var(--surface)', borderRadius: 16, padding: 24, border: '1px solid var(--line)', cursor: 'default' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--canvas)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={16} style={{ color: iconColor || 'var(--accent)' }} />
        </div>
        {trend && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.16em', background: 'var(--canvas)', color: trendColor || 'var(--secondary)', borderRadius: 'var(--radius-pill)', padding: '3px 8px' }}>
            {trend}
          </span>
        )}
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--ink-muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 40, color: 'var(--ink)', lineHeight: 1 }}>{value}</span>
        {subtitle && <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--ink-muted)' }}>{subtitle}</span>}
      </div>
    </div>
  );
}

function QuickActionCard({ to, icon: Icon, title, description }) {
  return (
    <Link to={to} style={{ textDecoration: 'none', display: 'block' }}>
      <div className="card-lift group" style={{ background: 'var(--surface)', borderRadius: 16, padding: 24, border: '1px solid var(--line)', height: '100%', cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--canvas)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={18} style={{ color: 'var(--accent)' }} />
          </div>
          <ArrowRight size={16} style={{ color: 'var(--ink-muted)', marginTop: 4 }} />
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--ink)', marginBottom: 6 }}>{title}</div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.55 }}>{description}</div>
      </div>
    </Link>
  );
}

export default function Dashboard() {
  const { user, clientId } = useCurrentUser();
  const [client, setClient] = useState(null);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) return;
    loadData();
  }, [clientId]);

  const loadData = async () => {
    const clients = await base44.entities.Client.filter({ id: clientId });
    if (clients.length) {
      setClient(clients[0]);
      const plans = await base44.entities.Plan.filter({ id: clients[0].plan_id });
      if (plans.length) setPlan(plans[0]);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
        <div style={{ width: 32, height: 32, border: '3px solid var(--line)', borderTop: '3px solid var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const artifactsUsed = client?.artifacts_used_this_period || 0;
  const artifactQuota = plan?.artifact_quota || 0;
  const creditsBalance = client?.credits_balance || 0;

  return (
    <div style={{ maxWidth: 1100 }}>
      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }} className="kpi-grid">
        <KPICard
          label="Artifacts this month"
          value={artifactsUsed}
          subtitle={artifactQuota ? `/ ${artifactQuota} quota` : ''}
          trend="+0 today"
          trendColor="var(--secondary)"
          icon={FileText}
          iconColor="var(--accent)"
        />
        <KPICard
          label="Hot leads"
          value="0"
          subtitle="last 7 days"
          trend="+0 today"
          trendColor="var(--secondary)"
          icon={TrendingUp}
          iconColor="var(--secondary)"
        />
        <KPICard
          label="Reply rate"
          value="—"
          subtitle="across 0 sends"
          icon={Mail}
          iconColor="var(--ink-soft)"
        />
        <KPICard
          label="Credits remaining"
          value={creditsBalance.toLocaleString()}
          subtitle="available"
          trend={plan ? `Renews 30d` : 'Trial'}
          trendColor="var(--ink-muted)"
          icon={CreditCard}
          iconColor="var(--ink-soft)"
        />
      </div>

      {/* Plan card */}
      {plan && (
        <div style={{ background: 'var(--surface)', borderRadius: 16, padding: '20px 24px', border: '1px solid var(--line)', marginBottom: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--ink-muted)', marginBottom: 4 }}>Current plan</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: 'var(--ink)' }}>
              {plan.name} <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>plan</em>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.16em', color: 'var(--ink-muted)' }}>Artifacts used</div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>{artifactsUsed} / {artifactQuota}</div>
            </div>
            <div style={{ width: 80, height: 6, background: 'var(--canvas)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${artifactQuota ? Math.min(100, (artifactsUsed / artifactQuota) * 100) : 0}%`, background: 'var(--accent)', borderRadius: 3, transition: 'width 600ms ease' }} />
            </div>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--ink-muted)', marginBottom: 16 }}>Quick actions</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }} className="actions-grid">
          <QuickActionCard
            to="/app/artifacts/new"
            icon={Sparkles}
            title="Generate a new artifact"
            description="Create a hyper-personalized pitch for a prospect using your brand profile and AI."
          />
          <QuickActionCard
            to="/app/prospects/request"
            icon={TrendingUp}
            title="Request an audience"
            description="Specify niche, geography, and intent signals. We deliver enriched prospects."
          />
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) { .kpi-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 500px) { .kpi-grid { grid-template-columns: 1fr !important; } .actions-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}