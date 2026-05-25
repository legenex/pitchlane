import React, { useState, useEffect } from 'react';
import useCurrentUser from '@/lib/useCurrentUser';
import { base44 } from '@/api/base44Client';
import EmailSignaturesTab from '@/components/settings/EmailSignaturesTab';
import NotificationPreferencesTab from '@/components/settings/NotificationPreferencesTab';
import { Mail, Users, Trash2, ArrowRight, Check } from 'lucide-react';

const TABS = [
  { id: 'account', label: 'Account' },
  { id: 'plan', label: 'Plan' },
  { id: 'team', label: 'Team' },
  { id: 'emails', label: 'Email Signatures' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'danger', label: 'Danger' },
];

function Section({ title, children }) {
  return (
    <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--line)', padding: '28px 32px', marginBottom: 16 }}>
      {title && (
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--ink)', marginBottom: 20 }}>
          {title}
        </div>
      )}
      {children}
    </div>
  );
}

function FieldRow({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--ink-muted)', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

function StyledInput({ value, disabled, placeholder }) {
  return (
    <input
      value={value || ''}
      disabled={disabled}
      placeholder={placeholder}
      readOnly={disabled}
      style={{ width: '100%', fontFamily: 'var(--font-body)', fontSize: 14, background: disabled ? 'var(--canvas)' : 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', padding: '10px 14px', color: disabled ? 'var(--ink-muted)' : 'var(--ink)', outline: 'none', boxSizing: 'border-box', cursor: disabled ? 'default' : 'text' }}
    />
  );
}

export default function Settings() {
  const { user, clientId } = useCurrentUser();
  const [client, setClient] = useState(null);
  const [plan, setPlan] = useState(null);
  const [activeTab, setActiveTab] = useState('account');

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
  };

  return (
    <div style={{ maxWidth: 760, display: 'flex', gap: 24, alignItems: 'flex-start' }} className="settings-layout">
      {/* Vertical tab nav */}
      <div style={{ width: 200, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 4 }} className="settings-nav">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{
              fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: activeTab === t.id ? 600 : 400,
              background: activeTab === t.id ? 'var(--ink)' : 'transparent',
              color: activeTab === t.id ? 'var(--canvas)' : 'var(--ink-soft)',
              padding: '9px 16px', borderRadius: 'var(--radius-md)',
              border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'all 150ms',
            }}
            onMouseEnter={e => { if (activeTab !== t.id) e.currentTarget.style.background = 'var(--canvas)'; }}
            onMouseLeave={e => { if (activeTab !== t.id) e.currentTarget.style.background = 'transparent'; }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Pane */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {activeTab === 'account' && (
          <Section title={<>Account <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>information</em></>}>
            <FieldRow label="Full Name"><StyledInput value={user?.full_name} disabled /></FieldRow>
            <FieldRow label="Email"><StyledInput value={user?.email} disabled /></FieldRow>
            <FieldRow label="Gmail Integration">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--canvas)', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', padding: '12px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Mail size={15} style={{ color: 'var(--ink-muted)' }} />
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink-soft)' }}>Gmail not connected</span>
                </div>
                <button style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, background: 'var(--ink)', color: 'var(--canvas)', padding: '6px 14px', borderRadius: 'var(--radius-pill)', border: 'none', cursor: 'pointer' }}>Connect</button>
              </div>
            </FieldRow>
          </Section>
        )}

        {activeTab === 'plan' && (
          <Section title={<>Current <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>plan</em></>}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, color: 'var(--ink)', marginBottom: 4 }}>{plan?.name || 'Trial'}</div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink-muted)' }}>${plan?.monthly_price || 0}/month</div>
              </div>
              {plan?.monthly_price === 0 && (
                <button style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, background: 'var(--accent)', color: '#fff', padding: '9px 20px', borderRadius: 'var(--radius-pill)', border: 'none', cursor: 'pointer', boxShadow: 'var(--shadow-accent)' }}>
                  Upgrade <ArrowRight size={13} />
                </button>
              )}
            </div>
            <div style={{ borderTop: '1px solid var(--line-soft)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(plan?.features_json || []).map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Check size={13} style={{ color: 'var(--secondary)', flexShrink: 0 }} />
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink-soft)' }}>{f}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {activeTab === 'team' && (
          <Section title={<>Team <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>members</em></>}>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--ink-muted)', marginBottom: 16 }}>Max {plan?.max_users || 1} members on {plan?.name || 'Trial'}</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--canvas)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 16 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>{user?.full_name}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--ink-muted)', marginTop: 2 }}>Owner</div>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.14em', background: 'var(--surface)', color: 'var(--ink-muted)', borderRadius: 'var(--radius-pill)', padding: '4px 10px', border: '1px solid var(--line)' }}>You</span>
            </div>
            <button style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500, background: 'transparent', color: 'var(--ink-soft)', padding: '10px 0', borderRadius: 'var(--radius-md)', border: '1px solid var(--line)', cursor: 'pointer', transition: 'all 150ms' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--canvas)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <Users size={14} /> Invite Team Member
            </button>
          </Section>
        )}

        {activeTab === 'emails' && (
          <Section title={<>Email <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>signatures</em></>}>
            <EmailSignaturesTab userId={user?.id} />
          </Section>
        )}

        {activeTab === 'notifications' && (
          <Section title={<>Notification <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>preferences</em></>}>
            <NotificationPreferencesTab userId={user?.id} />
          </Section>
        )}

        {activeTab === 'danger' && (
          <div style={{ background: 'rgba(234,67,53,0.04)', borderRadius: 'var(--radius-xl)', border: '1px solid rgba(234,67,53,0.2)', padding: '28px 32px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--danger)', marginBottom: 16 }}>Danger <em style={{ fontStyle: 'italic' }}>zone</em></div>
            <button style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, background: 'var(--danger)', color: '#fff', padding: '11px 0', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer' }}>
              <Trash2 size={14} /> Archive Workspace
            </button>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--ink-muted)', marginTop: 10, marginBottom: 0 }}>This action cannot be undone. Your workspace and all artifacts will be archived.</p>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 640px) {
          .settings-layout { flex-direction: column !important; }
          .settings-nav { width: 100% !important; flex-direction: row !important; flex-wrap: wrap !important; }
        }
      `}</style>
    </div>
  );
}