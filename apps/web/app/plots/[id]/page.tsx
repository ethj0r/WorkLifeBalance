"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Satellite,
  Sprout,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";

import { AppHeader } from "@/components/ui/AppHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { MapPolygon } from "@/components/plots/MapPolygon";
import { decimalID, formatIDR, formatIDRShort } from "@/lib/format";
import { getPlotById } from "@/lib/plots-store";
import { detectTreesFromFixedImage } from "@/lib/api-detection";
import type { Plot } from "@/lib/types";

export default function PlotDetailPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();

  const [plot, setPlot] = useState<Plot | null>(null);
  const [loaded, setLoaded] = useState(false);

  const [annotatedImage, setAnnotatedImage] = useState<string | null>(null);
  const [detectedTreeCount, setDetectedTreeCount] = useState<number | null>(
    null
  );
  const [detecting, setDetecting] = useState(false);
  const [detectError, setDetectError] = useState<string | null>(null);

  useEffect(() => {
    setPlot(getPlotById(params.id));
    setLoaded(true);
  }, [params.id]);

  useEffect(() => {
    if (!plot?.polygonPoints || plot.polygonPoints.length < 3) return;

    let ignore = false;

    async function rerunDetection() {
      try {
        setDetecting(true);
        setDetectError(null);

        const result = await detectTreesFromFixedImage(plot!.polygonPoints!);

        if (ignore) return;

        setDetectedTreeCount(result.tree_count);
        setAnnotatedImage(result.annotated_image_base64);
      } catch (error) {
        if (ignore) return;

        setDetectError(
          error instanceof Error ? error.message : "Gagal menjalankan deteksi."
        );
      } finally {
        if (!ignore) {
          setDetecting(false);
        }
      }
    }

    rerunDetection();

    return () => {
      ignore = true;
    };
  }, [plot?.id, plot?.polygonPoints]);

  if (!loaded) {
    return (
      <main className="web-page">
        <AppHeader active="dashboard" />
        <section className="web-container py-8 lg:py-10">
          <Card className="rounded-2xl p-6 text-sm text-ink-500">
            Memuat data lahan...
          </Card>
        </section>
      </main>
    );
  }

  if (!plot) {
    return (
      <main className="web-page">
        <AppHeader active="dashboard" />
        <section className="web-container py-8 lg:py-10">
          <Card className="rounded-2xl p-6">
            <h1 className="font-display text-3xl font-medium">
              Lahan tidak ditemukan
            </h1>
            <p className="mt-2 text-sm text-ink-500">
              Data lahan ini tidak ada di mock data atau localStorage.
            </p>
            <Link href="/dashboard" className="mt-5 inline-block">
              <Button>Kembali ke dashboard</Button>
            </Link>
          </Card>
        </section>
      </main>
    );
  }

  const shownTreeCount =
    detectedTreeCount !== null
      ? detectedTreeCount
      : plot.treeCount !== null && plot.treeCount !== undefined
        ? plot.treeCount
        : null;

  return (
    <main className="web-page">
      <AppHeader active="dashboard" />

      <section className="web-container py-8 lg:py-10">
        {searchParams.get("new") && (
          <div className="mb-6 flex gap-2 rounded-2xl bg-green-50 p-4 text-sm font-semibold text-green-700">
            <CheckCircle2 className="h-5 w-5 flex-none" />
            Lahan baru berhasil didaftarkan. Verifikasi awal sedang berjalan.
          </div>
        )}

        <div className="mb-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <div className="mb-3">
              <StatusBadge status={plot.status} />
            </div>

            <h1 className="display-md">{plot.name}</h1>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-ink-500">
              <span>{plot.location}</span>
              <span>·</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 font-semibold text-green-700">
                <Sprout className="h-3.5 w-3.5" />
                {plot.landType}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <Link href="/withdraw">
              <Button leftIcon={<Wallet className="h-4 w-4" />}>
                Tarik pendapatan
              </Button>
            </Link>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="space-y-5">
            <Card className="rounded-[24px] p-4">
              {annotatedImage ? (
                <div className="overflow-hidden rounded-2xl border border-[rgba(15,23,42,.08)] bg-ink-50">
                  <img
                    src={`data:image/png;base64,${annotatedImage}`}
                    alt="Hasil deteksi pohon"
                    className="h-[420px] w-full object-cover"
                  />
                </div>
              ) : detecting ? (
                <div className="grid h-[420px] place-items-center rounded-2xl bg-green-50 text-center text-sm font-semibold text-green-700">
                  Mendeteksi pohon dari polygon tersimpan...
                </div>
              ) : (
                <MapPolygon polygon={plot.polygon} height={420} ndvi />
              )}

              {detectError && (
                <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm leading-6 text-red-700">
                  {detectError}
                </div>
              )}
            </Card>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Metric label="Luas" value={`${decimalID(plot.area)} ha`} />
              <Metric label="Jenis lahan" value={plot.landType} />
              <Metric
                label="Carbon/tahun"
                value={`${decimalID(plot.carbonTons)} ton`}
              />
              <Metric
                label="Estimasi"
                value={formatIDRShort(plot.annualEarnings)}
              />
            </div>

            <Card className="rounded-2xl p-6">
              <div className="flex items-center gap-2">
                <Satellite className="h-5 w-5 text-green-700" />
                <h2 className="font-semibold">Hasil MRV otomatis</h2>
              </div>

              <div className="mt-5 grid gap-3 text-sm md:grid-cols-3">
                <InfoBox
                  label="NDVI"
                  value={String(plot.ndvi).replace(".", ",")}
                />
                <InfoBox label="Pohon dominan" value={plot.trees.join(", ")} />
                <InfoBox label="Confidence" value={`${plot.confidence}%`} />

                <InfoBox
                  label="Pohon terdeteksi"
                  value={
                    shownTreeCount !== null
                      ? `${shownTreeCount} pohon`
                      : "Belum dideteksi"
                  }
                />

                <InfoBox label="Jenis lahan" value={plot.landType} />
                <InfoBox label="Metode" value="DeepForest + polygon lahan" />
              </div>
            </Card>
          </div>

          <aside className="space-y-5">
            <Card className="rounded-2xl p-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-700" />
                <h2 className="font-semibold">Proyeksi pendapatan</h2>
              </div>

              <p className="mt-3 text-sm leading-6 text-ink-500">
                Estimasi ini masih mock untuk MVP. Angka final bergantung pada
                metodologi, kualitas data, jenis lahan, dan harga pembeli.
              </p>

              <div className="mt-5 rounded-2xl bg-green-700 p-5 text-green-50">
                <div className="eyebrow !text-green-50/70">
                  Estimasi tahunan
                </div>
                <div className="figure mt-2 text-4xl font-medium">
                  {formatIDR(plot.annualEarnings)}
                </div>
              </div>
            </Card>

            <Card className="rounded-2xl bg-earth-50 p-6">
              <div className="eyebrow text-earth-700">Catatan kualitas</div>
              <p className="mt-3 text-sm leading-6 text-earth-700">
                Untuk menaikkan kualitas credit, tambahkan dokumen legal dan
                foto pohon berkala agar audit trail lebih kuat.
              </p>
            </Card>
          </aside>
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <div className="eyebrow">{label}</div>
      <div className="figure mt-2 text-3xl font-medium">{value}</div>
    </Card>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-ink-50 p-4">
      <div className="eyebrow">{label}</div>
      <div className="mt-2 font-semibold text-ink-900">{value}</div>
    </div>
  );
}