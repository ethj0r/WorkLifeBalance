import { redirect, notFound } from 'next/navigation';
import { TopBar } from '@/components/ui/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AlertCircle } from 'lucide-react';
import { runFullVerificationPipeline } from '@/lib/api/verification';
import { getPlotById } from '@/lib/api/plots';
import { VerifyPageClient } from './VerifyPageClient';

export const dynamic = 'force-dynamic';

interface VerifyPageProps {
  params: { plotId: string };
}

export default async function VerifyPage({ params }: VerifyPageProps) {
  const { plotId } = params;

  // Fetch plot untuk pastikan plotId valid + user berhak akses (RLS handle ini)
  const plot = await getPlotById(plotId);
  if (!plot) {
    notFound();
  }

  // Kalau plot sudah verified atau credit_issued, redirect ke detail
  if (plot.status === 'verified' || plot.status === 'credit_issued') {
    redirect(`/plot/${plotId}`);
  }

  // Trigger pipeline — server-side, jalankan async
  let result;
  let error;
  try {
    result = await runFullVerificationPipeline(plotId);
  } catch (err) {
    console.error('Verification pipeline failed:', err);
    error = err instanceof Error ? err.message : 'Verifikasi gagal';
  }

  // Error state
  if (error || !result) {
    return (
      <div className="min-h-screen bg-paper">
        <TopBar title="Verifikasi" />
        <div className="px-5 py-8">
          <Card className="p-6 text-center">
            <div className="w-14 h-14 mx-auto mb-3 rounded-pill bg-danger-soft text-danger flex items-center justify-center">
              <AlertCircle size={24} strokeWidth={1.75} />
            </div>
            <h2 className="font-display text-[20px] mb-2">
              Verifikasi gagal
            </h2>
            <p className="text-sm text-ink-500 mb-5">
              {error || 'Terjadi kesalahan saat verifikasi. Silakan coba lagi.'}
            </p>
            <a href={`/verify/${plotId}`} className="no-underline border-0">
              <Button>Coba Lagi</Button>
            </a>
          </Card>
        </div>
      </div>
    );
  }

  // Success — pass result ke Client Component untuk animation
  return (
    <div className="min-h-screen bg-paper">
      <TopBar title="Verifikasi" />
      <div className="px-5 py-5 pb-12 max-w-2xl mx-auto">
        <VerifyPageClient plotId={plotId} result={result} />
      </div>
    </div>
  );
}