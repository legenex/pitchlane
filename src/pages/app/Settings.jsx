import React, { useState, useEffect } from 'react';
import useCurrentUser from '@/lib/useCurrentUser';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Lock, Users, Zap, Trash2, ArrowRight } from 'lucide-react';

export default function Settings() {
  const { user, clientId } = useCurrentUser();
  const [client, setClient] = useState(null);
  const [plan, setPlan] = useState(null);

  useEffect(() => {
    if (!clientId) return;
    loadData();
  }, [clientId]);

  const loadData = async () => {
    const clients = await base44.entities.Client.filter({ id: clientId });
    if (clients.length) {
      setClient(clients[0]);
      const plans = await base44.entities.Plan.filter({ id: clients[0].plan_id });
      if (plans.length) setPlan(plans[0]);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold mb-1">Settings</h1>
        <p className="text-muted-foreground">Manage your account and workspace.</p>
      </div>

      <Tabs defaultValue="account" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="plan">Plan</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="danger">Danger</TabsTrigger>
        </TabsList>

        {/* Account */}
        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input value={user?.full_name || ''} disabled className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input value={user?.email || ''} disabled className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-xs">Gmail Integration</label>
                <div className="mt-2 flex items-center justify-between bg-muted/50 border border-border rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Gmail not connected</span>
                  </div>
                  <Button variant="outline" size="sm">Connect</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Plan */}
        <TabsContent value="plan" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Current Plan</CardTitle>
              <CardDescription>Manage your subscription</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-lg">{plan?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    ${plan?.monthly_price}/month
                  </p>
                </div>
                {plan?.monthly_price === 0 && (
                  <Button variant="default" size="sm">
                    Upgrade <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                )}
              </div>
              <div className="border-t pt-4 space-y-2">
                {(plan?.features_json || []).map((f, i) => (
                  <div key={i} className="text-sm text-muted-foreground">✓ {f}</div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team */}
        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Team Members</CardTitle>
              <CardDescription>Max {plan?.max_users} members on {plan?.name}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium text-sm">{user?.full_name}</p>
                  <p className="text-xs text-muted-foreground">Owner</p>
                </div>
                <Badge variant="secondary">You</Badge>
              </div>
              <Button variant="outline" className="w-full">
                <Users className="w-4 h-4 mr-2" /> Invite Team Member
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Danger */}
        <TabsContent value="danger" className="space-y-4">
          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="text-base text-destructive">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" className="w-full">
                <Trash2 className="w-4 h-4 mr-2" /> Archive Workspace
              </Button>
              <p className="text-xs text-muted-foreground mt-3">This action cannot be undone. Your workspace and all artifacts will be archived.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}