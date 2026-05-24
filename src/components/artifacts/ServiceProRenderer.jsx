import React, { useEffect, useRef } from 'react';

const TOKENS = {
  bg: '#F4F0E8',
  ink: '#0A0908',
  inkSoft: '#3A332C',
  inkMuted: '#776B5E',
  line: 'rgba(10,9,8,0.12)',
};

export default function ServiceProRenderer({ artifact, brandProfile, onSectionVisible, onCtaClick }) {
  const content = artifact?.content_json || {};
  const accentColor = artifact?.accent_color || content.accent_color || '#6B4226';
  const sections = content.sections || [];
  const logoUrl = brandProfile?.logo_url || sections.find(s => s.key === 'hero')?.client_logo_url;

  const progressRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      const el = progressRef.current;
      if (!el) return;
      const doc = document.documentElement;
      const scrollTop = doc.scrollTop || document.body.scrollTop;
      const scrollHeight = doc.scrollHeight - doc.clientHeight;
      const pct = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
      el.style.width = `${pct}%`;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // IntersectionObserver for section tracking
  useEffect(() => {
    if (!onSectionVisible) return;
    const sectionTimes = {};
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const key = entry.target.dataset.sectionKey;
        if (!key) return;
        if (entry.isIntersecting) {
          sectionTimes[key] = Date.now();
        } else if (sectionTimes[key]) {
          const elapsed = Math.round((Date.now() - sectionTimes[key]) / 1000);
          if (elapsed >= 2) onSectionVisible(key, elapsed);
          delete sectionTimes[key];
        }
      });
    }, { threshold: 0.5 });

    document.querySelectorAll('[data-section-key]').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [sections, onSectionVisible]);

  const hero = sections.find(s => s.key === 'hero');
  const orderedSections = sections.filter(s => s.key !== 'hero');

  return (
    <div style={{ background: TOKENS.bg, color: TOKENS.ink, fontFamily: "'Newsreader', Georgia, serif", minHeight: '100vh', position: 'relative' }}>
      {/* Scroll progress bar */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: 2, background: TOKENS.line, zIndex: 100 }}>
        <div ref={progressRef} style={{ height: '100%', background: accentColor, width: '0%', transition: 'width 0.1s' }} />
      </div>

      {/* robots noindex via meta — handled at page level */}
      {/* Hero */}
      {hero && (
        <section
          data-section-key="hero"
          style={{
            minHeight: '100vh',
            background: `linear-gradient(160deg, ${accentColor}22 0%, ${TOKENS.bg} 60%)`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '120px 5vw 80px',
            position: 'relative',
            borderBottom: `1px solid ${TOKENS.line}`,
          }}
        >
          {/* Logo */}
          {logoUrl && (
            <div style={{ marginBottom: 48 }}>
              <img src={logoUrl} alt="Logo" style={{ height: 36, objectFit: 'contain', opacity: 0.9 }} />
            </div>
          )}
          <div style={{ maxWidth: 720 }}>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: accentColor, marginBottom: 24 }}>
              A personal pitch from {brandProfile?.contact?.email ? brandProfile.contact.email.split('@')[1]?.split('.')[0] : 'us'}
            </p>
            <h1 style={{
              fontFamily: "'Fraunces', 'Georgia', serif",
              fontSize: 'clamp(2.5rem, 6vw, 5rem)',
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              fontVariationSettings: '"opsz" 144',
              color: TOKENS.ink,
              marginBottom: 32,
            }}>
              {hero.title}
            </h1>
            {hero.subtitle && (
              <p style={{ fontSize: '1.2rem', color: TOKENS.inkSoft, marginBottom: 24, fontWeight: 300, lineHeight: 1.6 }}>
                {hero.subtitle}
              </p>
            )}
            {hero.personalized_opener && (
              <p style={{ fontSize: '1.05rem', color: TOKENS.inkMuted, lineHeight: 1.75, maxWidth: 560 }}>
                {hero.personalized_opener}
              </p>
            )}
          </div>
        </section>
      )}

      {/* Numbered sections */}
      {orderedSections.map((section, idx) => (
        <SectionRenderer
          key={section.key}
          section={section}
          idx={idx}
          accent={accentColor}
          tokens={TOKENS}
          onCtaClick={onCtaClick}
        />
      ))}
    </div>
  );
}

