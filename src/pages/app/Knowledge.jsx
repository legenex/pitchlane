import React, { useState, useEffect } from 'react';
import useCurrentUser from '@/lib/useCurrentUser';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, FileText, Image, Video, Globe, Loader2, Trash2, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TYPE_ICONS = {
  pdf: FileText,
  image: Image,
  video: Video,
  youtube: Video,
  vimeo: Video,
  instagram: Globe,
  website_scrape: Globe,
};

export default function Knowledge() {
  const { clientId } = useCurrentUser();
  const [activeTab, setActiveTab] = useState('assets');
  const [assets, setAssets] = useState([]);
  const [brandProfile, setBrandProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) return;
    loadData();
  }, [clientId]);

  const loadData = async () => {
    const [assetsData, profiles] = await Promise.all([
      base44.entities.KnowledgeAsset.filter({ client_id: clientId }),
      base44.entities.BrandProfile.filter({ client_id: clientId }),
    ]);
    setAssets(assetsData);
    if (profiles.length) setBrandProfile(profiles[0]);
    setLoading(false);
  };

  if (loading) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1">Knowledge Base</h1>
        <p className="text-muted-foreground">Manage your brand assets and brand profile.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="assets">Assets ({assets.length})</TabsTrigger>
          <TabsTrigger value="brand">Brand Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="assets" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Knowledge Assets</h2>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" /> Add Content
            </Button>
          </div>

          <div className="grid gap-3">
            <AnimatePresence>
              {assets.map(asset => {
                const Icon = TYPE_ICONS[asset.type] || FileText;
                const statusColor = {
                  parsing: 'bg-primary/10 text-primary',
                  ready: 'bg-emerald-50 text-emerald-700',
                  failed: 'bg-destructive/10 text-destructive',
                  archived: 'bg-muted text-muted-foreground',
                }[asset.status] || 'bg-muted text-muted-foreground';

                return (
                  <motion.div
                    key={asset.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-4 p-4 bg-card border border-border rounded-lg hover:border-primary/30 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{asset.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {asset.type} · {new Date(asset.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${statusColor}`}>
                      {asset.status === 'parsing' && <Loader2 className="w-3 h-3 inline animate-spin mr-1" />}
                      {asset.status.charAt(0).toUpperCase() + asset.status.slice(1)}
                    </div>
                    <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {!assets.length && (
              <Card className="border-dashed">
                <CardContent className="pt-12 text-center">
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold mb-1">No assets yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">Add PDFs, images, videos, or URLs to enrich your knowledge base.</p>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" /> Add Content
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="brand" className="space-y-4">
          <h2 className="text-lg font-semibold">Brand Profile</h2>
          {brandProfile ? (
            <div className="grid sm:grid-cols-2 gap-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Voice & Tone</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground italic">"{brandProfile.voice_tone || 'Not set'}"</p>
                </CardContent>
              </Card>
              {/* Value Propositions, Services, etc. — abbreviated for now */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Value Propositions</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {(brandProfile.value_propositions || []).map((vp, i) => (
                      <li key={i} className="text-sm">• {vp}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="pt-12 text-center">
                <p className="text-muted-foreground">Your brand profile will appear here after onboarding.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}