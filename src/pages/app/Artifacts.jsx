import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import useCurrentUser from '@/lib/useCurrentUser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Eye, Edit, Search, FileText, LayoutTemplate } from 'lucide-react';
import { motion } from 'framer-motion';

const STATUS_COLORS = {
  draft: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  published: 'bg-green-100 text-green-800 border-green-200',
  archived: 'bg-gray-100 text-gray-600 border-gray-200',
};

export default function Artifacts() {
  const { clientId } = useCurrentUser();
  const [artifacts, setArtifacts] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) return;
    loadData();
  }, [clientId]);

  const loadData = async () => {
    const [arts, tmps] = await Promise.all([
      base44.entities.Artifact.filter({ client_id: clientId }),
      base44.entities.ArtifactTemplate.list(),
    ]);
    setArtifacts(arts.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
    setTemplates(tmps);
    setLoading(false);
  };

  const getTemplate = (id) => templates.find(t => t.id === id);

  const filtered = artifacts.filter(a => {
    const matchSearch = a.title?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || a.status === filterStatus;
    return matchSearch && matchStatus;
  });

  if (loading) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Artifacts</h1>
          <p className="text-muted-foreground text-sm mt-1">Personalized pitches for your prospects.</p>
        </div>
        <Link to="/app/artifacts/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" /> New Artifact
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by title…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 w-56"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'draft', 'published', 'archived'].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                filterStatus === s ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-24 border-2 border-dashed border-border rounded-xl">
          <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">No artifacts yet</h3>
          <p className="text-muted-foreground mb-6">Generate your first personalized pitch to get started.</p>
          <Link to="/app/artifacts/new">
            <Button>Generate your first artifact</Button>
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((artifact, i) => {
            const tmpl = getTemplate(artifact.template_id);
            return (
              <motion.div
                key={artifact.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Card className="hover:border-primary/30 transition-colors group">
                  <CardContent className="p-5">
                    {/* Thumbnail placeholder */}
                    <div className="w-full h-32 rounded-lg bg-muted mb-4 flex items-center justify-center overflow-hidden">
                      {artifact.status === 'published' ? (
                        <iframe
                          src={`/p/${artifact.public_slug}?preview=1`}
                          className="w-[800px] h-[600px] scale-[0.2] origin-top-left pointer-events-none"
                          title="preview"
                        />
                      ) : (
                        <LayoutTemplate className="w-8 h-8 text-muted-foreground/40" />
                      )}
                    </div>

                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-sm line-clamp-2 flex-1">{artifact.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium shrink-0 ${STATUS_COLORS[artifact.status]}`}>
                        {artifact.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                      {tmpl && <span className="px-1.5 py-0.5 bg-muted rounded">{tmpl.name}</span>}
                      <span>·</span>
                      <Eye className="w-3 h-3" />
                      <span>{artifact.view_count || 0} views</span>
                      {artifact.last_viewed_at && (
                        <>
                          <span>·</span>
                          <span>{new Date(artifact.last_viewed_at).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Link to={`/app/artifacts/${artifact.id}/edit`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full gap-1">
                          <Edit className="w-3 h-3" /> Edit
                        </Button>
                      </Link>
                      {artifact.status === 'published' && (
                        <a href={`/p/${artifact.public_slug}`} target="_blank" rel="noreferrer">
                          <Button size="sm" variant="ghost" className="gap-1">
                            <Eye className="w-3 h-3" /> View
                          </Button>
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}