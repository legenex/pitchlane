import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Settings, LogOut, FileText, Users, CreditCard } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/app', icon: LayoutDashboard, exact: true },
  { label: 'Prospects', path: '/app/prospects', icon: Users },
  { label: 'Artifacts', path: '/app/artifacts', icon: FileText },
  { label: 'Knowledge', path: '/app/knowledge', icon: BookOpen },
  { label: 'Credits', path: '/app/credits', icon: CreditCard },
  { label: 'Settings', path: '/app/settings', icon: Settings },
];

export default function ClientLayout() {
  const location = useLocation();

  const isActive = (item) => {
    if (item.exact) return location.pathname === item.path;
    return location.pathname === item.path || location.pathname.startsWith(item.path + '/');
  };

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="w-56 shrink-0 border-r border-border flex flex-col">
        <div className="h-16 flex items-center px-5 border-b border-border">
          <span className="font-bold text-lg tracking-tight">Pitchlane</span>
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