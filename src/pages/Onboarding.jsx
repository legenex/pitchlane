import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import useCurrentUser from '@/lib/useCurrentUser';
import StepIndicator from '@/components/onboarding/StepIndicator';
import Step1Company from '@/components/onboarding/Step1Company';
import Step2Scrape from '@/components/onboarding/Step2Scrape';
import Step3Upload from '@/components/onboarding/Step3Upload';
import Step4BrandReview from '@/components/onboarding/Step4BrandReview';
import Step5Plan from '@/components/onboarding/Step5Plan';
import { motion } from 'framer-motion';

export default function Onboarding() {
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [data, setData] = useState({});
  const [client, setClient] = useState(null);
  const [onboardingProgress, setOnboardingProgress] = useState(null);

  useEffect(() => {
    if (!user?.client_id) return;
    loadOnboardingState();
  }, [user?.client_id]);

  const loadOnboardingState = async () => {
    const client = await base44.entities.Client.filter({ id: user.client_id });
    const progress = await base44.entities.OnboardingProgress.filter({ client_id: user.client_id });
    
    if (client.length) setClient(client[0]);
    if (progress.length) {
      const p = progress[0];
      setOnboardingProgress(p);
      setStep(p.step || 1);
      setData({
        step_1_company_data: p.step_1_company_data || {},
        step_2_scrape_data: p.step_2_scrape_data || {},
        step_3_uploads: p.step_3_uploads || {},
      });
    }
  };

  const handleStep1 = async (formData) => {
    const p = onboardingProgress;
    await base44.entities.OnboardingProgress.update(p.id, {
      step: 2,
      step_1_company_data: formData,
    });
    setData({ ...data, step_1_company_data: formData });
    setStep(2);
  };

  const handleStep2 = async (scrapeResult) => {
    const p = onboardingProgress;
    await base44.entities.OnboardingProgress.update(p.id, {
      step: 3,
      step_2_scrape_data: scrapeResult || {},
    });
    setData({ ...data, step_2_scrape_data: scrapeResult });
    setStep(3);
  };

  const handleStep3 = async (assets) => {
    const p = onboardingProgress;
    await base44.entities.OnboardingProgress.update(p.id, {
      step: 4,
      step_3_uploads: { asset_ids: assets.map(a => a.id) },
    });
    setData({ ...data, step_3_uploads: assets });
    setStep(4);
  };

  const handleStep4 = async (brandProfile) => {
    const p = onboardingProgress;
    await base44.entities.OnboardingProgress.update(p.id, {
      step: 5,
      step_4_brand_review: brandProfile,
    });
    setStep(5);
  };

  const handleComplete = async () => {
    navigate('/app');
  };

  if (!user?.client_id) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
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
          {step === 2 && <Step2Scrape
            websiteUrl={data.step_1_company_data?.website_url}
            clientId={user.client_id}
            onNext={handleStep2}
          />}
          {step === 3 && <Step3Upload clientId={user.client_id} onNext={handleStep3} />}
          {step === 4 && <Step4BrandReview clientId={user.client_id} onNext={handleStep4} />}
          {step === 5 && <Step5Plan clientId={user.client_id} onComplete={handleComplete} />}
        </motion.div>
      </div>
    </div>
  );
}