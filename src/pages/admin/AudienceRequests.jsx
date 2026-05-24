import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { fulfillAudienceRequest } from '@/functions/fulfillAudienceRequest';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Clock, Zap, ChevronRight, PlayCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const STATUS_TABS = ['all', 'pending', 'in_progress', 'fulfilled', 'partial', 'cancelled'];
const STATUS_COLORS = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
  fulfilled: 'bg-green-50 text-green-700 border-green-200',
  partial: 'bg-orange-50 text-orange-700 border-orange-200',
  cancelled: 'bg-gray-50 text-gray-500 border-gray-200',
};

export default function AudienceRequests() {
  const { toast } = useToast();
  const [requests, setRequests] = useState([]);
  const [clients, setClients] = useState({});
  const [plans, setPlans] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [reqs, clientList, planList] = await Promise.all([
      base44.asServiceRole.entities.AudienceRequest.list('-created_date', 200),
      base44.asServiceRole.entities.Client.list(),
      base44.asServiceRole.entities.Plan.list(),
    ]);
    const cm = {};
    clientList.forEach(c => { cm[c.id] = c; });
    const pm = {};
    planList.forEach(p => { pm[p.id] = p; });
    setClients(cm);
    setPlans(pm);
    setRequests(reqs);
    setLoading(false);
  };

  const tabCount = (s) => s === 'all' ? requests.length : requests.filter(r => r.status === s).length;
  const filtered = activeTab === 'all' ? requests : requests.filter(r => r.status === activeTab);

  const handleStart = async (id) => {
    const res = await fulfillAudienceRequest({ audience_request_id: id, action: 'start' });
    if (res.data?.request) {
      setRequests(prev => prev.map(r => r.id === id ? res.data.request : r));
      toast({ title: 'Fulfillment started' });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Audience Request Queue</h1>
        <p className="text-muted-foreground text-sm mt-1">Fulfillment workhorse — manage all incoming audience requests.</p>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {['pending', 'in_progress', 'fulfilled', 'partial', 'cancelled'].map(s => (
          <Card key={s} className="cursor-pointer hover:border-primary/30 transition-colors" onClick={() => setActiveTab(s)}>
            <CardContent className="p-3 text-center">
              <p className="text-xl font-bold">{tabCount(s)}</p>
              <p className="text-xs text-muted-foreground capitalize">{s.replace('_', ' ')}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 flex-wrap border-b border-border">
        {STATUS_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab === 'all' ? 'All' : tab.replace('_', ' ')} ({tabCount(tab)})
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">No requests in this status.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => {
            const client = clients[r.client_id];
            const plan = client?.plan_id ? plans[client.plan_id] : null;
            return (
              <div key={r.id} className="border border-border rounded-xl p-4 flex items-center justify-between gap-4 hover:border-primary/20 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-medium">{r.title}</span>
                    {r.is_rush && <span className="text-xs px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded flex items-center gap-0.5"><Zap className="w-2.5 h-2.5" />Rush</span>}
                    <span className={`text-xs px-1.5 py-0.5 rounded-full border ${STATUS_COLORS[r.status]}`}>{r.status}</span>
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-4 flex-wrap">
                    <span className="font-medium text-foreground">{client?.name || 'Unknown client'}</span>
                    {plan && <span className="px-1.5 py-0.5 bg-muted rounded">{plan.name}</span>}
                    <span>{r.niche} · {r.target_geo}</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{r.fulfilled_quantity || 0}/{r.requested_quantity}</span>
                    <span>{r.credits_committed} credits</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(r.requested_at || r.created_date).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {r.status === 'pending' && (
                    <Button size="sm" variant="outline" onClick={() => handleStart(r.id)} className="gap-1">
                      <PlayCircle className="w-3.5 h-3.5" /> Start
                    </Button>
                  )}
                  <Link to={`/admin/audience-requests/${r.id}`}>
                    <Button size="sm" className="gap-1">
                      Fulfill <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}