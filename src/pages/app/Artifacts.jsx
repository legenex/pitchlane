import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import useCurrentUser from '@/lib/useCurrentUser';
import { Plus, Eye, Edit, Search, FileText, LayoutTemplate } from 'lucide-react';
import { motion } from 'framer-motion';

// Template accent colors: chestnut / burgundy / vermillion
const TEMPLATE_ACCENTS = ['#6B4226', '#7C2D2D', '#EF3E2C'];

const STATUS_STYLE = {
  draft:     { bg: 'rgba(244,180,0,0.12)',  color: '#9A6800' },
  published: { bg: 'rgba(14,92,74,0.1)',   color: 'var(--secondary)' },
  archived:  { bg: 'var(--canvas)',         color: 'var(--ink-muted)' },
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
  const getTemplateAccent = (id) => {
    const idx = templates.findIndex(t => t.id === id);
    return TEMPLATE_ACCENTS[idx % TEMPLATE_ACCENTS.length] || 'var(--accent)';
  };

  const filtered = artifacts.filter(a => {
    const matchSearch = a.title?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || a.status === filterStatus;
    return matchSearch && matchStatus;
  });

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
      <div style={{ width: 28, height: 28, border: '3px solid var(--line)', borderTop: '3px solid var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 320 }}>
          <Search size={13} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-muted)', pointerEvents: 'none' }} />
          <input
            placeholder="Search by title…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', fontFamily: 'var(--font-body)', fontSize: 14, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius-pill)', padding: '9px 16px 9px 34px', color: 'var(--ink)', outline: 'none', boxSizing: 'border-box' }}
            onFocus={e => e.target.style.borderColor = 'rgba(242,92,42,0.4)'}
            onBlur={e => e.target.style.borderColor = 'var(--line)'}
          />
        </div>
        {/* Status filter */}
        <div style={{ display: 'flex', gap: 6 }}>
          {['all', 'draft', 'published', 'archived'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              style={{
                fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500,
                padding: '6px 14px', borderRadius: 'var(--radius-pill)',
                border: '1px solid var(--line)',
                background: filterStatus === s ? 'var(--ink)' : 'transparent',
                color: filterStatus === s ? 'var(--canvas)' : 'var(--ink-soft)',
                cursor: 'pointer', transition: 'all 150ms',
              }}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        {/* CTA */}
        <Link to="/app/artifacts/new" style={{ textDecoration: 'none', marginLeft: 'auto' }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, background: 'var(--accent)', color: '#fff', padding: '9px 20px', borderRadius: 'var(--radius-pill)', border: 'none', cursor: 'pointer', boxShadow: 'var(--shadow-accent)', transition: 'transform 150ms', whiteSpace: 'nowrap' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
            <Plus size={14} /> New Artifact
          </button>
        </Link>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 24px', background: 'var(--surface)', borderRadius: 'var(--radius-xl)', border: '1px dashed var(--line)' }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: 'var(--canvas)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <FileText size={24} style={{ color: 'var(--ink-muted)' }} />
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 22, color: 'var(--ink)', marginBottom: 8 }}>No artifacts yet</div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink-soft)', maxWidth: 360, margin: '0 auto 24px' }}>Generate your first personalized pitch to get started.</p>
          <Link to="/app/artifacts/new" style={{ textDecoration: 'none' }}>
            <button style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, background: 'var(--accent)', color: '#fff', padding: '10px 28px', borderRadius: 'var(--radius-pill)', border: 'none', cursor: 'pointer', boxShadow: 'var(--shadow-accent)' }}>Generate your first artifact</button>
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }} className="artifacts-grid">
          {filtered.map((artifact, i) => {
            const tmpl = getTemplate(artifact.template_id);
            const accent = getTemplateAccent(artifact.template_id);
            const st = STATUS_STYLE[artifact.status] || STATUS_STYLE.draft;
            return (
              <motion.div key={artifact.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="card-lift"
                style={{ background: 'var(--surface)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--line)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {/* Gradient banner */}
                <div style={{ height: 120, background: `linear-gradient(135deg, ${accent}22, ${accent}55)`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {artifact.status === 'published' ? (
                      <iframe
                        src={`/p/${artifact.public_slug}?preview=1`}
                        style={{ width: 800, height: 600, transform: 'scale(0.18)', transformOrigin: 'top center', pointerEvents: 'none', position: 'absolute', top: 0 }}
                        title="preview"
                      />
                    ) : (
                      <LayoutTemplate size={32} style={{ color: accent, opacity: 0.4 }} />
                    )}
                  </div>
                  {/* Template name badge */}
                  {tmpl && (
                    <span style={{ position: 'absolute', bottom: 10, left: 12, fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.16em', background: accent, color: '#fff', borderRadius: 'var(--radius-pill)', padding: '3px 8px' }}>
                      {tmpl.name}
                    </span>
                  )}
                </div>

                {/* Body */}
                <div style={{ padding: '16px 20px 20px', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, color: 'var(--ink)', lineHeight: 1.3, flex: 1, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{artifact.title}</div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.14em', background: st.bg, color: st.color, borderRadius: 'var(--radius-pill)', padding: '4px 8px', whiteSpace: 'nowrap', flexShrink: 0 }}>{artifact.status}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-muted)' }}>
                    <Eye size={11} />
                    <span>{artifact.view_count || 0} views</span>
                    {artifact.last_viewed_at && (
                      <>
                        <span>·</span>
                        <span>{new Date(artifact.last_viewed_at).toLocaleDateString()}</span>
                      </>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                    <Link to={`/app/artifacts/${artifact.id}/edit`} style={{ textDecoration: 'none', flex: 1 }}>
                      <button style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500, background: 'var(--canvas)', color: 'var(--ink-soft)', padding: '8px 0', borderRadius: 'var(--radius-pill)', border: '1px solid var(--line)', cursor: 'pointer', transition: 'all 150ms' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--line)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'var(--canvas)'}>
                        <Edit size={12} /> Edit
                      </button>
                    </Link>
                    {artifact.status === 'published' && (
                      <a href={`/p/${artifact.public_slug}`} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                        <button style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500, background: 'transparent', color: 'var(--ink-soft)', padding: '8px 14px', borderRadius: 'var(--radius-pill)', border: '1px solid var(--line)', cursor: 'pointer', transition: 'all 150ms' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--canvas)'; e.currentTarget.style.color = 'var(--ink)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--ink-soft)'; }}>
                          <Eye size={12} /> View
                        </button>
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 900px) { .artifacts-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 560px) { .artifacts-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}