import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, ChevronDown, ChevronUp, Database, Sparkles, MousePointer2, Mail, Eye, BarChart3 } from 'lucide-react';

// ─── Logo ────────────────────────────────────────────────────────────────────
function PitchlaneLogo({ cream = false }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--accent)' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', color: '#fff', fontSize: 18, lineHeight: 1 }}>P</span>
      </div>
      <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: cream ? 'var(--canvas)' : 'var(--ink)', lineHeight: 1 }}>
        Pitchlane
      </span>
    </div>
  );
}

// ─── Nav ─────────────────────────────────────────────────────────────────────
function Nav() {
  const [open, setOpen] = useState(false);
  return (
    <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(245,240,230,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--line)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
          <PitchlaneLogo />
          <div className="hidden md:flex items-center gap-8">
            {['How it works', 'Use cases', 'Pricing', 'FAQ'].map(l => (
              <a key={l} href={`#${l.toLowerCase().replace(/ /g, '-')}`}
                style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink-soft)', textDecoration: 'none' }}
                className="hover:text-ink transition-colors">
                {l}
              </a>
            ))}
          </div>
        </div>
        <div className="hidden md:flex items-center gap-4">
          <Link to="/signup" style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink-soft)', textDecoration: 'none' }}>
            Sign in
          </Link>
          <Link to="/signup"
            style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, background: 'var(--ink)', color: 'var(--canvas)', padding: '8px 20px', borderRadius: 'var(--radius-pill)', textDecoration: 'none', transition: 'background 200ms' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--accent)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--ink)'}>
            Start free
          </Link>
        </div>
        <button className="md:hidden" onClick={() => setOpen(!open)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <div style={{ width: 24, height: 2, background: 'var(--ink)', marginBottom: 5 }} />
          <div style={{ width: 24, height: 2, background: 'var(--ink)', marginBottom: 5 }} />
          <div style={{ width: 18, height: 2, background: 'var(--ink)' }} />
        </button>
      </div>
      {open && (
        <div style={{ background: 'var(--canvas)', borderTop: '1px solid var(--line)', padding: '16px 24px' }} className="md:hidden">
          {['How it works', 'Use cases', 'Pricing', 'FAQ'].map(l => (
            <a key={l} href={`#${l.toLowerCase().replace(/ /g, '-')}`} onClick={() => setOpen(false)}
              style={{ display: 'block', padding: '10px 0', fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--ink-soft)', textDecoration: 'none', borderBottom: '1px solid var(--line-soft)' }}>
              {l}
            </a>
          ))}
          <Link to="/signup" onClick={() => setOpen(false)}
            style={{ display: 'block', marginTop: 12, textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 600, background: 'var(--accent)', color: '#fff', padding: '12px 0', borderRadius: 'var(--radius-pill)', textDecoration: 'none' }}>
            Start free
          </Link>
        </div>
      )}
    </nav>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section style={{ background: 'var(--canvas)', padding: '100px 24px 120px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 80, alignItems: 'center' }} className="hero-grid">
        {/* Left */}
        <div>
          {/* Pill */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius-pill)', padding: '6px 14px', marginBottom: 32 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--ink-muted)' }}>
              New: reply detection & sentiment AI is live
            </span>
          </div>
          {/* Headline */}
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(48px, 7.5vw, 96px)', lineHeight: 0.95, letterSpacing: '-0.02em', fontWeight: 400, color: 'var(--ink)', margin: '0 0 28px' }}>
            The end of{' '}
            <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>cold</em>
            {' '}outreach.<br />
            Every prospect gets{' '}
            <em style={{ fontStyle: 'italic' }}>their own</em>
            {' '}pitch.
          </h1>
          {/* Subhead */}
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 20, lineHeight: 1.55, color: 'var(--ink-soft)', maxWidth: 560, margin: '0 0 40px' }}>
            Pitchlane turns your brand into one-to-one interactive pitches. Every prospect from intent data, every artifact generated from your real work, every email sent from your own Gmail. The pitch reads like you wrote it. Because, in every way that matters, you did.
          </p>
          {/* CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', marginBottom: 32 }}>
            <Link to="/signup"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--accent)', color: '#fff', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 16, padding: '14px 28px', borderRadius: 'var(--radius-pill)', textDecoration: 'none', boxShadow: 'var(--shadow-accent)', transition: 'transform 200ms, box-shadow 200ms' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(242,92,42,0.38)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-accent)'; }}>
              Start free for 14 days <ArrowRight size={16} />
            </Link>
            <a href="#how-it-works"
              style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--ink-soft)', textDecoration: 'none', borderBottom: '1px solid var(--ink-muted)', paddingBottom: 2 }}>
              See how it works
            </a>
          </div>
          {/* Trust marks */}
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {['No credit card', '10 min setup', '3 free artifacts'].map(t => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Check size={13} style={{ color: 'var(--accent)' }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--ink-muted)' }}>{t}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — artifact mockup */}
        <div style={{ position: 'relative', minHeight: 420 }} className="hidden lg:block">
          {/* Glow */}
          <div style={{ position: 'absolute', width: 360, height: 360, background: 'radial-gradient(circle, rgba(242,92,42,0.12) 0%, transparent 70%)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', pointerEvents: 'none' }} />
          {/* Back card */}
          <div style={{ position: 'absolute', top: 20, left: 0, width: 280, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 16, padding: 24, transform: 'rotate(4deg)', boxShadow: 'var(--shadow-md)' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--ink-muted)', marginBottom: 12 }}>For Edward Beaumont</div>
            <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 18, color: '#7C2D2D', lineHeight: 1.3, marginBottom: 10 }}>A private correspondence.</div>
            <div style={{ height: 6, background: 'var(--line)', borderRadius: 3, marginBottom: 6, width: '90%' }} />
            <div style={{ height: 6, background: 'var(--line)', borderRadius: 3, marginBottom: 6, width: '75%' }} />
            <div style={{ height: 6, background: 'var(--line)', borderRadius: 3, width: '60%' }} />
          </div>
          {/* Front card */}
          <div style={{ position: 'absolute', top: 40, left: 60, width: 300, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 16, overflow: 'hidden', transform: 'rotate(-2deg)', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ background: 'linear-gradient(135deg, #6B4226, #4a2c18)', padding: '20px 22px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(245,240,230,0.65)', marginBottom: 10 }}>For Margaret Chen</div>
              <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 16, color: 'var(--canvas)', lineHeight: 1.3 }}>On restraint, <em>warmth</em>, and the homes worth keeping.</div>
            </div>
            <div style={{ padding: '16px 22px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--accent)', marginBottom: 8 }}>01 — Why we wrote</div>
              <div style={{ height: 5, background: 'var(--line)', borderRadius: 3, marginBottom: 5, width: '95%' }} />
              <div style={{ height: 5, background: 'var(--line)', borderRadius: 3, marginBottom: 12, width: '80%' }} />
              <div style={{ display: 'flex', gap: 6 }}>
                {['Interior', 'Residential', 'Award 2024'].map(c => (
                  <span key={c} style={{ fontFamily: 'var(--font-mono)', fontSize: 9, background: 'var(--canvas)', border: '1px solid var(--line)', borderRadius: 'var(--radius-pill)', padding: '3px 8px', color: 'var(--ink-muted)' }}>{c}</span>
                ))}
              </div>
            </div>
          </div>
          {/* Live tracking badge */}
          <div style={{ position: 'absolute', bottom: 0, right: -20, width: 260, background: 'var(--ink)', borderRadius: 14, padding: '16px 18px', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span className="pulse-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', flexShrink: 0 }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--accent)' }}>Hot lead detected</span>
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 15, color: 'var(--canvas)', marginBottom: 4 }}>Margaret just opened your pitch</div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(245,240,230,0.55)', marginBottom: 10 }}>2nd visit · 3min 42s on page</div>
            <a href="#" style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: 'var(--accent)', textDecoration: 'none' }}>Send follow-up →</a>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1100px) {
          .hero-grid { grid-template-columns: 1fr !important; gap: 48px !important; }
        }
      `}</style>
    </section>
  );
}

// ─── Social Proof Strip ───────────────────────────────────────────────────────
function SocialProof() {
  return (
    <div style={{ background: 'var(--surface)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)', padding: '28px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 40, flexWrap: 'wrap', justifyContent: 'center' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--ink-muted)', whiteSpace: 'nowrap' }}>
          Built for studios that close on craft —
        </span>
        {['HOLM STUDIO', 'ATHERTON RIDGEWAY', 'VELA STUDIO', 'NORTH BAY'].map(n => (
          <span key={n} style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 18, color: 'var(--ink)', letterSpacing: '-0.01em' }}>{n}</span>
        ))}
      </div>
    </div>
  );
}

// ─── Problem Section ──────────────────────────────────────────────────────────
function Problem() {
  return (
    <section style={{ background: 'var(--deep)', padding: '160px 24px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', right: -100, top: '50%', transform: 'translateY(-50%)', width: 500, height: 500, background: 'radial-gradient(circle, rgba(242,92,42,0.08) 0%, transparent 65%)', pointerEvents: 'none' }} />
      <div style={{ maxWidth: 900, margin: '0 auto', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <div style={{ height: 1, width: 40, background: 'var(--accent)', flexShrink: 0 }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--accent)' }}>The problem</span>
        </div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(40px, 6vw, 80px)', lineHeight: 0.97, letterSpacing: '-0.02em', fontWeight: 400, color: 'var(--canvas)', margin: '0 0 40px' }}>
          Personalization has become<br />
          a <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>copy-paste field.</em>
        </h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 22, lineHeight: 1.6, color: 'rgba(245,240,230,0.78)', maxWidth: 760, marginBottom: 20 }}>
          {'Every tool promises personalization. Every tool means "Hi {{first_name}}, I noticed you work at {{company}}." Your prospects have seen it ten thousand times. They delete it before they read it.'}
        </p>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 22, lineHeight: 1.6, color: 'rgba(245,240,230,0.78)', maxWidth: 760 }}>
          True personalization means building something that could only exist for this person, from this studio, for this project. That is what Pitchlane does — and it does it in minutes, not hours.
        </p>
      </div>
    </section>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────
const HOW_STEPS = [
  {
    n: '01', icon: Sparkles, title: 'Connect your brand',
    body: 'Connect Google, paste your URL, upload a project deck. In under 60 seconds Pitchlane extracts your voice, portfolio, testimonials, and differentiators into a living brand profile.'
  },
  {
    n: '02', icon: Database, title: 'Request your audience',
    body: 'Specify niche, geography, and intent signals. We deliver enriched, validated prospect records — companies actively researching what you sell — credited to your balance.'
  },
  {
    n: '03', icon: MousePointer2, title: 'Send personalized pitches',
    body: 'Generate a one-to-one artifact per prospect, write an AI email from your voice, send through your Gmail. Track every open, section scroll, and reply in real time.'
  },
];

function HowItWorks() {
  return (
    <section id="how-it-works" style={{ background: 'var(--canvas)', padding: '140px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 80 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--accent)', display: 'block', marginBottom: 16 }}>The mechanism</span>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(40px, 6vw, 80px)', lineHeight: 0.97, letterSpacing: '-0.02em', fontWeight: 400, color: 'var(--ink)', margin: 0 }}>
            Three steps. Ten minutes. <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>Done.</em>
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }} className="steps-grid">
          {HOW_STEPS.map(s => {
            const Icon = s.icon;
            return (
              <div key={s.n} className="card-lift"
                style={{ background: 'var(--surface)', borderRadius: 24, padding: '40px 32px', border: '1px solid var(--line)', cursor: 'default' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 88, color: 'var(--accent)', lineHeight: 0.9, marginBottom: 20, opacity: 0.9 }}>{s.n}</div>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--canvas)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                  <Icon size={20} style={{ color: 'var(--accent)' }} />
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--ink)', margin: '0 0 12px' }}>{s.title}</h3>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, lineHeight: 1.6, color: 'var(--ink-soft)', margin: 0 }}>{s.body}</p>
              </div>
            );
          })}
        </div>
      </div>
      <style>{`
        @media (max-width: 900px) { .steps-grid { grid-template-columns: 1fr !important; } }
        @media (min-width: 600px) and (max-width: 900px) { .steps-grid { grid-template-columns: repeat(2, 1fr) !important; } }
      `}</style>
    </section>
  );
}

// ─── Use Cases ────────────────────────────────────────────────────────────────
const USE_CASES = [
  { label: 'Architecture', template: 'Service Pro', accent: '#6B4226', tagline: 'For studios that present like a monograph.', stat: '14%', statLabel: 'Average reply rate, Q1 2026', body: 'Homeowners shortlist architects before they even make contact. Your artifact arrives when intent is highest — anchored in your real projects, your real voice.' },
  { label: 'Advisory', template: 'Advisory', accent: '#7C2D2D', tagline: 'For practices that send a letter, not a brochure.', stat: '22%', statLabel: 'Average reply rate, Q1 2026', body: 'High-net-worth clients expect discretion and depth. The Advisory template reads like a private correspondence, not a pitch deck.' },
  { label: 'Creative', template: 'Creative Portfolio', accent: '#EF3E2C', tagline: 'For studios that get judged on the open.', stat: '18%', statLabel: 'Average reply rate, Q1 2026', body: 'You will be judged by the first impression. Every artifact is a gallery-quality presentation of your best work, curated for this exact prospect.' },
];

function UseCases() {
  const [active, setActive] = useState(0);
  const uc = USE_CASES[active];
  return (
    <section id="use-cases" style={{ background: 'var(--surface)', padding: '140px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 48, alignItems: 'end', marginBottom: 56 }} className="uc-header">
          <div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--accent)', display: 'block', marginBottom: 12 }}>Built for service businesses that close on craft</span>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(36px, 5vw, 68px)', lineHeight: 0.97, letterSpacing: '-0.02em', fontWeight: 400, color: 'var(--ink)', margin: 0 }}>
              Three templates. <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>One per industry.</em>
            </h2>
          </div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, lineHeight: 1.6, color: 'var(--ink-soft)', maxWidth: 320, margin: 0 }}>
            Each template is calibrated for the purchasing psychology of its industry — tone, structure, visual hierarchy.
          </p>
        </div>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
          {USE_CASES.map((uc, i) => (
            <button key={uc.label} onClick={() => setActive(i)}
              style={{
                fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500,
                padding: '8px 20px', borderRadius: 'var(--radius-pill)', border: '1px solid var(--line)',
                background: active === i ? 'var(--ink)' : 'transparent',
                color: active === i ? 'var(--canvas)' : 'var(--ink-soft)',
                cursor: 'pointer', transition: 'all 200ms'
              }}>
              {uc.label}
            </button>
          ))}
        </div>
        {/* Detail card */}
        <div style={{ background: 'var(--canvas)', borderRadius: 32, padding: '64px', border: '1px solid var(--line)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 220, height: 220, borderRadius: '50%', background: uc.accent, opacity: 0.08, pointerEvents: 'none' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 64, alignItems: 'center', position: 'relative' }} className="uc-detail-grid">
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.2em', color: uc.accent, marginBottom: 16 }}>{uc.template} Template</div>
              <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 'clamp(28px, 4vw, 48px)', lineHeight: 1.1, color: 'var(--ink)', marginBottom: 20 }}>{uc.tagline}</div>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 18, lineHeight: 1.6, color: 'var(--ink-soft)', marginBottom: 24 }}>{uc.body}</p>
              <a href="/signup" style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: uc.accent, textDecoration: 'none', borderBottom: `1px solid ${uc.accent}`, paddingBottom: 2 }}>See a live example →</a>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 'clamp(72px, 12vw, 128px)', color: uc.accent, lineHeight: 0.9, marginBottom: 12 }}>{uc.stat}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--ink-muted)' }}>{uc.statLabel}</div>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 900px) {
          .uc-header { grid-template-columns: 1fr !important; }
          .uc-detail-grid { grid-template-columns: 1fr !important; gap: 32px !important; padding: 0 !important; }
        }
      `}</style>
    </section>
  );
}

