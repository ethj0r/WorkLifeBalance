'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type {
  AddLahanFormState,
  OwnershipType,
  RelationshipType,
  LandType,
  DocumentType,
} from '@worklifebalance/types';

// ─────────────────────────────────────────────────────────────
// Initial state
// ─────────────────────────────────────────────────────────────

const initialFormState: AddLahanFormState = {
  ownership: null,
  registrant_full_name: '',
  registrant_nik: '',
  plot_name: '',
  address: '',
  dominant_tree_types: [],
  legal_documents: [],
  photos: [],
  consent_acknowledged: false,
};

// ─────────────────────────────────────────────────────────────
// Step definitions — branched per ownership type
// ─────────────────────────────────────────────────────────────

export const WIZARD_STEPS_SELF = [
  { id: 'ownership',  label: 'Kepemilikan' },
  { id: 'self_data',  label: 'Data diri' },
  { id: 'location',   label: 'Lokasi' },
  { id: 'polygon',    label: 'Polygon' },
  { id: 'detail',     label: 'Detail' },
  { id: 'photos',     label: 'Foto' },
  { id: 'review',     label: 'Review' },
] as const;

export const WIZARD_STEPS_ON_BEHALF = [
  { id: 'ownership',  label: 'Kepemilikan' },
  { id: 'owner_data', label: 'Data pemilik' },
  { id: 'self_data',  label: 'Data diri' },
  { id: 'location',   label: 'Lokasi' },
  { id: 'polygon',    label: 'Polygon' },
  { id: 'detail',     label: 'Detail' },
  { id: 'photos',     label: 'Foto' },
  { id: 'review',     label: 'Review' },
] as const;

export type WizardStepId =
  | (typeof WIZARD_STEPS_SELF)[number]['id']
  | (typeof WIZARD_STEPS_ON_BEHALF)[number]['id'];

// ─────────────────────────────────────────────────────────────
// Context shape
// ─────────────────────────────────────────────────────────────

interface WizardContextValue {
  form: AddLahanFormState;
  step: number;
  steps: readonly { id: WizardStepId; label: string }[];
  currentStep: WizardStepId;
  isFirstStep: boolean;
  isLastStep: boolean;

  // Mutations
  updateForm: (patch: Partial<AddLahanFormState>) => void;
  setOwnership: (ownership: OwnershipType) => void;

  // Navigation
  next: () => void;
  back: () => void;
  goToStep: (stepIndex: number) => void;

  // Validation per step
  isStepValid: (stepId: WizardStepId) => boolean;
}

const WizardContext = createContext<WizardContextValue | null>(null);

// ─────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────

export function WizardProvider({
  children,
  onComplete,
}: {
  children: ReactNode;
  onComplete: () => void;
}) {
  const [form, setForm] = useState<AddLahanFormState>(initialFormState);
  const [step, setStep] = useState(0);

  // Steps array tergantung ownership choice
  const steps =
    form.ownership === 'on_behalf' ? WIZARD_STEPS_ON_BEHALF : WIZARD_STEPS_SELF;

  const currentStep = steps[step]?.id || 'ownership';
  const isFirstStep = step === 0;
  const isLastStep = step === steps.length - 1;

  const updateForm = useCallback((patch: Partial<AddLahanFormState>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  }, []);

  const setOwnership = useCallback(
    (ownership: OwnershipType) => {
      setForm((prev) => ({ ...prev, ownership }));
      // Auto-advance ke step 1 setelah pilih
      setStep(1);
    },
    []
  );

  const next = useCallback(() => {
    if (isLastStep) {
      onComplete();
    } else {
      setStep((s) => s + 1);
    }
  }, [isLastStep, onComplete]);

  const back = useCallback(() => {
    if (!isFirstStep) setStep((s) => s - 1);
  }, [isFirstStep]);

  const goToStep = useCallback(
    (stepIndex: number) => {
      if (stepIndex >= 0 && stepIndex < steps.length) {
        setStep(stepIndex);
      }
    },
    [steps.length]
  );

  // ─── Validation logic per step ───
  const isStepValid = useCallback(
    (stepId: WizardStepId): boolean => {
      switch (stepId) {
        case 'ownership':
          return form.ownership !== null;

        case 'owner_data':
          return !!(
            form.owner_full_name &&
            form.owner_nik &&
            form.owner_nik.length === 16 &&
            form.owner_relationship &&
            form.owner_ktp_photo_url
          );

        case 'self_data':
          return !!(
            form.registrant_full_name &&
            form.registrant_nik &&
            form.registrant_nik.length === 16 &&
            form.registrant_ktp_photo_url
          );

        case 'location':
          return !!(form.plot_name && form.address && form.center_lat);

        case 'polygon':
          return !!(form.polygon_geojson && form.area_hectares);

        case 'detail':
          return !!(
            form.land_type &&
            form.managed_since_year &&
            form.dominant_tree_types.length > 0
          );

        case 'photos':
          return form.photos.length >= 3;

        case 'review':
          // Konsen wajib hanya kalau on_behalf
          if (form.ownership === 'on_behalf') {
            return form.consent_acknowledged;
          }
          return true;

        default:
          return false;
      }
    },
    [form]
  );

  return (
    <WizardContext.Provider
      value={{
        form,
        step,
        steps,
        currentStep,
        isFirstStep,
        isLastStep,
        updateForm,
        setOwnership,
        next,
        back,
        goToStep,
        isStepValid,
      }}
    >
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard() {
  const ctx = useContext(WizardContext);
  if (!ctx) {
    throw new Error('useWizard must be used inside <WizardProvider>');
  }
  return ctx;
}