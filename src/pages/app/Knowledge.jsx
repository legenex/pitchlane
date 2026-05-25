import React, { useState, useEffect } from 'react';
import useCurrentUser from '@/lib/useCurrentUser';
import { base44 } from '@/api/base44Client';
import { Plus, FileText, Image, Video, Globe, Loader2, Trash2, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TYPE_ICONS = {
  pdf: FileText,
  image: Image,
  video: Video,
  youtube: Video,
  vimeo: Video,
  instagram: Globe,
  website_scrape: Globe,
};

const STATUS_STYLE = {
  parsing:  { bg: 'rgba(242,92,42,0.1)',  color: 'var(--accent)',    label: 'Parsing' },
  ready:    { bg: 'rgba(14,92,74,0.1)',   color: 'var(--secondary)', label: 'Ready' },
  failed:   { bg: 'rgba(234,67,53,0.1)', color: 'var(--danger)',    label: 'Failed' },
  archived: { bg: 'var(--canvas)',        color: 'var(--ink-muted)', label: 'Archived' },
};

export default function Knowledge() {
  const { clientId } = useCurrentUser();
  const [activeTab, setActiveTab] = useState('assets');
  const [assets, setAssets] = useState([]);
  const [brandProfile, setBrandProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) return;
    loadData();
  }, [clientId]);

  const loadData = async () => {
    const [assetsData, profiles] = await Promise.all([
      base44.entities.KnowledgeAsset.filter({ client_id: clientId }),
      base44.entities.BrandProfile.filter({ client_id: clientId }),
    ]);
    setAssets(assetsData);
    if (profiles.length) setBrandProfile(profiles[0]);
    setLoading(false);
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
      <div style={{ width: 28, height: 28, border: '3px solid var(--line)', borderTop: '3px solid var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const TABS = [
    { id: 'assets', label: `Assets`, count: assets.length },
    { id: 'brand', label: 'Brand Profile' },
  ];

  return (
    <div style={{ maxWidth: 900 }}>
      {/* Tab pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{
              fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500,
              padding: '8px 20px', borderRadius: 'var(--radius-pill)',
              border: '1px solid var(--line)',
              background: activeTab === t.id ? 'var(--ink)' : 'transparent',
              color: activeTab === t.id ? 'var(--canvas)' : 'var(--ink-soft)',
              cursor: 'pointer', transition: 'all 150ms',
            }}>
            {t.label}{t.count !== undefined ? ` (${t.count})` : ''}
          </button>
        ))}
      </div>

      {activeTab === 'assets' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--ink)' }}>
              Knowledge <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>assets</em>
            </div>
            <button style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, background: 'var(--accent)', color: '#fff', padding: '8px 20px', borderRadius: 'var(--radius-pill)', border: 'none', cursor: 'pointer', boxShadow: 'var(--shadow-accent)' }}>
              <Plus size={14} /> Add Content
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <AnimatePresence>
              {assets.map(asset => {
                const Icon = TYPE_ICONS[asset.type] || FileText;
                const st = STATUS_STYLE[asset.status] || STATUS_STYLE.archived;
                return (
                  <motion.div key={asset.id}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
                    className="card-lift"
                    style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--line)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--canvas)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={18} style={{ color: 'var(--ink-muted)' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{asset.title}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--ink-muted)', marginTop: 3 }}>
                        {asset.type} · {new Date(asset.created_date).toLocaleDateString()}
                      </div>
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.14em', background: st.bg, color: st.color, borderRadius: 'var(--radius-pill)', padding: '4px 10px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                      {asset.status === 'parsing' && <Loader2 size={10} style={{ animation: 'spin 0.8s linear infinite' }} />}
                      {st.label}
                    </span>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8, color: 'var(--ink-muted)', flexShrink: 0 }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-muted)'}>
                      <Trash2 size={14} />
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {!assets.length && (
              <div style={{ textAlign: 'center', padding: '80px 24px', background: 'var(--surface)', borderRadius: 'var(--radius-xl)', border: '1px dashed var(--line)' }}>
                <div style={{ width: 56, height: 56, borderRadius: 14, background: 'var(--canvas)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <BookOpen size={24} style={{ color: 'var(--ink-muted)' }} />
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 22, color: 'var(--ink)', marginBottom: 8 }}>No assets yet</div>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink-soft)', marginBottom: 20, maxWidth: 360, margin: '0 auto 20px' }}>Add PDFs, images, videos, or URLs to enrich your knowledge base.</p>
                <button style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, background: 'var(--accent)', color: '#fff', padding: '10px 24px', borderRadius: 'var(--radius-pill)', border: 'none', cursor: 'pointer', boxShadow: 'var(--shadow-accent)' }}>
                  <Plus size={14} /> Add Content
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'brand' && (
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--ink)', marginBottom: 20 }}>
            Brand <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>profile</em>
          </div>
          {brandProfile ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="brand-grid">
              {[
                { label: 'Voice & Tone', value: brandProfile.voice_tone ? `"${brandProfile.voice_tone}"` : 'Not set', italic: true },
                { label: 'Target Audience', value: brandProfile.target_audience_description || 'Not set' },
              ].map(card => (
                <div key={card.label} style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: '24px', border: '1px solid var(--line)' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--ink-muted)', marginBottom: 10 }}>{card.label}</div>
                  <p style={{ fontFamily: card.italic ? 'var(--font-display)' : 'var(--font-body)', fontStyle: card.italic ? 'italic' : 'normal', fontSize: 15, color: 'var(--ink-soft)', margin: 0 }}>{card.value}</p>
                </div>
              ))}
              {(brandProfile.value_propositions || []).length > 0 && (
                <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: '24px', border: '1px solid var(--line)', gridColumn: '1 / -1' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--ink-muted)', marginBottom: 12 }}>Value Propositions</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {brandProfile.value_propositions.map((vp, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--canvas)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent)' }}>{i + 1}</span>
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink-soft)' }}>{vp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '80px 24px', background: 'var(--surface)', borderRadius: 'var(--radius-xl)', border: '1px dashed var(--line)' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 22, color: 'var(--ink)', marginBottom: 8 }}>No brand profile yet</div>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink-soft)', margin: 0 }}>Your brand profile will appear here after completing onboarding.</p>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 640px) { .brand-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}