// ─── Features Grid ────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: Database, title: 'Intent-validated audiences', body: 'Request prospects by what they have been researching, not just demographics. Every record is enriched and validated before delivery.' },
  { icon: Sparkles, title: 'AI brand extraction', body: 'Connect your site once. We read your projects, voice, testimonials, and differentiators — and remember them for every artifact.' },
  { icon: MousePointer2, title: 'One-to-one artifacts', body: 'Every prospect gets a unique interactive pitch. Three editorial templates built for the psychology of your industry.' },
  { icon: Mail, title: 'Gmail-native send', body: 'Send from your own Gmail through OAuth. No new sender domains. No warmup. Your deliverability, your reputation.' },
  { icon: Eye, title: 'Hot-lead detection', body: 'See exactly when a prospect opens, what they read, how long. Get pinged the moment they go hot.' },
  { icon: BarChart3, title: 'Reply sentiment AI', body: 'Replies classified positive, neutral, or negative as they arrive. Know which thread to prioritize without reading every email.' },
];

function Features() {
  return (
    <section style={{ background: 'var(--canvas)', padding: '140px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 72 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--accent)', display: 'block', marginBottom: 16 }}>The platform</span>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(36px, 5vw, 68px)', lineHeight: 0.97, letterSpacing: '-0.02em', fontWeight: 400, color: 'var(--ink)', margin: 0 }}>
            Everything you need. <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>Nothing you don't.</em>
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }} className="features-grid">
          {FEATURES.map(f => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="card-lift"
                style={{ background: 'var(--surface)', borderRadius: 20, padding: '32px 28px', border: '1px solid var(--line)' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--canvas)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                  <Icon size={18} style={{ color: 'var(--accent)' }} />
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--ink)', margin: '0 0 10px' }}>{f.title}</h3>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.65, color: 'var(--ink-soft)', margin: 0 }}>{f.body}</p>
              </div>
            );
          })}
        </div>
      </div>
      <style>{`
        @media (max-width: 900px) { .features-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 600px) { .features-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  );
}

// ─── Stat Break ───────────────────────────────────────────────────────────────
const STATS = [
  { val: '18%', label: 'Avg. reply rate across customers, Q1 2026' },
  { val: '10 min', label: 'From signup to first personalized artifact' },
  { val: '< 1.5s', label: 'Artifact first paint on mobile 3G' },
  { val: '0', label: 'Sender domains to warm up. Use your Gmail.' },
];

function StatBreak() {
  return (
    <section style={{ background: 'var(--deep)', padding: '120px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 48 }} className="stats-grid">
        {STATS.map(s => (
          <div key={s.val} style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 'clamp(48px, 5vw, 80px)', color: 'var(--accent)', lineHeight: 0.95, marginBottom: 12 }}>{s.val}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.16em', color: 'rgba(245,240,230,0.65)', lineHeight: 1.6 }}>{s.label}</div>
          </div>
        ))}
      </div>
      <style>{`
        @media (max-width: 900px) { .stats-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 500px) { .stats-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  );
}

