import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Settings, LogOut, FileText, Users, CreditCard, Bell, Inbox, Sparkles, ChevronDown, X, Menu } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import useCurrentUser from '@/lib/useCurrentUser';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/app', icon: LayoutDashboard, exact: true },
  { label: 'Prospects', path: '/app/prospects', icon: Users },
  { label: 'Artifacts', path: '/app/artifacts', icon: FileText },
  { label: 'Inbox', path: '/app/notifications', icon: Inbox, badge: true },
  { label: 'Knowledge', path: '/app/knowledge', icon: Sparkles },
  { label: 'Billing', path: '/app/billing', icon: CreditCard },
  { label: 'Settings', path: '/app/settings', icon: Settings },
];

function PitchlaneLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--accent)' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', color: '#fff', fontSize: 18, lineHeight: 1 }}>P</span>
      </div>
      <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--canvas)', lineHeight: 1 }}>Pitchlane</span>
    </div>
  );
}

function Sidebar({ unreadCount, onClose }) {
  const location = useLocation();
  const { user } = useCurrentUser();
  const firstName = user?.full_name?.split(' ')[0] || 'you';

  const isActive = (item) => {
    if (item.exact) return location.pathname === item.path;
    return location.pathname === item.path || location.pathname.startsWith(item.path + '/');
  };

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--deep)', width: 260 }}>
      {/* Logo */}
      <div className="flex items-center justify-between px-6 pt-6 pb-4">
        <PitchlaneLogo />
        {onClose && (
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--canvas)', opacity: 0.6, padding: 4 }}>
            <X size={18} />
          </button>
        )}
      </div>

      {/* Client switcher */}
      <div className="mx-4 mb-6">
        <div style={{ background: 'var(--deep-soft)', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', color: '#fff', fontSize: 14 }}>{firstName[0]}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, color: 'var(--canvas)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.full_name || 'My Workspace'}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'rgba(245,240,230,0.4)', marginTop: 1 }}>Workspace</div>
          </div>
          <ChevronDown size={14} style={{ color: 'rgba(245,240,230,0.4)', flexShrink: 0 }} />
        </div>
      </div>

      {/* Section label */}
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.22em', color: 'rgba(245,240,230,0.3)', padding: '0 22px', marginBottom: 8 }}>
        Workspace
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 overflow-auto" style={{ overflowX: 'hidden' }}>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          const hasBadge = item.badge && unreadCount > 0;
          return (
            <Link key={item.path} to={item.path}
              className="flex items-center gap-3 mb-1 relative"
              style={{
                padding: '10px 12px', borderRadius: 10, textDecoration: 'none',
                background: active ? 'var(--accent)' : 'transparent',
                transition: 'background 150ms',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--deep-soft)'; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
              <Icon size={16} style={{ color: active ? '#fff' : 'rgba(245,240,230,0.65)', flexShrink: 0 }} />
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: active ? 600 : 400, color: active ? '#fff' : 'rgba(245,240,230,0.75)', flex: 1 }}>{item.label}</span>
              {hasBadge && (
                <span style={{ background: 'var(--accent)', color: '#fff', fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, minWidth: 18, height: 18, borderRadius: 'var(--radius-pill)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>
                  {unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Upgrade card */}
      <div className="m-4 mt-2">
        <div style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))', borderRadius: 16, padding: '20px 18px' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 16, color: '#fff', marginBottom: 6, lineHeight: 1.3 }}>Going strong this month.</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.16em', color: 'rgba(255,255,255,0.7)', marginBottom: 16 }}>Renews in 14 days</div>
          <Link to="/app/billing"
            style={{ display: 'block', textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, background: '#fff', color: 'var(--accent)', padding: '8px 0', borderRadius: 'var(--radius-pill)', textDecoration: 'none' }}>
            Upgrade plan
          </Link>
        </div>
      </div>

      {/* Logout */}
      <div style={{ borderTop: '1px solid var(--line-dark)', padding: '12px 8px 16px' }}>
        <button onClick={() => base44.auth.logout()}
          className="flex items-center gap-3 w-full"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '10px 12px', borderRadius: 10, transition: 'background 150ms' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--deep-soft)'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}>
          <LogOut size={16} style={{ color: 'rgba(245,240,230,0.45)' }} />
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(245,240,230,0.55)' }}>Log out</span>
        </button>
      </div>
    </div>
  );
}

export default function ClientLayout() {
  const { user, clientId } = useCurrentUser();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!clientId) return;
    const loadUnread = async () => {
      const ns = await base44.entities.OutreachNotification.filter({ client_id: clientId });
      setUnreadCount(ns.filter(n => !n.read).length);
    };
    loadUnread();
    const interval = setInterval(loadUnread, 30000);
    return () => clearInterval(interval);
  }, [clientId]);

  // Close drawer on route change
  useEffect(() => { setDrawerOpen(false); }, [location.pathname]);

  const firstName = user?.full_name?.split(' ')[0] || 'there';

  const pageTitle = () => {
    const p = location.pathname;
    if (p === '/app') return { pre: 'Welcome back,', italic: firstName };
    if (p.startsWith('/app/prospects')) return { pre: 'Your', italic: 'prospects' };
    if (p.startsWith('/app/artifacts')) return { pre: 'Recent', italic: 'artifacts' };
    if (p.startsWith('/app/knowledge')) return { pre: 'Your', italic: 'knowledge' };
    if (p.startsWith('/app/billing')) return { pre: 'Billing &', italic: 'usage' };
    if (p.startsWith('/app/settings')) return { pre: 'Account', italic: 'settings' };
    if (p.startsWith('/app/notifications')) return { pre: 'Your', italic: 'inbox' };
    return { pre: 'Welcome back,', italic: firstName };
  };
  const title = pageTitle();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--canvas)' }}>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex flex-col flex-shrink-0" style={{ width: 260, position: 'sticky', top: 0, height: '100vh', overflowY: 'auto' }}>
        <Sidebar unreadCount={unreadCount} />
      </div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,16,20,0.5)', backdropFilter: 'blur(4px)' }} onClick={() => setDrawerOpen(false)} />
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 260, overflowY: 'auto', boxShadow: 'var(--shadow-lg)' }}>
            <Sidebar unreadCount={unreadCount} onClose={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Top header */}
        <div style={{ padding: '28px 40px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24 }} className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Hamburger for mobile */}
            <button className="lg:hidden" onClick={() => setDrawerOpen(true)}
              style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
              <Menu size={18} style={{ color: 'var(--ink-soft)' }} />
            </button>
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 3vw, 40px)', fontWeight: 400, color: 'var(--ink)', margin: 0, lineHeight: 1.1 }}>
                {title.pre} <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>{title.italic}</em>
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Search bar */}
            <div className="hidden md:flex items-center gap-2" style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius-pill)', padding: '0 16px', height: 40, minWidth: 240 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ink-muted)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--ink-muted)', flex: 1 }}>Search...</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-muted)', background: 'var(--canvas)', borderRadius: 4, padding: '2px 6px' }}>⌘K</span>
            </div>
            {/* Bell */}
            <Link to="/app/notifications">
              <button style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--surface)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}>
                <Bell size={16} style={{ color: 'var(--ink-soft)' }} />
                {unreadCount > 0 && (
                  <span style={{ position: 'absolute', top: 7, right: 7, width: 7, height: 7, background: 'var(--accent)', borderRadius: '50%' }} />
                )}
              </button>
            </Link>
          </div>
        </div>

        <main style={{ flex: 1, padding: '32px 40px 60px', minWidth: 0 }} className="main-content">
          <Outlet />
        </main>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .page-header { padding: 20px 20px 0 !important; }
          .main-content { padding: 24px 20px 48px !important; }
        }
      `}</style>
    </div>
  );
}