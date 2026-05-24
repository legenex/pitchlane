import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Users, Clock, Zap, ChevronRight } from 'lucide-react';

const STATUS_COLORS = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
  fulfilled: 'bg-green-50 text-green-700 border-green-200',
  partial: 'bg-orange-50 text-orange-700 border-orange-200',
  cancelled: 'bg-gray-50 text-gray-500 border-gray-200',
};

export default function AudienceRequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.AudienceRequest.filter({ id }).then(rs => {
      if (rs.length) setRequest(rs[0]);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div className="text-muted-foreground p-4">Loading...</div>;
  if (!request) return <div className="text-muted-foreground p-4">Request not found.</div>;

  return (
    <div className="max-w-2xl space-y-6">
      <Link to="/app/prospects/requests">
        <Button variant="ghost" size="sm" className="gap-1 -ml-2"><ArrowLeft className="w-4 h-4" /> Back to Requests</Button>
      </Link>

      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">{request.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">Submitted {new Date(request.requested_at || request.created_date).toLocaleDateString()}</p>
        </div>
        <div className="flex items-center gap-2">
          {request.is_rush && <span className="flex items-center gap-1 text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded"><Zap className="w-3 h-3" />Rush</span>}
          <span className={`px-2.5 py-1 text-sm rounded-full border font-medium ${STATUS_COLORS[request.status]}`}>{request.status}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{request.requested_quantity}</p>
            <p className="text-xs text-muted-foreground">Requested</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{request.fulfilled_quantity || 0}</p>
            <p className="text-xs text-muted-foreground">Fulfilled</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{request.credits_committed}</p>
            <p className="text-xs text-muted-foreground">Credits</p>
          </CardContent>
        </Card>
      </div>

      {/* Criteria */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Request Criteria</CardTitle></CardHeader>
        <CardContent className="p-5 pt-0 space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div><p className="text-xs text-muted-foreground">Niche</p><p className="font-medium">{request.niche || '—'}</p></div>
            <div><p className="text-xs text-muted-foreground">Geography</p><p className="font-medium">{request.target_geo || '—'}</p></div>
          </div>
          {request.target_audience_description && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Audience Criteria</p>
              <p className="text-sm text-muted-foreground">{request.target_audience_description}</p>
            </div>
          )}
          {(request.intent_signals || []).length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Intent Signals</p>
              <div className="flex gap-2 flex-wrap">
                {request.intent_signals.map((s, i) => (
                  <span key={i} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">{s}</span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Admin notes */}
      {request.fulfillment_notes && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Notes from our team</CardTitle></CardHeader>
          <CardContent className="p-5 pt-0">
            <p className="text-sm text-muted-foreground">{request.fulfillment_notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {(request.fulfilled_quantity || 0) > 0 && (
          <Link to={`/app/prospects?audience_request_id=${request.id}`}>
            <Button className="gap-2">
              <Users className="w-4 h-4" /> View {request.fulfilled_quantity} Prospects
            </Button>
          </Link>
        )}
        <Link to="/app/prospects/request">
          <Button variant="outline">Request More Like This</Button>
        </Link>
      </div>
    </div>
  );
}