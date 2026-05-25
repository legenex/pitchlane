import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, CreditCard, Settings, LogOut, ShieldCheck, BarChart2, Inbox, Search, Mail, Menu, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { label: 'Overview', path: '/admin', icon: LayoutDashboard, exact: true },
  { label: 'Clients', path: '/admin/clients', icon: Users },
  { label: 'Audience Queue', path: '/admin/audience-requests', icon: Inbox },
  { label: 'Prospects', path: '/admin/prospects', icon: Search },
  { label: 'Email Health', path: '/admin/email-deliverability', icon: Mail },
  { label: 'Billing', path: '/admin/billing', icon: CreditCard },
  { label: 'Audit Log', path: '/admin/audit-log', icon: ShieldCheck },
  { label: 'Plans', path: '/admin/plans', icon: CreditCard },
  { label: 'Analytics', path: '/admin/analytics', icon: BarChart2 },
  { label: 'Settings', path: '/admin/settings', icon: Settings },
];

function AdminSidebar({ onClose }) {
  const location = useLocation();

  const isActive = (item) => {
    if (item.exact) return location.pathname === item.path;
    return location.pathname === item.path || location.pathname.startsWith(item.path + '/');
  };

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--deep)', width: 260 }}>
      {/* Logo */}
      <div className="flex items-center justify-between px-6 pt-6 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--accent)' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', color: '#fff', fontSize: 18, lineHeight: 1 }}>P</span>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--canvas)', lineHeight: 1 }}>Pitchlane</span>
        </div>
        {onClose && (
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--canvas)', opacity: 0.6, padding: 4 }}>
            <X size={18} />
          </button>
        )}
      </div>

      {/* Admin badge */}
      <div className="mx-4 mb-6">
        <div style={{ background: 'var(--deep-soft)', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(242,92,42,0.15)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={16} style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, color: 'var(--canvas)' }}>Super Admin</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'rgba(245,240,230,0.4)', marginTop: 1 }}>All Clients</div>
          </div>
        </div>
      </div>

      {/* Section label */}
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.22em', color: 'rgba(245,240,230,0.3)', padding: '0 22px', marginBottom: 8 }}>
        Administration
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 overflow-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          return (
            <Link key={item.path} to={item.path}
              className="flex items-center gap-3 mb-1"
              style={{ padding: '10px 12px', borderRadius: 10, textDecoration: 'none', background: active ? 'var(--accent)' : 'transparent', transition: 'background 150ms' }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--deep-soft)'; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
              <Icon size={16} style={{ color: active ? '#fff' : 'rgba(245,240,230,0.65)', flexShrink: 0 }} />
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: active ? 600 : 400, color: active ? '#fff' : 'rgba(245,240,230,0.75)' }}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

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

export default function AdminLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--canvas)' }}>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex flex-col flex-shrink-0" style={{ width: 260, position: 'sticky', top: 0, height: '100vh', overflowY: 'auto' }}>
        <AdminSidebar />
      </div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,16,20,0.5)', backdropFilter: 'blur(4px)' }} onClick={() => setDrawerOpen(false)} />
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 260, overflowY: 'auto', boxShadow: 'var(--shadow-lg)' }}>
            <AdminSidebar onClose={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}

      {/* Main */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Top bar */}
        <div style={{ padding: '28px 40px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div className="flex items-center gap-3">
            <button className="lg:hidden" onClick={() => setDrawerOpen(true)}
              style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Menu size={18} style={{ color: 'var(--ink-soft)' }} />
            </button>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--ink-muted)', marginBottom: 4 }}>Admin Panel</div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 400, color: 'var(--ink)', margin: 0, lineHeight: 1.1 }}>
                Platform <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>overview</em>
              </h1>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(242,92,42,0.1)', borderRadius: 'var(--radius-pill)', padding: '6px 14px' }}>
            <ShieldCheck size={14} style={{ color: 'var(--accent)' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.16em', color: 'var(--accent)' }}>Admin</span>
          </div>
        </div>

        <main style={{ flex: 1, padding: '32px 40px 60px', minWidth: 0 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}