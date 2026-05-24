import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import useCurrentUser from '@/lib/useCurrentUser';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Clock, Users, ChevronRight } from 'lucide-react';

const STATUS_COLORS = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
  fulfilled: 'bg-green-50 text-green-700 border-green-200',
  partial: 'bg-orange-50 text-orange-700 border-orange-200',
  cancelled: 'bg-gray-50 text-gray-500 border-gray-200',
};

export default function AudienceRequestHistory() {
  const { clientId } = useCurrentUser();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!clientId) return;
    base44.entities.AudienceRequest.filter({ client_id: clientId }).then(rs => {
      setRequests(rs.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
      setLoading(false);
    });
  }, [clientId]);

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Audience Requests</h1>
          <p className="text-muted-foreground text-sm mt-1">{requests.length} total requests</p>
        </div>
        <Link to="/app/prospects/request">
          <Button className="gap-2"><Plus className="w-4 h-4" /> New Request</Button>
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 flex-wrap">
        {['all', 'pending', 'in_progress', 'fulfilled', 'partial', 'cancelled'].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${filter === s ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'}`}
          >
            {s === 'all' ? 'All' : s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-border rounded-xl">
          <Users className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground mb-4">No audience requests yet.</p>
          <Link to="/app/prospects/request"><Button>Request Your First Audience</Button></Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => (
            <Link key={r.id} to={`/app/prospects/requests/${r.id}`}>
              <div className="border border-border rounded-xl p-4 hover:border-primary/30 transition-colors flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium truncate">{r.title}</p>
                    {r.is_rush && <span className="text-xs px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded">Rush</span>}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{r.fulfilled_quantity || 0} / {r.requested_quantity} fulfilled</span>
                    <span>{r.credits_committed} credits</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(r.requested_at || r.created_date).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`px-2 py-0.5 text-xs rounded-full border font-medium ${STATUS_COLORS[r.status]}`}>{r.status}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}