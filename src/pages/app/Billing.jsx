import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useCurrentUser from '@/lib/useCurrentUser';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { createCheckoutSession } from '@/functions/createCheckoutSession';
import { useToast } from '@/components/ui/use-toast';
import { CreditCard, Zap, FileText, AlertTriangle, ExternalLink, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

const CREDIT_PACKS = [
  { id: 'pack_100', credits: 100, price: 150, label: '100 Credits', priceLabel: '$150' },
  { id: 'pack_500', credits: 500, price: 600, label: '500 Credits', priceLabel: '$600', popular: true },
  { id: 'pack_1000', credits: 1000, price: 1000, label: '1,000 Credits', priceLabel: '$1,000' },
  { id: 'pack_5000', credits: 5000, price: 4500, label: '5,000 Credits', priceLabel: '$4,500' },
];

export default function Billing() {
  const { user, clientId } = useCurrentUser();
  const { toast } = useToast();
  const [client, setClient] = useState(null);
  const [plan, setPlan] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [creditTransactions, setCreditTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buyingPack, setBuyingPack] = useState(null);

  useEffect(() => {
    if (!clientId) return;
    loadData();
  }, [clientId]);

  const loadData = async () => {
    const [clients, subs, invs, txns] = await Promise.all([
      base44.entities.Client.filter({ id: clientId }),
      base44.entities.Subscription.filter({ client_id: clientId }),
      base44.entities.Invoice.filter({ client_id: clientId }),
      base44.entities.CreditTransaction.filter({ client_id: clientId }),
    ]);
    const c = clients[0];
    setClient(c);
    if (c?.plan_id) {
      const plans = await base44.entities.Plan.filter({ id: c.plan_id });
      if (plans.length) setPlan(plans[0]);
    }
    setSubscription(subs[0] || null);
    setInvoices(invs.sort((a, b) => new Date(b.issued_at || b.created_date) - new Date(a.issued_at || a.created_date)));
    setCreditTransactions(txns.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 10));
    setLoading(false);
  };

  const handleBuyCredits = async (pack) => {
    setBuyingPack(pack.id);
    try {
      const res = await createCheckoutSession({
        mode: 'payment',
        client_id: clientId,
        credit_pack_id: pack.id,
        credits: pack.credits,
        amount: pack.price,
        success_url: `${window.location.origin}/app/billing/checkout/success?credits=${pack.credits}`,
        cancel_url: `${window.location.origin}/app/billing/checkout/cancel`,
      });
      if (res.data?.url) {
        window.location.href = res.data.url;
      }
    } catch (e) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
    setBuyingPack(null);
  };

  const handleUpgrade = async () => {
    try {
      const res = await createCheckoutSession({
        mode: 'subscription',
        client_id: clientId,
        success_url: `${window.location.origin}/app/billing/checkout/success`,
        cancel_url: `${window.location.origin}/app/billing/checkout/cancel`,
      });
      if (res.data?.url) window.location.href = res.data.url;
    } catch (e) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const artifactQuota = plan?.artifact_quota || 0;
  const artifactsUsed = client?.artifacts_used_this_period || 0;
  const creditsBalance = client?.credits_balance || 0;
  const periodEnd = subscription?.current_period_end ? new Date(subscription.current_period_end) : null;
  const daysLeft = periodEnd ? Math.max(0, Math.ceil((periodEnd - new Date()) / 86400000)) : null;

  if (loading) return <div className="text-muted-foreground text-sm">Loading billing...</div>;

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold mb-1">Billing</h1>
        <p className="text-muted-foreground">Manage your subscription, credits, and invoices.</p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="w-4 h-4" /> Current Plan
            </CardTitle>
            {subscription && (
              <Badge variant={subscription.status === 'active' ? 'default' : subscription.status === 'past_due' ? 'destructive' : 'secondary'}>
                {subscription.status}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-2xl font-bold">{plan?.name || 'Trial'}</p>
              <p className="text-muted-foreground text-sm">${(plan?.monthly_price || 0) / 100}/month</p>
            </div>
            {(!plan || plan.monthly_price === 0) && (
              <Button onClick={handleUpgrade}>Upgrade Plan</Button>
            )}
          </div>

          {subscription?.payment_method_brand && (
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm capitalize">{subscription.payment_method_brand} ending in {subscription.payment_method_last4}</span>
              </div>
            </div>
          )}

          {subscription?.cancel_at_period_end && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
              <AlertTriangle className="w-4 h-4" />
              Subscription cancels on {periodEnd ? format(periodEnd, 'MMM d, yyyy') : '—'}
            </div>
          )}

          {periodEnd && !subscription?.cancel_at_period_end && (
            <p className="text-xs text-muted-foreground">
              Renews {format(periodEnd, 'MMM d, yyyy')} · {daysLeft} days remaining
            </p>
          )}
        </CardContent>
      </Card>

      {/* Usage */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="w-4 h-4" /> Usage & Credits
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Artifacts used this period</span>
              <span className="font-medium">{artifactsUsed} / {artifactQuota || '∞'}</span>
            </div>
            {artifactQuota > 0 && (
              <Progress value={Math.min(100, (artifactsUsed / artifactQuota) * 100)} className="h-2" />
            )}
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-2xl">{creditsBalance.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Available credits</p>
            </div>
            {daysLeft !== null && (
              <p className="text-xs text-muted-foreground">Period resets in {daysLeft} days</p>
            )}
          </div>
          {creditTransactions.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Recent Activity</p>
              {creditTransactions.map(tx => (
                <div key={tx.id} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground capitalize">{tx.transaction_type?.replace('_', ' ')} — {tx.reason || '—'}</span>
                  <span className={tx.amount > 0 ? 'text-green-600 font-medium' : 'text-red-500 font-medium'}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Buy Credits */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Buy Credits</CardTitle>
          <CardDescription>Credits are used for audience requests and enrichment.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-3">
            {CREDIT_PACKS.map(pack => (
              <div
                key={pack.id}
                className={`relative border rounded-xl p-4 cursor-pointer hover:border-primary/50 transition-colors ${pack.popular ? 'border-primary bg-primary/5' : 'border-border'}`}
              >
                {pack.popular && (
                  <span className="absolute -top-2.5 left-3 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">Most Popular</span>
                )}
                <p className="font-semibold">{pack.label}</p>
                <p className="text-2xl font-bold mt-1">{pack.priceLabel}</p>
                <p className="text-xs text-muted-foreground mb-3">${(pack.price / pack.credits).toFixed(2)}/credit</p>
                <Button
                  size="sm"
                  className="w-full"
                  variant={pack.popular ? 'default' : 'outline'}
                  disabled={buyingPack === pack.id}
                  onClick={() => handleBuyCredits(pack)}
                >
                  {buyingPack === pack.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Purchase'}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Invoice History */}
      {invoices.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4" /> Invoice History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {invoices.map(inv => (
                <div key={inv.id} className="flex items-center justify-between p-3 border border-border rounded-lg text-sm">
                  <div>
                    <p className="font-medium">${((inv.amount_paid || inv.amount_due || 0) / 100).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(inv.issued_at || inv.created_date), 'MMM d, yyyy')}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={inv.status === 'paid' ? 'secondary' : inv.status === 'open' ? 'outline' : 'destructive'}>
                      {inv.status}
                    </Badge>
                    {inv.hosted_invoice_url && (
                      <a href={inv.hosted_invoice_url} target="_blank" rel="noreferrer">
                        <Button size="sm" variant="ghost" className="h-7 px-2 gap-1">
                          View <ExternalLink className="w-3 h-3" />
                        </Button>
                      </a>
                    )}
                    {inv.invoice_pdf_url && (
                      <a href={inv.invoice_pdf_url} target="_blank" rel="noreferrer">
                        <Button size="sm" variant="ghost" className="h-7 px-2">PDF</Button>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}