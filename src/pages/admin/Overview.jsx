import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, FileText, TrendingUp, Zap } from 'lucide-react';

export default function AdminOverview() {
  const [stats, setStats] = useState({ clients: 0, active: 0, trial: 0, artifacts: 0, mrr: 0 });
  const [recentSignups, setRecentSignups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const clients = await base44.asServiceRole.entities.Client.list();
    const plans = await base44.asServiceRole.entities.Plan.list();
    
    const active = clients.filter(c => c.status === 'active').length;
    const trial = clients.filter(c => c.plan_id === plans.find(p => p.name === 'Trial')?.id).length;
    
    const mrr = clients.reduce((sum, c) => {
      const plan = plans.find(p => p.id === c.plan_id);
      return sum + (plan?.monthly_price || 0);
    }, 0);

    setStats({
      clients: clients.length,
      active,
      trial,
      artifacts: 0, // Populated in Week 2
      mrr,
    });

    setRecentSignups(clients.slice(-5).reverse());
    setLoading(false);
  };

  if (loading) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-1">Admin Overview</h1>
        <p className="text-muted-foreground">System metrics and recent activity.</p>
      </div>

      {/* KPI Tiles */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPITile icon={Users} label="Total Clients" value={stats.clients} />
        <KPITile icon={Users} label="Active Clients" value={stats.active} sublabel={`${stats.trial} trial`} />
        <KPITile icon={TrendingUp} label="MRR" value={`$${(stats.mrr / 100).toLocaleString()}`} />
        <KPITile icon={Zap} label="Credits in Circulation" value="0" />
      </div>

      {/* Recent Signups */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Signups</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentSignups.map(client => (
              <div key={client.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium text-sm">{client.name}</p>
                  <p className="text-xs text-muted-foreground">{new Date(client.created_at).toLocaleDateString()}</p>
                </div>
                <Badge variant="outline">{client.status}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function KPITile({ icon: Icon, label, value, sublabel }) {
  if (!Icon) return null;
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
            <p className="text-3xl font-bold mt-2">{value}</p>
            {sublabel && <p className="text-xs text-muted-foreground mt-1">{sublabel}</p>}
          </div>
          <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
            <Icon className="w-4.5 h-4.5 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}