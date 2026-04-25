'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { TopBar, BottomBar, WizardStepper } from '@/components/ui/Layout';
import { Button } from '@/components/ui/Button';
import {
  WizardProvider,
  useWizard,
} from '@/components/wizard/WizardContext';
import { Step_Ownership } from '@/components/wizard/Step_Ownership';
import { Step_OwnerData } from '@/components/wizard/Step_OwnerData';
import { Step_SelfData } from '@/components/wizard/Step_SelfData';
import { Step_Location } from '@/components/wizard/Step_Location';
import { Step_Polygon } from '@/components/wizard/Step_Polygon';
import { Step_Detail } from '@/components/wizard/Step_Detail';
import { Step_Photos } from '@/components/wizard/Step_Photos';
import { Step_Review } from '@/components/wizard/Step_Review';
import { submitPlotAction } from './actions';
import type { AddLahanFormState } from '@karbonkredit/types';

export default function WizardPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Submit handler — dipanggil dari WizardShell, butuh access ke `form`
  const handleComplete = async (form: AddLahanFormState) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await submitPlotAction(form);
      if (result.success && result.plotId) {
        router.push(`/verify/${result.plotId}`);
      } else {
        setSubmitError(result.error || 'Gagal submit. Coba lagi.');
        setSubmitting(false);
      }
    } catch (err) {
      console.error(err);
      setSubmitError(
        err instanceof Error ? err.message : 'Terjadi kesalahan tak terduga'
      );
      setSubmitting(false);
    }
  };

  return (
    <WizardProvider onComplete={() => {}}>
      <WizardShell
        submitting={submitting}
        submitError={submitError}
        onSubmit={handleComplete}
      />
    </WizardProvider>
  );
}

// ─────────────────────────────────────────────────────────────
// Inner shell — punya akses ke useWizard() context
// ─────────────────────────────────────────────────────────────
interface WizardShellProps {
  submitting: boolean;
  submitError: string | null;
  onSubmit: (form: AddLahanFormState) => void;
}

function WizardShell({ submitting, submitError, onSubmit }: WizardShellProps) {
  const router = useRouter();
  const {
    form,
    step,
    steps,
    currentStep,
    isFirstStep,
    isLastStep,
    next,
    back,
    isStepValid,
  } = useWizard();

  const handleBack = () => {
    if (isFirstStep) {
      router.push('/home');
    } else {
      back();
    }
  };

  const handleNext = () => {
    if (isLastStep) {
      onSubmit(form);
    } else {
      next();
    }
  };

  const canProceed = isStepValid(currentStep);

  return (
    <div className="flex flex-col min-h-screen bg-paper">
      <TopBar title="Daftarkan Lahan" onBack={handleBack} />
      <WizardStepper
        step={step}
        total={steps.length}
        labels={steps.map((s) => s.label)}
      />

      {/* Step body */}
      <div className="flex-1 px-5 py-5 overflow-y-auto">
        {currentStep === 'ownership' && <Step_Ownership />}
        {currentStep === 'owner_data' && <Step_OwnerData />}
        {currentStep === 'self_data' && <Step_SelfData />}
        {currentStep === 'location' && <Step_Location />}
        {currentStep === 'polygon' && <Step_Polygon />}
        {currentStep === 'detail' && <Step_Detail />}
        {currentStep === 'photos' && <Step_Photos />}
        {currentStep === 'review' && <Step_Review />}

        {/* Submit error */}
        {submitError && (
          <div className="mt-5 p-3.5 bg-danger-soft text-danger text-sm rounded-sm">
            <b>Submit gagal:</b> {submitError}
          </div>
        )}
      </div>

      {/* Bottom action bar — hanya muncul setelah step 0 (ownership) selected */}
      {step > 0 && (
        <BottomBar>
          <Button
            variant="secondary"
            onClick={back}
            disabled={submitting}
          >
            Kembali
          </Button>
          <Button
            fullWidth
            onClick={handleNext}
            disabled={!canProceed || submitting}
            loading={submitting && isLastStep}
          >
            {isLastStep ? 'Daftarkan Lahan' : 'Lanjut'}
          </Button>
        </BottomBar>
      )}
    </div>
  );
}