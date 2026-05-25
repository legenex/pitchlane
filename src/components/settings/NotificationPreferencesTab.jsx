import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { Bell, Mail, Hash, CheckCircle2 } from 'lucide-react';

const NOTIFICATION_TYPES = [
  { key: 'prospect_hot', label: 'Prospect goes hot' },
  { key: 'artifact_viewed_first_time', label: 'Artifact first viewed' },
  { key: 'artifact_hot', label: 'Artifact heavily engaged' },
  { key: 'email_replied', label: 'Email reply received' },
  { key: 'email_bounced', label: 'Email bounced' },
  { key: 'audience_fulfilled', label: 'Audience request fulfilled' },
  { key: 'weekly_summary', label: 'Weekly summary digest' },
];

const DEFAULT_TYPES = Object.fromEntries(NOTIFICATION_TYPES.map(t => [t.key, true]));

export default function NotificationPreferencesTab({ userId }) {
  const { toast } = useToast();
  const [prefs, setPrefs] = useState(null);
  const [prefId, setPrefId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingSlack, setTestingSlack] = useState(false);

  useEffect(() => {
    if (!userId) return;
    loadPrefs();
  }, [userId]);

  const loadPrefs = async () => {
    const existing = await base44.entities.NotificationPreference.filter({ user_id: userId });
    if (existing.length) {
      setPrefId(existing[0].id);
      setPrefs({ ...existing[0] });
    } else {
      setPrefs({
        in_app_enabled: true,
        email_enabled: true,
        slack_enabled: false,
        slack_webhook_url: '',
        digest_frequency: 'realtime',
        types_enabled: DEFAULT_TYPES,
      });
    }
    setLoading(false);
  };

  const save = async () => {
    setSaving(true);
    if (prefId) {
      await base44.entities.NotificationPreference.update(prefId, prefs);
    } else {
      const created = await base44.entities.NotificationPreference.create({ user_id: userId, ...prefs });
      setPrefId(created.id);
    }
    setSaving(false);
    toast({ title: 'Preferences saved' });
  };

  const testSlack = async () => {
    if (!prefs?.slack_webhook_url) return;
    setTestingSlack(true);
    try {
      await fetch(prefs.slack_webhook_url, {
        method: 'POST',
        body: JSON.stringify({ text: '👋 Pitchlane notification test — your Slack integration is working!' }),
      });
      toast({ title: 'Test sent to Slack' });
    } catch {
      toast({ title: 'Failed to send test', variant: 'destructive' });
    }
    setTestingSlack(false);
  };

  const setField = (key, value) => setPrefs(p => ({ ...p, [key]: value }));
  const setTypeEnabled = (key, value) =>
    setPrefs(p => ({ ...p, types_enabled: { ...(p.types_enabled || DEFAULT_TYPES), [key]: value } }));

  if (loading || !prefs) return <p className="text-sm text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-6">
      {/* Channels */}
      <div className="space-y-4">
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Channels</p>

        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">In-app notifications</p>
              <p className="text-xs text-muted-foreground">Show in notification center</p>
            </div>
          </div>
          <Switch checked={prefs.in_app_enabled} onCheckedChange={v => setField('in_app_enabled', v)} />
        </div>

        <Separator />

        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Email notifications</p>
              <p className="text-xs text-muted-foreground">Sent from notify@pitchlane.co</p>
            </div>
          </div>
          <Switch checked={prefs.email_enabled} onCheckedChange={v => setField('email_enabled', v)} />
        </div>

        <Separator />

        <div className="space-y-3 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Slack notifications</p>
                <p className="text-xs text-muted-foreground">Send to a Slack channel via webhook</p>
              </div>
            </div>
            <Switch checked={prefs.slack_enabled} onCheckedChange={v => setField('slack_enabled', v)} />
          </div>
          {prefs.slack_enabled && (
            <div className="flex gap-2 ml-6">
              <Input
                placeholder="https://hooks.slack.com/services/..."
                value={prefs.slack_webhook_url || ''}
                onChange={e => setField('slack_webhook_url', e.target.value)}
                className="flex-1"
              />
              <Button variant="outline" size="sm" onClick={testSlack} disabled={testingSlack || !prefs.slack_webhook_url}>
                Test
              </Button>
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Digest frequency */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Digest frequency</p>
          <p className="text-xs text-muted-foreground">How often to batch email notifications</p>
        </div>
        <Select value={prefs.digest_frequency} onValueChange={v => setField('digest_frequency', v)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="realtime">Real-time</SelectItem>
            <SelectItem value="hourly">Hourly</SelectItem>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="never">Never</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Per-type toggles */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Notification Types</p>
        {NOTIFICATION_TYPES.map(t => (
          <div key={t.key} className="flex items-center justify-between py-1">
            <span className="text-sm">{t.label}</span>
            <Switch
              checked={(prefs.types_enabled || DEFAULT_TYPES)[t.key] !== false}
              onCheckedChange={v => setTypeEnabled(t.key, v)}
            />
          </div>
        ))}
      </div>

      <Button onClick={save} disabled={saving} className="gap-2">
        <CheckCircle2 className="w-4 h-4" />
        {saving ? 'Saving...' : 'Save Preferences'}
      </Button>
    </div>
  );
}