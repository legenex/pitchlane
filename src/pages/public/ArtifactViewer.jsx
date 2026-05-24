import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { trackArtifactView } from '@/functions/trackArtifactView';
import { resolveProspectPid } from '@/functions/resolveProspectPid';
import ServiceProRenderer from '@/components/artifacts/ServiceProRenderer';

function getDeviceType() {
  const w = window.innerWidth;
  if (w < 640) return 'mobile';
  if (w < 1024) return 'tablet';
  return 'desktop';
}

function getOrCreateSessionId() {
  let sid = sessionStorage.getItem('pitchlane_session');
  if (!sid) {
    sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem('pitchlane_session', sid);
  }
  return sid;
}

export default function ArtifactViewer() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get('preview') === '1';
  const pidHash = searchParams.get('pid');

  const [artifact, setArtifact] = useState(null);
  const [brandProfile, setBrandProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const sessionId = useRef(getOrCreateSessionId());
  const sectionsViewedRef = useRef({});
  const timeSpentRef = useRef(0);
  const heartbeatInterval = useRef(null);
  const startTime = useRef(Date.now());

  useEffect(() => {
    loadArtifact();
  }, [slug]);

  const loadArtifact = async () => {
    const arts = await base44.entities.Artifact.filter({ public_slug: slug });
    if (!arts.length || (!isPreview && arts[0].status !== 'published')) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    const art = arts[0];
    setArtifact(art);

    const profiles = await base44.entities.BrandProfile.filter({ client_id: art.client_id });
    if (profiles.length) setBrandProfile(profiles[0]);

    setLoading(false);

    if (!isPreview) {
      initTracking(art.id);
      if (pidHash) {
        resolveProspectPid({
          action: 'resolve_and_track',
          artifact_id: art.id,
          pid_hash: pidHash,
          session_id: getOrCreateSessionId(),
        });
      }
    }
  };

  const initTracking = async (artifactId) => {
    await trackArtifactView({
      action: 'create',
      artifact_id: artifactId,
      session_id: sessionId.current,
      user_agent: navigator.userAgent,
      referrer: document.referrer,
      device_type: getDeviceType(),
    });

    startTime.current = Date.now();

    heartbeatInterval.current = setInterval(() => {
      const elapsed = Math.round((Date.now() - startTime.current) / 1000);
      timeSpentRef.current = elapsed;
      trackArtifactView({
        action: 'heartbeat',
        artifact_id: artifactId,
        session_id: sessionId.current,
        time_spent_seconds: elapsed,
        sections_viewed: Object.values(sectionsViewedRef.current),
      });
    }, 15000);

    const flush = () => {
      const elapsed = Math.round((Date.now() - startTime.current) / 1000);
      navigator.sendBeacon && navigator.sendBeacon('/api/noop', JSON.stringify({}));
      trackArtifactView({
        action: 'heartbeat',
        artifact_id: artifactId,
        session_id: sessionId.current,
        time_spent_seconds: elapsed,
        sections_viewed: Object.values(sectionsViewedRef.current),
      });
    };

    window.addEventListener('beforeunload', flush);
    return () => {
      clearInterval(heartbeatInterval.current);
      window.removeEventListener('beforeunload', flush);
    };
  };

  const handleSectionVisible = useCallback((sectionKey, timeInSection) => {
    if (isPreview) return;
    const existing = sectionsViewedRef.current[sectionKey];
    sectionsViewedRef.current[sectionKey] = {
      section_key: sectionKey,
      first_seen_at: existing?.first_seen_at || new Date().toISOString(),
      total_time_seconds: (existing?.total_time_seconds || 0) + timeInSection,
    };
  }, [isPreview]);

  const handleCtaClick = useCallback(async (ctaLabel, url) => {
    if (isPreview || !artifact) return;
    await trackArtifactView({
      action: 'cta_click',
      artifact_id: artifact.id,
      session_id: sessionId.current,
      cta_click: { cta_label: ctaLabel, url },
    });
  }, [artifact, isPreview]);

  useEffect(() => {
    return () => { clearInterval(heartbeatInterval.current); };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F4F0E8' }}>
        <div className="w-6 h-6 border-2 border-[#6B4226]/30 border-t-[#6B4226] rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F4F0E8' }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'serif', color: '#0A0908' }}>404</h1>
          <p style={{ color: '#776B5E' }}>This pitch has not been published or does not exist.</p>
        </div>
      </div>
    );
  }

  if (!artifact?.content_json) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..900&family=Newsreader:ital,wght@0,300..700;1,300..700&family=JetBrains+Mono:wght@400;500&display=swap');
        html { scroll-behavior: smooth; }
      `}</style>
      {!isPreview && (
        <meta name="robots" content="noindex, nofollow" />
      )}
      <ServiceProRenderer
        artifact={artifact}
        brandProfile={brandProfile}
        onSectionVisible={handleSectionVisible}
        onCtaClick={handleCtaClick}
      />
    </>
  );
}