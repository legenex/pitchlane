import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRight, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Step1Company({ data, onNext }) {
  const [form, setForm] = useState({
    business_name: data?.business_name || '',
    website_url: data?.website_url || '',
    niche: data?.niche || '',
    primary_geo: data?.primary_geo || '',
    target_audience_short: data?.target_audience_short || '',
  });

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    onNext(form);
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Building2 className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Tell us about your firm</h2>
        <p className="text-muted-foreground">This helps us personalise your pitch artifacts.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Business Name *</label>
          <Input value={form.business_name} onChange={set('business_name')} placeholder="Acme Architecture" required />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Website URL</label>
          <Input value={form.website_url} onChange={set('website_url')} placeholder="https://acmearchitecture.com" type="url" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Industry / Niche *</label>
          <Input value={form.niche} onChange={set('niche')} placeholder="e.g. Residential Architecture, Wealth Advisory" required />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Primary Geography</label>
          <Input value={form.primary_geo} onChange={set('primary_geo')} placeholder="e.g. Cape Town, South Africa" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Target Audience</label>
          <Textarea value={form.target_audience_short} onChange={set('target_audience_short')} placeholder="e.g. High-net-worth individuals building luxury homes" rows={2} />
        </div>
        <Button type="submit" className="w-full h-11 mt-2">
          Continue <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </form>
    </motion.div>
  );
}