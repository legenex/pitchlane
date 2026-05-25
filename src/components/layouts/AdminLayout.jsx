import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, CreditCard, Settings, LogOut, ShieldCheck, BarChart2, Inbox, Search, Mail } from 'lucide-react';
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

export default function AdminLayout() {
  const location = useLocation();

  const isActive = (item) => {
    if (item.exact) return location.pathname === item.path;
    return location.pathname === item.path || location.pathname.startsWith(item.path + '/');
  };

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="w-56 shrink-0 border-r border-border flex flex-col">
        <div className="h-16 flex items-center px-5 border-b border-border gap-2">
          <ShieldCheck className="w-5 h-5 text-primary" />
          <span className="font-bold text-lg tracking-tight">Admin</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive(item)
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-3 py-4 border-t border-border">
          <button
            onClick={() => base44.auth.logout()}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors w-full"
          >
            <LogOut className="w-4 h-4" />
            Log out
          </button>
        </div>
      </aside>
      <main className="flex-1 min-w-0 p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}