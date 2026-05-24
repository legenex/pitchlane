import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Eye, LogIn, ZapOff, Zap } from 'lucide-react';

export default function AdminClients() {
  const [clients, setClients] = useState([]);
  const [plans, setPlans] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [clientsData, plansData] = await Promise.all([
      base44.asServiceRole.entities.Client.list(),
      base44.asServiceRole.entities.Plan.list(),
    ]);
    setClients(clientsData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    setPlans(plansData);
    setLoading(false);
  };

  const getPlan = (planId) => plans.find(p => p.id === planId);

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.slug.toLowerCase().includes(search.toLowerCase())
  );

  const handleImpersonate = (clientSlug) => {
    window.open(`/app?impersonate=${clientSlug}`, '_blank');
  };

  if (loading) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-4">Clients</h1>
        <Input
          placeholder="Search clients..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="space-y-2">
        {filteredClients.map(client => {
          const plan = getPlan(client.plan_id);
          return (
            <Card key={client.id} className="hover:border-primary/30 transition-colors">
              <CardContent className="py-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold truncate">{client.name}</h3>
                      <Badge variant="outline" className="shrink-0">{client.status}</Badge>
                      <Badge variant="secondary" className="shrink-0">{plan?.name}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{client.slug} · Created {new Date(client.created_at).toLocaleDateString()}</p>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link to={`/admin/clients/${client.slug}`} className="flex items-center">
                          <Eye className="w-4 h-4 mr-2" /> View
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleImpersonate(client.slug)}>
                        <LogIn className="w-4 h-4 mr-2" /> Impersonate
                      </DropdownMenuItem>
                      {client.status === 'active' && (
                        <DropdownMenuItem className="text-destructive">
                          <ZapOff className="w-4 h-4 mr-2" /> Suspend
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}