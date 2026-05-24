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

  // Bootstrap: find or create Client + OnboardingProgress for this user
  const bootstrap = async () => {
    setBootstrapping(true);

    // Find existing client owned by this user
    let clients = await base44.entities.Client.filter({ owner_user_id: user.id });
    let client;

    if (!clients.length) {
      // Create a new client stub
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

    // Find or create OnboardingProgress
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

    // If already completed, go to dashboard
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
    await base44.entities.OnboardingProgress.update(onboardingProgress.id, {
      step: 2,
      step_1_company_data: formData,
    });
    // Also update client name from company data
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
    await base44.entities.OnboardingProgress.update(onboardingProgress.id, {
      step: 3,
      step_2_scrape_data: scrapeResult || {},
    });
    setData({ ...data, step_2_scrape_data: scrapeResult });
    setStep(3);
  };

  const handleStep3 = async (assets) => {
    await base44.entities.OnboardingProgress.update(onboardingProgress.id, {
      step: 4,
      step_3_uploads: { asset_ids: assets.map(a => a.id) },
    });
    setData({ ...data, step_3_uploads: assets });
    setStep(4);
  };

  const handleStep4 = async (brandProfile) => {
    await base44.entities.OnboardingProgress.update(onboardingProgress.id, {
      step: 5,
      step_4_brand_review: brandProfile,
    });
    setStep(5);
  };

  const handleComplete = async () => {
    navigate('/app');
  };

  if (bootstrapping || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:py-12">
      <div className="max-w-2xl mx-auto">
        <StepIndicator current={step} />

        <motion.div
          key={step}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
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
        </motion.div>
      </div>
    </div>
  );
}