import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Globe, CheckCircle2, Loader2, AlertCircle, FileText, Users, Star, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { scrapeWebsite } from '@/functions/scrapeWebsite';

export default function Step2Scrape({ websiteUrl, clientId, onNext }) {
  const [status, setStatus] = useState('scanning');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    runScrape();
  }, []);

  const runScrape = async () => {
    setStatus('scanning');
    setError('');
    try {
      const res = await scrapeWebsite({ website_url: websiteUrl, client_id: clientId });
      setResult(res.data);
      setStatus('complete');
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Scrape failed');
      setStatus('error');
    }
  };

  const extractionSummary = result?.brand_extraction;

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Globe className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Scanning your website</h2>
        <p className="text-muted-foreground">We're extracting your brand context from {websiteUrl}</p>
      </div>

      {status === 'scanning' && (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Analyzing pages, extracting services, projects, testimonials...</p>
          <p className="text-xs text-muted-foreground/60 mt-2">This usually takes 30-60 seconds</p>
        </div>
      )}

      {status === 'error' && (
        <div className="text-center py-12">
          <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-4" />
          <p className="text-sm text-destructive mb-4">{error}</p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={runScrape}>Retry</Button>
            <Button onClick={() => onNext(null)}>Skip & Continue</Button>
          </div>
        </div>
      )}

      {status === 'complete' && (
        <div className="space-y-6">
          <div className="bg-muted/50 rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Scanned {result?.pages_scraped || 0} pages</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {result?.pages?.map((p, i) => (
                <span key={i} className="text-xs bg-card border border-border rounded-full px-3 py-1 text-muted-foreground">
                  {p.title || p.url}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {extractionSummary?.services?.length > 0 && (
              <SummaryCard
                icon={FileText}
                title="Services"
                items={extractionSummary.services.map(s => s.name)}
              />
            )}
            {extractionSummary?.notable_projects?.length > 0 && (
              <SummaryCard
                icon={Star}
                title="Notable Projects"
                items={extractionSummary.notable_projects.map(p => p.name)}
              />
            )}
            {extractionSummary?.social_proof?.length > 0 && (
              <SummaryCard
                icon={MessageSquare}
                title="Social Proof"
                items={extractionSummary.social_proof.map(s => s.content?.substring(0, 60) + '...')}
              />
            )}
            {extractionSummary?.differentiators?.length > 0 && (
              <SummaryCard
                icon={Users}
                title="Differentiators"
                items={extractionSummary.differentiators}
              />
            )}
          </div>

          {extractionSummary?.voice_tone && (
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Detected Voice & Tone</p>
              <p className="text-sm italic">"{extractionSummary.voice_tone}"</p>
            </div>
          )}

          <Button onClick={() => onNext(result)} className="w-full h-11">
            Looks Good — Continue <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
    </motion.div>
  );
}

function SummaryCard({ icon: Icon, title, items }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">{title}</span>
        <span className="text-xs text-muted-foreground">({items.length})</span>
      </div>
      <ul className="space-y-1.5">
        {items.slice(0, 5).map((item, i) => (
          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
            <span className="w-1 h-1 rounded-full bg-primary shrink-0 mt-2" />
            {item}
          </li>
        ))}
        {items.length > 5 && (
          <li className="text-xs text-muted-foreground/60">+{items.length - 5} more</li>
        )}
      </ul>
    </div>
  );
}