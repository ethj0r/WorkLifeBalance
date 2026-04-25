'use client';

import { useEffect, useState, useRef } from 'react';
import { Satellite, Camera, GitMerge, Leaf, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { LiveProgress, type ProgressStage } from '@/components/ui/Layout';
import { Button } from '@/components/ui/Button';
import type { VerificationPipelineResult } from '@karbonkredit/types';

interface VerificationProgressProps {
  plotId: string;
  /**
   * Pre-computed result yang akan di-reveal stage-by-stage.
   * Server-side sudah jalankan pipeline dan kirim full result ke client.
   * Client tinggal animate reveal-nya.
   */
  result: VerificationPipelineResult;
  onComplete: () => void;
}

interface Stage {
  id: 'satellite' | 'photo' | 'cross' | 'carbon';
  title: string;
  detailFn: (result: VerificationPipelineResult) => string;
  duration: number; // ms minimum sebelum next stage
}

const STAGES: Stage[] = [
  {
    id: 'satellite',
    title: 'Satellite Imagery — Sentinel-2',
    detailFn: (r) =>
      `NDVI: ${r.satellite.ndvi_score.toFixed(2)} · ${ndviLabel(r.satellite.ndvi_score)} · ${r.satellite.estimated_tree_count} pohon (estimasi)`,
    duration: 2500,
  },
  {
    id: 'photo',
    title: 'Photo AI Analysis — Tree Counting',
    detailFn: (r) => {
      const total = r.photo_analysis.reduce((s, p) => s + p.tree_count, 0);
      return `${total} pohon terdeteksi dari ${r.photo_analysis.length} foto`;
    },
    duration: 3500, // foto analysis butuh waktu lebih
  },
  {
    id: 'cross',
    title: 'Cross-Validation',
    detailFn: (r) => `Confidence score: ${r.cross_validation_confidence}%`,
    duration: 1800,
  },
  {
    id: 'carbon',
    title: 'Carbon Stock Estimation',
    detailFn: (r) =>
      `${r.carbon_estimate.annual_sequestration_tco2e.toFixed(1)} ton CO2e/tahun`,
    duration: 1500,
  },
];

function ndviLabel(score: number): string {
  if (score >= 0.6) return 'High Density';
  if (score >= 0.4) return 'Medium Density';
  return 'Low Density';
}

export function VerificationProgress({
  plotId,
  result,
  onComplete,
}: VerificationProgressProps) {
  const [currentStage, setCurrentStage] = useState(0);
  const [allDone, setAllDone] = useState(false);
  const timersRef = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    // Timing-based reveal — start dari stage 0
    let cumulativeDelay = 800; // initial delay biar gak terlalu cepat

    STAGES.forEach((stage, idx) => {
      const timer = setTimeout(() => {
        setCurrentStage(idx + 1);
        if (idx === STAGES.length - 1) {
          // Last stage finished
          setTimeout(() => setAllDone(true), 600);
        }
      }, cumulativeDelay + stage.duration);
      timersRef.current.push(timer);
      cumulativeDelay += stage.duration;
    });

    return () => {
      timersRef.current.forEach(clearTimeout);
    };
  }, []);

  const stagesForUI: ProgressStage[] = STAGES.map((s, i) => ({
    title: s.title,
    detail: i < currentStage ? s.detailFn(result) : undefined,
    state:
      i < currentStage ? 'done' : i === currentStage ? 'active' : 'pending',
  }));

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="font-display text-[24px] mb-1">
          {allDone ? 'Verifikasi selesai' : 'Sedang memverifikasi lahan…'}
        </h2>
        <p className="text-sm text-ink-500">
          {allDone
            ? 'Semua tahap berhasil. Klik "Lihat Hasil" untuk detail.'
            : 'Biasanya selesai dalam 30–45 detik. Jangan tutup halaman ini.'}
        </p>
      </div>

      {/* Live progress card */}
      <Card className="shadow-md">
        <LiveProgress stages={stagesForUI} />
      </Card>

      {/* Active stage detail panel — only shown when satellite/photo stage active */}
      {currentStage > 0 && currentStage <= 2 && !allDone && (
        <ActiveStageDetail
          stage={STAGES[currentStage - 1].id}
          result={result}
        />
      )}

      {/* Final summary — only shown after all done */}
      {allDone && <FinalSummary result={result} />}

      {/* Action button */}
      {allDone && (
        <Button size="lg" fullWidth onClick={onComplete}>
          Lihat Hasil →
        </Button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Active stage detail — visual feedback per stage
// ─────────────────────────────────────────────────────────────
function ActiveStageDetail({
  stage,
  result,
}: {
  stage: Stage['id'];
  result: VerificationPipelineResult;
}) {
  if (stage === 'satellite') {
    return (
      <Card variant="mint">
        <div className="flex items-start gap-3">
          <Satellite
            size={20}
            strokeWidth={1.75}
            className="text-green-700 mt-0.5 flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-green-700 mb-1">
              Memproses citra Sentinel-2…
            </div>
            <div className="text-xs text-green-700/80 mb-3">
              Tanggal citra: {result.satellite.imagery_date}. Menghitung NDVI
              untuk verifikasi tutupan vegetasi dari atas.
            </div>
            {/* NDVI gradient preview */}
            <div className="h-16 rounded-sm overflow-hidden relative bg-gradient-to-br from-green-700 via-green-400 to-green-200">
              <div
                className="absolute inset-0 animate-pulse"
                style={{
                  background:
                    'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 2s linear infinite',
                }}
              />
            </div>
            <div className="flex justify-between text-[10px] mt-1 text-green-700/70 font-mono">
              <span>NDVI 0.0</span>
              <span>0.5</span>
              <span>1.0</span>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  if (stage === 'photo') {
    return (
      <Card variant="mint">
        <div className="flex items-start gap-3">
          <Camera
            size={20}
            strokeWidth={1.75}
            className="text-green-700 mt-0.5 flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-green-700 mb-1">
              Menganalisis foto dengan AI…
            </div>
            <div className="text-xs text-green-700/80 mb-3">
              Model computer vision mendeteksi pohon dan menghitung kanopi.
            </div>
            {/* Mock photo thumbnails dengan bounding box illusion */}
            <div className="grid grid-cols-3 gap-2">
              {result.photo_analysis.slice(0, 3).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-xs overflow-hidden relative"
                  style={{
                    background: `linear-gradient(${135 + i * 25}deg, #2F6840, #6FAF6C)`,
                  }}
                >
                  {/* Mock bounding boxes */}
                  <svg
                    viewBox="0 0 100 100"
                    className="absolute inset-0 w-full h-full"
                  >
                    {[
                      [20, 25, 18, 18],
                      [55, 30, 22, 22],
                      [30, 60, 16, 16],
                      [65, 65, 18, 18],
                    ].map(([x, y, w, h], idx) => (
                      <rect
                        key={idx}
                        x={x}
                        y={y}
                        width={w}
                        height={h}
                        fill="none"
                        stroke="#FCD34D"
                        strokeWidth="1.5"
                        strokeDasharray="2 1"
                        opacity="0.9"
                        style={{
                          animation: `fadeIn 600ms ease-out ${idx * 200}ms both`,
                        }}
                      />
                    ))}
                  </svg>
                  <div className="absolute bottom-1 left-1 px-1 py-0.5 bg-yellow-300/95 text-[9px] font-bold text-yellow-900 rounded-xs">
                    {[3, 5, 4][i]} pohon
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return null;
}

// ─────────────────────────────────────────────────────────────
// Final summary — appears after all stages done
// ─────────────────────────────────────────────────────────────
function FinalSummary({ result }: { result: VerificationPipelineResult }) {
  const totalPhotoTree = result.photo_analysis.reduce(
    (s, p) => s + p.tree_count,
    0
  );

  return (
    <Card variant="mint" className="animate-slide-up">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-pill bg-green-700 text-green-50 flex items-center justify-center">
          <Leaf size={20} strokeWidth={1.75} />
        </div>
        <div>
          <div className="text-[13px] font-semibold text-green-700">
            Verifikasi Berhasil
          </div>
          <div className="text-xs text-green-700/70">
            Confidence score: {result.cross_validation_confidence}%
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-xs text-green-700/70">Pohon (foto)</div>
          <div className="figure text-[18px] text-green-700">
            {totalPhotoTree}
          </div>
        </div>
        <div>
          <div className="text-xs text-green-700/70">Pohon (satelit)</div>
          <div className="figure text-[18px] text-green-700">
            {result.satellite.estimated_tree_count}
          </div>
        </div>
        <div className="col-span-2 pt-2 border-t border-green-200">
          <div className="text-xs text-green-700/70">Carbon sequestration</div>
          <div className="figure text-[24px] text-green-700">
            {result.carbon_estimate.annual_sequestration_tco2e.toFixed(1)}{' '}
            <span className="text-sm font-sans">ton CO2e/thn</span>
          </div>
        </div>
      </div>
    </Card>
  );
}