// ─── Pricing ──────────────────────────────────────────────────────────────────
const PLANS = [
  { name: 'Trial', price: '$0', period: '/14 days', artifacts: '3 artifacts', revisions: '3 revisions each', prospects: '0 prospects', cta: 'Start free', style: 'outline', featured: false },
  { name: 'Starter', price: '$497', period: '/month', artifacts: '25 artifacts', revisions: '5 revisions each', prospects: '50 prospects', cta: 'Start free trial', style: 'dark', featured: false },
  { name: 'Growth', price: '$1,497', period: '/month', artifacts: '100 artifacts', revisions: '7 revisions each', prospects: '250 prospects', cta: 'Start free trial', style: 'featured', featured: true },
  { name: 'Scale', price: '$2,997', period: '/month', artifacts: '300 artifacts', revisions: '10 revisions each', prospects: '750 prospects', cta: 'Start free trial', style: 'dark', featured: false },
];

function Pricing() {
  return (
    <section id="pricing" style={{ background: 'var(--canvas)', padding: '140px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 72 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--accent)', display: 'block', marginBottom: 16 }}>Pricing</span>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(36px, 5vw, 68px)', lineHeight: 0.97, letterSpacing: '-0.02em', fontWeight: 400, color: 'var(--ink)', margin: '0 0 16px' }}>
            Pick the volume. <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>Cancel anytime.</em>
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 18, color: 'var(--ink-soft)', margin: 0 }}>All plans include full platform access. No feature gating. Just volume.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, alignItems: 'end' }} className="pricing-grid">
          {PLANS.map(p => (
            <div key={p.name} className="card-lift" style={{ position: 'relative',
              background: p.featured ? 'var(--ink)' : 'var(--surface)',
              borderRadius: 24, padding: '40px 28px',
              border: p.featured ? '1px solid transparent' : '1px solid var(--line)' }}>
              {p.featured && (
                <span style={{ position: 'absolute', top: -12, left: 20, fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.16em', background: 'var(--accent)', color: '#fff', padding: '4px 12px', borderRadius: 'var(--radius-pill)' }}>Most popular</span>
              )}
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.2em', color: p.featured ? 'var(--accent)' : 'var(--ink-muted)', marginBottom: 20 }}>{p.name}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, marginBottom: 4 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 56, color: p.featured ? 'var(--canvas)' : 'var(--ink)', lineHeight: 0.9 }}>{p.price}</span>
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em', color: p.featured ? 'rgba(245,240,230,0.55)' : 'var(--ink-muted)', marginBottom: 32 }}>{p.period}</div>
              {[p.artifacts, p.revisions, p.prospects].map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: `1px solid ${p.featured ? 'rgba(245,240,230,0.08)' : 'var(--line-soft)'}` }}>
                  <Check size={13} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: p.featured ? 'rgba(245,240,230,0.85)' : 'var(--ink-soft)' }}>{f}</span>
                </div>
              ))}
              <Link to="/signup"
                style={{ display: 'block', marginTop: 32, textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, padding: '12px 0', borderRadius: 'var(--radius-pill)', textDecoration: 'none', transition: 'all 200ms',
                  background: p.featured ? 'var(--accent)' : p.style === 'outline' ? 'transparent' : 'var(--ink)',
                  color: p.featured ? '#fff' : p.style === 'outline' ? 'var(--ink)' : 'var(--canvas)',
                  border: p.style === 'outline' ? '1px solid var(--line)' : 'none' }}>
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @media (max-width: 1000px) { .pricing-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 600px) { .pricing-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  );
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────
const FAQ_ITEMS = [
  { q: 'Will my prospects know this was generated by AI?', a: 'No. Pitchlane generates from your actual brand profile — your real projects, your voice, your differentiators. The artifact reads as a handwritten document, not a template. Prospects receive something that feels as though you spent an afternoon preparing it specifically for them.' },
  { q: 'How is this different from Apollo or Instantly?', a: "Apollo and Instantly are volume tools. They help you send more emails faster. Pitchlane is a quality tool. It helps you send fewer emails that actually get opened and replied to. The economics are different: you're paying for a 22% reply rate rather than a 0.5% reply rate on ten times the volume." },
  { q: 'Will it work in my industry?', a: 'Pitchlane is specifically designed for service businesses in Architecture, Advisory, and Creative fields. If your business closes on craft and relationship — and your clients shortlist based on perceived quality before they ever speak to you — Pitchlane was built for you.' },
  { q: 'Do I need to bring my own list?', a: "No. You can request an audience directly from Pitchlane — specify niche, geography, and intent signals and we'll deliver enriched, validated prospect records to your account. You can also import your own list if you already have one." },
  { q: 'How long does setup take?', a: 'Approximately ten minutes. Connect your Google account, paste your website URL, and optionally upload a project deck or PDF. Pitchlane reads everything and builds your brand profile automatically. Your first artifact can be generated within minutes of completing setup.' },
  { q: 'What if AI gets it wrong?', a: 'Every artifact goes through your review before it is sent. You get a live preview, can make manual edits section by section, or prompt the AI to revise any part. You always have the final word before anything reaches a prospect.' },
];

