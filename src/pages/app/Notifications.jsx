import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useCurrentUser from '@/lib/useCurrentUser';
import { base44 } from '@/api/base44Client';
import { Flame, Eye, Mail, AlertCircle, Users, CheckCheck, Inbox } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';

const TABS = ['all', 'unread', 'hot_leads', 'replies', 'system'];

const TYPE_META = {
  prospect_hot:               { icon: Flame,       bg: 'rgba(242,92,42,0.1)',  color: 'var(--accent)',    label: 'Hot Lead' },
  artifact_hot:               { icon: Flame,       bg: 'rgba(242,92,42,0.1)',  color: 'var(--accent)',    label: 'Hot Artifact' },
  artifact_viewed_first_time: { icon: Eye,         bg: 'rgba(15,16,20,0.06)', color: 'var(--ink-soft)',  label: 'First View' },
  email_replied:              { icon: Mail,        bg: 'rgba(14,92,74,0.1)',  color: 'var(--secondary)', label: 'Reply' },
  email_bounced:              { icon: AlertCircle, bg: 'rgba(234,67,53,0.1)', color: 'var(--danger)',    label: 'Bounced' },
  audience_fulfilled:         { icon: Users,       bg: 'rgba(14,92,74,0.1)',  color: 'var(--secondary)', label: 'Fulfilled' },
};

const TAB_FILTER = {
  all:        () => true,
  unread:     n => !n.read,
  hot_leads:  n => ['prospect_hot', 'artifact_hot'].includes(n.type),
  replies:    n => ['email_replied', 'email_bounced'].includes(n.type),
  system:     n => ['audience_fulfilled'].includes(n.type),
};

export default function Notifications() {
  const { clientId } = useCurrentUser();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) return;
    loadData();
  }, [clientId]);

  const loadData = async () => {
    const ns = await base44.entities.OutreachNotification.filter({ client_id: clientId }, '-created_date', 100);
    setNotifications(ns);
    setLoading(false);
  };

  const markRead = async (n) => {
    await base44.entities.OutreachNotification.update(n.id, { read: true });
    setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x));
  };

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.read);
    await Promise.all(unread.map(n => base44.entities.OutreachNotification.update(n.id, { read: true })));
    setNotifications(prev => prev.map(x => ({ ...x, read: true })));
    toast({ title: `Marked ${unread.length} as read` });
  };

  const filtered = notifications.filter(TAB_FILTER[activeTab] || (() => true));
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div style={{ maxWidth: 760 }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--ink-muted)' }}>Stay on top of your leads and activity.</div>
        {unreadCount > 0 && (
          <button onClick={markAllRead}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, background: 'var(--surface)', color: 'var(--ink-soft)', padding: '7px 16px', borderRadius: 'var(--radius-pill)', border: '1px solid var(--line)', cursor: 'pointer', transition: 'all 150ms' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--canvas)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--surface)'}>
            <CheckCheck size={14} /> Mark all read
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        {TABS.map(tab => {
          const active = activeTab === tab;
          const count = tab === 'unread' ? unreadCount : notifications.filter(TAB_FILTER[tab]).length;
          return (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{
                fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500,
                padding: '7px 14px', borderRadius: 'var(--radius-pill)',
                border: '1px solid var(--line)',
                background: active ? 'var(--ink)' : 'transparent',
                color: active ? 'var(--canvas)' : 'var(--ink-soft)',
                cursor: 'pointer', transition: 'all 150ms',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
              {tab.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())}
              {count > 0 && (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, background: active ? 'rgba(245,240,230,0.2)' : 'var(--canvas)', color: active ? 'var(--canvas)' : 'var(--ink-muted)', borderRadius: 'var(--radius-pill)', padding: '1px 6px' }}>{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
          <div style={{ width: 28, height: 28, border: '3px solid var(--line)', borderTop: '3px solid var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 24px' }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: 'var(--surface)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Inbox size={24} style={{ color: 'var(--ink-muted)', opacity: 0.5 }} />
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 20, color: 'var(--ink)' }}>Nothing here yet</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(n => {
            const meta = TYPE_META[n.type] || { icon: AlertCircle, bg: 'var(--canvas)', color: 'var(--ink-muted)', label: n.type };
            const Icon = meta.icon;
            return (
              <div key={n.id}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 14, padding: '16px 20px',
                  background: !n.read ? 'var(--surface)' : 'transparent',
                  borderRadius: 'var(--radius-lg)',
                  border: !n.read ? '1px solid var(--line)' : '1px solid transparent',
                  transition: 'all 150ms',
                }}
                onMouseEnter={e => { if (n.read) e.currentTarget.style.background = 'var(--surface)'; }}
                onMouseLeave={e => { if (n.read) e.currentTarget.style.background = 'transparent'; }}>
                {/* Icon badge */}
                <div style={{ width: 36, height: 36, borderRadius: 10, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={16} style={{ color: meta.color }} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.14em', background: meta.bg, color: meta.color, borderRadius: 'var(--radius-pill)', padding: '3px 8px' }}>{meta.label}</span>
                    {!n.read && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />}
                  </div>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink)', margin: '0 0 6px', lineHeight: 1.5 }}>{n.message}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-muted)' }}>
                      {formatDistanceToNow(new Date(n.created_date), { addSuffix: true })}
                    </span>
                    {n.prospect_id && (
                      <Link to={`/app/prospects/${n.prospect_id}`}
                        style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--accent)', textDecoration: 'none', borderBottom: '1px solid rgba(242,92,42,0.4)' }}>
                        View prospect →
                      </Link>
                    )}
                    {n.artifact_id && (
                      <Link to={`/app/artifacts/${n.artifact_id}/edit`}
                        style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--accent)', textDecoration: 'none', borderBottom: '1px solid rgba(242,92,42,0.4)' }}>
                        View artifact →
                      </Link>
                    )}
                  </div>
                </div>

                {!n.read && (
                  <button onClick={() => markRead(n)}
                    style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500, background: 'var(--canvas)', color: 'var(--ink-muted)', padding: '5px 12px', borderRadius: 'var(--radius-pill)', border: '1px solid var(--line)', cursor: 'pointer', flexShrink: 0, transition: 'all 150ms' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--ink)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-muted)'}>
                    Mark read
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}