import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.21.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { mode, client_id, credit_pack_id, credits, amount, success_url, cancel_url } = body;

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), { apiVersion: '2023-10-16' });

    // Get or create Stripe customer
    const clients = await base44.entities.Client.filter({ id: client_id });
    if (!clients.length) return Response.json({ error: 'Client not found' }, { status: 404 });
    const client = clients[0];

    let customerId = null;
    const subs = await base44.entities.Subscription.filter({ client_id });
    if (subs.length && subs[0].stripe_customer_id) {
      customerId = subs[0].stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        name: client.name,
        metadata: { client_id, user_id: user.id },
      });
      customerId = customer.id;
    }

    let session;

    if (mode === 'payment' && credit_pack_id) {
      // One-time credit purchase
      session = await stripe.checkout.sessions.create({
        mode: 'payment',
        customer: customerId,
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: { name: `${credits} Pitchlane Credits (${credit_pack_id})` },
            unit_amount: amount * 100, // amount is in cents already? No - amount is dollars here
          },
          quantity: 1,
        }],
        metadata: { client_id, credit_pack_id, credits: String(credits), type: 'credit_purchase' },
        success_url,
        cancel_url,
      });
    } else if (mode === 'subscription') {
      // Subscription checkout - requires price IDs to be configured
      const plans = await base44.entities.Plan.list();
      // Show plan selection or use a default starter plan price
      const starterPriceId = Deno.env.get('STRIPE_STARTER_PRICE_ID');
      if (!starterPriceId) return Response.json({ error: 'Stripe plan price IDs not configured' }, { status: 500 });

      session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer: customerId,
        line_items: [{ price: starterPriceId, quantity: 1 }],
        metadata: { client_id, type: 'subscription' },
        success_url,
        cancel_url,
        subscription_data: {
          trial_period_days: 0,
          metadata: { client_id },
        },
      });
    } else {
      return Response.json({ error: 'Invalid mode' }, { status: 400 });
    }

    return Response.json({ url: session.url, session_id: session.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});