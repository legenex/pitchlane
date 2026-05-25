import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Settings, LogOut, FileText, Users, CreditCard, Bell } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import useCurrentUser from '@/lib/useCurrentUser';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/app', icon: LayoutDashboard, exact: true },
  { label: 'Prospects', path: '/app/prospects', icon: Users },
  { label: 'Artifacts', path: '/app/artifacts', icon: FileText },
  { label: 'Knowledge', path: '/app/knowledge', icon: BookOpen },
  { label: 'Credits', path: '/app/credits', icon: CreditCard },
  { label: 'Billing', path: '/app/billing', icon: CreditCard },
  { label: 'Settings', path: '/app/settings', icon: Settings },
];

export default function ClientLayout() {
  const location = useLocation();
  const { clientId } = useCurrentUser();
  const [unreadCount, setUnreadCount] = useState(0);

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

  const isActive = (item) => {
    if (item.exact) return location.pathname === item.path;
    return location.pathname === item.path || location.pathname.startsWith(item.path + '/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="h-16 border-b border-border flex items-center justify-between px-8">
        <span className="font-bold text-lg tracking-tight">Pitchlane</span>
        <Link to="/app/notifications" className="relative">
          <button className="relative p-2 hover:bg-muted rounded-lg transition-colors">
            <Bell className="w-5 h-5 text-muted-foreground" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-destructive rounded-full" />
            )}
          </button>
        </Link>
      </header>
      <div className="flex flex-1 min-w-0 overflow-hidden">
        <aside className="w-56 shrink-0 border-r border-border flex flex-col">
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-auto">
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
    </div>
  );
}