import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import useCurrentUser from '@/lib/useCurrentUser';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, TrendingDown, TrendingUp, Zap } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const CREDIT_PACKS = [
  { credits: 100, price: 150, label: 'Starter' },
  { credits: 500, price: 600, label: 'Growth', popular: true },
  { credits: 1000, price: 1000, label: 'Scale' },
  { credits: 5000, price: 4500, label: 'Enterprise' },
];

export default function Credits() {
  const { clientId } = useCurrentUser();
  const { toast } = useToast();
  const [client, setClient] = useState(null);
  const [plan, setPlan] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) return;
    loadData();
  }, [clientId]);

  const loadData = async () => {
    const [clients, txs] = await Promise.all([
      base44.entities.Client.filter({ id: clientId }),
      base44.entities.CreditTransaction.filter({ client_id: clientId }),
    ]);
    if (clients.length) {
      const c = clients[0];
      setClient(c);
      if (c.plan_id) {
        const plans = await base44.entities.Plan.filter({ id: c.plan_id });
        if (plans.length) setPlan(plans[0]);
      }
    }
    setTransactions(txs.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
    setLoading(false);
  };

  const handleBuy = () => {
    toast({
      title: 'Coming soon',
      description: 'Stripe payments are being wired up — available in Week 4!',
    });
  };

  if (loading) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Credits</h1>
        <p className="text-muted-foreground text-sm mt-1">Credits are used to request audiences (1 prospect = 1 credit).</p>
      </div>

      {/* Balance */}
      <Card className="bg-primary text-primary-foreground">
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <p className="text-sm opacity-80">Current Balance</p>
            <p className="text-4xl font-bold mt-1">{(client?.credits_balance || 0).toLocaleString()}</p>
            <p className="text-sm opacity-70 mt-1">credits</p>
          </div>
          <CreditCard className="w-12 h-12 opacity-20" />
        </CardContent>
      </Card>

      {/* Plan included */}
      {plan?.credits_included > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 border border-border rounded-lg px-4 py-3">
          <Zap className="w-4 h-4 text-primary" />
          Your <strong>{plan.name}</strong> plan includes {plan.credits_included.toLocaleString()} credits/month.
        </div>
      )}

      {/* Credit packs */}
      <div>
        <h2 className="font-semibold mb-3">Buy Credits</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CREDIT_PACKS.map(pack => (
            <Card key={pack.credits} className={pack.popular ? 'border-primary' : ''}>
              <CardContent className="p-4 space-y-3">
                {pack.popular && <Badge className="text-xs">Most Popular</Badge>}
                <div>
                  <p className="text-2xl font-bold">{pack.credits.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">credits</p>
                </div>
                <div>
                  <p className="text-xl font-semibold">${pack.price.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">${(pack.price / pack.credits).toFixed(2)}/credit</p>
                </div>
                <Button onClick={handleBuy} variant={pack.popular ? 'default' : 'outline'} size="sm" className="w-full">
                  Buy — {pack.label}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block"></span>
          Stripe checkout coming in Week 4.
        </p>
      </div>

      {/* Transaction history */}
      <div>
        <h2 className="font-semibold mb-3">Transaction History</h2>
        {transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No transactions yet.</p>
        ) : (
          <div className="border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="p-3 text-left font-medium text-muted-foreground">Type</th>
                  <th className="p-3 text-left font-medium text-muted-foreground">Reason</th>
                  <th className="p-3 text-right font-medium text-muted-foreground">Amount</th>
                  <th className="p-3 text-right font-medium text-muted-foreground hidden md:table-cell">Balance After</th>
                  <th className="p-3 text-right font-medium text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {transactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-muted/20">
                    <td className="p-3">
                      <span className="text-xs px-2 py-0.5 rounded-full border capitalize" style={{ background: tx.amount > 0 ? '#f0fdf4' : '#fef2f2', borderColor: tx.amount > 0 ? '#bbf7d0' : '#fecaca', color: tx.amount > 0 ? '#166534' : '#991b1b' }}>
                        {tx.transaction_type?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground text-xs max-w-[200px] truncate">{tx.reason || '—'}</td>
                    <td className="p-3 text-right font-medium">
                      <span className={tx.amount > 0 ? 'text-green-600' : 'text-red-600'}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount}
                      </span>
                    </td>
                    <td className="p-3 text-right text-muted-foreground hidden md:table-cell">{tx.balance_after ?? '—'}</td>
                    <td className="p-3 text-right text-xs text-muted-foreground">{new Date(tx.created_date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}