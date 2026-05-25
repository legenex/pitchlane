import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import StepIndicator from '@/components/onboarding/StepIndicator';
import Step1Company from '@/components/onboarding/Step1Company';
import Step2Scrape from '@/components/onboarding/Step2Scrape';
import Step3Upload from '@/components/onboarding/Step3Upload';
import Step4BrandReview from '@/components/onboarding/Step4BrandReview';
import Step5Plan from '@/components/onboarding/Step5Plan';
import { motion } from 'framer-motion';

function PitchlaneLogo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 40 }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', color: '#fff', fontSize: 18, lineHeight: 1 }}>P</span>
      </div>
      <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--ink)', lineHeight: 1 }}>Pitchlane</span>
    </div>
  );
}

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [data, setData] = useState({});
  const [clientId, setClientId] = useState(null);
  const [onboardingProgress, setOnboardingProgress] = useState(null);
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    if (!user) return;
    bootstrap();
  }, [user?.id]);

  const bootstrap = async () => {
    setBootstrapping(true);

    let clients = await base44.entities.Client.filter({ owner_user_id: user.id });
    let client;

    if (!clients.length) {
      client = await base44.entities.Client.create({
        name: user.full_name || 'My Firm',
        slug: `client-${user.id.slice(0, 8)}`,
        owner_user_id: user.id,
        status: 'active',
        credits_balance: 0,
        artifacts_used_this_period: 0,
      });
    } else {
      client = clients[0];
    }

    setClientId(client.id);

    let progresses = await base44.entities.OnboardingProgress.filter({ client_id: client.id });
    let progress;

    if (!progresses.length) {
      progress = await base44.entities.OnboardingProgress.create({
        client_id: client.id,
        step: 1,
        completed: false,
      });
    } else {
      progress = progresses[0];
    }

    if (progress.completed) {
      navigate('/app');
      return;
    }

    setOnboardingProgress(progress);
    setStep(progress.step || 1);
    setData({
      step_1_company_data: progress.step_1_company_data || {},
      step_2_scrape_data: progress.step_2_scrape_data || {},
      step_3_uploads: progress.step_3_uploads || {},
    });
    setBootstrapping(false);
  };

  const handleStep1 = async (formData) => {
    await base44.entities.OnboardingProgress.update(onboardingProgress.id, { step: 2, step_1_company_data: formData });
    if (formData.business_name) {
      await base44.entities.Client.update(clientId, {
        name: formData.business_name,
        slug: formData.business_name.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 40),
        niche: formData.niche,
        target_geo: formData.primary_geo,
        target_audience_short: formData.target_audience_short,
      });
    }
    setData({ ...data, step_1_company_data: formData });
    setStep(2);
  };

  const handleStep2 = async (scrapeResult) => {
    await base44.entities.OnboardingProgress.update(onboardingProgress.id, { step: 3, step_2_scrape_data: scrapeResult || {} });
    setData({ ...data, step_2_scrape_data: scrapeResult });
    setStep(3);
  };

  const handleStep3 = async (assets) => {
    await base44.entities.OnboardingProgress.update(onboardingProgress.id, { step: 4, step_3_uploads: { asset_ids: assets.map(a => a.id) } });
    setData({ ...data, step_3_uploads: assets });
    setStep(4);
  };

  const handleStep4 = async (brandProfile) => {
    await base44.entities.OnboardingProgress.update(onboardingProgress.id, { step: 5, step_4_brand_review: brandProfile });
    setStep(5);
  };

  const handleComplete = async () => {
    navigate('/app');
  };

  if (bootstrapping || !user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--canvas)' }}>
        <div style={{ width: 32, height: 32, border: '3px solid var(--line)', borderTop: '3px solid var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--canvas)', padding: '40px 24px 80px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <PitchlaneLogo />
        <StepIndicator current={step} />
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div style={{ background: 'var(--surface)', borderRadius: 24, padding: '56px 64px', boxShadow: 'var(--shadow-md)', border: '1px solid var(--line)' }} className="onboarding-card">
            {step === 1 && <Step1Company data={data.step_1_company_data} onNext={handleStep1} />}
            {step === 2 && (
              <Step2Scrape
                websiteUrl={data.step_1_company_data?.website_url}
                clientId={clientId}
                onNext={handleStep2}
              />
            )}
            {step === 3 && <Step3Upload clientId={clientId} onNext={handleStep3} />}
            {step === 4 && <Step4BrandReview clientId={clientId} onNext={handleStep4} />}
            {step === 5 && <Step5Plan clientId={clientId} onComplete={handleComplete} />}
          </div>
        </motion.div>
      </div>
      <style>{`
        @media (max-width: 640px) {
          .onboarding-card { padding: 32px 24px !important; border-radius: 16px !important; }
        }
      `}</style>
    </div>
  );
}