function FAQ() {
  const [open, setOpen] = useState(null);
  return (
    <section id="faq" style={{ background: 'var(--surface)', padding: '140px 24px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 72 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--accent)', display: 'block', marginBottom: 16 }}>Questions</span>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(36px, 5vw, 64px)', lineHeight: 0.97, letterSpacing: '-0.02em', fontWeight: 400, color: 'var(--ink)', margin: 0 }}>
            The honest <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>answers.</em>
          </h2>
        </div>
        {FAQ_ITEMS.map((item, i) => (
          <div key={i} style={{ borderBottom: '1px solid var(--line)' }}>
            <button onClick={() => setOpen(open === i ? null : i)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, padding: '24px 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(18px, 2.5vw, 24px)', color: 'var(--ink)', lineHeight: 1.3 }}>{item.q}</span>
              <span style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, background: open === i ? 'var(--accent)' : 'var(--canvas)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 200ms' }}>
                {open === i
                  ? <ChevronUp size={16} style={{ color: '#fff' }} />
                  : <ChevronDown size={16} style={{ color: 'var(--ink-muted)' }} />}
              </span>
            </button>
            {open === i && (
              <div style={{ paddingBottom: 32 }}>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 17, lineHeight: 1.65, color: 'var(--ink-soft)', margin: 0 }}>{item.a}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Final CTA ────────────────────────────────────────────────────────────────
function FinalCTA() {
  return (
    <section style={{ background: 'var(--accent)', padding: '160px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', bottom: -20, left: -20, fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 'clamp(120px, 18vw, 280px)', color: 'rgba(255,255,255,0.08)', lineHeight: 1, pointerEvents: 'none', userSelect: 'none', whiteSpace: 'nowrap' }}>
        Pitchlane
      </div>
      <div style={{ position: 'relative', maxWidth: 800, margin: '0 auto' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(48px, 8vw, 120px)', lineHeight: 0.93, letterSpacing: '-0.02em', fontWeight: 400, color: '#fff', margin: '0 0 32px' }}>
          Send pitches your <em style={{ fontStyle: 'italic' }}>prospects actually open.</em>
        </h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 20, lineHeight: 1.55, color: 'rgba(255,255,255,0.8)', maxWidth: 560, margin: '0 auto 48px' }}>
          Start with three free artifacts. No credit card. Ten minutes from now you will have sent your first.
        </p>
        <Link to="/signup"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--ink)', color: 'var(--canvas)', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 16, padding: '16px 36px', borderRadius: 'var(--radius-pill)', textDecoration: 'none', transition: 'transform 200ms, box-shadow 200ms' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(15,16,20,0.3)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
          Start free for 14 days →
        </Link>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  const cols = [
    { title: 'Product', links: ['Dashboard', 'Artifacts', 'Prospects', 'Knowledge Base', 'Billing'] },
    { title: 'Resources', links: ['Documentation', 'API Reference', 'Status', 'Changelog'] },
    { title: 'Company', links: ['About', 'Blog', 'Careers', 'Privacy', 'Terms'] },
  ];
  return (
    <footer style={{ background: 'var(--deep)', padding: '80px 24px 48px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: 48, marginBottom: 64 }} className="footer-grid">
          <div>
            <PitchlaneLogo cream />
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.65, color: 'rgba(245,240,230,0.55)', marginTop: 20, maxWidth: 260 }}>
              One-to-one pitch artifacts for service businesses that close on craft.
            </p>
          </div>
          {cols.map(c => (
            <div key={c.title}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(245,240,230,0.4)', marginBottom: 20 }}>{c.title}</div>
              {c.links.map(l => (
                <a key={l} href="#" style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: 14, color: 'rgba(245,240,230,0.6)', textDecoration: 'none', marginBottom: 10, transition: 'color 200ms' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--canvas)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(245,240,230,0.6)'}>
                  {l}
                </a>
              ))}
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1px solid var(--line-dark)', paddingTop: 32, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'rgba(245,240,230,0.35)' }}>© 2026 Pitchlane Inc.</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'rgba(245,240,230,0.35)' }}>Made for studios with taste.</span>
        </div>
      </div>
      <style>{`
        @media (max-width: 800px) { .footer-grid { grid-template-columns: 1fr 1fr !important; } }
        @media (max-width: 500px) { .footer-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Home() {
  return (
    <div style={{ background: 'var(--canvas)' }}>
      <Nav />
      <Hero />
      <SocialProof />
      <Problem />
      <HowItWorks />
      <UseCases />
      <Features />
      <StatBreak />
      <Pricing />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  );
}