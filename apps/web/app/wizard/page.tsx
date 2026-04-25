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

export default function WizardPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  // Submit handler — akan di-wire ke Server Action di Turn berikutnya
    const handleComplete = async () => {
        setSubmitting(true);
        try {
            const result = await submitPlotAction(form);
            if (result.success && result.plotId) {
            router.push(`/verify/${result.plotId}`);
            } else {
            alert(result.error || 'Gagal submit. Coba lagi.');
            setSubmitting(false);
            }
        } catch (err) {
            console.error(err);
            setSubmitting(false);
        }
    };

  return (
    <WizardProvider onComplete={handleComplete}>
      <WizardShell submitting={submitting} />
    </WizardProvider>
  );
}

// ─────────────────────────────────────────────────────────────
// Inner shell — menggunakan useWizard()
// ─────────────────────────────────────────────────────────────
function WizardShell({ submitting, setSubmitting }: { submitting: boolean; setSubmitting: (s: boolean) => void }) {
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

  const canProceed = isStepValid(currentStep);

    const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const result = await submitPlotAction(form);
      if (result.success && result.plotId) {
        router.push(`/verify/${result.plotId}`);
      } else {
        alert(result.error || 'Gagal submit. Coba lagi.');
        setSubmitting(false);
      }
    } catch (err) {
      console.error(err);
      setSubmitting(false);
    }
  };

  // Ganti `next` di tombol Lanjut menjadi `handleSubmit` kalau isLastStep:
  const handleNext = () => {
    if (isLastStep) {
      handleSubmit();
    } else {
      next();
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-paper">
      <TopBar title="Daftarkan Lahan" onBack={handleBack} />
      <WizardStepper
        step={step}
        total={steps.length}
        labels={steps.map((s) => s.label)}
      />

        {currentStep === 'self_data' && <Step_SelfData />}
        {currentStep === 'location' && <Step_Location />}
        {currentStep === 'polygon' && <Step_Polygon />}
        {currentStep === 'detail' && <Step_Detail />}
        {currentStep === 'photos' && <Step_Photos />}
        {currentStep === 'review' && <Step_Review />}

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

// Placeholder untuk step yang belum diimplementasi
function PlaceholderStep({ label }: { label: string }) {
  return (
    <div className="p-8 bg-white border border-dashed border-ink-300 rounded-md text-center">
      <div className="text-3xl mb-3">🚧</div>
      <div className="font-semibold text-ink-900 mb-1">Coming soon</div>
      <div className="text-sm text-ink-500">{label}</div>
    </div>
  );
}