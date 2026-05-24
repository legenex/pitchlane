import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Sparkles, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';

export default function Step5Plan({ clientId, onComplete }) {
  const [plans, setPlans] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.entities.Plan.list()
      .then(data => {
        setPlans(data.sort((a, b) => a.monthly_price - b.monthly_price));
        if (data.length) setSelected(data[0].id);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleComplete = async () => {
    setSaving(true);
    const clients = await base44.entities.Client.filter({ id: clientId });
    if (clients.length) {
      await base44.entities.Client.update(clients[0].id, { plan_id: selected });
    }
    const progresses = await base44.entities.OnboardingProgress.filter({ client_id: clientId });
    if (progresses.length) {
      await base44.entities.OnboardingProgress.update(progresses[0].id, { completed: true, step: 5 });
    }
    onComplete();
  };

  if (loading) return (
    <div className="text-center py-16">
      <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Choose your plan</h2>
        <p className="text-muted-foreground">Start free, upgrade anytime.</p>
      </div>

      <div className="grid gap-4 mb-6">
        {plans.map(plan => (
          <Card
            key={plan.id}
            onClick={() => setSelected(plan.id)}
            className={cn(
              'cursor-pointer transition-all',
              selected === plan.id ? 'border-primary ring-2 ring-primary/20' : 'hover:border-primary/40'
            )}
          >
            <CardContent className="pt-5 pb-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-lg">{plan.name}</p>
                  <p className="text-2xl font-bold mt-1">${plan.monthly_price}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                  <ul className="mt-3 space-y-1">
                    {(plan.features_json || []).map((f, i) => (
                      <li key={i} className="text-sm text-muted-foreground">✓ {f}</li>
                    ))}
                  </ul>
                </div>
                {selected === plan.id && (
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-1" />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button onClick={handleComplete} disabled={!selected || saving} className="w-full h-11">
        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
        Get Started
      </Button>
    </motion.div>
  );
}