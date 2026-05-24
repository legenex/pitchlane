import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import useCurrentUser from '@/lib/useCurrentUser';
import { submitAudienceRequest } from '@/functions/submitAudienceRequest';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, X, ArrowLeft, Zap, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Link } from 'react-router-dom';

const NICHE_SIGNALS = {
  architecture: ['Researched residential architects', 'Visited Houzz/Architectural Digest', 'In-market for renovation', 'Searching for Pacific Heights renovation', 'Viewed construction permits'],
  wealth: ['Researched fiduciary advisors', 'Liquidity event recent', 'Researched estate planning', 'High net worth indicator', 'Property value $3M+'],
  law: ['Searched specific case types', 'Researched firms in practice area', 'Recent legal need indicator'],
  default: ['In-market buyer', 'Recently searched competitor', 'Visited industry publication', 'High intent signal'],
};

export default function AudienceRequestForm() {
  const { user, clientId } = useCurrentUser();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState('');
  const [niche, setNiche] = useState('');
  const [geo, setGeo] = useState('');
  const [description, setDescription] = useState('');
  const [signals, setSignals] = useState([]);
  const [customSignal, setCustomSignal] = useState('');
  const [quantity, setQuantity] = useState(100);
  const [isRush, setIsRush] = useState(false);

  useEffect(() => {
    if (!clientId) return;
    base44.entities.Client.filter({ id: clientId }).then(cs => {
      if (cs.length) {
        const c = cs[0];
        setClient(c);
        setNiche(c.niche || '');
        setGeo(c.target_geo || '');
      }
      setLoading(false);
    });
  }, [clientId]);

  const creditCost = isRush ? Math.ceil(quantity * 1.2) : quantity;
  const balance = client?.credits_balance || 0;
  const hasEnough = balance >= creditCost;

  const suggestedSignals = () => {
    const key = Object.keys(NICHE_SIGNALS).find(k => (niche || '').toLowerCase().includes(k));
    return NICHE_SIGNALS[key] || NICHE_SIGNALS.default;
  };

  const toggleSignal = (s) => {
    setSignals(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const addCustomSignal = () => {
    const t = customSignal.trim();
    if (t && !signals.includes(t)) {
      setSignals(prev => [...prev, t]);
      setCustomSignal('');
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !quantity) return;
    setSubmitting(true);
    const res = await submitAudienceRequest({
      client_id: clientId,
      title,
      niche,
      target_geo: geo,
      target_audience_description: description,
      intent_signals: signals,
      requested_quantity: quantity,
      is_rush: isRush,
    });
    setSubmitting(false);

    if (res.data?.request) {
      toast({ title: 'Request submitted!', description: "We'll notify you when prospects are ready." });
      navigate(`/app/prospects/requests/${res.data.request.id}`);
    } else {
      const err = res.data?.error;
      if (err === 'insufficient_credits') {
        toast({ title: 'Insufficient credits', description: `You need ${res.data.needed} credits but have ${res.data.balance}.`, variant: 'destructive' });
      } else {
        toast({ title: 'Error', description: err || 'Please try again.', variant: 'destructive' });
      }
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link to="/app/prospects"><Button variant="ghost" size="sm" className="gap-1 -ml-2 mb-4"><ArrowLeft className="w-4 h-4" /> Back</Button></Link>
        <h1 className="text-2xl font-bold">Request Audience</h1>
        <p className="text-muted-foreground text-sm mt-1">Tell us who you want to reach. We'll source and verify them for you.</p>
      </div>

      {/* Section 1 */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <h2 className="font-semibold">1. What are you looking for?</h2>
          <div>
            <label className="text-sm font-medium">Request title *</label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Pacific Heights luxury renovation prospects" className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Niche</label>
              <Input value={niche} onChange={e => setNiche(e.target.value)} placeholder="e.g. Architecture" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Target geography</label>
              <Input value={geo} onChange={e => setGeo(e.target.value)} placeholder="e.g. San Francisco, CA" className="mt-1" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Audience criteria</label>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Homeowners researching architects in last 30 days, $3M+ home value, Pacific Heights area"
              className="mt-1 h-24 text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Intent signals */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <h2 className="font-semibold">2. Intent signals</h2>
          <p className="text-sm text-muted-foreground">Select the signals that indicate a strong prospect.</p>
          <div className="flex gap-2 flex-wrap">
            {suggestedSignals().map(s => (
              <button
                key={s}
                onClick={() => toggleSignal(s)}
                className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                  signals.includes(s) ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary/50'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Input value={customSignal} onChange={e => setCustomSignal(e.target.value)} placeholder="Add custom signal…" className="flex-1 text-sm" onKeyDown={e => e.key === 'Enter' && addCustomSignal()} />
            <Button variant="outline" size="sm" onClick={addCustomSignal}><Plus className="w-4 h-4" /></Button>
          </div>
          {signals.filter(s => !suggestedSignals().includes(s)).map(s => (
            <Badge key={s} variant="secondary" className="gap-1 mr-1">
              {s} <button onClick={() => toggleSignal(s)}><X className="w-3 h-3" /></button>
            </Badge>
          ))}
        </CardContent>
      </Card>

      {/* Section 3: Quantity */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <h2 className="font-semibold">3. Quantity</h2>
          <div>
            <label className="text-sm font-medium">Number of prospects</label>
            <Input
              type="number"
              min={50}
              max={5000}
              value={quantity}
              onChange={e => setQuantity(Number(e.target.value))}
              className="mt-1 w-40"
            />
            <p className="text-xs text-muted-foreground mt-1">50 – 5,000 prospects per request</p>
          </div>

          {/* Timing */}
          <div className="space-y-2">
            <h2 className="font-semibold text-sm">4. Fulfillment speed</h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setIsRush(false)}
                className={`p-3 rounded-lg border-2 text-left transition-colors ${!isRush ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}
              >
                <p className="font-medium text-sm">Standard</p>
                <p className="text-xs text-muted-foreground">2–3 business days</p>
              </button>
              <button
                onClick={() => setIsRush(true)}
                className={`p-3 rounded-lg border-2 text-left transition-colors ${isRush ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}
              >
                <div className="flex items-center gap-1 mb-0.5">
                  <Zap className="w-3.5 h-3.5 text-yellow-500" />
                  <p className="font-medium text-sm">Rush</p>
                </div>
                <p className="text-xs text-muted-foreground">24h · +20% credits</p>
              </button>
            </div>
          </div>

          {/* Cost preview */}
          <div className={`rounded-lg p-4 border ${hasEnough ? 'bg-muted/30 border-border' : 'bg-destructive/5 border-destructive/30'}`}>
            <div className="flex items-center justify-between text-sm">
              <span>{quantity.toLocaleString()} prospects{isRush ? ' (rush +20%)' : ''}</span>
              <span className="font-semibold">{creditCost.toLocaleString()} credits</span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
              <span>Your balance</span>
              <span className={hasEnough ? '' : 'text-destructive font-medium'}>{balance.toLocaleString()} credits</span>
            </div>
            {!hasEnough && (
              <div className="flex items-center gap-2 mt-2 text-xs text-destructive">
                <AlertTriangle className="w-3.5 h-3.5" />
                Insufficient credits. <Link to="/app/credits" className="underline">Buy more</Link> or reduce quantity.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={handleSubmit}
        disabled={submitting || !title.trim() || !hasEnough}
        className="w-full gap-2"
        size="lg"
      >
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
        Submit Request · {creditCost.toLocaleString()} credits
      </Button>
    </div>
  );
}