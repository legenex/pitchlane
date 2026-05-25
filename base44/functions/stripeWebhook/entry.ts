import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.21.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), { apiVersion: '2023-10-16' });
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    const body = await req.text();
    const sig = req.headers.get('stripe-signature');

    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
    } catch (err) {
      return Response.json({ error: `Webhook signature invalid: ${err.message}` }, { status: 400 });
    }

    // Idempotency check
    const existing = await base44.asServiceRole.entities.StripeWebhookEvent.filter({ stripe_event_id: event.id });
    if (existing.length) {
      return Response.json({ received: true, skipped: 'duplicate' });
    }

    // Record event
    await base44.asServiceRole.entities.StripeWebhookEvent.create({
      stripe_event_id: event.id,
      event_type: event.type,
      processed_at: new Date().toISOString(),
      payload_summary: { object: event.data.object.object, id: event.data.object.id },
    });

    const obj = event.data.object;

    switch (event.type) {
      case 'checkout.session.completed': {
        const metadata = obj.metadata || {};
        const client_id = metadata.client_id;
        if (!client_id) break;

        if (metadata.type === 'credit_purchase') {
          const credits = parseInt(metadata.credits || '0');
          const pack_id = metadata.credit_pack_id;

          // Create CreditPurchase record
          await base44.asServiceRole.entities.CreditPurchase.create({
            client_id,
            stripe_payment_intent_id: obj.payment_intent,
            credit_pack_id: pack_id,
            credits_purchased: credits,
            amount_paid: obj.amount_total || 0,
            status: 'succeeded',
            succeeded_at: new Date().toISOString(),
          });

          // Get current balance
          const clients = await base44.asServiceRole.entities.Client.filter({ id: client_id });
          if (clients.length) {
            const current = clients[0].credits_balance || 0;
            await base44.asServiceRole.entities.Client.update(client_id, {
              credits_balance: current + credits,
            });
            // Create ledger transaction
            await base44.asServiceRole.entities.CreditTransaction.create({
              client_id,
              amount: credits,
              balance_after: current + credits,
              transaction_type: 'purchase',
              reference_id: obj.payment_intent,
              reason: `Credit pack purchase: ${pack_id}`,
            });
            // Notification
            await base44.asServiceRole.entities.OutreachNotification.create({
              client_id,
              type: 'audience_fulfilled',
              message: `${credits} credits added to your account.`,
              read: false,
            });
          }
        } else if (metadata.type === 'subscription') {
          // Subscription created via checkout — handle in subscription.created
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const client_id = obj.metadata?.client_id;
        if (!client_id) break;

        const existing = await base44.asServiceRole.entities.Subscription.filter({ client_id });
        const subData = {
          client_id,
          stripe_customer_id: obj.customer,
          stripe_subscription_id: obj.id,
          status: obj.status,
          current_period_start: new Date(obj.current_period_start * 1000).toISOString(),
          current_period_end: new Date(obj.current_period_end * 1000).toISOString(),
          cancel_at_period_end: obj.cancel_at_period_end || false,
        };

        if (existing.length) {
          await base44.asServiceRole.entities.Subscription.update(existing[0].id, subData);
        } else {
          await base44.asServiceRole.entities.Subscription.create(subData);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const client_id = obj.metadata?.client_id;
        if (!client_id) break;
        const existing = await base44.asServiceRole.entities.Subscription.filter({ client_id });
        if (existing.length) {
          await base44.asServiceRole.entities.Subscription.update(existing[0].id, { status: 'canceled', cancel_at_period_end: false });
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const client_id = obj.metadata?.client_id || (
          obj.subscription ? await getClientFromSub(base44, obj.subscription) : null
        );
        if (!client_id) break;

        await base44.asServiceRole.entities.Invoice.create({
          client_id,
          stripe_invoice_id: obj.id,
          subscription_id: obj.subscription || null,
          amount_due: obj.amount_due,
          amount_paid: obj.amount_paid,
          currency: obj.currency,
          status: 'paid',
          invoice_pdf_url: obj.invoice_pdf,
          hosted_invoice_url: obj.hosted_invoice_url,
          billing_reason: obj.billing_reason || 'subscription_cycle',
          issued_at: new Date(obj.created * 1000).toISOString(),
          paid_at: new Date().toISOString(),
        });
        break;
      }

      case 'invoice.payment_failed': {
        const client_id = obj.metadata?.client_id || (
          obj.subscription ? await getClientFromSub(base44, obj.subscription) : null
        );
        if (client_id) {
          const existing = await base44.asServiceRole.entities.Subscription.filter({ client_id });
          if (existing.length) {
            await base44.asServiceRole.entities.Subscription.update(existing[0].id, { status: 'past_due' });
          }
          await base44.asServiceRole.entities.OutreachNotification.create({
            client_id,
            type: 'audience_fulfilled',
            message: 'Your payment failed. Please update your payment method to avoid service interruption.',
            read: false,
          });
        }
        break;
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function getClientFromSub(base44, stripeSubId) {
  const subs = await base44.asServiceRole.entities.Subscription.filter({ stripe_subscription_id: stripeSubId });
  return subs[0]?.client_id || null;
}