function SectionLabel({ number, label, accent }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 48 }}>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: accent }}>
        {String(number).padStart(2, '0')} — {label}
      </span>
      <div style={{ flex: 1, height: 1, background: `${accent}33` }} />
    </div>
  );
}

function SectionRenderer({ section, idx, accent, tokens, onCtaClick }) {
  const num = idx + 1;

  const wrapStyle = {
    padding: '160px 5vw',
    maxWidth: 900,
    margin: '0 auto',
    borderBottom: `1px solid ${tokens.line}`,
  };

  if (section.key === 'why_reaching_out') {
    return (
      <section data-section-key={section.key} style={wrapStyle}>
        <SectionLabel number={num} label={section.title || "Why I'm reaching out"} accent={accent} />
        <p style={{ fontSize: '1.15rem', color: tokens.inkSoft, lineHeight: 1.8, maxWidth: 640, marginBottom: 32 }}>
          {section.body}
        </p>
        {(section.signal_chips || []).length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {section.signal_chips.map((chip, i) => (
              <span key={i} style={{ padding: '6px 14px', border: `1px solid ${accent}44`, borderRadius: 100, fontSize: 12, color: accent, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.06em' }}>
                {chip}
              </span>
            ))}
          </div>
        )}
      </section>
    );
  }

  if (section.key === 'selected_work') {
    const projects = section.projects || [];
    return (
      <section data-section-key={section.key} style={{ padding: '160px 0', borderBottom: `1px solid ${tokens.line}` }}>
        <div style={{ padding: '0 5vw', maxWidth: 900, margin: '0 auto', marginBottom: 64 }}>
          <SectionLabel number={num} label={section.title || 'Selected work'} accent={accent} />
          {section.intro && <p style={{ fontSize: '1.1rem', color: tokens.inkMuted, lineHeight: 1.7 }}>{section.intro}</p>}
        </div>
        {projects.map((project, pi) => {
          const variant = pi % 3;
          return (
            <ProjectCard key={pi} project={project} idx={pi} variant={variant} accent={accent} tokens={tokens} />
          );
        })}
      </section>
    );
  }

  if (section.key === 'differentiators') {
    const items = section.items || [];
    return (
      <section data-section-key={section.key} style={wrapStyle}>
        <SectionLabel number={num} label={section.title || 'Why us'} accent={accent} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 40 }}>
          {items.map((item, i) => (
            <div key={i}>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: accent, marginBottom: 10 }}>
                {toRomanette(i + 1)}.
              </p>
              <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: '1.25rem', fontWeight: 600, marginBottom: 12, color: tokens.ink }}>
                {item.title}
              </h3>
              <p style={{ color: tokens.inkSoft, lineHeight: 1.75, fontSize: '0.95rem' }}>{item.description}</p>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (section.key === 'social_proof') {
    const testimonials = section.testimonials || [];
    return (
      <section data-section-key={section.key} style={wrapStyle}>
        <SectionLabel number={num} label={section.title || 'What clients say'} accent={accent} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 64 }}>
          {testimonials.map((t, i) => (
            <div key={i} style={{ paddingLeft: i % 2 === 0 ? 0 : '10%' }}>
              <p style={{
                fontFamily: "'Fraunces', serif",
                fontSize: 'clamp(1.3rem, 2.5vw, 1.9rem)',
                fontStyle: 'italic',
                lineHeight: 1.4,
                color: tokens.inkSoft,
                marginBottom: 20,
                fontVariationSettings: '"opsz" 144',
              }}>
                "{t.quote}"
              </p>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent }}>
                — {t.source}
              </p>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (section.key === 'cta') {
    return (
      <section
        data-section-key={section.key}
        style={{ background: tokens.ink, color: tokens.bg, padding: '160px 5vw', textAlign: 'center' }}
      >
        <div style={{ maxWidth: 620, margin: '0 auto' }}>
          <h2 style={{
            fontFamily: "'Fraunces', serif",
            fontSize: 'clamp(2rem, 4vw, 3.2rem)',
            fontWeight: 700,
            lineHeight: 1.15,
            fontVariationSettings: '"opsz" 144',
            marginBottom: 24,
          }}>
            {section.title}
          </h2>
          <p style={{ fontSize: '1.05rem', color: `${tokens.bg}bb`, lineHeight: 1.75, marginBottom: 48 }}>
            {section.body}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center' }}>
            {section.primary_action && (
              <a
                href={section.primary_action.url}
                target="_blank"
                rel="noreferrer"
                onClick={() => onCtaClick?.(section.primary_action.label, section.primary_action.url)}
                style={{
                  display: 'inline-block',
                  padding: '16px 36px',
                  background: accent,
                  color: '#fff',
                  borderRadius: 4,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 13,
                  letterSpacing: '0.08em',
                  textDecoration: 'none',
                  transition: 'opacity 0.2s',
                }}
              >
                {section.primary_action.label}
              </a>
            )}
            {section.secondary_action && (
              <a
                href={section.secondary_action.url}
                target="_blank"
                rel="noreferrer"
                onClick={() => onCtaClick?.(section.secondary_action.label, section.secondary_action.url)}
                style={{
                  display: 'inline-block',
                  padding: '16px 36px',
                  border: `1px solid ${tokens.bg}44`,
                  color: tokens.bg,
                  borderRadius: 4,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 13,
                  letterSpacing: '0.08em',
                  textDecoration: 'none',
                }}
              >
                {section.secondary_action.label}
              </a>
            )}
          </div>
        </div>
      </section>
    );
  }

  return null;
}

function ProjectCard({ project, idx, variant, accent, tokens }) {
  const isFullBleed = variant === 0;
  const isSplitLeft = variant === 1;
  // variant 2 = split-right

  if (isFullBleed) {
    return (
      <div style={{ marginBottom: 8 }}>
        <div style={{
          width: '100%',
          height: 'clamp(300px, 50vw, 560px)',
          background: `${accent}15`,
          backgroundImage: project.image_url ? `url(${project.image_url})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
        }}>
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to top, ${tokens.ink}99 0%, transparent 50%)` }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '32px 5vw' }}>
            <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: '1.5rem', color: '#fff', fontWeight: 600, marginBottom: 8 }}>
              {project.name}
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.9rem' }}>{project.description}</p>
          </div>
        </div>
      </div>
    );
  }

  const imgFirst = isSplitLeft;
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      marginBottom: 8,
    }}>
      {imgFirst && (
        <div style={{
          height: 'clamp(280px, 40vw, 480px)',
          background: project.image_url ? `url(${project.image_url}) center/cover` : `${accent}15`,
        }} />
      )}
      <div style={{ padding: '80px 5vw', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: tokens.bg }}>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: accent, marginBottom: 20, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          {project.year || ''}
        </p>
        <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: '1.4rem', fontWeight: 600, marginBottom: 16, color: tokens.ink }}>
          {project.name}
        </h3>
        <p style={{ color: tokens.inkSoft, lineHeight: 1.75, fontSize: '0.9rem' }}>{project.description}</p>
        {(project.tags || []).length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 24 }}>
            {project.tags.map((tag, i) => (
              <span key={i} style={{ fontSize: 11, padding: '4px 10px', border: `1px solid ${tokens.line}`, borderRadius: 100, color: tokens.inkMuted }}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      {!imgFirst && (
        <div style={{
          height: 'clamp(280px, 40vw, 480px)',
          background: project.image_url ? `url(${project.image_url}) center/cover` : `${accent}15`,
        }} />
      )}
    </div>
  );
}

function toRomanette(n) {
  const vals = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x'];
  return vals[n - 1] || n;
}