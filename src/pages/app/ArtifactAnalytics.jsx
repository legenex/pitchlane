import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Eye, Clock, MousePointer, Smartphone, Monitor, Tablet, Flame } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const HOT_SECONDS = 60;

export default function ArtifactAnalytics() {
  const { id } = useParams();
  const [artifact, setArtifact] = useState(null);
  const [views, setViews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    const [arts, viewData] = await Promise.all([
      base44.entities.Artifact.filter({ id }),
      base44.entities.ArtifactView.filter({ artifact_id: id }),
    ]);
    if (arts.length) setArtifact(arts[0]);
    setViews(viewData.sort((a, b) => new Date(b.opened_at) - new Date(a.opened_at)));
    setLoading(false);
  };

  if (loading) return <div className="text-muted-foreground p-8">Loading analytics…</div>;
  if (!artifact) return <div className="text-muted-foreground p-8">Artifact not found.</div>;

  const totalViews = views.length;
  const avgTime = totalViews ? Math.round(views.reduce((s, v) => s + (v.time_spent_seconds || 0), 0) / totalViews) : 0;
  const totalCtaClicks = views.reduce((s, v) => s + (v.cta_clicks?.length || 0), 0);

  // Device breakdown
  const deviceCounts = views.reduce((acc, v) => {
    acc[v.device_type || 'desktop'] = (acc[v.device_type || 'desktop'] || 0) + 1;
    return acc;
  }, {});

  // Section heatmap
  const sectionMap = {};
  views.forEach(v => {
    (v.sections_viewed || []).forEach(sv => {
      if (!sectionMap[sv.section_key]) sectionMap[sv.section_key] = { count: 0, total_time: 0 };
      sectionMap[sv.section_key].count += 1;
      sectionMap[sv.section_key].total_time += (sv.total_time_seconds || 0);
    });
  });
  const sectionHeatmap = Object.entries(sectionMap).map(([key, data]) => ({
    key,
    reach_pct: totalViews ? Math.round((data.count / totalViews) * 100) : 0,
    avg_time: data.count ? Math.round(data.total_time / data.count) : 0,
  }));

  // Time distribution for histogram (bucket by 10s)
  const timeBuckets = {};
  views.forEach(v => {
    const bucket = Math.floor((v.time_spent_seconds || 0) / 10) * 10;
    const label = `${bucket}–${bucket + 10}s`;
    timeBuckets[label] = (timeBuckets[label] || 0) + 1;
  });
  const timeData = Object.entries(timeBuckets).map(([label, count]) => ({ label, count }));

  // Hot leads
  const sessionCounts = {};
  views.forEach(v => { sessionCounts[v.session_id] = (sessionCounts[v.session_id] || 0) + 1; });
  const hotViews = views.filter(v => (v.time_spent_seconds || 0) >= HOT_SECONDS || (sessionCounts[v.session_id] || 0) >= 2);

  const DEVICE_ICONS = { mobile: Smartphone, desktop: Monitor, tablet: Tablet };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <Link to={`/app/artifacts/${id}/edit`}>
          <Button variant="ghost" size="sm" className="gap-1"><ArrowLeft className="w-4 h-4" /> Back to editor</Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">{artifact.title}</h1>
          <p className="text-sm text-muted-foreground">View analytics</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon={Eye} label="Total Views" value={totalViews} />
        <KPICard icon={Clock} label="Avg. Time on Page" value={`${avgTime}s`} />
        <KPICard icon={MousePointer} label="CTA Clicks" value={totalCtaClicks} />
        <KPICard icon={Flame} label="Hot Leads" value={hotViews.length} highlight={hotViews.length > 0} />
      </div>

      {/* View timeline */}
      <Card>
        <CardHeader><CardTitle className="text-base">View Timeline</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-64 overflow-auto">
            {views.length === 0 && <p className="text-sm text-muted-foreground">No views yet.</p>}
            {views.map((v, i) => {
              const isHot = (v.time_spent_seconds || 0) >= HOT_SECONDS || (sessionCounts[v.session_id] || 0) >= 2;
              const DevIcon = DEVICE_ICONS[v.device_type] || Monitor;
              return (
                <div key={v.id} className={`flex items-center justify-between p-2 rounded-lg text-sm ${isHot ? 'bg-orange-50 border border-orange-200' : 'bg-muted/40'}`}>
                  <div className="flex items-center gap-2">
                    <DevIcon className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">{new Date(v.opened_at).toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground">{v.device_type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{v.time_spent_seconds || 0}s</span>
                    {isHot && <Badge className="bg-orange-500 text-white text-xs">Hot 🔥</Badge>}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Time distribution */}
        <Card>
          <CardHeader><CardTitle className="text-base">Time Distribution</CardTitle></CardHeader>
          <CardContent>
            {timeData.length === 0 ? <p className="text-sm text-muted-foreground">No data yet.</p> : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={timeData}>
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Device breakdown */}
        <Card>
          <CardHeader><CardTitle className="text-base">Device Breakdown</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3 pt-2">
              {Object.entries(deviceCounts).map(([device, count]) => {
                const DevIcon = DEVICE_ICONS[device] || Monitor;
                const pct = totalViews ? Math.round((count / totalViews) * 100) : 0;
                return (
                  <div key={device} className="flex items-center gap-3">
                    <DevIcon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm capitalize flex-1">{device}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-muted rounded-full h-1.5">
                        <div className="bg-primary h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground w-8 text-right">{pct}%</span>
                    </div>
                  </div>
                );
              })}
              {Object.keys(deviceCounts).length === 0 && <p className="text-sm text-muted-foreground">No views yet.</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section heatmap */}
      <Card>
        <CardHeader><CardTitle className="text-base">Section Heatmap</CardTitle></CardHeader>
        <CardContent>
          {sectionHeatmap.length === 0 ? (
            <p className="text-sm text-muted-foreground">No section data yet.</p>
          ) : (
            <div className="space-y-3">
              {sectionHeatmap.sort((a, b) => b.reach_pct - a.reach_pct).map(s => (
                <div key={s.key} className="flex items-center gap-3">
                  <span className="text-sm capitalize w-40 shrink-0">{s.key.replace(/_/g, ' ')}</span>
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${s.reach_pct}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground w-12 text-right">{s.reach_pct}% reached</span>
                  <span className="text-xs text-muted-foreground w-14 text-right">{s.avg_time}s avg</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function KPICard({ icon: Icon, label, value, highlight }) {
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