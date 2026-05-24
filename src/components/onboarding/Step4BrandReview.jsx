import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRight, Palette, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';

export default function Step4BrandReview({ clientId, onNext }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, [clientId]);

  const loadProfile = async () => {
    const profiles = await base44.entities.BrandProfile.filter({ client_id: clientId });
    setProfile(profiles[0] || { client_id: clientId, voice_tone: '', value_propositions: [] });
    setLoading(false);
  };

  const set = (k) => (e) => setProfile({ ...profile, [k]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (profile.id) {
      await base44.entities.BrandProfile.update(profile.id, profile);
    } else {
      await base44.entities.BrandProfile.create(profile);
    }
    onNext(profile);
  };

  if (loading) return (
    <div className="text-center py-16">
      <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-3" />
      <p className="text-sm text-muted-foreground">Loading your brand profile...</p>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Palette className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Review your brand</h2>
        <p className="text-muted-foreground">We've pre-filled this from your website. Adjust as needed.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="text-sm font-medium mb-1 block">Voice & Tone</label>
          <Textarea
            value={profile.voice_tone || ''}
            onChange={set('voice_tone')}
            placeholder="e.g. Professional yet approachable, confident, detail-oriented"
            rows={2}
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Primary Color</label>
          <div className="flex gap-3 items-center">
            <input
              type="color"
              value={profile.primary_color || '#1a1a1a'}
              onChange={set('primary_color')}
              className="w-10 h-10 rounded cursor-pointer border border-border"
            />
            <Input
              value={profile.primary_color || '#1a1a1a'}
              onChange={set('primary_color')}
              placeholder="#1a1a1a"
              className="flex-1"
            />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Accent Color</label>
          <div className="flex gap-3 items-center">
            <input
              type="color"
              value={profile.accent_color || '#4F46E5'}
              onChange={set('accent_color')}
              className="w-10 h-10 rounded cursor-pointer border border-border"
            />
            <Input
              value={profile.accent_color || '#4F46E5'}
              onChange={set('accent_color')}
              placeholder="#4F46E5"
              className="flex-1"
            />
          </div>
        </div>
        <Button type="submit" className="w-full h-11">
          Save & Continue <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </form>
    </motion.div>
  );
}