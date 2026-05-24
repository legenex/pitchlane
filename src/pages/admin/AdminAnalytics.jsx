import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Eye, RotateCw, Flame, LayoutTemplate } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const HOT_SECONDS = 60;

export default function AdminAnalytics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [artifacts, views, templates] = await Promise.all([
      base44.asServiceRole.entities.Artifact.list(),
      base44.asServiceRole.entities.ArtifactView.list(),
      base44.asServiceRole.entities.ArtifactTemplate.list(),
    ]);

    const published = artifacts.filter(a => a.status === 'published');
    const totalViews = views.length;
    const avgRevisions = artifacts.length ? (artifacts.reduce((s, a) => s + (a.revisions_used || 0), 0) / artifacts.length).toFixed(1) : 0;
    const avgViews = published.length ? (published.reduce((s, a) => s + (a.view_count || 0), 0) / published.length).toFixed(1) : 0;

    // Hot leads
    const sessionCounts = {};
    views.forEach(v => { sessionCounts[v.session_id] = (sessionCounts[v.session_id] || 0) + 1; });
    const hotViews = views.filter(v => (v.time_spent_seconds || 0) >= HOT_SECONDS || (sessionCounts[v.session_id] || 0) >= 2);
    const hotRate = totalViews ? Math.round((hotViews.length / totalViews) * 100) : 0;

    // CTA clicks
    const totalCtaClicks = views.reduce((s, v) => s + (v.cta_clicks?.length || 0), 0);
    const ctaRate = totalViews ? Math.round((totalCtaClicks / totalViews) * 100) : 0;

    // Template popularity
    const templateCounts = {};
    artifacts.forEach(a => { templateCounts[a.template_id] = (templateCounts[a.template_id] || 0) + 1; });
    const templateData = templates.map(t => ({
      name: t.name,
      count: templateCounts[t.id] || 0,
    })).sort((a, b) => b.count - a.count);

    setStats({ totalArtifacts: artifacts.length, avgRevisions, avgViews, hotRate, ctaRate, templateData, totalViews });
    setLoading(false);
  };

  if (loading) return <div className="text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1">Platform Analytics</h1>
        <p className="text-muted-foreground text-sm">Aggregate metrics across all clients.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon={FileText} label="Total Artifacts" value={stats.totalArtifacts} />
        <StatCard icon={Eye} label="Total Views" value={stats.totalViews} />
        <StatCard icon={RotateCw} label="Avg Revisions" value={stats.avgRevisions} />
        <StatCard icon={Eye} label="Avg Views (published)" value={stats.avgViews} />
        <StatCard icon={Flame} label="Hot Lead Rate" value={`${stats.hotRate}%`} highlight={stats.hotRate > 20} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Template Popularity</CardTitle></CardHeader>
          <CardContent>
            {stats.templateData.length === 0 ? (
              <p className="text-sm text-muted-foreground">No artifacts generated yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats.templateData} layout="vertical">
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">CTA Click Rate</CardTitle></CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <p className="text-5xl font-bold">{stats.ctaRate}%</p>
            <p className="text-sm text-muted-foreground mt-2">of views result in a CTA click</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, highlight }) {
  return (
    <Card className={highlight ? 'border-orange-300 bg-orange-50' : ''}>
      <CardContent className="pt-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
          </div>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${highlight ? 'bg-orange-100' : 'bg-muted'}`}>
            <Icon className={`w-4 h-4 ${highlight ? 'text-orange-500' : 'text-muted-foreground'}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}