import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AdminSettings() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold mb-1">Admin Settings</h1>
        <p className="text-muted-foreground">Global configuration and secrets.</p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="ai">AI Model</TabsTrigger>
          <TabsTrigger value="secrets">Secrets</TabsTrigger>
        </TabsList>

        {/* General */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pitchlane Brand</CardTitle>
              <CardDescription>Platform branding</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Platform Name</label>
                <Input defaultValue="Pitchlane" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Support Email</label>
                <Input type="email" placeholder="support@pitchlane.com" className="mt-1" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Model */}
        <TabsContent value="ai" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Default AI Model</CardTitle>
              <CardDescription>Used for artifact generation and extraction</CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <label className="text-sm font-medium">Model</label>
                <Input defaultValue="claude_sonnet_4_6" disabled className="mt-1" />
                <p className="text-xs text-muted-foreground mt-2">Update via backend configuration.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Secrets */}
        <TabsContent value="secrets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>Third-party integrations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Anthropic API Key</label>
                <Input type="password" placeholder="sk-ant-..." className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Scraper Service URL</label>
                <Input placeholder="https://scraper.example.com" className="mt-1" />
              </div>
              <Button>Save</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}