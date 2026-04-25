'use client';

import { useRouter } from 'next/navigation';
import { VerificationProgress } from '@/components/shared/VerificationProgress';
import type { VerificationPipelineResult } from '@worklifebalance/types';

export function VerifyPageClient({
  plotId,
  result,
}: {
  plotId: string;
  result: VerificationPipelineResult;
}) {
  const router = useRouter();

  return (
    <VerificationProgress
      plotId={plotId}
      result={result}
      onComplete={() => router.push(`/plot/${plotId}?from=verify`)}
    />
  );
}