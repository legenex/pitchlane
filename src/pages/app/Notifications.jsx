import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useCurrentUser from '@/lib/useCurrentUser';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Flame, Eye, Mail, AlertCircle, Users, CheckCheck, Trash2, Inbox } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';

const TABS = ['all', 'unread', 'hot_leads', 'replies', 'system'];

const TYPE_META = {
  prospect_hot:             { icon: Flame,        color: 'text-orange-500', label: 'Hot Lead' },
  artifact_hot:             { icon: Flame,        color: 'text-orange-500', label: 'Hot Artifact' },
  artifact_viewed_first_time: { icon: Eye,        color: 'text-blue-500',   label: 'First View' },
  email_replied:            { icon: Mail,         color: 'text-green-600',  label: 'Reply' },
  email_bounced:            { icon: AlertCircle,  color: 'text-red-500',    label: 'Bounced' },
  audience_fulfilled:       { icon: Users,        color: 'text-purple-500', label: 'Fulfilled' },
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
    const ns = await base44.entities.OutreachNotification.filter(
      { client_id: clientId }, '-created_date', 100
    );
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
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-1">Notifications</h1>
          <p className="text-muted-foreground text-sm">Stay on top of your leads and activity.</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead} className="gap-2">
            <CheckCheck className="w-4 h-4" /> Mark all read
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 flex-wrap border-b border-border">
        {TABS.map(tab => {
          const count = tab === 'unread' ? unreadCount : notifications.filter(TAB_FILTER[tab]).length;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors capitalize ${
                activeTab === tab ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.replace('_', ' ')} {count > 0 && <span className="ml-1 text-xs bg-muted px-1.5 py-0.5 rounded-full">{count}</span>}
            </button>
          );
        })}
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3 text-muted-foreground">
          <Inbox className="w-10 h-10 opacity-30" />
          <p>No notifications here yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(n => {
            const meta = TYPE_META[n.type] || { icon: AlertCircle, color: 'text-muted-foreground', label: n.type };
            const Icon = meta.icon;
            return (
              <div
                key={n.id}
                className={`flex items-start gap-3 p-4 rounded-xl border transition-colors ${!n.read ? 'bg-muted/40 border-border' : 'border-transparent hover:bg-muted/20'}`}
              >
                <div className={`mt-0.5 ${meta.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Badge variant="outline" className="text-xs py-0">{meta.label}</Badge>
                    {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                  </div>
                  <p className="text-sm">{n.message}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(n.created_date), { addSuffix: true })}
                    </span>
                    {n.prospect_id && (
                      <Link to={`/app/prospects/${n.prospect_id}`} className="text-xs text-primary hover:underline">
                        View prospect →
                      </Link>
                    )}
                    {n.artifact_id && (
                      <Link to={`/app/artifacts/${n.artifact_id}/edit`} className="text-xs text-primary hover:underline">
                        View artifact →
                      </Link>
                    )}
                  </div>
                </div>
                {!n.read && (
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs shrink-0" onClick={() => markRead(n)}>
                    Mark read
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}