import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useCurrentUser from '@/lib/useCurrentUser';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, FileText, RotateCw, Zap, Sparkles, BookOpen, Users } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const { user, clientId } = useCurrentUser();
  const [client, setClient] = useState(null);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);

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
    setLoading(false);
  };

  if (loading) return <div className="text-muted-foreground">Loading...</div>;

  const artifactUsagePercent = plan ? (client?.artifacts_used_this_period || 0) / plan.artifact_quota * 100 : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.full_name?.split(' ')[0]}!</h1>
        <p className="text-muted-foreground">You're on the <span className="font-semibold text-foreground">{plan?.name}</span> plan.</p>
      </div>

      {/* KPIs */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Artifacts Used"
          value={`${client?.artifacts_used_this_period || 0} / ${plan?.artifact_quota || 0}`}
          icon={FileText}
          progress={artifactUsagePercent}
        />
        <KPICard
          label="Revisions Pool"
          value={plan?.revisions_per_artifact || 0}
          sublabel="per artifact"
          icon={RotateCw}
        />
        <KPICard
          label="Credits Balance"
          value={client?.credits_balance || 0}
          icon={Zap}
        />
        <KPICard
          label="Team Members"
          value="1"
          sublabel="of 1"
          icon={Users}
        />
      </div>

      {/* CTAs */}
      <div className="grid sm:grid-cols-2 gap-4">
        <motion.div whileHover={{ y: -2 }} className="group">
          <Link to="/app/artifacts/new">
            <Card className="cursor-pointer border-2 border-primary/20 hover:border-primary/40 transition-colors h-full">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <h3 className="font-semibold mb-1">Generate your first artifact</h3>
                <p className="text-sm text-muted-foreground">Create a hyper-personalized pitch for a prospect.</p>
              </CardContent>
            </Card>
          </Link>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="group">
          <Link to="/app/knowledge">
            <Card className="cursor-pointer border border-border hover:border-primary/40 transition-colors h-full">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <h3 className="font-semibold mb-1">Expand your knowledge base</h3>
                <p className="text-sm text-muted-foreground">Add more content to improve artifact quality.</p>
              </CardContent>
            </Card>
          </Link>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Nothing yet — generate your first artifact to get started.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>Check back here once you start building.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function KPICard({ label, value, sublabel, icon: Icon, progress }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {sublabel && <p className="text-xs text-muted-foreground mt-1">{sublabel}</p>}
          </div>
          <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
            <Icon className="w-4.5 h-4.5 text-muted-foreground" />
          </div>
        </div>
        {progress !== undefined && (
          <Progress value={Math.min(progress, 100)} className="h-1.5" />
        )}
      </CardContent>
    </Card>
  );
}