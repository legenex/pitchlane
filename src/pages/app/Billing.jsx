import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useCurrentUser from '@/lib/useCurrentUser';
import { base44 } from '@/api/base44Client';
import { createCheckoutSession } from '@/functions/createCheckoutSession';
import { useToast } from '@/components/ui/use-toast';
import { CreditCard, Zap, FileText, AlertTriangle, ExternalLink, RefreshCw, Check } from 'lucide-react';
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
      if (res.data?.url) window.location.href = res.data.url;
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

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
        <div style={{ width: 28, height: 28, border: '3px solid var(--line)', borderTop: '3px solid var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 760 }}>
      {/* Current Plan */}
      <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 28, border: '1px solid var(--line)', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--canvas)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CreditCard size={16} style={{ color: 'var(--accent)' }} />
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--ink-muted)' }}>Current Plan</span>
          </div>
          {subscription && (
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.14em',
              background: subscription.status === 'active' ? 'rgba(14,92,74,0.1)' : subscription.status === 'past_due' ? 'rgba(234,67,53,0.1)' : 'var(--canvas)',
              color: subscription.status === 'active' ? 'var(--secondary)' : subscription.status === 'past_due' ? 'var(--danger)' : 'var(--ink-muted)',
              borderRadius: 'var(--radius-pill)', padding: '4px 12px'
            }}>
              {subscription.status}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, color: 'var(--ink)', marginBottom: 4 }}>
              {plan?.name || 'Trial'}
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink-muted)' }}>${(plan?.monthly_price || 0) / 100}/month</div>
          </div>
          {(!plan || plan.monthly_price === 0) && (
            <button onClick={handleUpgrade}
              style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, background: 'var(--accent)', color: '#fff', padding: '10px 24px', borderRadius: 'var(--radius-pill)', border: 'none', cursor: 'pointer', boxShadow: 'var(--shadow-accent)', transition: 'transform 200ms' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
              Upgrade Plan
            </button>
          )}
        </div>
        {subscription?.payment_method_brand && (
          <div style={{ marginTop: 16, padding: '12px 16px', background: 'var(--canvas)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <CreditCard size={14} style={{ color: 'var(--ink-muted)' }} />
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--ink-soft)', textTransform: 'capitalize' }}>
              {subscription.payment_method_brand} ending in {subscription.payment_method_last4}
            </span>
          </div>
        )}
        {subscription?.cancel_at_period_end && (
          <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(234,67,53,0.08)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={14} style={{ color: 'var(--danger)' }} />
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--danger)' }}>
              Subscription cancels on {periodEnd ? format(periodEnd, 'MMM d, yyyy') : '—'}
            </span>
          </div>
        )}
        {periodEnd && !subscription?.cancel_at_period_end && (
          <div style={{ marginTop: 12, fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--ink-muted)' }}>
            Renews {format(periodEnd, 'MMM d, yyyy')} · {daysLeft} days remaining
          </div>
        )}
      </div>

      {/* Usage & Credits */}
      <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 28, border: '1px solid var(--line)', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--canvas)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={16} style={{ color: 'var(--accent)' }} />
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--ink-muted)' }}>Usage & Credits</span>
        </div>

        {artifactQuota > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--ink-soft)' }}>Artifacts used this period</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink)' }}>{artifactsUsed} / {artifactQuota}</span>
            </div>
            <div style={{ height: 6, background: 'var(--canvas)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min(100, (artifactsUsed / artifactQuota) * 100)}%`, background: 'var(--accent)', borderRadius: 3, transition: 'width 600ms ease' }} />
            </div>
          </div>
        )}

        <div style={{ borderTop: '1px solid var(--line-soft)', paddingTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, color: 'var(--ink)', lineHeight: 1 }}>{creditsBalance.toLocaleString()}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.16em', color: 'var(--ink-muted)', marginTop: 4 }}>Available credits</div>
          </div>
          {daysLeft !== null && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--ink-muted)' }}>Period resets in {daysLeft} days</div>
          )}
        </div>

        {creditTransactions.length > 0 && (
          <div style={{ marginTop: 20, borderTop: '1px solid var(--line-soft)', paddingTop: 16 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--ink-muted)', marginBottom: 12 }}>Recent Activity</div>
            {creditTransactions.map(tx => (
              <div key={tx.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--line-soft)' }}>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--ink-soft)', textTransform: 'capitalize' }}>
                  {tx.transaction_type?.replace('_', ' ')} — {tx.reason || '—'}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: tx.amount > 0 ? 'var(--secondary)' : 'var(--danger)' }}>
                  {tx.amount > 0 ? '+' : ''}{tx.amount}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Buy Credits */}
      <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 28, border: '1px solid var(--line)', marginBottom: 20 }}>
        <div style={{ marginBottom: 20 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--ink-muted)' }}>Buy Credits</span>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink-muted)', marginTop: 4, marginBottom: 0 }}>Credits are used for audience requests and enrichment.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {CREDIT_PACKS.map(pack => (
            <div key={pack.id} className="card-lift" style={{ position: 'relative', border: `1px solid ${pack.popular ? 'var(--accent)' : 'var(--line)'}`, borderRadius: 12, padding: 20, background: pack.popular ? 'rgba(242,92,42,0.04)' : 'var(--canvas)', cursor: 'pointer' }}>
              {pack.popular && (
                <span style={{ position: 'absolute', top: -10, left: 12, fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.16em', background: 'var(--accent)', color: '#fff', padding: '3px 10px', borderRadius: 'var(--radius-pill)' }}>Most Popular</span>
              )}
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500, color: 'var(--ink)', marginBottom: 4 }}>{pack.label}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--ink)', lineHeight: 1, marginBottom: 4 }}>{pack.priceLabel}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--ink-muted)', marginBottom: 16 }}>${(pack.price / pack.credits).toFixed(2)}/credit</div>
              <button
                disabled={buyingPack === pack.id}
                onClick={() => handleBuyCredits(pack)}
                style={{ width: '100%', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, padding: '9px 0', borderRadius: 'var(--radius-pill)', border: pack.popular ? 'none' : '1px solid var(--line)', background: pack.popular ? 'var(--accent)' : 'transparent', color: pack.popular ? '#fff' : 'var(--ink)', cursor: buyingPack === pack.id ? 'not-allowed' : 'pointer', opacity: buyingPack === pack.id ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {buyingPack === pack.id ? <RefreshCw size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> : 'Purchase'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Invoice History */}
      {invoices.length > 0 && (
        <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 28, border: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <FileText size={16} style={{ color: 'var(--ink-muted)' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--ink-muted)' }}>Invoice History</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {invoices.map(inv => (
              <div key={inv.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', border: '1px solid var(--line)', borderRadius: 10 }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>${((inv.amount_paid || inv.amount_due || 0) / 100).toFixed(2)}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--ink-muted)', marginTop: 2 }}>{format(new Date(inv.issued_at || inv.created_date), 'MMM d, yyyy')}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em',
                    background: inv.status === 'paid' ? 'rgba(14,92,74,0.1)' : 'var(--canvas)',
                    color: inv.status === 'paid' ? 'var(--secondary)' : 'var(--ink-muted)',
                    borderRadius: 'var(--radius-pill)', padding: '4px 10px'
                  }}>{inv.status}</span>
                  {inv.hosted_invoice_url && (
                    <a href={inv.hosted_invoice_url} target="_blank" rel="noreferrer"
                      style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--accent)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                      View <ExternalLink size={11} />
                    </a>
                  )}
                  {inv.invoice_pdf_url && (
                    <a href={inv.invoice_pdf_url} target="_blank" rel="noreferrer"
                      style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--ink-muted)', textDecoration: 'none' }}>
                      PDF
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}