import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, AlertTriangle, DollarSign, Users, Zap } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';

export default function BillingHealth() {
  const [loading, setLoading] = useState(true);
  const [subs, setSubs] = useState([]);
  const [plans, setPlans] = useState({});
  const [clients, setClients] = useState({});
  const [invoices, setInvoices] = useState([]);
  const [creditPurchases, setCreditPurchases] = useState([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [subList, planList, clientList, invList, cpList] = await Promise.all([
      base44.entities.Subscription.list(),
      base44.entities.Plan.list(),
      base44.entities.Client.list(),
      base44.entities.Invoice.list('-issued_at', 200),
      base44.entities.CreditPurchase.filter({ status: 'succeeded' }),
    ]);
    const pm = {};
    planList.forEach(p => { pm[p.id] = p; });
    const cm = {};
    clientList.forEach(c => { cm[c.id] = c; });
    setSubs(subList);
    setPlans(pm);
    setClients(cm);
    setInvoices(invList);
    setCreditPurchases(cpList);
    setLoading(false);
  };

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const active = subs.filter(s => s.status === 'active');
  const pastDue = subs.filter(s => s.status === 'past_due');
  const canceledThisMonth = subs.filter(s => s.status === 'canceled' && new Date(s.updated_date) >= monthStart);
  const newThisMonth = subs.filter(s => s.status === 'active' && new Date(s.created_date) >= monthStart);

  const mrr = active.reduce((sum, s) => {
    const plan = plans[s.plan_id];
    return sum + (plan?.monthly_price || 0);
  }, 0);
  const arr = mrr * 12;

  const creditRevenueThisMonth = creditPurchases
    .filter(cp => new Date(cp.succeeded_at || cp.created_date) >= monthStart)
    .reduce((sum, cp) => sum + (cp.amount_paid || 0), 0);

  if (loading) return <div className="text-muted-foreground text-sm">Loading...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Billing Health</h1>
        <p className="text-muted-foreground text-sm mt-1">Revenue overview and payment status.</p>
      </div>

      {/* KPI row */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI icon={DollarSign} label="MRR" value={`$${(mrr / 100).toLocaleString()}`} />
        <KPI icon={TrendingUp} label="ARR" value={`$${(arr / 100).toLocaleString()}`} />
        <KPI icon={Users} label="Active Subscriptions" value={active.length} sublabel={`${newThisMonth.length} new this month`} />
        <KPI icon={Zap} label="Credit Revenue (MTD)" value={`$${(creditRevenueThisMonth / 100).toLocaleString()}`} />
      </div>

      {/* Past Due Queue */}
      {pastDue.length > 0 && (
        <Card className="border-destructive/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-4 h-4" /> Failed Payments ({pastDue.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pastDue.map(s => {
                const client = clients[s.client_id];
                const plan = plans[s.plan_id];
                return (
                  <div key={s.id} className="flex items-center justify-between p-3 border border-destructive/20 rounded-lg bg-destructive/5">
                    <div>
                      <p className="font-medium text-sm">{client?.name || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground">{plan?.name} · past_due since {format(new Date(s.updated_date || s.created_date), 'MMM d')}</p>
                    </div>
                    <Badge variant="destructive">past_due</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cancellations This Month */}
      {canceledThisMonth.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-muted-foreground" /> Canceled This Month ({canceledThisMonth.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {canceledThisMonth.map(s => {
                const client = clients[s.client_id];
                return (
                  <div key={s.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg text-sm">
                    <span>{client?.name || 'Unknown'}</span>
                    <span className="text-muted-foreground">{format(new Date(s.updated_date), 'MMM d, yyyy')}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Invoices */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recent Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground">No invoices yet.</p>
          ) : (
            <div className="space-y-2">
              {invoices.slice(0, 20).map(inv => {
                const client = clients[inv.client_id];
                return (
                  <div key={inv.id} className="flex items-center justify-between p-3 border border-border rounded-lg text-sm">
                    <div>
                      <p className="font-medium">{client?.name || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(inv.issued_at || inv.created_date), 'MMM d, yyyy')} · {inv.billing_reason?.replace('_', ' ')}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-medium">${((inv.amount_paid || inv.amount_due || 0) / 100).toFixed(2)}</span>
                      <Badge variant={inv.status === 'paid' ? 'secondary' : inv.status === 'open' ? 'outline' : 'destructive'}>
                        {inv.status}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function KPI({ icon: IconComponent, label, value, sublabel }) {
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
            <IconComponent className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}