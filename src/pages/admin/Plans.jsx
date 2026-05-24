import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit2, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function AdminPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const data = await base44.asServiceRole.entities.Plan.list();
    setPlans(data.sort((a, b) => a.monthly_price - b.monthly_price));
    setLoading(false);
  };

  if (loading) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold mb-1">Plans</h1>
        <p className="text-muted-foreground">Manage pricing and features.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {plans.map(plan => (
          <Card key={plan.id} className="relative">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <p className="text-2xl font-bold mt-2">${plan.monthly_price}</p>
                  <p className="text-sm text-muted-foreground">/month</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Edit2 className="w-4 h-4 mr-2" /> Edit
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Artifacts/mo</p>
                  <p className="font-semibold">{plan.artifact_quota}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Revisions</p>
                  <p className="font-semibold">{plan.revisions_per_artifact}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Credits</p>
                  <p className="font-semibold">{plan.credits_included}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Max Users</p>
                  <p className="font-semibold">{plan.max_users}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Features</p>
                <ul className="space-y-1">
                  {(plan.features_json || []).map((f, i) => (
                    <li key={i} className="text-xs text-muted-foreground">✓ {f}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}